import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { askWithScore, askWithScoreInScope, type AiScopedResult } from '@/lib/gemini'
import { findMatch, calcDeadline } from '@/lib/matching'
import { checkContent } from '@/lib/contentFilter'
import { notifyMatchedUser } from '@/lib/email'
import { translateQuestionToLocales, SUPPORTED_LOCALES } from '@/lib/translate'
import { getApiErrors } from '@/lib/apiErrors'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w぀-ゟ゠-ヿ一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  // 書き込み・RPC・レート制限は service_role（RLSバイパス）で実行する。
  // 公開anonキーからの直接改ざん・不正RPC実行を防ぐため、DB側の書き込み権限は
  // 一般ユーザー(anon/authenticated)に開放せず、サーバーからのみ書き込む。
  const admin = createAdminClient()
  const apiErrors = await getApiErrors()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: apiErrors.loginRequired }, { status: 401 })
  }

  // BANされたユーザーは投稿不可（is_bannedはプロフィールに保存。adminで確実に読む）
  const { data: banProfile } = await admin
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .maybeSingle()
  if (banProfile?.is_banned) {
    return NextResponse.json({ error: apiErrors.notPermitted }, { status: 403 })
  }

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '0.0.0.0'

  const { data: withinLimit, error: rateLimitError } = await admin.rpc(
    'check_and_increment_rate_limit',
    { p_user_id: user.id, p_tenant_id: tenantId }
  )
  if (rateLimitError) {
    console.error('Rate limit check error:', rateLimitError)
  } else if (!withinLimit) {
    return NextResponse.json(
      { error: '本日の質問投稿数の上限に達しました。時間をおいて再度お試しください。' },
      { status: 429 }
    )
  }

  const { title, body, locale } = await request.json()
  const sourceLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'ja'

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: apiErrors.titleAndBodyRequired }, { status: 400 })
  }
  if (title.trim().length < 5) {
    return NextResponse.json({ error: apiErrors.titleTooShort }, { status: 400 })
  }
  if (body.trim().length < 30) {
    return NextResponse.json({ error: apiErrors.bodyTooShort }, { status: 400 })
  }

  const filterResult = checkContent(`${title} ${body}`)
  if (!filterResult.ok) {
    return NextResponse.json({ error: apiErrors[filterResult.reasonCode] }, { status: 422 })
  }

  // ① 保存前にジャンル判定＋AI回答生成（1回のGroq呼び出しに統合・コスト最適化）。
  // ジャンル外なら保存せず即拒否（従来のcheckInScopeと同じUX）。
  // ジャンル内なら生成済みの回答・スコアを保持し、保存後のルーティングで再利用する。
  let aiResult: AiScopedResult | null = null
  try {
    aiResult = await askWithScoreInScope(tenantId, `${title}\n\n${body}`)
    if (!aiResult.inScope) {
      return NextResponse.json(
        { error: 'このサービスでは関連のある質問のみ受け付けています。' },
        { status: 422 }
      )
    }
  } catch (e) {
    console.error('Scope check error:', e)
    // 判定失敗時は通す（ユーザー体験優先）。保存後にaskWithScoreで再試行する
  }

  // スラッグ生成（重複時は末尾に数値付加）
  let slug = toSlug(title)
  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .like('slug', `${slug}%`)

  if (count && count > 0) slug = `${slug}-${count + 1}`

  const { data: question, error } = await admin
    .from('questions')
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      slug,
      ip_address: ip,
      source_locale: sourceLocale,
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('Question insert error:', error)
    return NextResponse.json({ error: apiErrors.postFailed }, { status: 500 })
  }

  // ①.5 対応8言語へ自動翻訳（投稿時に静的な多言語ページとして存在させるためSEO優位）
  // AI回答・マッチング処理と並行実行するため、ここではPromiseを開始するだけで待たない。
  // Cloudflare Workersはレスポンスを返すと未完了のfire-and-forget処理を打ち切るため、
  // 必ずレスポンス返却前にawaitする（下部参照）。
  const translationPromise = translateQuestionToLocales(title.trim(), body.trim(), sourceLocale).catch((e) => {
    console.error('question translation error:', e)
    return { title_i18n: {}, body_i18n: {} }
  })
  const titleTranslationPromise = translationPromise.then((r) => r.title_i18n)

  // ② ジャンル内確定。①で生成済みの回答を再利用する（Groq呼び出しなし）。
  // ①がGroqエラーで結果を持てなかった場合のみ、従来方式のaskWithScoreで再試行する
  let resultType: 'ai' | 'matched' | 'pending' = 'pending'
  try {
    const result = aiResult ?? (await askWithScore(tenantId, `${title}\n\n${body}`))

    if (result.routed === 'ai') {
      await admin.from('answers').insert({
        question_id: question.id,
        tenant_id: tenantId,
        body: result.answer,
        is_ai: true,
        ai_score: result.score,
      })
      await admin
        .from('questions')
        .update({ status: 'ai_answered', ai_score: result.score })
        .eq('id', question.id)
      resultType = 'ai'
    } else {
      console.log(`[Routing] score=${result.score} → human (tenant=${tenantId})`)
      const matchedB = await findMatch(tenantId, question.id, [user.id])

      if (matchedB) {
        await admin.from('questions').update({
          status: 'open',
          ai_score: result.score,
          matched_b_id: matchedB,
          matched_b_deadline: calcDeadline(8),
        }).eq('id', question.id)
        console.log(`[Matching] B=${matchedB}`)
        resultType = 'matched'
        try {
          await notifyMatchedUser({
            userId: matchedB,
            tenantId,
            questionTitle: title.trim(),
            questionTitleTranslations: await titleTranslationPromise,
            questionSlug: question.slug,
          })
        } catch (e) {
          console.error('notifyMatchedUser error:', e)
        }
      } else {
        const matchedC = await findMatch(tenantId, question.id, [user.id])
        if (matchedC) {
          await admin.from('questions').update({
            status: 'matched_c',
            ai_score: result.score,
            matched_c_id: matchedC,
            matched_c_deadline: calcDeadline(8),
          }).eq('id', question.id)
          console.log(`[Matching] B=none → C=${matchedC}`)
          resultType = 'matched'
          try {
            await notifyMatchedUser({
              userId: matchedC,
              tenantId,
              questionTitle: title.trim(),
              questionTitleTranslations: await titleTranslationPromise,
              questionSlug: question.slug,
            })
          } catch (e) {
            console.error('notifyMatchedUser error:', e)
          }
        } else {
          await admin.from('questions').update({
            status: 'hard',
            ai_score: result.score,
          }).eq('id', question.id)
          console.log(`[Matching] B=none, C=none → hard`)
        }
      }
    }
  } catch (e) {
    console.error('Groq error:', e)
  }

  // 質問投稿数カウント＋称号チェック
  try {
    await admin.rpc('increment_question_count', { uid: user.id, p_tenant_id: tenantId })
    await admin.rpc('check_and_award_titles', { p_user_id: user.id, p_tenant_id: tenantId })
  } catch (e) {
    console.error('question title award error:', e)
  }

  // 翻訳結果を保存（Cloudflare Workersがレスポンス返却後に処理を打ち切るため必ずawaitする）
  const { title_i18n, body_i18n } = await translationPromise
  await admin.from('questions').update({ title_i18n, body_i18n }).eq('id', question.id)

  return NextResponse.json({ slug: question.slug, result: resultType })
}

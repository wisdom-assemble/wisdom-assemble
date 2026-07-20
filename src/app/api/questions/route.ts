import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { askWithScore, askWithScoreInScope, isGroqUnavailable, type AiScopedResult } from '@/lib/gemini'
import { findMatch, calcDeadline } from '@/lib/matching'
import { checkContent } from '@/lib/contentFilter'
import { notifyMatchedUser } from '@/lib/email'
import { translateQuestionToLocales, translateToLocales, SUPPORTED_LOCALES } from '@/lib/translate'
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
  // AI予算チェック（Groq呼び出し前に1回）。本日の全体AI質問数が自主上限に達していたら
  // AIを一切呼ばず、後段で人間ルーティングへ切り替える（赤字/暴走の自主的な蓋）。
  let aiUnavailable = false
  let aiResetAt: string | null = null
  try {
    const { data: budget } = await admin.rpc('check_and_reserve_ai_budget', { p_tenant_id: tenantId })
    if (budget && budget.allowed === false) {
      aiUnavailable = true
      aiResetAt = budget.reset_at ?? null
    }
  } catch (e) {
    console.error('ai budget check error:', e) // フェイルオープン: 判定失敗時はAIを許可
  }

  let aiResult: AiScopedResult | null = null
  if (!aiUnavailable) {
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
      // Groqが一時停止(429/blocked)ならAI不可として人間ルーティングへ（reset時刻は不明=曖昧UX）。
      // それ以外のエラーはaiResult=nullのまま後段askWithScoreで再試行する。
      if (isGroqUnavailable(e)) aiUnavailable = true
    }
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
      // AIが内容から付けたタグ(2〜3個)。Groqエラー等で取得できなければ空配列（No.34タグ検索用）
      tags: aiResult?.tags ?? [],
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

  // クロージャ内ではSupabaseの判別ユニオンによる非null絞り込みが失われるため、
  // 確定済み(insert成功・認証済み)の値をローカルに束ねてから使う。
  const q = question
  const posterId = user.id

  // AIが使えない/低スコア時に質問を人間へルーティングする（B→C→hard）。孤立を防ぐ共通処理。
  async function routeToHuman(score: number): Promise<'matched' | 'pending'> {
    const matchedB = await findMatch(tenantId, q.id, [posterId])
    if (matchedB) {
      await admin.from('questions').update({
        status: 'open',
        ai_score: score,
        matched_b_id: matchedB,
        matched_b_deadline: calcDeadline(8),
      }).eq('id', q.id)
      console.log(`[Matching] B=${matchedB}`)
      try {
        await notifyMatchedUser({
          userId: matchedB,
          tenantId,
          questionTitle: title.trim(),
          questionTitleTranslations: await titleTranslationPromise,
          questionSlug: q.slug,
        })
      } catch (e) {
        console.error('notifyMatchedUser error:', e)
      }
      return 'matched'
    }
    const matchedC = await findMatch(tenantId, q.id, [posterId])
    if (matchedC) {
      await admin.from('questions').update({
        status: 'matched_c',
        ai_score: score,
        matched_c_id: matchedC,
        matched_c_deadline: calcDeadline(8),
      }).eq('id', q.id)
      console.log(`[Matching] B=none → C=${matchedC}`)
      try {
        await notifyMatchedUser({
          userId: matchedC,
          tenantId,
          questionTitle: title.trim(),
          questionTitleTranslations: await titleTranslationPromise,
          questionSlug: q.slug,
        })
      } catch (e) {
        console.error('notifyMatchedUser error:', e)
      }
      return 'matched'
    }
    await admin.from('questions').update({ status: 'hard', ai_score: score }).eq('id', q.id)
    console.log(`[Matching] B=none, C=none → hard`)
    return 'pending'
  }

  // ② AI回答を試みる（予算内 & AI障害なしの場合のみ）。①で生成済みの回答があれば再利用。
  let resultType: 'ai' | 'matched' | 'pending' = 'pending'
  let handled = false
  if (!aiUnavailable) {
    try {
      const result = aiResult ?? (await askWithScore(tenantId, `${title}\n\n${body}`))
      // トークン使用量を記録（ダッシュボードのコスト表示用・失敗しても本処理は続行）
      if (result.usage) {
        admin.rpc('record_ai_tokens', {
          p_tenant_id: tenantId,
          p_prompt: result.usage.prompt,
          p_completion: result.usage.completion,
          p_cost: result.usage.cost,
        }).then(() => {}, (e: unknown) => console.error('record_ai_tokens error:', e))
      }
      if (result.routed === 'ai') {
        // AI回答も8言語へ翻訳して保存（多言語SEO対策）。AI回答は日本語生成のためsource='ja'。
        const aiBodyI18n = await translateToLocales(result.answer, 'ja').catch((e) => {
          console.error('AI answer translation error:', e)
          return {}
        })
        await admin.from('answers').insert({
          question_id: question.id,
          tenant_id: tenantId,
          body: result.answer,
          body_i18n: aiBodyI18n,
          source_locale: 'ja',
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
        resultType = await routeToHuman(result.score)
      }
      handled = true
    } catch (e) {
      console.error('Groq error:', e)
      // Groqが一時停止(429/blocked)ならAI不可扱い。いずれにせよ下の孤立防止で人間へ回す。
      if (isGroqUnavailable(e)) aiUnavailable = true
    }
  }

  // AIが使えなかった(上限/障害)・未処理のまま抜けた質問は人間へ回す（孤立を防ぐ）。
  if (!handled) {
    resultType = await routeToHuman(0)
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

  return NextResponse.json({ slug: question.slug, result: resultType, aiCapped: aiUnavailable, aiResetAt })
}

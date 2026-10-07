import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { askWithScore, askWithScoreInScope, isGroqUnavailable, type AiScopedResult } from '@/lib/gemini'
import { findMatch, calcDeadline } from '@/lib/matching'
import { checkContent } from '@/lib/contentFilter'
import { notifyMatchedUser, sendAiCostAlert } from '@/lib/email'
import { translateQuestionToLocales, translateToLocales, translateTagsToLocales, translateCost, SUPPORTED_LOCALES, type TokenUsage } from '@/lib/translate'
import { getApiErrors } from '@/lib/apiErrors'
import { detectSourceLocale } from '@/lib/detectLocale'

// 翌JST0時をISO(UTC)で返す。AIが使えない時のモーダル「次に使える時刻」の
// フォールバック（予算RPCのreset_atが取れない場合用）。
function nextJstMidnightIso(): string {
  const now = Date.now()
  const jst = new Date(now + 9 * 3_600_000) // UTC→JST
  const next0Jst = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate() + 1, 0, 0, 0)
  return new Date(next0Jst - 9 * 3_600_000).toISOString() // JST0時をUTCへ戻す
}

function toSlug(text: string): string {
  // 【2026-10-07】文字の種類を全言語に広げた（以前は英数字と日本語の範囲だけで、ハングルやアクセント付きの文字が消え、
  // 韓国語のタイトルだと slug が「-」になっていた）。文字が1つも残らなければ 'q'。
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .replace(/-+/g, '-')
  // 文字単位（サロゲートペアを壊さない）で100文字に切ってから、端のハイフンを落とす
  const cut = Array.from(slug).slice(0, 100).join('').replace(/^-+|-+$/g, '')
  return cut || 'q'
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

  const { title, body, locale } = await request.json()

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

  // 元の言語は本文の文字で判定する（画面の言語ではなく・2026-10-07。src/lib/detectLocale.ts）
  const sourceLocale = detectSourceLocale(`${title}\n${body}`, String(locale ?? ''), SUPPORTED_LOCALES)

  // 【2026-10-07】投稿数の上限（1日3件）は、入力チェックを通ってから数える。
  // 以前は最初に数えていたため、文字数不足や連絡先の記載で弾かれた投稿でも1件減り、3回失敗すると24時間投稿できなかった。
  // AIを呼ぶ前には数える（AIの利用回数の歯止めも兼ねるため）。
  const { data: withinLimit, error: rateLimitError } = await admin.rpc(
    'check_and_increment_rate_limit',
    { p_user_id: user.id, p_tenant_id: tenantId }
  )
  if (rateLimitError) {
    console.error('Rate limit check error:', rateLimitError)
  } else if (!withinLimit) {
    return NextResponse.json({ error: apiErrors.rateLimited }, { status: 429 })
  }

  // ① 保存前にジャンル判定＋AI回答生成（1回のGroq呼び出しに統合・コスト最適化）。
  // ジャンル外なら保存せず即拒否（従来のcheckInScopeと同じUX）。
  // ジャンル内なら生成済みの回答・スコアを保持し、保存後のルーティングで再利用する。
  // AI予算チェック（Groq呼び出し前に1回）。本日の全体AI質問数が自主上限に達していたら
  // AIを一切呼ばず、後段で人間ルーティングへ切り替える（赤字/暴走の自主的な蓋）。
  let aiUnavailable = false
  let aiResetAt: string | null = null
  // 予算RPCが返す reset_at（翌JST0時）は上限オン/オフに関わらず常に返る。
  // 無料モードでGroq自身が429で止まった時も、この時刻をモーダルの「次に使える時刻」に流用する。
  let budgetResetAt: string | null = null
  // AI側(Gemini)が返す復活までの秒数。RPM超過なら数十秒、RPD超過なら長時間。
  let aiRetryAfterSec: number | null = null
  try {
    const { data: budget } = await admin.rpc('check_and_reserve_ai_budget', { p_tenant_id: tenantId })
    const b = budget as { allowed?: boolean; enabled?: boolean; remaining?: number; cap?: number; reset_at?: string } | null
    budgetResetAt = b?.reset_at ?? null
    if (b && b.allowed === false) {
      aiUnavailable = true
      aiResetAt = b.reset_at ?? null
    }
    // コストアラート（使用90%到達 or 上限到達で、運営者に1日1回だけメール）
    if (b?.cap && typeof b.remaining === 'number') {
      const usedPct = ((b.cap - b.remaining) / b.cap) * 100
      const level: 'limit' | 'warn90' | null =
        b.allowed === false ? 'limit' : usedPct >= 90 ? 'warn90' : null
      if (level) {
        const { data: shouldSend } = await admin.rpc('try_mark_ai_alert', { p_level: level })
        if (shouldSend) {
          await sendAiCostAlert({ level, cap: b.cap, remaining: Math.max(0, b.remaining) })
            .catch((e) => console.error('ai cost alert send error:', e))
        }
      }
    }
  } catch (e) {
    console.error('ai budget check error:', e) // フェイルオープン: 判定失敗時はAIを許可
  }

  let aiResult: AiScopedResult | null = null
  if (!aiUnavailable) {
    try {
      aiResult = await askWithScoreInScope(tenantId, `${title}\n\n${body}`)
      if (!aiResult.inScope) {
        return NextResponse.json({ error: apiErrors.outOfScope }, { status: 422 })
      }
    } catch (e) {
      console.error('Scope check error:', e)
      // Groqが一時停止(429/blocked)ならAI不可として人間ルーティングへ（reset時刻は不明=曖昧UX）。
      // それ以外のエラーはaiResult=nullのまま後段askWithScoreで再試行する。
      if (isGroqUnavailable(e)) {
        aiUnavailable = true
        aiRetryAfterSec = (e as { retryAfterSec?: number }).retryAfterSec ?? aiRetryAfterSec
      }
    }
  }

  // スラッグ生成（重複時は末尾に連番）
  // 【2026-10-07】以前は「前方一致する件数＋1」を付けていたため、「X 2」が先にあると「X」が X-2 になって衝突したり、
  // 削除後に既存とぶつかったりして500になっていた。実在する slug を見て空いている番号を選び、
  // それでも一意制約に当たった場合（同時投稿など）は短いランダムな接尾辞で1回だけ再試行する。
  const baseSlug = toSlug(title)
  const { data: takenRows } = await admin
    .from('questions')
    .select('slug')
    .eq('tenant_id', tenantId)
    .like('slug', `${baseSlug}%`)
  const taken = new Set((takenRows ?? []).map((r: { slug: string }) => r.slug))
  let slug = baseSlug
  for (let n = 2; taken.has(slug); n++) slug = `${baseSlug}-${n}`

  const insertQuestion = (s: string) => admin
    .from('questions')
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      slug: s,
      // 【2026-10-07】IPアドレスは保存しない（公開の鍵で読める列だった・既存分もSQLで消去済み）
      source_locale: sourceLocale,
      // AIが内容から付けたタグ(2〜3個)。Groqエラー等で取得できなければ空配列（No.34タグ検索用）
      tags: aiResult?.tags ?? [],
    })
    .select('id, slug')
    .single()

  let { data: question, error } = await insertQuestion(slug)
  if (error && (error as { code?: string }).code === '23505') {
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`
    ;({ data: question, error } = await insertQuestion(slug))
  }

  if (error || !question) {
    console.error('Question insert error:', error)
    return NextResponse.json({ error: apiErrors.postFailed }, { status: 500 })
  }

  // ①.5 対応8言語へ自動翻訳（投稿時に静的な多言語ページとして存在させるためSEO優位）
  // AI回答・マッチング処理と並行実行するため、ここではPromiseを開始するだけで待たない。
  // Cloudflare Workersはレスポンスを返すと未完了のfire-and-forget処理を打ち切るため、
  // 必ずレスポンス返却前にawaitする（下部参照）。
  // 翻訳(Groq 8b)のトークンも計上する。回答生成(Gemini)だけだとダッシュボードの
  // 金額が実コストより過小に見えるため（請求先がGoogle/Groqの2つに割れている）。
  const translationUsage: TokenUsage = { prompt: 0, completion: 0 }
  const translationPromise = translateQuestionToLocales(title.trim(), body.trim(), sourceLocale, translationUsage).catch((e) => {
    console.error('question translation error:', e)
    return { title_i18n: {}, body_i18n: {} }
  })
  const titleTranslationPromise = translationPromise.then((r) => r.title_i18n)
  // 【2026-10-07】タグも翻訳する（tags_i18n）。本文の翻訳と並行して走らせ、下で保存前に待つ。
  // 失敗しても投稿は成功扱い（そのタグは元の言語のまま表示されるだけ）。
  // タグを作るAIの指示は日本語固定（gemini.ts）なので、元の言語は本文ではなくタグ自体の文字で判定する（2026-10-08）
  const questionTags = aiResult?.tags ?? []
  const tagsSourceLocale = detectSourceLocale(questionTags.join(' '), 'en', SUPPORTED_LOCALES)
  const tagsTranslationPromise = translateTagsToLocales(questionTags, tagsSourceLocale, translationUsage).catch((e) => {
    console.error('tag translation error:', e)
    return {} as Record<string, string[]>
  })

  // クロージャ内ではSupabaseの判別ユニオンによる非null絞り込みが失われるため、
  // 確定済み(insert成功・認証済み)の値をローカルに束ねてから使う。
  const q = question
  const posterId = user.id

  // AIが使えない/低スコア時に質問を人間へルーティングする（B→C→hard）。孤立を防ぐ共通処理。
  async function routeToHuman(score: number): Promise<'matched' | 'pending'> {
    // 翻訳もスキルタグの照合に使う（日本語タグが英語の質問に当たらない問題の解消）。
    // この時点ではまだDBに保存されていないので、Promiseの結果を直接渡す。
    // 人間ルートではこの下の通知メールでどのみち翻訳を待つため、待ちが増えるのは
    // 「DB更新＋メール送信」と重ならなくなるぶんだけ（実測で1秒未満）。
    // 翻訳が失敗しても {} が返るだけで、従来どおり元言語での照合にフォールバックする。
    const tr = await translationPromise
    const matchedB = await findMatch(tenantId, q.id, [posterId], tr)
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
    // Bが見つからない＝候補が0人ということなので、ここでCを探しても必ず同じ結果になる。
    // 以前は同じ除外リストでfindMatchをもう一度呼んでいたが、条件が同一なので
    // 空振りが確定しており、無駄なDB往復が1回増えるだけだった（2026-08-15に指摘を受けて削除）。
    // Cへの割り当ては「Bが回答したあと、質問者が別のメンバーに依頼する」escalate側の役割。
    await admin.from('questions').update({ status: 'hard', ai_score: score }).eq('id', q.id)
    console.log(`[Matching] 候補なし → hard`)
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
          p_model: result.usage.model,
        }).then(() => {}, (e: unknown) => console.error('record_ai_tokens error:', e))
      }
      if (result.routed === 'ai') {
        // AI回答も8言語へ翻訳して保存（多言語SEO対策）。AI回答は日本語生成のためsource='ja'。
        const aiBodyI18n = await translateToLocales(result.answer, 'ja', translationUsage).catch((e) => {
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
      if (isGroqUnavailable(e)) {
        aiUnavailable = true
        aiRetryAfterSec = (e as { retryAfterSec?: number }).retryAfterSec ?? aiRetryAfterSec
      }
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
  const tags_i18n = await tagsTranslationPromise
  if (Object.keys(tags_i18n).length > 0) {
    // タイトル・本文とは別の更新にする（tags_i18n 列の問題でタイトル・本文の保存まで失敗させないため）
    const { error: tagsSaveError } = await admin.from('questions').update({ tags_i18n }).eq('id', question.id)
    if (tagsSaveError) console.error('tags_i18n save error:', tagsSaveError)
  }

  // 翻訳分のトークン/コストを加算（callsは増やさない＝AI質問数は回答生成のみを数える）
  if (translationUsage.prompt || translationUsage.completion) {
    await admin.rpc('record_ai_tokens', {
      p_tenant_id: tenantId,
      p_prompt: translationUsage.prompt,
      p_completion: translationUsage.completion,
      p_cost: translateCost(translationUsage),
    }).then(() => {}, (e: unknown) => console.error('record translation tokens error:', e))
  }

  // AIが使えなかった場合は、理由（自主上限/レート超過）に関わらず必ず具体的な
  // 復活時刻をモーダルへ渡す。ユーザーには無料/有料の区別は見せない（同じ体験にする）。
  // AI側が復活秒数を返していればそれを優先する（GeminiのRPD超過等。翌0時より正確）。
  if (aiUnavailable && !aiResetAt) {
    aiResetAt = aiRetryAfterSec != null
      ? new Date(Date.now() + aiRetryAfterSec * 1000).toISOString()
      : (budgetResetAt ?? nextJstMidnightIso())
  }

  return NextResponse.json({ slug: question.slug, result: resultType, aiCapped: aiUnavailable, aiResetAt })
}

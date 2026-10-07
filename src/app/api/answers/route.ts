import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { checkContent } from '@/lib/contentFilter'
import { translateToLocales, translateCost, SUPPORTED_LOCALES, type TokenUsage } from '@/lib/translate'
import { getApiErrors } from '@/lib/apiErrors'
import { detectSourceLocale } from '@/lib/detectLocale'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const apiErrors = await getApiErrors()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: apiErrors.loginRequired }, { status: 401 })
  }

  // BANされたユーザーは回答不可（adminで確実に読む）
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

  const { questionId, body, locale } = await request.json()

  // 元の言語は本文の文字で判定する（画面の言語ではなく・2026-10-07。src/lib/detectLocale.ts）
  const sourceLocale = detectSourceLocale(String(body ?? ''), String(locale ?? ''), SUPPORTED_LOCALES)

  if (!questionId || !body?.trim()) {
    return NextResponse.json({ error: apiErrors.answerRequired }, { status: 400 })
  }
  if (body.trim().length < 30) {
    return NextResponse.json({ error: apiErrors.answerTooShort }, { status: 400 })
  }

  const filterResult = checkContent(body)
  if (!filterResult.ok) {
    return NextResponse.json({ error: apiErrors[filterResult.reasonCode] }, { status: 422 })
  }

  // 質問の存在確認
  const { data: question } = await supabase
    .from('questions')
    .select('id, status, user_id, matched_b_id, matched_c_id, matched_b_deadline, matched_c_deadline')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) {
    return NextResponse.json({ error: apiErrors.questionNotFound }, { status: 404 })
  }
  // 【2026-10-07】解決済みの質問には回答できない（画面では回答欄を出していないが、APIを直接叩けば通っていた）
  if (question.status === 'solved') {
    return NextResponse.json({ error: apiErrors.alreadySolved }, { status: 400 })
  }
  // 【2026-10-07】画面で回答欄を出す条件（questions/[slug]/page.tsx）と同じ条件をAPIでも課す。
  // それまではAPIを直接叩けば、質問者本人が自分の質問に回答して自分でベストアンサーにできた（実績・称号の水増し）うえ、
  // 担当の専門家（B/C）の優先時間中に第三者が割り込めた（割り込まれると自動の高難度移行も止まる）。
  //   誰でも回答できる：高難度／AI回答済み／担当者が見つからず止まっている質問
  //   担当者だけが回答できる：専門家①（B）・②（C）が担当中の質問（期限内に限る）
  const now = Date.now()
  const notExpired = (deadline: string | null) => !deadline || new Date(deadline).getTime() >= now
  const isOwner = question.user_id === user.id
  const openToAll =
    question.status === 'hard' ||
    question.status === 'ai_answered' ||
    (question.status === 'open' && !question.matched_b_id) ||
    (question.status === 'matched_c' && !question.matched_c_id)
  const isAssignee =
    (question.status === 'open' && question.matched_b_id === user.id && notExpired(question.matched_b_deadline)) ||
    (question.status === 'matched_c' && question.matched_c_id === user.id && notExpired(question.matched_c_deadline))
  if (isOwner || !(openToAll || isAssignee)) {
    return NextResponse.json({ error: apiErrors.notPermitted }, { status: 403 })
  }

  // 同一ユーザーの重複回答チェック（DBにも一意制約 answers_one_human_answer_per_user あり・2026-10-08）
  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .eq('is_ai', false)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: apiErrors.alreadyAnswered }, { status: 409 })
  }

  // 回答INSERTはservice_role経由。コンテンツフィルタ・最低文字数・重複チェックを
  // 通した後にサーバーからのみ挿入し、anonキーによる直接INSERT（各検査の回避）を防ぐ。
  const { data: answer, error } = await admin
    .from('answers')
    .insert({
      question_id: questionId,
      tenant_id: tenantId,
      user_id: user.id,
      body: body.trim(),
      is_ai: false,
      source_locale: sourceLocale,
    })
    .select('id')
    .single()

  if (error) {
    // 同時に2回送られた場合は一意制約（23505）で弾かれる＝回答済みとして返す
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: apiErrors.alreadyAnswered }, { status: 409 })
    }
    console.error('Answer insert error:', error)
    return NextResponse.json({ error: apiErrors.postFailed }, { status: 500 })
  }

  // 対応8言語へ自動翻訳して保存（Cloudflare Workers対策のため必ずawaitする）
  try {
    const translationUsage: TokenUsage = { prompt: 0, completion: 0 }
    const body_i18n = await translateToLocales(body.trim(), sourceLocale, translationUsage)
    // 回答の翻訳コストも計上（ダッシュボードの金額を実コストに近づける）
    if (translationUsage.prompt || translationUsage.completion) {
      await admin.rpc('record_ai_tokens', {
        p_tenant_id: tenantId,
        p_prompt: translationUsage.prompt,
        p_completion: translationUsage.completion,
        p_cost: translateCost(translationUsage),
      }).then(() => {}, (e: unknown) => console.error('record translation tokens error:', e))
    }
    await admin.from('answers').update({ body_i18n }).eq('id', answer.id)
  } catch (e) {
    console.error('answer translation error:', e)
  }

  // 質問を「受付中→open維持」（解決はベストアンサー選択時）
  // 回答が付いたことだけ記録したい場合はここでステータス変更も可

  return NextResponse.json({ ok: true })
}

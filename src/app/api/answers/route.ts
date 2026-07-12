import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { checkContent } from '@/lib/contentFilter'
import { translateToLocales, SUPPORTED_LOCALES } from '@/lib/translate'
import { getApiErrors } from '@/lib/apiErrors'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const apiErrors = await getApiErrors()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: apiErrors.loginRequired }, { status: 401 })
  }

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'

  const { questionId, body, locale } = await request.json()
  const sourceLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'ja'

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
    .select('id, status')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) {
    return NextResponse.json({ error: apiErrors.questionNotFound }, { status: 404 })
  }

  // 同一ユーザーの重複回答チェック
  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .eq('is_ai', false)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: apiErrors.alreadyAnswered }, { status: 409 })
  }

  const { data: answer, error } = await supabase
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
    console.error('Answer insert error:', error)
    return NextResponse.json({ error: apiErrors.postFailed }, { status: 500 })
  }

  // 対応8言語へ自動翻訳して保存（Cloudflare Workers対策のため必ずawaitする）
  try {
    const body_i18n = await translateToLocales(body.trim(), sourceLocale)
    await supabase.from('answers').update({ body_i18n }).eq('id', answer.id)
  } catch (e) {
    console.error('answer translation error:', e)
  }

  // 質問を「受付中→open維持」（解決はベストアンサー選択時）
  // 回答が付いたことだけ記録したい場合はここでステータス変更も可

  return NextResponse.json({ ok: true })
}

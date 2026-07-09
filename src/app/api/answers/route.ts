import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { checkContent } from '@/lib/contentFilter'
import { translateToLocales, SUPPORTED_LOCALES } from '@/lib/translate'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') ?? 'debug'

  const { questionId, body, locale } = await request.json()
  const sourceLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'ja'

  if (!questionId || !body?.trim()) {
    return NextResponse.json({ error: '回答内容は必須です' }, { status: 400 })
  }
  if (body.trim().length < 30) {
    return NextResponse.json({ error: '回答は30文字以上入力してください' }, { status: 400 })
  }

  const filterResult = checkContent(body)
  if (!filterResult.ok) {
    return NextResponse.json({ error: filterResult.reason }, { status: 422 })
  }

  // 質問の存在確認
  const { data: question } = await supabase
    .from('questions')
    .select('id, status')
    .eq('id', questionId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!question) {
    return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 })
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
    return NextResponse.json({ error: 'すでにこの質問に回答しています' }, { status: 409 })
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
    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { checkContent } from '@/lib/contentFilter'
import { translateToLocales, translateCost, SUPPORTED_LOCALES, type TokenUsage } from '@/lib/translate'
import { getApiErrors } from '@/lib/apiErrors'
import { detectSourceLocale } from '@/lib/detectLocale'

// 【2026-10-07】自分の回答を編集する。それまでは回答の編集手段が無く、貼り間違いや誤字を直すには
// 運営がDBを直接書き換えて翻訳をやり直すしかなかった（2026-08-19に実際に発生）。
// 本人の人間の回答だけ・内容チェックは投稿時と同じ。本文を変えたら翻訳もやり直す。
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const apiErrors = await getApiErrors()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: apiErrors.loginRequired }, { status: 401 })

  const { data: banProfile } = await admin.from('profiles').select('is_banned').eq('id', user.id).maybeSingle()
  if (banProfile?.is_banned) return NextResponse.json({ error: apiErrors.notPermitted }, { status: 403 })

  const tenantId = (await headers()).get('x-tenant-id') ?? 'debug'
  const { id: answerId } = await params
  const { body, locale } = await request.json().catch(() => ({}))
  const text = String(body ?? '').trim()

  if (!text) return NextResponse.json({ error: apiErrors.answerRequired }, { status: 400 })
  if (text.length < 30) return NextResponse.json({ error: apiErrors.answerTooShort }, { status: 400 })
  const filterResult = checkContent(text)
  if (!filterResult.ok) return NextResponse.json({ error: apiErrors[filterResult.reasonCode] }, { status: 422 })

  const { data: answer } = await admin
    .from('answers')
    .select('id, user_id, is_ai, tenant_id')
    .eq('id', answerId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (!answer) return NextResponse.json({ error: apiErrors.answerNotFound }, { status: 404 })
  if (answer.is_ai || answer.user_id !== user.id) {
    return NextResponse.json({ error: apiErrors.notPermitted }, { status: 403 })
  }

  const sourceLocale = detectSourceLocale(text, String(locale ?? ''), SUPPORTED_LOCALES)
  // 先に本文を保存し、古い翻訳は消す（翻訳に失敗しても、古い内容の訳が残らないように）
  const { error: updateError } = await admin
    .from('answers')
    .update({ body: text, source_locale: sourceLocale, body_i18n: {} })
    .eq('id', answerId)
  if (updateError) {
    console.error('answer edit error:', updateError)
    return NextResponse.json({ error: apiErrors.postFailed }, { status: 500 })
  }

  try {
    const usage: TokenUsage = { prompt: 0, completion: 0 }
    const body_i18n = await translateToLocales(text, sourceLocale, usage)
    if (usage.prompt || usage.completion) {
      await admin.rpc('record_ai_tokens', {
        p_tenant_id: tenantId,
        p_prompt: usage.prompt,
        p_completion: usage.completion,
        p_cost: translateCost(usage),
      }).then(() => {}, (e: unknown) => console.error('record translation tokens error:', e))
    }
    await admin.from('answers').update({ body_i18n }).eq('id', answerId)
  } catch (e) {
    console.error('answer edit translation error:', e)
  }

  return NextResponse.json({ ok: true })
}

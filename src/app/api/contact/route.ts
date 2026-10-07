import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSpamOnly } from '@/lib/contentFilter'
import { sendContactInquiry } from '@/lib/email'
import { getApiErrors } from '@/lib/apiErrors'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const apiErrors = await getApiErrors()

  // 【2026-10-07】ログインなしでも送れるようにした（AdSense再申請前の点検で「連絡手段がログイン必須のフォームだけ」と指摘）。
  // ログイン中はアカウントのメールを返信先に使い、未ログインなら入力された返信先メールを使う。
  const { data: { user } } = await supabase.auth.getUser()

  const { subject, body, email, website, elapsedMs } = await request.json()

  // 迷惑メール対策（DBを使わない軽いもの）：人には見えない入力欄(website)に値がある／開いて3秒未満で送信
  // ＝機械的な送信とみなし、送ったふりをして実際には送らない（相手に対策を気付かせない）。
  // ⚠️Brevoの送信上限（300通/日）を守るためでもある。大量に来るようになったら Cloudflare のレート制限を足す。
  if ((typeof website === 'string' && website.trim() !== '') || !(Number(elapsedMs) >= 3000)) {
    return NextResponse.json({ ok: true })
  }

  const replyTo = user?.email ?? (typeof email === 'string' ? email.trim() : '')
  if (!replyTo || replyTo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
    return NextResponse.json({ error: apiErrors.invalidEmail }, { status: 400 })
  }

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: apiErrors.subjectAndBodyRequired }, { status: 400 })
  }
  if (subject.trim().length < 10) {
    return NextResponse.json({ error: apiErrors.subjectTooShort }, { status: 400 })
  }
  if (body.trim().length < 20) {
    return NextResponse.json({ error: apiErrors.contactBodyTooShort }, { status: 400 })
  }
  if (subject.trim().length > 200 || body.trim().length > 5000) {
    return NextResponse.json({ error: apiErrors.notPermitted }, { status: 400 })
  }

  const filterResult = checkSpamOnly(`${subject} ${body}`)
  if (!filterResult.ok) {
    return NextResponse.json({ error: apiErrors[filterResult.reasonCode] }, { status: 422 })
  }

  try {
    await sendContactInquiry({
      fromEmail: replyTo,
      loggedIn: !!user?.email,
      subject: subject.trim(),
      body: body.trim(),
    })
  } catch (e) {
    console.error('sendContactInquiry error:', e)
    return NextResponse.json({ error: apiErrors.sendFailed }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

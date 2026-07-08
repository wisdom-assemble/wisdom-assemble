import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkContent } from '@/lib/contentFilter'
import { sendContactInquiry } from '@/lib/email'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const { subject, body } = await request.json()

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: '件名と内容は必須です' }, { status: 400 })
  }
  if (subject.trim().length < 10) {
    return NextResponse.json({ error: '件名は10文字以上入力してください' }, { status: 400 })
  }
  if (body.trim().length < 20) {
    return NextResponse.json({ error: '内容は20文字以上入力してください' }, { status: 400 })
  }

  const filterResult = checkContent(`${subject} ${body}`)
  if (!filterResult.ok) {
    return NextResponse.json({ error: filterResult.reason }, { status: 422 })
  }

  try {
    await sendContactInquiry({
      fromEmail: user.email,
      subject: subject.trim(),
      body: body.trim(),
    })
  } catch (e) {
    console.error('sendContactInquiry error:', e)
    return NextResponse.json({ error: '送信に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

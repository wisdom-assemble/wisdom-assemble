import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkContent } from '@/lib/contentFilter'
import { sendContactInquiry } from '@/lib/email'
import { getApiErrors } from '@/lib/apiErrors'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const apiErrors = await getApiErrors()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: apiErrors.loginRequired }, { status: 401 })
  }

  const { subject, body } = await request.json()

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: apiErrors.subjectAndBodyRequired }, { status: 400 })
  }
  if (subject.trim().length < 10) {
    return NextResponse.json({ error: apiErrors.subjectTooShort }, { status: 400 })
  }
  if (body.trim().length < 20) {
    return NextResponse.json({ error: apiErrors.contactBodyTooShort }, { status: 400 })
  }

  const filterResult = checkContent(`${subject} ${body}`)
  if (!filterResult.ok) {
    return NextResponse.json({ error: apiErrors[filterResult.reasonCode] }, { status: 422 })
  }

  try {
    await sendContactInquiry({
      fromEmail: user.email,
      subject: subject.trim(),
      body: body.trim(),
    })
  } catch (e) {
    console.error('sendContactInquiry error:', e)
    return NextResponse.json({ error: apiErrors.sendFailed }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

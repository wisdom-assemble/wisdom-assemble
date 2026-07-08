import { createClient as createServiceClient } from '@supabase/supabase-js'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SITE_URL = 'wisdomassemble.com'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendEmail(params: { to: string; subject: string; htmlContent: string; replyTo?: string }): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('BREVO_API_KEY未設定のためメール送信をスキップしました')
    return
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Wisdom Assemble', email: 'noreply@wisdomassemble.com' },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      replyTo: params.replyTo ? { email: params.replyTo } : undefined,
    }),
  })

  if (!res.ok) {
    console.error('Brevo送信エラー:', await res.text())
  }
}

const CONTACT_INBOX = 'wisdomassemble@gmail.com'

// 問い合わせフォームの内容を運営者のGmailに転送する（ユーザーには宛先を見せない）
export async function sendContactInquiry(params: {
  fromEmail: string
  subject: string
  body: string
}): Promise<void> {
  await sendEmail({
    to: CONTACT_INBOX,
    subject: `【お問い合わせ】${params.subject}`,
    htmlContent: `
      <p>送信者: ${escapeHtml(params.fromEmail)}</p>
      <p style="white-space:pre-wrap;">${escapeHtml(params.body)}</p>
    `,
    replyTo: params.fromEmail,
  })
}

// マッチングされたユーザーに通知メールを送る（email_notify=falseなら送らない）
export async function notifyMatchedUser(params: {
  userId: string
  tenantId: string
  questionTitle: string
  questionSlug: string
}): Promise<void> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('email_notify')
    .eq('id', params.userId)
    .maybeSingle()

  if (profile?.email_notify === false) return

  const { data: authData } = await admin.auth.admin.getUserById(params.userId)
  const email = authData?.user?.email
  if (!email) return

  const { data: tenant } = await admin
    .from('tenants')
    .select('subdomain, name')
    .eq('id', params.tenantId)
    .maybeSingle()

  const subdomain = tenant?.subdomain ?? params.tenantId
  const siteName = tenant?.name ?? 'Wisdom Assemble'
  const url = `https://${subdomain}.${SITE_URL}/questions/${encodeURIComponent(params.questionSlug)}`

  await sendEmail({
    to: email,
    subject: `【${siteName}】あなたに回答依頼が届いています`,
    htmlContent: `
      <p>こんにちは。</p>
      <p>あなたにマッチした質問があります。</p>
      <p style="font-weight:bold;">${escapeHtml(params.questionTitle)}</p>
      <p><a href="${url}">質問を見て回答する</a></p>
      <p style="color:#888;font-size:12px;">このメールは ${siteName} からの自動送信です。マイページの設定からメール通知をオフにできます。</p>
    `,
  })
}

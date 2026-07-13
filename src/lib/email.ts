import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTenantDisplayName, getPublicSubdomain } from '@/lib/tenantNames'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SITE_URL = 'wisdomassemble.com'

type MatchNotifyLocale = 'en' | 'ja' | 'zh' | 'id' | 'vi' | 'ko' | 'es' | 'pt'

const MATCH_NOTIFY_TEMPLATES: Record<MatchNotifyLocale, {
  subject: (siteName: string) => string
  body: (params: { questionTitle: string; url: string; siteName: string }) => string
}> = {
  ja: {
    subject: (siteName) => `【${siteName}】あなたに回答依頼が届いています`,
    body: ({ questionTitle, url, siteName }) => `
      <p>こんにちは。</p>
      <p>あなたにマッチした質問があります。</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">質問を見て回答する</a></p>
      <p style="color:#888;font-size:12px;">このメールは ${escapeHtml(siteName)} からの自動送信です。マイページの設定からメール通知をオフにできます。</p>
    `,
  },
  en: {
    subject: (siteName) => `[${siteName}] You have a new question to answer`,
    body: ({ questionTitle, url, siteName }) => `
      <p>Hello,</p>
      <p>A question has been matched to you.</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">View and answer the question</a></p>
      <p style="color:#888;font-size:12px;">This is an automated email from ${escapeHtml(siteName)}. You can turn off email notifications in your account settings.</p>
    `,
  },
  zh: {
    subject: (siteName) => `【${siteName}】您有一个新问题待回答`,
    body: ({ questionTitle, url, siteName }) => `
      <p>您好，</p>
      <p>有一个问题已匹配给您。</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">查看并回答该问题</a></p>
      <p style="color:#888;font-size:12px;">这是来自 ${escapeHtml(siteName)} 的自动邮件。您可以在个人页面设置中关闭邮件通知。</p>
    `,
  },
  id: {
    subject: (siteName) => `[${siteName}] Anda memiliki pertanyaan baru untuk dijawab`,
    body: ({ questionTitle, url, siteName }) => `
      <p>Halo,</p>
      <p>Sebuah pertanyaan telah dicocokkan dengan Anda.</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">Lihat dan jawab pertanyaan</a></p>
      <p style="color:#888;font-size:12px;">Ini adalah email otomatis dari ${escapeHtml(siteName)}. Anda dapat mematikan notifikasi email di pengaturan akun Anda.</p>
    `,
  },
  vi: {
    subject: (siteName) => `[${siteName}] Bạn có một câu hỏi mới cần trả lời`,
    body: ({ questionTitle, url, siteName }) => `
      <p>Xin chào,</p>
      <p>Một câu hỏi đã được ghép nối với bạn.</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">Xem và trả lời câu hỏi</a></p>
      <p style="color:#888;font-size:12px;">Đây là email tự động từ ${escapeHtml(siteName)}. Bạn có thể tắt thông báo email trong cài đặt tài khoản của mình.</p>
    `,
  },
  ko: {
    subject: (siteName) => `[${siteName}] 답변할 새 질문이 있습니다`,
    body: ({ questionTitle, url, siteName }) => `
      <p>안녕하세요,</p>
      <p>회원님에게 매칭된 질문이 있습니다.</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">질문 보고 답변하기</a></p>
      <p style="color:#888;font-size:12px;">이 메일은 ${escapeHtml(siteName)}에서 자동으로 발송되었습니다. 마이페이지 설정에서 이메일 알림을 끌 수 있습니다.</p>
    `,
  },
  es: {
    subject: (siteName) => `[${siteName}] Tienes una nueva pregunta para responder`,
    body: ({ questionTitle, url, siteName }) => `
      <p>Hola,</p>
      <p>Se te ha asignado una pregunta.</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">Ver y responder la pregunta</a></p>
      <p style="color:#888;font-size:12px;">Este es un correo automático de ${escapeHtml(siteName)}. Puedes desactivar las notificaciones por correo en la configuración de tu cuenta.</p>
    `,
  },
  pt: {
    subject: (siteName) => `[${siteName}] Você tem uma nova pergunta para responder`,
    body: ({ questionTitle, url, siteName }) => `
      <p>Olá,</p>
      <p>Uma pergunta foi associada a você.</p>
      <p style="font-weight:bold;">${escapeHtml(questionTitle)}</p>
      <p><a href="${url}">Ver e responder à pergunta</a></p>
      <p style="color:#888;font-size:12px;">Este é um e-mail automático de ${escapeHtml(siteName)}. Você pode desativar as notificações por e-mail nas configurações da sua conta.</p>
    `,
  },
}

const isMatchNotifyLocale = (v: string | null | undefined): v is MatchNotifyLocale =>
  !!v && v in MATCH_NOTIFY_TEMPLATES

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
  questionTitleTranslations?: Record<string, string>
  questionSlug: string
}): Promise<void> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenantProfile } = await admin
    .from('tenant_profiles')
    .select('email_notify')
    .eq('tenant_id', params.tenantId)
    .eq('user_id', params.userId)
    .maybeSingle()

  if (tenantProfile?.email_notify === false) return

  const { data: authData } = await admin.auth.admin.getUserById(params.userId)
  const email = authData?.user?.email
  if (!email) return

  const [{ data: tenant }, { data: profile }] = await Promise.all([
    admin.from('tenants').select('name, language').eq('id', params.tenantId).maybeSingle(),
    admin.from('profiles').select('language').eq('id', params.userId).maybeSingle(),
  ])

  const siteName = getTenantDisplayName(params.tenantId, tenant?.name ?? params.tenantId)
  const subdomain = getPublicSubdomain(params.tenantId)
  const url = `https://${subdomain}.${SITE_URL}/questions/${encodeURIComponent(params.questionSlug)}`
  // メールは受信者本人がマイページで選んだ表示言語に合わせる（テナントの言語ではない）。
  // 未設定の場合のみテナント言語、それも無ければ英語にフォールバックする。
  const templateLocale: MatchNotifyLocale = isMatchNotifyLocale(profile?.language)
    ? profile.language
    : isMatchNotifyLocale(tenant?.language)
    ? tenant.language
    : 'en'
  const template = MATCH_NOTIFY_TEMPLATES[templateLocale]
  // 受信者の言語に翻訳済みのタイトルがあればそちらを使う（未翻訳の言語混在はスパム判定リスクがあるため）
  const questionTitle = params.questionTitleTranslations?.[templateLocale] ?? params.questionTitle

  await sendEmail({
    to: email,
    subject: template.subject(siteName),
    htmlContent: template.body({ questionTitle, url, siteName }),
  })
}

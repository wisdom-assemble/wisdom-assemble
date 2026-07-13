const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
// AI回答（askWithScore）とはモデルを分けてコストを抑える。翻訳は複雑な推論が不要な軽いタスクのため。
const TRANSLATE_MODEL = 'llama-3.1-8b-instant'

export const SUPPORTED_LOCALES = ['en', 'ja', 'zh', 'id', 'vi', 'ko', 'es', 'pt'] as const

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  zh: 'Simplified Chinese',
  id: 'Indonesian',
  vi: 'Vietnamese',
  ko: 'Korean',
  es: 'Spanish',
  pt: 'Portuguese',
}

// 429(レート制限)の時は間隔を空けて最大4回リトライする。それ以外のエラーは即座に投げる。
async function callGroqJson(systemPrompt: string, userText: string, attempt = 0): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: TRANSLATE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    }),
  })
  if (res.status === 429 && attempt < 4) {
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
    return callGroqJson(systemPrompt, userText, attempt + 1)
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Groq translate API error: ${res.status} ${bodyText}`)
  }
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

// sourceLocaleを除く対応言語へ翻訳し、{locale: 翻訳文} のオブジェクトを返す。
// 言語ごとに個別リクエストするとGroqのレート制限(429)にほぼ確実に引っかかるため、
// 全ターゲット言語分を1回のGroq呼び出しにまとめてJSONで受け取る。
export async function translateToLocales(
  text: string,
  sourceLocale: string
): Promise<Record<string, string>> {
  const targets = SUPPORTED_LOCALES.filter((locale) => locale !== sourceLocale)
  const localeList = targets.map((locale) => `"${locale}": ${LOCALE_NAMES[locale]}`).join(', ')
  const systemPrompt = `You are a professional translator. Translate the user's text into ALL of the following languages: ${localeList}. Preserve Markdown formatting exactly (headings, code blocks, lists, links). Respond with ONLY a JSON object whose keys are exactly the locale codes (${targets.join(', ')}) and whose values are the translated text for that locale. No explanations, no extra keys.`

  try {
    const content = await callGroqJson(systemPrompt, text)
    const parsed = JSON.parse(content) as Record<string, string>
    const result: Record<string, string> = {}
    for (const locale of targets) {
      if (typeof parsed[locale] === 'string' && parsed[locale].trim()) {
        result[locale] = parsed[locale].trim()
      }
    }
    return result
  } catch (e) {
    console.error('translateToLocales: batch translation failed', e)
    return {}
  }
}

// タイトルと本文をまとめて1回のGroq呼び出しで翻訳する（title/bodyを別々に呼ぶと8b-instantモデルへの
// リクエスト数が倍になり429が起きやすくなるため統合）。
export async function translateQuestionToLocales(
  title: string,
  body: string,
  sourceLocale: string
): Promise<{ title_i18n: Record<string, string>; body_i18n: Record<string, string> }> {
  const targets = SUPPORTED_LOCALES.filter((locale) => locale !== sourceLocale)
  const localeList = targets.map((locale) => `"${locale}": ${LOCALE_NAMES[locale]}`).join(', ')
  const systemPrompt = `You are a professional translator. You will receive a JSON object with "title" and "body" fields. Translate BOTH fields into ALL of the following languages: ${localeList}. Preserve Markdown formatting exactly in the body (headings, code blocks, lists, links). Respond with ONLY a JSON object whose keys are exactly the locale codes (${targets.join(', ')}), and whose values are objects of the form {"title": "...", "body": "..."} containing the translation for that locale. No explanations, no extra keys.`
  const userText = JSON.stringify({ title, body })

  const empty = { title_i18n: {}, body_i18n: {} }
  try {
    const content = await callGroqJson(systemPrompt, userText)
    const parsed = JSON.parse(content) as Record<string, { title?: string; body?: string }>
    const title_i18n: Record<string, string> = {}
    const body_i18n: Record<string, string> = {}
    for (const locale of targets) {
      const entry = parsed[locale]
      if (entry?.title?.trim()) title_i18n[locale] = entry.title.trim()
      if (entry?.body?.trim()) body_i18n[locale] = entry.body.trim()
    }
    return { title_i18n, body_i18n }
  } catch (e) {
    console.error('translateQuestionToLocales: batch translation failed', e)
    return empty
  }
}

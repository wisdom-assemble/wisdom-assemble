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

// 429(レート制限)の時だけ1回だけ間隔を空けてリトライする。それ以外のエラーは即座に投げる。
async function callGroqTranslate(text: string, targetLanguageName: string, retried = false): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: TRANSLATE_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the user's text into ${targetLanguageName}. Preserve Markdown formatting exactly (headings, code blocks, lists, links). Output ONLY the translated text with no explanations, no quotes, and no preamble.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 2048,
    }),
  })
  if (res.status === 429 && !retried) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return callGroqTranslate(text, targetLanguageName, true)
  }
  if (!res.ok) throw new Error(`Groq translate API error: ${res.status}`)
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

// 一度に投げるGroqリクエスト数の上限。タイトル・本文それぞれ最大7言語=14件を
// 全部同時に投げるとGroqのレート制限(429)にほぼ確実に引っかかっていたため、
// ロケール単位（タイトル+本文の2件ずつ）でこの数だけ並行実行する。
const CONCURRENCY = 2

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  async function run(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await worker(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run))
  return results
}

// sourceLocaleを除く対応言語へ翻訳し、{locale: 翻訳文} のオブジェクトを返す。
// 個別の翻訳が失敗してもそのロケールだけスキップし、他の翻訳は継続する。
export async function translateToLocales(
  text: string,
  sourceLocale: string
): Promise<Record<string, string>> {
  const targets = SUPPORTED_LOCALES.filter((locale) => locale !== sourceLocale)
  const entries = await mapWithConcurrency(targets, CONCURRENCY, async (locale): Promise<[string, string] | null> => {
    try {
      const translated = await callGroqTranslate(text, LOCALE_NAMES[locale])
      return [locale, translated]
    } catch (e) {
      console.error(`translateToLocales: failed for locale=${locale}`, e)
      return null
    }
  })
  const result: Record<string, string> = {}
  for (const entry of entries) {
    if (entry) result[entry[0]] = entry[1]
  }
  return result
}

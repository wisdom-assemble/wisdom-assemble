// ============================================================
// 多言語翻訳（2026-07-22〜 Groq 8b → Gemini 3.5 Flash-Lite へ移行）
// ------------------------------------------------------------
// 移行理由は品質。Groq 8bには実害のある誤訳があった（実測）:
//   韓国語「op-ampの"音"の違い」→「소음(騒音)의 차이」＝意味が変わる
//   中国語「ケンタウロス」→「オペ阿姆」＝日本語カタカナが混入
// Geminiは同一条件で7/7言語成功し、型番(RC3403ADB/uPC4741C)・製品名
// (Quad Cortex Mini/Genelec G Three)・Markdownを全言語で保持することを検証済み。
//
// Groqはフォールバックとして残す。単一プロバイダにするとGemini障害時に翻訳が
// 全滅するため、保険として経路を維持する（GEMINI_API_KEY未設定時もGroqで動く）。
// ============================================================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const GEMINI_TRANSLATE_MODEL = 'gemini-3.5-flash-lite'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_TRANSLATE_MODEL = 'llama-3.1-8b-instant'

const USE_GEMINI = !!GEMINI_API_KEY
// GroqキーはGemini障害時のフォールバックに必要。消すと保険が静かに死ぬので残すこと。
// 未設定の場合はフォールバック経路自体を外す（Bearer undefined で401を撃たないため）。
const HAS_GROQ = !!GROQ_API_KEY

// 翻訳の料金（USD / 1Mトークン、2026-07-22に公式料金ページで確認）:
//   Gemini 3.5 Flash-Lite : 入力$0.30 / 出力$2.50
//   Groq 8b-instant       : 入力$0.05 / 出力$0.08（フォールバック時用）
// フォールバックが発生した回はGemini単価で計上されるが、稀なうえ推定値なので許容する。
// 回答生成がGeminiになりコストの請求先が2つに割れたため、翻訳分も計上しないと
// ダッシュボードの金額が実コストより過小に見える（プランナー指摘・2026-07-22）。
const RATE_8B_IN = 0.05
const RATE_8B_OUT = 0.08
const RATE_GEMINI_IN = 0.30
const RATE_GEMINI_OUT = 2.50

// 呼び出し側が任意で渡すトークン集計用アキュムレータ。
// 渡さなければ従来どおり何も起きない（既存の呼び出しは無改修で動く）。
export type TokenUsage = { prompt: number; completion: number }
export function translateCost(u: TokenUsage): number {
  const [ri, ro] = USE_GEMINI ? [RATE_GEMINI_IN, RATE_GEMINI_OUT] : [RATE_8B_IN, RATE_8B_OUT]
  return (u.prompt / 1_000_000) * ri + (u.completion / 1_000_000) * ro
}

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
// 出力に必要なトークン数を入力量から見積もる。
// GroqはTPM(6000/分)を「実際の使用量」ではなく「要求したmax_tokens」で予約するため、
// 固定4096を指定すると1回で枠の7割を食い、2問目以降が必ず429になる（実測で判明）。
// 実測値: 113文字の質問を7言語へ訳して completion 524 → 1文字×1言語あたり約0.66トークン。
// それに安全率1.8を掛け、下限800・上限4096でクランプする。
// 翻訳の再試行に使える時間（ミリ秒）。
// ※これは「1回の翻訳呼び出しあたり」の予算。質問翻訳とAI回答翻訳は別々に予算を持つが、
//   両者は並行して走る（route.tsが185行でPromiseを開始し312行で待つ）ため、
//   リクエスト全体の実効的な最悪値は合計36秒ではなく20秒程度になる。
// 翻訳は質問投稿APIのレスポンス前にawaitされる＝この時間ぶんユーザーが待つ。
// プロバイダ2つ×再試行を無制限に許すと最悪50秒超になるため予算で縛る。
// 予算切れの場合は翻訳を諦める（質問の投稿自体は成功し、多言語ページが後回しになるだけ）。
const TRANSLATE_BUDGET_MS = 18_000

function estimateMaxTokens(text: string, localeCount: number): number {
  const est = Math.ceil(text.length * localeCount * 1.2)
  return Math.min(4096, Math.max(800, est))
}

// 1回分のAPI呼び出し。GeminiもGroqもOpenAI互換なのでリクエスト形は共通。
async function callOnce(
  provider: 'gemini' | 'groq',
  systemPrompt: string,
  userText: string,
  maxTokens: number
): Promise<Response> {
  const isGem = provider === 'gemini'
  return fetch(isGem ? GEMINI_API_URL : GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${isGem ? GEMINI_API_KEY : GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: isGem ? GEMINI_TRANSLATE_MODEL : GROQ_TRANSLATE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      response_format: { type: 'json_object' },
      // Geminiは内部thinkingがトークンを食うので下限を確保する
      max_tokens: isGem ? Math.max(maxTokens, 1200) : maxTokens,
    }),
  })
}

// 429の本文から復活までの秒数を取り出す（Geminiは "retry in 10.7s" / retryDelay を返す）
function parseRetrySec(body: string): number | null {
  const m = body.match(/retry in ([\d.]+)s/i) ?? body.match(/"retryDelay"\s*:\s*"?([\d.]+)s/i)
  const sec = m ? Number(m[1]) : NaN
  return Number.isFinite(sec) ? Math.ceil(sec) : null
}

// 翻訳を実行する。Geminiを優先し、429は短時間だけ待って再試行、
// それでも駄目ならGroqへフォールバックする（Gemini障害時に翻訳が全滅しないための保険）。
async function callGroqJson(
  systemPrompt: string,
  userText: string,
  usageOut?: TokenUsage,
  maxTokens = 4096,
  deadline = Date.now() + TRANSLATE_BUDGET_MS
): Promise<string> {
  const order: Array<'gemini' | 'groq'> = USE_GEMINI
    ? (HAS_GROQ ? ['gemini', 'groq'] : ['gemini'])
    : ['groq']
  let lastErr = ''

  for (const provider of order) {
    // 予算を使い切っていたら次のプロバイダも試さず終了する
    if (Date.now() >= deadline) {
      lastErr = lastErr || 'translate budget exceeded'
      break
    }
    for (let i = 0; i <= 2; i++) {
      const res = await callOnce(provider, systemPrompt, userText, maxTokens)
      if (res.ok) {
        const json = await res.json()
        if (usageOut) {
          usageOut.prompt += json.usage?.prompt_tokens ?? 0
          usageOut.completion += json.usage?.completion_tokens ?? 0
        }
        return (json.choices?.[0]?.message?.content ?? '').trim()
      }
      const bodyText = await res.text().catch(() => '')
      lastErr = `${provider} ${res.status} ${bodyText.slice(0, 160)}`
      // 429は短い待ちなら1回だけその場で待つ。長い/繰り返すなら次のプロバイダへ。
      if (res.status === 429 && i < 2) {
        const suggested = parseRetrySec(bodyText)
        const waitMs = suggested != null && suggested <= 12 ? (suggested + 1) * 1000 : 1500 * (i + 1)
        // 待つと予算を超えるなら、待たずに次のプロバイダへ回す
        if (Date.now() + waitMs >= deadline) break
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }
      break // 429以外、または再試行を使い切ったら次のプロバイダへ
    }
    if (provider === 'gemini') {
      console.error('translate: Gemini failed, falling back to Groq:', lastErr)
    }
  }
  throw new Error(`translate API error: ${lastErr}`)
}

// sourceLocaleを除く対応言語へ翻訳し、{locale: 翻訳文} のオブジェクトを返す。
// 言語ごとに個別リクエストするとGroqのレート制限(429)にほぼ確実に引っかかるため、
// 全ターゲット言語分を1回のGroq呼び出しにまとめてJSONで受け取る。
export async function translateToLocales(
  text: string,
  sourceLocale: string,
  usageOut?: TokenUsage,
  onlyLocales?: string[],
  deadline = Date.now() + TRANSLATE_BUDGET_MS
): Promise<Record<string, string>> {
  const targets = SUPPORTED_LOCALES.filter(
    (locale) => locale !== sourceLocale && (!onlyLocales || onlyLocales.includes(locale))
  )
  if (targets.length === 0) return {}
  const localeList = targets.map((locale) => `"${locale}": ${LOCALE_NAMES[locale]}`).join(', ')
  const systemPrompt = `You are a professional translator. Translate the user's text into ALL of the following languages: ${localeList}. Preserve Markdown formatting exactly (headings, code blocks, lists, links). Respond with ONLY a JSON object whose keys are exactly the locale codes (${targets.join(', ')}) and whose values are the translated text for that locale. No explanations, no extra keys.`

  try {
    const content = await callGroqJson(systemPrompt, text, usageOut, estimateMaxTokens(text, targets.length), deadline)
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
// キーはネストせずフラット(title_en, body_en, ...)にする。ネストしたJSONだとタイトルに引用符等が
// 含まれる場合にモデルがエスケープを誤り400 json_validate_failedになりやすいため。
// それでも失敗した場合は従来の個別呼び出し(2回)にフォールバックする。
export async function translateQuestionToLocales(
  title: string,
  body: string,
  sourceLocale: string,
  usageOut?: TokenUsage,
  deadline = Date.now() + TRANSLATE_BUDGET_MS
): Promise<{ title_i18n: Record<string, string>; body_i18n: Record<string, string> }> {
  const targets = SUPPORTED_LOCALES.filter((locale) => locale !== sourceLocale)
  const localeList = targets.map((locale) => `"${locale}": ${LOCALE_NAMES[locale]}`).join(', ')
  const keyList = targets.flatMap((locale) => [`title_${locale}`, `body_${locale}`]).join(', ')
  const systemPrompt = `You are a professional translator. You will receive a JSON object with "title" and "body" fields. Translate BOTH fields into ALL of the following languages: ${localeList}. Preserve Markdown formatting exactly in the body (headings, code blocks, lists, links). Respond with ONLY a flat JSON object (no nested objects) with exactly these keys: ${keyList}. Each key's value is the translated text for that field/locale. No explanations, no extra keys.`
  const userText = JSON.stringify({ title, body })

  try {
    const content = await callGroqJson(systemPrompt, userText, usageOut, estimateMaxTokens(title + body, targets.length), deadline)
    const parsed = JSON.parse(content) as Record<string, string>
    const title_i18n: Record<string, string> = {}
    const body_i18n: Record<string, string> = {}
    for (const locale of targets) {
      const t = parsed[`title_${locale}`]
      const b = parsed[`body_${locale}`]
      if (typeof t === 'string' && t.trim()) title_i18n[locale] = t.trim()
      if (typeof b === 'string' && b.trim()) body_i18n[locale] = b.trim()
    }

    // モデルが一部の言語を出し忘れることがある（実測で6回中1回、7言語中5言語しか返らず）。
    // 欠けた言語だけを対象に1回ずつ補完する。全言語を訳し直すより軽く、TPMも節約できる。
    const missTitle = targets.filter((l) => !title_i18n[l])
    const missBody = targets.filter((l) => !body_i18n[l])
    if (missTitle.length) {
      Object.assign(title_i18n, await translateToLocales(title, sourceLocale, usageOut, missTitle, deadline).catch((e) => {
        console.error('translateQuestionToLocales: title gap-fill failed for', missTitle, e)
        return {}
      }))
    }
    if (missBody.length) {
      Object.assign(body_i18n, await translateToLocales(body, sourceLocale, usageOut, missBody, deadline).catch((e) => {
        console.error('translateQuestionToLocales: body gap-fill failed for', missBody, e)
        return {}
      }))
    }
    return { title_i18n, body_i18n }
  } catch (e) {
    console.error('translateQuestionToLocales: batch translation failed, falling back to separate calls', e)
    // 直列で実行する。Promise.allで同時に投げるとTPM(6000/分)を二重に消費し、
    // バッチ失敗直後に必ず429が連鎖してタイトル・本文の両方が空になっていた（実測）。
    const title_i18n = await translateToLocales(title, sourceLocale, usageOut, undefined, deadline)
    const body_i18n = await translateToLocales(body, sourceLocale, usageOut, undefined, deadline)
    return { title_i18n, body_i18n }
  }
}

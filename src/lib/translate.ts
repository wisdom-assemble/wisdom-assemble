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
// ⚠️2026-09-05: Groqが llama 系を全廃し、旧値 'llama-3.1-8b-instant' は 404
//   （"The model does not exist or you do not have access to it"）になっていた。
//   Groqは「Geminiが落ちたときだけ」呼ばれるので、死んでいても普段は気づけない。
//   実際にGeminiが503を返した日に、保険が効かず翻訳が全滅して発覚した。
//   ⚠️qwen/qwen3.8-27b は訳質が最良だったが、7言語をまとめて返すと出力トークン上限で
//   429「Request too large ... on output tokens」になったため不採用。保険は落ちないことが第一。
//   採用時に実訳を確認済み：「op-ampの音の違い」→ko「사운드 차이」(旧8bの「소음(騒音)」誤訳は再現せず)、
//   zhにカタカナ混入なし、Quad Cortex Mini / Genelec G Three の製品名も全言語で保持。
//   ⚠️Groqのラインナップは入れ替わる。404が出たら
//     curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
//   で実在するモデルを確認してから差し替えること。
const GROQ_TRANSLATE_MODEL = 'openai/gpt-oss-120b'

const USE_GEMINI = !!GEMINI_API_KEY
// GroqキーはGemini障害時のフォールバックに必要。消すと保険が静かに死ぬので残すこと。
// 未設定の場合はフォールバック経路自体を外す（Bearer undefined で401を撃たないため）。
const HAS_GROQ = !!GROQ_API_KEY

// 翻訳の料金（USD / 1Mトークン、2026-07-22に公式料金ページで確認）:
//   Gemini 3.5 Flash-Lite : 入力$0.30 / 出力$2.50
//   Groq qwen3.8-27b      : フォールバック時用（旧 8b-instant は2026-09-05に廃止済み）
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

// 日本語→多言語では出力が原文の約15倍の文字数になる（実測: 366字→7言語で合計5554字）。
// 係数1.2では上限に当たって一部の言語が数文字しか返らない事故が起きたため引き上げた。
// 上限8192はGeminiの出力上限。Groqへ渡す値は callOnce 側で別途絞る（TPMを食うため）。
function estimateMaxTokens(text: string, localeCount: number): number {
  const est = Math.ceil(text.length * localeCount * 2.5)
  return Math.min(8192, Math.max(1500, est))
}

// 1回分のAPI呼び出し。GeminiもGroqもOpenAI互換なのでリクエスト形は共通。
// 出力させたいJSONの形。Geminiに渡すと構造が保証される（下記 callOnce のコメント参照）。
export type JsonSchema = { name: string; schema: Record<string, unknown> }

// 全キーが string の JSON を要求するスキーマを組み立てる
export function stringSchema(name: string, keys: string[]): JsonSchema {
  return {
    name,
    schema: {
      type: 'object',
      properties: Object.fromEntries(keys.map((k) => [k, { type: 'string' }])),
      required: [...keys],
      additionalProperties: false,
    },
  }
}

async function callOnce(
  provider: 'gemini' | 'groq',
  systemPrompt: string,
  userText: string,
  maxTokens: number,
  schema?: JsonSchema,
  deadline?: number
): Promise<Response> {
  const isGem = provider === 'gemini'
  return fetch(isGem ? GEMINI_API_URL : GROQ_API_URL, {
    method: 'POST',
    // 予算はループの前後でしか見ていないため、1回の呼び出しが長引くと予算を超える
    // （実測で35秒かかった回があった）。呼び出し自体にも残り時間で上限をかける。
    // ⚠️2026-09-05修正（E0）：以前は残り予算をまるごとGeminiに渡していたため、
    //   Geminiが18秒フルに使ってタイムアウトすると callGroqJson のループ先頭の
    //   `if (Date.now() >= deadline) break` に当たり、Groqが一度も呼ばれなかった。
    //   ⭐Geminiには残り予算の2/3、フォールバック用に1/3を残す。
    //   ⚠️配分の根拠（2026-09-05 実測）：
    //     Geminiの正常な成功は 8〜9秒（CLAUDE.mdの実測記録）
    //     Groq(gpt-oss-120b)の7言語翻訳は 3〜5秒（実測 4.96 / 3.23 / 3.62秒）
    //   ⛔半分(9秒)で切ると正常なGeminiまで打ち切ってしまう（品質が理由でGeminiを
    //     主役にしたので本末転倒）。⭐Groqは速いので1/3(6秒)あれば足りる。
    //   Groq側は残り全部を使ってよい（最後の砦なので）。
    signal: deadline
      ? AbortSignal.timeout(
          Math.max(1000, isGem
            ? Math.floor((deadline - Date.now()) * 2 / 3)
            : deadline - Date.now())
        )
      : undefined,
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
      // Geminiはjson_schemaで出力の構造を強制できる。json_objectだけだと
      // ①稀に不正なJSONを返す（`"id": "indonesian": "…"` のような二重コロン。
      //   パース全体が失敗し全言語が失われる）②翻訳が要約され原文の半分の
      //   分量になる、の2つが実際に起きた（2026-08-17に本番で発生・実測で確認）。
      // Groqへのフォールバック側は8bモデルがjson_schema非対応なので従来どおり。
      response_format: isGem && schema
        ? { type: 'json_schema', json_schema: schema }
        : { type: 'json_object' },
      // Geminiは内部thinkingがトークンを食うので下限を確保する。
      // GroqはTPM(6000/分)を「実際の使用量」ではなく「要求したmax_tokens」で予約するため、
      // 大きな値を渡すと1回で枠を食い潰して次の質問が429になる。4096で頭打ちにする。
      max_tokens: isGem ? Math.max(maxTokens, 1200) : Math.min(maxTokens, 4096),
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
  deadline = Date.now() + TRANSLATE_BUDGET_MS,
  schema?: JsonSchema
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
      const res = await callOnce(provider, systemPrompt, userText, maxTokens, schema, deadline)
        .catch((e) => { lastErr = `${provider} ${e}`; return null })
      if (!res) break // タイムアウト・通信エラーは次のプロバイダへ
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
  // 書式に注意: `"id": Indonesian` のような「キー: 値」に見える書き方をすると、
  // モデルがこれを出力テンプレートと誤解し `"id": "indonesian": "実際の翻訳"` という
  // 不正なJSONを返すことがある（2026-08-17に本番で発生。JSON全体のパースが失敗し
  // 7言語すべてが失われた）。キーと言語名は必ず括弧書きで分けること。
  const localeList = targets.map((locale) => `${locale} (${LOCALE_NAMES[locale]})`).join(', ')
  const systemPrompt = `You are a professional translator. Translate the user's text into ALL of the following languages: ${localeList}. Preserve Markdown formatting exactly (headings, code blocks, lists, links). Respond with ONLY a JSON object whose keys are exactly the locale codes (${targets.join(', ')}) and whose values are the translated text for that locale. No explanations, no extra keys.`

  const schema = stringSchema('translations', [...targets])
  const maxTokens = estimateMaxTokens(text, targets.length)

  // JSONが壊れて返る事故は「1回目は失敗するが2回目は通る」形で起きるため、
  // 予算が残っていればパース失敗そのものを再試行する（API側のリトライは
  // callGroqJson が429にしか反応せず、壊れたJSONは拾えないため）。
  let lastErr: unknown = null
  let best: Record<string, string> = {}
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0 && Date.now() >= deadline) break
    try {
      const content = await callGroqJson(systemPrompt, text, usageOut, maxTokens, deadline, schema)
      const parsed = JSON.parse(content) as Record<string, string>
      const result: Record<string, string> = {}
      for (const locale of targets) {
        const v = typeof parsed[locale] === 'string' ? parsed[locale].trim() : ''
        // json_schema は「stringであること」しか保証しないので、出力トークンが尽きると
        // 残りの言語に数文字だけ入った状態で返ってくる。原文に対して極端に短いものは
        // 欠損とみなして採用しない（言語差を考えても1/4を下回ることはない）。
        if (v && v.length >= text.length * 0.25) result[locale] = v
      }
      if (Object.keys(result).length === targets.length) return result
      if (Object.keys(result).length > Object.keys(best).length) best = result
      lastErr = new Error(`incomplete: ${Object.keys(result).length}/${targets.length}`)
    } catch (e) {
      lastErr = e
    }
  }
  // まとめて要求すると、モデルが最初の1〜2言語だけ出してJSONを閉じてしまうことがある
  // （トークン切れではない。実測で completion 431 でも打ち切られた）。
  // 欠けた言語だけで要求し直すと出力が短くなり通りやすいので、1段だけ補完する。
  // onlyLocales 付きの呼び出しは既に補完中なので再帰しない。
  const missing = targets.filter((l) => !best[l])
  if (missing.length && missing.length < targets.length && !onlyLocales && Date.now() < deadline) {
    Object.assign(best, await translateToLocales(text, sourceLocale, usageOut, missing, deadline))
  }

  const filled = targets.filter((l) => best[l]).length
  if (filled > 0) {
    if (filled < targets.length) console.error(`translateToLocales: partial ${filled}/${targets.length}`, lastErr)
    return best
  }
  console.error('translateToLocales: batch translation failed', lastErr)
  return {}
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
  // 書式に注意: `"id": Indonesian` のような「キー: 値」に見える書き方をすると、
  // モデルがこれを出力テンプレートと誤解し `"id": "indonesian": "実際の翻訳"` という
  // 不正なJSONを返すことがある（2026-08-17に本番で発生。JSON全体のパースが失敗し
  // 7言語すべてが失われた）。キーと言語名は必ず括弧書きで分けること。
  const localeList = targets.map((locale) => `${locale} (${LOCALE_NAMES[locale]})`).join(', ')
  const keyList = targets.flatMap((locale) => [`title_${locale}`, `body_${locale}`]).join(', ')
  const systemPrompt = `You are a professional translator. You will receive a JSON object with "title" and "body" fields. Translate BOTH fields into ALL of the following languages: ${localeList}. Preserve Markdown formatting exactly in the body (headings, code blocks, lists, links). Respond with ONLY a flat JSON object (no nested objects) with exactly these keys: ${keyList}. Each key's value is the translated text for that field/locale. No explanations, no extra keys.`
  const userText = JSON.stringify({ title, body })

  try {
    const content = await callGroqJson(
      systemPrompt,
      userText,
      usageOut,
      estimateMaxTokens(title + body, targets.length),
      deadline,
      stringSchema('question_translations', targets.flatMap((l) => [`title_${l}`, `body_${l}`]))
    )
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

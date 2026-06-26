const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function askGemini(
  tenantId: string,
  question: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(tenantId)

  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: { maxOutputTokens: 1024 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`)
  }

  const json = await res.json()
  const text: string =
    json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  return text.trim()
}

function buildSystemPrompt(tenantId: string): string {
  const genre = tenantId === 'debug' ? 'プログラミング・デバッグ' : tenantId

  return `あなたは${genre}の専門家です。
ユーザーの質問に答えてください。

重要なルール：
- 確信が持てない場合や、情報が古い可能性がある場合は、正直に「わかりません」と答えてください
- 曖昧な推測は絶対にしないでください
- 知らないことを知っているように見せないでください
- 回答は簡潔・明確に。日本語で答えてください
- ジャンル外の質問（${genre}に関係ない）には「このサービスでは${genre}の質問のみ受け付けています」と答えてください`
}

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function askGemini(
  tenantId: string,
  question: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(tenantId)

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${res.status} ${err}`)
  }

  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
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

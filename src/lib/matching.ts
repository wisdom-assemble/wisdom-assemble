import { createClient } from '@/lib/supabase/server'

// スコア設定定数（リリース後に実データで調整）
const SCORE = {
  SKILL_TAG_MATCH: 5,      // 自己申告スキルタグ一致
  ANSWERED_TAG_MATCH: 2,   // 回答実績タグ一致
  ANSWERED_TAG_CAP: 10,    // 実績タグの上限回数
  ANSWER_COUNT_RATE: 0.3,  // 総回答数ボーナス
  BASE_SCORE: 20,          // 全員の最低保証スコア（初心者にもチャンス）
}

// スコアに比例した確率で1人を選ぶ重み付きランダム選択
function weightedRandom(candidates: { id: string; score: number }[]): string | null {
  if (candidates.length === 0) return null
  const total = candidates.reduce((sum, c) => sum + c.score, 0)
  let rand = Math.random() * total
  for (const c of candidates) {
    rand -= c.score
    if (rand <= 0) return c.id
  }
  return candidates[candidates.length - 1].id
}

// JSONBの翻訳カラムから文字列だけを取り出す（型が不定なので防御的に扱う）
function i18nValues(v: unknown): string[] {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return []
  return Object.values(v as Record<string, unknown>).filter((x): x is string => typeof x === 'string')
}

// スキルタグで最適なユーザーを選ぶ（重み付きランダム選択）
export async function findMatch(
  tenantId: string,
  questionId: string,
  excludeUserIds: string[],  // 質問者・前回のB/Cを除外
  // 投稿直後は翻訳がまだDBに保存されていないため、呼び出し側が持っている翻訳を渡せる。
  // 渡された場合はそちらを優先する（questions/route.ts の新規投稿がこの経路）。
  translations?: { title_i18n?: unknown; body_i18n?: unknown }
): Promise<string | null> {
  const supabase = await createClient()

  // 質問のカテゴリキーワードを取得
  const { data: question } = await supabase
    .from('questions')
    .select('title, body, title_i18n, body_i18n')
    .eq('id', questionId)
    .single()

  if (!question) return null

  // 回答可能なユーザー一覧を取得（除外リスト以外）
  const excludeFilter = excludeUserIds.length > 0
    ? excludeUserIds.join(',')
    : '00000000-0000-0000-0000-000000000000' // ダミーUUID（除外なし時のworkaround）

  const { data: candidates } = await supabase
    .from('tenant_profiles')
    .select('user_id, skill_tags, answered_tags, answer_count')
    .eq('tenant_id', tenantId)
    .eq('is_available', true)
    .not('user_id', 'in', `(${excludeFilter})`)

  if (!candidates || candidates.length === 0) return null

  // 照合は「タグの文字列が質問文に含まれるか」の部分一致なので、投稿された元言語の
  // 本文しか見ないと、日本語のスキルタグは英語で投稿された質問に一生当たらない
  // （逆も同じ）。多言語サービスとしては成立しないため、翻訳結果も対象に含める。
  // これにより、テナントのタグを言語ごとに用意しなくても全言語の質問に当たる。
  const parts = [
    question.title,
    question.body,
    ...i18nValues(translations?.title_i18n ?? question.title_i18n),
    ...i18nValues(translations?.body_i18n ?? question.body_i18n),
  ]
  const questionText = parts.join(' ').toLowerCase()

  const scored = candidates.map(c => {
    const skillTags: string[] = c.skill_tags ?? []
    const answeredTags: string[] = c.answered_tags ?? []

    // 自己申告タグマッチ
    const skillMatch = skillTags.filter(tag =>
      questionText.includes(tag.toLowerCase())
    ).length

    // 回答実績タグマッチ（上限あり）
    const answeredMatch = Math.min(
      answeredTags.filter(tag => questionText.includes(tag.toLowerCase())).length,
      SCORE.ANSWERED_TAG_CAP
    )

    const score =
      SCORE.BASE_SCORE +
      skillMatch * SCORE.SKILL_TAG_MATCH +
      answeredMatch * SCORE.ANSWERED_TAG_MATCH +
      (c.answer_count ?? 0) * SCORE.ANSWER_COUNT_RATE

    return { id: c.user_id, score }
  })

  return weightedRandom(scored)
}

// 時間制限のデッドラインを計算
export function calcDeadline(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

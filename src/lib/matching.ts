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

// スキルタグで最適なユーザーを選ぶ（重み付きランダム選択）
export async function findMatch(
  tenantId: string,
  questionId: string,
  excludeUserIds: string[]  // 質問者・前回のB/Cを除外
): Promise<string | null> {
  const supabase = await createClient()

  // 質問のカテゴリキーワードを取得
  const { data: question } = await supabase
    .from('questions')
    .select('title, body')
    .eq('id', questionId)
    .single()

  if (!question) return null

  // 回答可能なユーザー一覧を取得（除外リスト以外）
  const excludeFilter = excludeUserIds.length > 0
    ? excludeUserIds.join(',')
    : '00000000-0000-0000-0000-000000000000' // ダミーUUID（除外なし時のworkaround）

  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, skill_tags, answered_tags, answer_count')
    .eq('is_available', true)
    .not('id', 'in', `(${excludeFilter})`)

  if (!candidates || candidates.length === 0) return null

  const questionText = `${question.title} ${question.body}`.toLowerCase()

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

    return { id: c.id, score }
  })

  return weightedRandom(scored)
}

// 時間制限のデッドラインを計算
export function calcDeadline(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

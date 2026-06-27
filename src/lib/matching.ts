import { createClient } from '@/lib/supabase/server'

// スキルタグで最適なユーザーを選ぶ
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
  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, skill_tags, answer_count')
    .eq('is_available', true)
    .not('id', 'in', `(${excludeUserIds.map(id => `"${id}"`).join(',')})`)

  if (!candidates || candidates.length === 0) return null

  // スキルマッチスコアを計算
  const questionText = `${question.title} ${question.body}`.toLowerCase()

  const scored = candidates.map(c => {
    const tags: string[] = c.skill_tags ?? []
    const matchCount = tags.filter(tag =>
      questionText.includes(tag.toLowerCase())
    ).length
    const score = matchCount * 20 + (c.answer_count ?? 0) * 0.1
    return { id: c.id, score }
  })

  // スコア順にソートして最上位を返す
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.score > 0 ? scored[0].id : (scored[0]?.id ?? null)
}

// 時間制限のデッドラインを計算
export function calcDeadline(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

import { createClient } from '@/lib/supabase/server'
import { getSkillOptions } from '@/lib/skillTags'

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

  // 【2026-10-07】BANされた人は候補にしない（BANしても is_available は true のままで、選ばれると
  // 通知が届くのに回答APIでは403になり、質問が8時間止まっていた）。取得に失敗した場合は絞らない。
  const { data: bannedRows, error: bannedErr } = await supabase
    .from('profiles')
    .select('id')
    .in('id', candidates.map((c) => c.user_id))
    .eq('is_banned', true)
  const bannedIds = new Set(bannedErr ? [] : (bannedRows ?? []).map((r: { id: string }) => r.id))
  const eligible = candidates.filter((c) => !bannedIds.has(c.user_id))
  if (eligible.length === 0) return null

  // 【2026-10-07】自己申告の得意分野は、そのテナントの選択肢にあるものだけを数える（重複も除く）。
  // skill_tags はブラウザから直接書き込める列で、'a' や 'e' のような1文字を大量に入れると
  // 部分一致で加点され、マッチングをほぼ独占できた。
  const allowedSkills = new Set(getSkillOptions(tenantId).map((t) => t.toLowerCase()))

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

  const scored = eligible.map(c => {
    const skillTags: string[] = [...new Set(((c.skill_tags ?? []) as string[]).filter((tag) => allowedSkills.has(String(tag).toLowerCase())))]
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

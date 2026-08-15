// テナントごとの選択可能スキルタグ（マイページの「得意なこと」設定で使用）。
// 未定義のテナントはdebug相当のデフォルトにフォールバックする。
export const TENANT_SKILL_OPTIONS: Record<string, string[]> = {
  debug: [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS',
    'Node.js', 'Python', 'SQL', 'PostgreSQL', 'MySQL',
    'MongoDB', 'Redis', 'Firebase', 'Supabase', 'Docker',
    'AWS', 'Git', 'Linux', 'セキュリティ',
  ],
  dtm: [
    'Ableton Live', 'Logic Pro', 'Cubase', 'FL Studio', 'Pro Tools',
    'ミキシング', 'マスタリング', 'DAW', 'MIDI', 'シンセサイザー',
    'サンプリング', 'レコーディング', '音楽理論', '作曲', '編曲',
  ],
  // マッチングは「タグの文字列が質問本文に含まれるか」の部分一致（matching.ts）なので、
  // 同義語・表記ゆれは独立したタグとして両方入れてある（エフェクター/ペダル、
  // アコースティックギター/アコギ、ビンテージ機材/ヴィンテージ）。
  // 「配線・改造」のような複合語は質問文に出ないため一度も一致しない＝入れないこと。
  guitar: [
    'エレキギター', 'アコースティックギター', 'アコギ', 'エフェクター', 'ペダル',
    'マルチエフェクター', 'ペダルボード', 'アンプ', '真空管アンプ', 'アンプシミュレーター',
    'ピックアップ', '配線', '改造', 'リペア', 'セットアップ',
    'ビンテージ機材', 'ヴィンテージ', '録音',
  ],
}

export function getSkillOptions(tenantId: string): string[] {
  return TENANT_SKILL_OPTIONS[tenantId] ?? TENANT_SKILL_OPTIONS.debug
}

// トップページの「検索されそうなキーワード」用の絞り込み表示。SKILL_OPTIONSの
// 全件を出すと折り返しが増えすぎるため、代表的なものだけを厳選した短いリスト。
export const TENANT_SUGGESTED_KEYWORDS: Record<string, string[]> = {
  debug: [
    'React', 'TypeScript', 'Python', 'PostgreSQL', 'Supabase',
    'Docker', 'AWS', 'Git', 'セキュリティ',
  ],
  dtm: [
    'Ableton Live', 'Logic Pro', 'ミキシング', 'マスタリング',
    'DAW', 'MIDI', 'シンセサイザー', '作曲', '編曲',
  ],
  // 検索は title/body の部分一致（page.tsx）なので、押して0件にならない語を選ぶこと。
  // Googleサジェストの実データで実需を確認済み（scripts/suggest-keywords.mts）。
  // 質問を投入したあと、実ヒット数を数えて0件の語は差し替える。
  guitar: [
    'エフェクター', 'オーバードライブ', 'ファズ', 'マルチエフェクター',
    'ピックアップ', '配線', 'ノイズ', '弦高', 'ビンテージ',
  ],
}

export function getSuggestedKeywords(tenantId: string): string[] {
  return TENANT_SUGGESTED_KEYWORDS[tenantId] ?? TENANT_SUGGESTED_KEYWORDS.debug
}

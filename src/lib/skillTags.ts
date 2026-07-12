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
}

export function getSuggestedKeywords(tenantId: string): string[] {
  return TENANT_SUGGESTED_KEYWORDS[tenantId] ?? TENANT_SUGGESTED_KEYWORDS.debug
}

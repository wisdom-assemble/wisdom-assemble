// テナントごとの選択可能スキルタグ（マイページの「得意なこと」設定・トップページの
// 検索キーワード例で共用）。未定義のテナントはdebug相当のデフォルトにフォールバックする。
export const TENANT_SKILL_OPTIONS: Record<string, string[]> = {
  debug: [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS',
    'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Docker',
    'AWS', 'Supabase', 'Git', 'Linux', 'セキュリティ',
  ],
  dtm: [
    'Ableton Live', 'Logic Pro', 'Cubase', 'FL Studio', 'Pro Tools',
    'ミキシング', 'マスタリング', 'DAW', 'MIDI', 'シンセサイザー',
    'サンプリング', 'レコーディング', '音楽理論', '作曲', 'EQ',
  ],
}

export function getSkillOptions(tenantId: string): string[] {
  return TENANT_SKILL_OPTIONS[tenantId] ?? TENANT_SKILL_OPTIONS.debug
}

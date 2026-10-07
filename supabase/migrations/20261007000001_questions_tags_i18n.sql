-- 【2026-10-07】質問タグの多言語化。タグはAIが投稿の元言語で付けるため、英語ページにも日本語タグが出ていた。
-- tags_i18n = { "en": ["Plugins", ...], "zh": [...], ... }（tags と同じ順番・元言語のキーは持たない＝元のtagsを使う）。
-- 既存の質問への値の投入は scripts/add-tags-i18n.sql（2026-10-07 Claudeが訳を作成）。
alter table public.questions add column if not exists tags_i18n jsonb not null default '{}'::jsonb;

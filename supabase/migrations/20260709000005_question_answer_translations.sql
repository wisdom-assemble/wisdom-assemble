-- 質問・回答の自動翻訳機能用スキーマ（2026-07-09）
-- 投稿時に対応8言語へ自動翻訳してJSONBで保存する。翻訳ボタン方式ではなく、
-- 投稿時に静的な多言語ページとして存在させることでSEO優位性を狙う（Notion仕様）。
-- source_localeは投稿時の元言語（トグルで原文表示する際の判定・翻訳対象からの除外に使う）。

alter table questions add column if not exists title_i18n jsonb not null default '{}'::jsonb;
alter table questions add column if not exists body_i18n jsonb not null default '{}'::jsonb;
alter table questions add column if not exists source_locale text not null default 'ja';

alter table answers add column if not exists body_i18n jsonb not null default '{}'::jsonb;
alter table answers add column if not exists source_locale text not null default 'ja';

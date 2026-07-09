-- タグライン多言語対応を8言語に拡張するにあたり、description_en方式（言語ごとに
-- カラムを増やす）だと今後さらに言語が増えるたびにカラムが増え続けてしまうため、
-- description_i18n というJSONBカラムに一本化する（2026-07-09）。
-- description（日本語・デフォルト）は引き続きフォールバック用に維持する。
-- 既存のdescription_enの値をdescription_i18nの'en'キーに移行してからdescription_enは削除する。

alter table tenants add column if not exists description_i18n jsonb not null default '{}'::jsonb;

update tenants
set description_i18n = jsonb_build_object('en', description_en)
where description_en is not null;

alter table tenants drop column if exists description_en;

-- トップページのタグライン（tenants.description）を言語切替えに対応させる（2026-07-09）
-- description は日本語版として維持し、英語版を description_en に追加する。
-- 将来言語が増えた場合はdescription_{locale}パターンで追加していく想定。

alter table tenants add column if not exists description_en text;

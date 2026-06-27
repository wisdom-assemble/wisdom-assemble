-- フェーズB：管理機能追加

-- is_banned カラム（管理者によるBAN機能）
alter table profiles
  add column if not exists is_banned boolean not null default false;

-- is_banned ユーザーの質問・回答を制限するためのRLSは
-- 今後必要に応じて追加する（現状は管理者が手動で対応）

-- ============================================================
-- テナント別ダークモード対応：tenants に theme / bg_color を追加
-- ------------------------------------------------------------
-- theme='dark' のテナントは <html data-theme="dark"> でダーク化（globals.cssの
-- ダーク上書き層が全ページに適用される）。bg_color があれば背景色を個別に上書き
-- （--page-bg）。ルートポータルの各テナントカードもこの theme/bg_color に追従する。
-- 既存テナントは theme='light'（デフォルト）＝従来通り白背景で見た目不変。
-- ============================================================

alter table tenants add column if not exists theme text not null default 'light';
alter table tenants add column if not exists bg_color text;

alter table tenants
  add constraint tenants_theme_check check (theme in ('light', 'dark'));

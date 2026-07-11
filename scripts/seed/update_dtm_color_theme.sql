-- MUSIC PRODUCTION（dtm）テナントのキーカラーを青系に変更
-- 新ロゴ（#74a7fe→#606060のグラデーション）に合わせつつ、
-- ボタン背景・リンク文字色として使われるため視認性を確保できる濃さの青にした
update tenants
set color_theme = '#2563EB'
where id = 'dtm';

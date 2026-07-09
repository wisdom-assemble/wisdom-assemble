-- トップページのタグライン文言を「AIが答えられない・不確かな{ジャンル}質問・問題を、
-- 人間のエキスパートに繋げるQ&Aサービス」という共通テンプレートに統一（2026-07-09）。
-- ブランディングの一貫性を保ちつつ、{ジャンル}部分だけテナントごとに差し替えることで
-- SEO用meta descriptionの重複も避けられる。

update tenants set description = 'AIが答えられない・不確かなコードのバグや技術的な質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'debug';
update tenants set description = 'AIが答えられない・不確かな日本の確定申告や税金に関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'tax-japan';
update tenants set description = 'AIが答えられない・不確かなオーストラリアのワーキングホリデーに関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'australia-whv';
update tenants set description = 'AIが答えられない・不確かなバリ島移住に関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'bali';
update tenants set description = 'AIが答えられない・不確かなチェンマイ移住・ノマド生活に関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'chiangmai';
update tenants set description = 'AIが答えられない・不確かなポルトガル移住に関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'portugal';
update tenants set description = 'AIが答えられない・不確かなDTMや音楽制作に関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'dtm';
update tenants set description = 'AIが答えられない・不確かな自作キーボードの設計・製作に関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'keyboard';
update tenants set description = 'AIが答えられない・不確かなフィリピン留学に関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'philippines';
update tenants set description = 'AIが答えられない・不確かなカナダ留学・ワーホリに関する質問・問題を、人間のエキスパートに繋げるQ&Aサービス' where id = 'canada';

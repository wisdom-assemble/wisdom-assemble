-- トップページのタグライン英語版（2026-07-09）
-- 日本語版（scripts/update-tenant-descriptions.sql）と同じ「{ジャンル}」型テンプレートの英語版。

update tenants set description_en = 'A Q&A service connecting coding bugs and technical questions AI can''t confidently answer with real human experts.' where id = 'debug';
update tenants set description_en = 'A Q&A service connecting Japanese tax filing questions AI can''t confidently answer with real human experts.' where id = 'tax-japan';
update tenants set description_en = 'A Q&A service connecting Australian working holiday questions AI can''t confidently answer with real human experts.' where id = 'australia-whv';
update tenants set description_en = 'A Q&A service connecting Bali relocation questions AI can''t confidently answer with real human experts.' where id = 'bali';
update tenants set description_en = 'A Q&A service connecting Chiang Mai relocation questions AI can''t confidently answer with real human experts.' where id = 'chiangmai';
update tenants set description_en = 'A Q&A service connecting Portugal relocation questions AI can''t confidently answer with real human experts.' where id = 'portugal';
update tenants set description_en = 'A Q&A service connecting DTM and music production questions AI can''t confidently answer with real human experts.' where id = 'dtm';
update tenants set description_en = 'A Q&A service connecting custom keyboard design and building questions AI can''t confidently answer with real human experts.' where id = 'keyboard';
update tenants set description_en = 'A Q&A service connecting Philippines study abroad questions AI can''t confidently answer with real human experts.' where id = 'philippines';
update tenants set description_en = 'A Q&A service connecting Canada study abroad questions AI can''t confidently answer with real human experts.' where id = 'canada';

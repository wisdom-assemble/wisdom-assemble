-- GUITAR & PEDALS テナントの登録（2026-08-15）
-- Supabase → SQL Editor に貼って実行する。
--
-- description_i18n は既存 debug/dtm と同じ文型で7言語ぶん入れてある（ja は description 列を使うため不要）。
-- theme='light' / bg_color=null は既存2テナントと同じ（ダークモードにしない）。
-- color_theme はロゴのメイン色と揃えてある（ファビコン・OGP・ボタンの色になる）。

insert into tenants (id, name, description, description_i18n, color_theme, subdomain, language, theme, bg_color)
values (
  'guitar',
  'GUITAR & PEDALS',
  'AIが答えられない・不確かなギター・エフェクターの質問・問題を、人間のエキスパートに繋げるQ&Aサービス',
  '{"en": "A Q&A service connecting guitar and pedal questions AI can''t confidently answer with real human experts.", "es": "Un servicio de preguntas y respuestas que conecta preguntas sobre guitarras y pedales que la IA no puede responder con confianza con expertos humanos reales.", "id": "Layanan tanya jawab yang menghubungkan pertanyaan seputar gitar dan pedal yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.", "ko": "AI가 자신 있게 답변하지 못하는 기타 및 페달 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.", "pt": "Um serviço de perguntas e respostas que conecta perguntas sobre guitarras e pedais que a IA não consegue responder com confiança a especialistas humanos reais.", "vi": "Dịch vụ hỏi đáp kết nối những câu hỏi về guitar và pedal mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.", "zh": "一个将AI无法确定回答的吉他和效果器相关问题连接给真正人类专家的问答服务。"}'::jsonb,
  '#a96800',
  'guitar',
  'ja',
  'light',
  null
);

-- 確認（7言語そろっているか）
select id, name, color_theme, jsonb_object_keys(description_i18n) as locale
from tenants where id = 'guitar';

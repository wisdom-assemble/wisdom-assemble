-- タグライン残り6言語分（zh/id/vi/ko/es/pt）を投入する（2026-07-09）。
-- 既存のdescription_i18n（'en'キー）を上書きしないよう || で追加マージする。

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的代码错误和技术性问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan bug kode dan teknis yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về lỗi code và kỹ thuật mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 코드 버그나 기술적인 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre errores de código y cuestiones técnicas que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre bugs de código e questões técnicas que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'debug';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的日本报税相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan pengajuan pajak Jepang yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về khai thuế Nhật Bản mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 일본 세금 신고 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre la declaración de impuestos en Japón que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre declaração de impostos no Japão que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'tax-japan';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的澳大利亚打工度假相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan liburan kerja Australia yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về working holiday Úc mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 호주 워킹홀리데이 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre el working holiday en Australia que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre o working holiday na Austrália que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'australia-whv';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的巴厘岛移居相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan relokasi ke Bali yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về chuyển đến sinh sống tại Bali mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 발리 이주 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre la reubicación en Bali que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre a mudança para Bali que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'bali';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的清迈移居相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan relokasi ke Chiang Mai yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về chuyển đến sinh sống tại Chiang Mai mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 치앙마이 이주 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre la reubicación en Chiang Mai que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre a mudança para Chiang Mai que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'chiangmai';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的葡萄牙移居相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan relokasi ke Portugal yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về chuyển đến sinh sống tại Bồ Đào Nha mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 포르투갈 이주 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre la reubicación en Portugal que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre a mudança para Portugal que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'portugal';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的DTM和音乐制作相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan DTM dan produksi musik yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về DTM và sản xuất âm nhạc mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 DTM 및 음악 제작 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre DTM y producción musical que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre DTM e produção musical que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'dtm';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的自制键盘设计与制作相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan desain dan pembuatan keyboard custom yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về thiết kế và chế tạo bàn phím tùy chỉnh mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 커스텀 키보드 설계 및 제작 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre el diseño y construcción de teclados personalizados que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre o design e construção de teclados personalizados que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'keyboard';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的菲律宾留学相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan studi ke Filipina yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về du học Philippines mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 필리핀 유학 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre estudiar en Filipinas que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre estudar nas Filipinas que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'philippines';

update tenants set description_i18n = description_i18n || jsonb_build_object(
  'zh', '一个将AI无法确定回答的加拿大留学相关问题连接给真正人类专家的问答服务。',
  'id', 'Layanan tanya jawab yang menghubungkan pertanyaan studi ke Kanada yang tidak dapat dijawab AI dengan yakin kepada ahli manusia sungguhan.',
  'vi', 'Dịch vụ hỏi đáp kết nối những câu hỏi về du học Canada mà AI không thể trả lời chắc chắn với các chuyên gia con người thực sự.',
  'ko', 'AI가 자신 있게 답변하지 못하는 캐나다 유학 관련 질문을 진짜 사람 전문가와 연결해주는 Q&A 서비스입니다.',
  'es', 'Un servicio de preguntas y respuestas que conecta preguntas sobre estudiar en Canadá que la IA no puede responder con confianza con expertos humanos reales.',
  'pt', 'Um serviço de perguntas e respostas que conecta perguntas sobre estudar no Canadá que a IA não consegue responder com confiança a especialistas humanos reais.'
) where id = 'canada';

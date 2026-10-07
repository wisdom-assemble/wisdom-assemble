-- 質問タグの多言語化（2026-10-07）。新規タブに全部貼って Run。何度実行しても同じ結果。
alter table public.questions add column if not exists tags_i18n jsonb not null default '{}'::jsonb;

with dict(ja,en,zh,ko,es,pt,id,vi) as (values
  ('MIDI編集','MIDI editing','MIDI编辑','MIDI 편집','Edición MIDI','Edição MIDI','Pengeditan MIDI','Chỉnh sửa MIDI'),
  ('USBケーブル','USB cable','USB线','USB 케이블','Cable USB','Cabo USB','Kabel USB','Cáp USB'),
  ('アコギ','Acoustic guitar','原声吉他','어쿠스틱 기타','Guitarra acústica','Violão','Gitar akustik','Guitar acoustic'),
  ('アコースティックギター','Acoustic guitar','原声吉他','어쿠스틱 기타','Guitarra acústica','Violão','Gitar akustik','Guitar acoustic'),
  ('アッテネーター','Attenuator','衰减器','어테뉴에이터','Atenuador','Atenuador','Attenuator','Attenuator'),
  ('アレンジ','Arrangement','编曲','편곡','Arreglo','Arranjo','Aransemen','Phối khí'),
  ('アンプ','Amp','音箱','앰프','Amplificador','Amplificador','Ampli','Ampli'),
  ('アンプシミュレーター','Amp simulator','音箱模拟器','앰프 시뮬레이터','Simulador de amplificador','Simulador de amplificador','Simulator ampli','Giả lập ampli'),
  ('エフェクター','Effects pedal','效果器','이펙터','Pedal de efectos','Pedal de efeito','Pedal efek','Pedal hiệu ứng'),
  ('エフェクト','Effects','效果','이펙트','Efectos','Efeitos','Efek','Hiệu ứng'),
  ('エレアコ','Acoustic-electric guitar','电箱吉他','일렉 어쿠스틱 기타','Guitarra electroacústica','Violão eletroacústico','Gitar akustik elektrik','Guitar acoustic điện'),
  ('エレキギター','Electric guitar','电吉他','일렉트릭 기타','Guitarra eléctrica','Guitarra elétrica','Gitar listrik','Guitar điện'),
  ('オペアンプ','Op-amp','运算放大器','옵앰프','Amplificador operacional','Amplificador operacional','Op-amp','Op-amp'),
  ('オーディオインターフェイス','Audio interface','音频接口','오디오 인터페이스','Interfaz de audio','Interface de áudio','Audio interface','Audio interface'),
  ('オーディオインターフェース','Audio interface','音频接口','오디오 인터페이스','Interfaz de audio','Interface de áudio','Audio interface','Audio interface'),
  ('オーバードライブ','Overdrive','过载','오버드라이브','Overdrive','Overdrive','Overdrive','Overdrive'),
  ('キャプチャー','Capture','捕获','캡처','Captura','Captura','Capture','Capture'),
  ('ギター','Guitar','吉他','기타','Guitarra','Guitarra','Gitar','Guitar'),
  ('ギター回路','Guitar wiring','吉他电路','기타 회로','Circuito de guitarra','Circuito da guitarra','Rangkaian gitar','Mạch guitar'),
  ('ギター構造','Guitar construction','吉他结构','기타 구조','Construcción de guitarra','Construção da guitarra','Konstruksi gitar','Cấu tạo guitar'),
  ('ギター設定','Guitar setup','吉他设置','기타 세팅','Configuración de guitarra','Configuração da guitarra','Pengaturan gitar','Thiết lập guitar'),
  ('ケンタウロス','Centaur','Centaur','켄타우로스','Centaur','Centaur','Centaur','Centaur'),
  ('ジャガー','Jaguar','Jaguar','재규어','Jaguar','Jaguar','Jaguar','Jaguar'),
  ('ジャズマスター','Jazzmaster','Jazzmaster','재즈마스터','Jazzmaster','Jazzmaster','Jazzmaster','Jazzmaster'),
  ('ストラトキャスター','Stratocaster','Stratocaster','스트라토캐스터','Stratocaster','Stratocaster','Stratocaster','Stratocaster'),
  ('スピーカー','Speakers','扬声器','스피커','Altavoces','Alto-falantes','Speaker','Loa'),
  ('セッションビュー','Session View','Session View','세션 뷰','Session View','Session View','Session View','Session View'),
  ('セッションプレーヤー','Session Player','Session Player','세션 플레이어','Session Player','Session Player','Session Player','Session Player'),
  ('セッティング','Setup','设置','세팅','Ajustes','Ajustes','Pengaturan','Thiết lập'),
  ('テレキャスター','Telecaster','Telecaster','텔레캐스터','Telecaster','Telecaster','Telecaster','Telecaster'),
  ('デジタル','Digital','数字','디지털','Digital','Digital','Digital','Kỹ thuật số'),
  ('デバッグ','Debugging','调试','디버깅','Depuración','Depuração','Debugging','Gỡ lỗi'),
  ('ドラムマシーン','Drum machine','鼓机','드럼 머신','Caja de ritmos','Bateria eletrônica','Drum machine','Drum machine'),
  ('ドラム打ち込み','Drum programming','鼓编程','드럼 프로그래밍','Programación de batería','Programação de bateria','Pemrograman drum','Lập trình trống'),
  ('ノイズ対策','Noise reduction','降噪','노이즈 대책','Reducción de ruido','Redução de ruído','Mengatasi noise','Giảm nhiễu'),
  ('ハイエンド','High-end','高端','하이엔드','Gama alta','Topo de linha','High-end','Cao cấp'),
  ('ハムバッカー','Humbucker','双线圈拾音器','험버커','Humbucker','Humbucker','Humbucker','Humbucker'),
  ('ビンテージ','Vintage','复古','빈티지','Vintage','Vintage','Vintage','Vintage'),
  ('ヴィンテージ','Vintage','复古','빈티지','Vintage','Vintage','Vintage','Vintage'),
  ('ビンテージエフェクター','Vintage pedals','复古效果器','빈티지 이펙터','Pedales vintage','Pedais vintage','Pedal efek vintage','Pedal vintage'),
  ('ビンテージ機材','Vintage gear','复古器材','빈티지 장비','Equipo vintage','Equipamento vintage','Peralatan vintage','Thiết bị vintage'),
  ('ファズ','Fuzz','Fuzz','퍼즈','Fuzz','Fuzz','Fuzz','Fuzz'),
  ('プラグイン','Plugins','插件','플러그인','Plugins','Plugins','Plugin','Plugin'),
  ('ベリンガー','Behringer','Behringer','베링거','Behringer','Behringer','Behringer','Behringer'),
  ('ボーカル','Vocals','人声','보컬','Voz','Vocal','Vokal','Giọng hát'),
  ('マイク','Microphone','麦克风','마이크','Micrófono','Microfone','Mikrofon','Micro'),
  ('マルチエフェクター','Multi-effects','综合效果器','멀티 이펙터','Multiefectos','Multiefeitos','Multi-efek','Multi-effect'),
  ('ミキシング','Mixing','混音','믹싱','Mezcla','Mixagem','Mixing','Mixing'),
  ('ミックス','Mixing','混音','믹싱','Mezcla','Mixagem','Mixing','Mixing'),
  ('メロディ','Melody','旋律','멜로디','Melodía','Melodia','Melodi','Giai điệu'),
  ('モニタースピーカー','Studio monitors','监听音箱','모니터 스피커','Monitores de estudio','Monitores de estúdio','Monitor studio','Loa kiểm âm'),
  ('ルーパー','Looper','Looper','루퍼','Looper','Looper','Looper','Looper'),
  ('レコーディング','Recording','录音','레코딩','Grabación','Gravação','Rekaman','Thu âm'),
  ('作曲','Composition','作曲','작곡','Composición','Composição','Komposisi','Sáng tác'),
  ('作曲ソフト','Composition software','作曲软件','작곡 소프트웨어','Software de composición','Software de composição','Software komposisi','Phần mềm sáng tác'),
  ('初心者','Beginners','新手','초보자','Principiantes','Iniciantes','Pemula','Người mới'),
  ('技クラフト','Waza Craft','Waza Craft','Waza Craft','Waza Craft','Waza Craft','Waza Craft','Waza Craft'),
  ('木材','Tonewood','木材','목재','Maderas','Madeiras','Kayu','Gỗ'),
  ('楽曲構成','Song structure','歌曲结构','곡 구성','Estructura de la canción','Estrutura da música','Struktur lagu','Cấu trúc bài hát'),
  ('機材','Gear','器材','장비','Equipo','Equipamento','Peralatan','Thiết bị'),
  ('機材比較','Gear comparison','器材对比','장비 비교','Comparativa de equipo','Comparação de equipamentos','Perbandingan peralatan','So sánh thiết bị'),
  ('機材選び','Choosing gear','器材选择','장비 선택','Elegir equipo','Escolha de equipamento','Memilih peralatan','Chọn thiết bị'),
  ('歪みエフェクター','Distortion pedals','失真效果器','디스토션 이펙터','Pedales de distorsión','Pedais de distorção','Pedal distorsi','Pedal distortion'),
  ('歴史','History','历史','역사','Historia','História','Sejarah','Lịch sử'),
  ('真空管アンプ','Tube amp','电子管音箱','진공관 앰프','Amplificador de válvulas','Amplificador valvulado','Ampli tabung','Ampli đèn'),
  ('自宅練習','Home practice','在家练习','집에서 연습','Práctica en casa','Prática em casa','Latihan di rumah','Luyện tập tại nhà'),
  ('電源','Power supply','电源','전원','Fuente de alimentación','Fonte de alimentação','Catu daya','Nguồn điện'),
  ('音作り','Tone shaping','音色调整','톤 메이킹','Ajuste de tono','Construção de timbre','Pengaturan tone','Chỉnh tone'),
  ('音質','Sound quality','音质','음질','Calidad de sonido','Qualidade de som','Kualitas suara','Chất lượng âm thanh'),
  ('音響補正','Room correction','声学校正','음향 보정','Corrección acústica','Correção acústica','Koreksi akustik','Hiệu chỉnh âm học'),
  ('DTM','Music production','电脑音乐制作','음악 제작','Producción musical','Produção musical','Produksi musik','Sản xuất âm nhạc')
), s as (
  select q.id, jsonb_build_object(
    'en', jsonb_agg(coalesce(d.en, t.tag) order by t.ord),
    'zh', jsonb_agg(coalesce(d.zh, t.tag) order by t.ord),
    'ko', jsonb_agg(coalesce(d.ko, t.tag) order by t.ord),
    'es', jsonb_agg(coalesce(d.es, t.tag) order by t.ord),
    'pt', jsonb_agg(coalesce(d.pt, t.tag) order by t.ord),
    'id', jsonb_agg(coalesce(d.id, t.tag) order by t.ord),
    'vi', jsonb_agg(coalesce(d.vi, t.tag) order by t.ord)) as obj
  from public.questions q
  cross join lateral unnest(q.tags) with ordinality as t(tag, ord)
  left join dict d on d.ja = t.tag
  where q.tenant_id in ('dtm','guitar') and coalesce(q.source_locale, 'ja') = 'ja'
  group by q.id
)
update public.questions q set tags_i18n = s.obj from s where q.id = s.id;

-- 確認：0件ならOK
select tenant_id, slug from public.questions
where tenant_id in ('dtm','guitar') and cardinality(tags) > 0 and tags_i18n = '{}'::jsonb;

-- ============================================================
-- BUG DEBUGテナント サンプル質問追加スクリプト（自動生成）
-- 生成日時: 2026-07-09T17:41:26.296345+00:00
-- solved済み: 20件 / hard(未解決・公開): 5件 / 合計 25件
-- 実行方法: Supabase SQL Editorで「新規タブ」を開いて全文を貼り付けて実行
-- ============================================================

begin;

-- [1/20] setTimeoutの中でuseStateの値を更新しても古い値のまま
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('74b20542-864a-4b47-95d7-c6cd048721f0', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'setTimeoutの中でuseStateの値を更新しても古い値のまま', 'Reactでカウントアップ機能を作っています。setTimeoutの中でsetCount(count + 1)を呼んでいるのですが、何度実行しても1しか増えません。なぜでしょうか？', 'seed-solved-1-74b20542', 'solved', '2026-05-30T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 12, '2026-05-30T14:41:26.296345+00:00', '2026-05-30T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('fa3e3656-c421-468c-8963-c27876feb5a6', '74b20542-864a-4b47-95d7-c6cd048721f0', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'それは典型的な「stale closure（古いクロージャ）」の問題です。setTimeoutのコールバックが生成された時点のcountの値をずっと参照し続けてしまうので、毎回同じ値に+1しているだけになります。

解決策はsetCountに関数を渡す形にすることです。

setCount(prev => prev + 1)

こうすればReactが最新のstateを引数として渡してくれるので、クロージャの古い値を参照する問題を回避できます。setInterval等、非同期処理の中でstateを更新するときはほぼ必ずこの関数型の更新を使うと覚えておくと安全です。', false, true, '2026-05-30T20:11:26.296345+00:00', '2026-05-30T20:11:26.296345+00:00');

-- [2/20] Next.jsのApp RouterでServer ComponentとClient Componentの使い分けが分からない
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('0de7c7ba-7c7d-4ae3-b5e9-176a29be7f40', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'Next.jsのApp RouterでServer ComponentとClient Componentの使い分けが分からない', 'Next.js 14のApp Routerを使い始めましたが、''use client''をどこに付ければいいか判断に迷っています。基準を教えてください。', 'seed-solved-2-0de7c7ba', 'solved', '2026-06-01T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 15, '2026-06-01T14:41:26.296345+00:00', '2026-06-01T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('3fd64c8e-d6ec-464b-8c2b-cdd838307c09', '0de7c7ba-7c7d-4ae3-b5e9-176a29be7f40', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', '基本方針は「デフォルトは全部Server Component、必要な場所だけClient Componentにする」です。

Client Componentが必要になるのは主に次のケースです。
- useState/useEffectなどReactのフックを使う
- onClickなどのイベントハンドラが必要
- ブラウザ専用API（window, localStorage等）を使う
- Context APIを使う

逆に、データ取得だけして表示するだけのコンポーネントはServer Componentのままにしておくと、JSバンドルサイズが減ってパフォーマンスが良くなります。よくあるパターンとして、ページ全体はServer Componentにしておき、ボタンやフォームなどインタラクティブな部分だけを小さいClient Componentに切り出す設計にすると綺麗にまとまります。', false, true, '2026-06-01T20:11:26.296345+00:00', '2026-06-01T20:11:26.296345+00:00');

-- [3/20] TypeScriptのsatisfiesとasの違いがよく分からない
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('82339411-168e-409c-a84d-7ce90289a493', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'TypeScriptのsatisfiesとasの違いがよく分からない', 'TypeScript 4.9で追加されたsatisfiesキーワードと、従来のas構文の違いがいまいち理解できません。使い分けを教えてください。', 'seed-solved-3-82339411', 'solved', '2026-06-03T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 18, '2026-06-03T14:41:26.296345+00:00', '2026-06-03T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('6a1303db-1c5c-49ab-a0fc-00f10464a77e', '82339411-168e-409c-a84d-7ce90289a493', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', '一番の違いは「型の絞り込みを保ったまま検証できるかどうか」です。

asは強制的に型をキャストするので、間違った型を指定してもコンパイラは基本的に黙って通してしまいます（実質的に型チェックをすり抜けられる）。

一方satisfiesは、指定した型に合致しているかをチェックしつつも、変数自体の型は元の（より具体的な）推論結果のまま保持してくれます。

例えば
const config = { color: ''red'' } satisfies { color: string }
と書くと、configの型は{ color: string }ではなく{ color: ''red'' }のリテラル型として保持されるので、後続のコードで自動補完やより厳密なチェックが効きます。

「型が合っているか検証したいだけで、変数の型そのものは緩めたくない」場合はsatisfies、「どうしても型を上書きしたい」場合だけasを使う、という使い分けがおすすめです。', false, true, '2026-06-03T20:11:26.296345+00:00', '2026-06-03T20:11:26.296345+00:00');

-- [4/20] PostgreSQLでN+1クエリが発生していないか調べる方法
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('d7842e6d-1cff-4a0c-9c56-bba9af496c9f', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'PostgreSQLでN+1クエリが発生していないか調べる方法', 'ORMを使わず生のSQLでAPIを書いているのですが、一覧取得のたびにループの中で個別クエリを投げてしまっている気がします。N+1になっているかどうかの確認方法と対処法を教えてください。', 'seed-solved-4-d7842e6d', 'solved', '2026-06-05T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 21, '2026-06-05T14:41:26.296345+00:00', '2026-06-05T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('e98f940d-96a2-48f4-89c3-1d731ef7374b', 'd7842e6d-1cff-4a0c-9c56-bba9af496c9f', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', '確認方法としては、まずEXPLAIN ANALYZEでクエリの実行回数を見るより先に、アプリ側のログ（またはpg_stat_statementsのcalls列）を見るのが手っ取り早いです。1回のリクエストで同じパターンのSQLが件数分だけ発行されていたら、それがN+1です。

対処法の基本は「ループの中でクエリを投げるのをやめて、1回のJOINまたはIN句にまとめる」ことです。

例えば投稿一覧＋各投稿の著者名を取りたい場合、

SELECT p.*, u.name FROM posts p JOIN users u ON u.id = p.user_id

のように1本のJOINクエリにまとめれば、投稿件数が増えてもクエリ回数は常に1回で済みます。どうしてもJOINが複雑になりすぎる場合は、関連するIDを先にまとめて集めておき、WHERE id = ANY(array)で1回だけ取得してからアプリ側でマッピングする方法も有効です。', false, true, '2026-06-05T20:11:26.296345+00:00', '2026-06-05T20:11:26.296345+00:00');

-- [5/20] docker runしてもコンテナがすぐ終了してしまう
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('8a2a6e3f-5046-448d-8fd7-9cb1d3d9ac7d', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'docker runしてもコンテナがすぐ終了してしまう', '自作のNode.jsアプリのDockerイメージをdocker runで起動しても、すぐにExitedになってしまいます。ログには特にエラーが出ていません。', 'seed-solved-5-8a2a6e3f', 'solved', '2026-06-07T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 24, '2026-06-07T14:41:26.296345+00:00', '2026-06-07T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('c1583d4c-15c4-4e37-b3df-e7d8cbb9433f', '8a2a6e3f-5046-448d-8fd7-9cb1d3d9ac7d', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', '多くの場合、コンテナの中でメインプロセス（PID 1）がすぐに終了してしまっているのが原因です。Dockerコンテナは「フォアグラウンドで動き続けるプロセスがある間だけ」起動し続ける仕組みなので、たとえばCMDで指定したコマンドが一瞬で処理を終えて終了するタイプのスクリプトだと、コンテナ自体もそこで終了してしまいます。

チェックすべきポイントは以下の通りです。
1. Dockerfileの CMD がnode server.jsのように「起動し続けるプロセス」を指しているか（npm run buildのような一度で終わるコマンドになっていないか）
2. server.jsの中でapp.listen()などが正しく呼ばれていてイベントループが待機し続ける状態になっているか
3. コンテナ内で例外が発生してクラッシュしていないか → docker logs <コンテナID>で直前のログを確認する

docker logsでエラーが何も出ていない場合は、docker run -it --entrypoint sh イメージ名のようにシェルで直接入って手動でコマンドを実行し、何が起きているか確認するのが確実です。', false, true, '2026-06-07T20:11:26.296345+00:00', '2026-06-07T20:11:26.296345+00:00');

-- [6/20] pushしてしまったコミットを安全に取り消す方法
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('23ba6443-722c-4057-8640-46811b5853b9', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'pushしてしまったコミットを安全に取り消す方法', 'リモートに間違えてpushしてしまったコミットがあります。他の人もすでにpullしているかもしれない状況で、安全に取り消す方法を教えてください。', 'seed-solved-6-23ba6443', 'solved', '2026-06-09T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 27, '2026-06-09T14:41:26.296345+00:00', '2026-06-09T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('a6eddd6c-fd4a-48a2-97b8-3aa1dc939090', '23ba6443-722c-4057-8640-46811b5853b9', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', '他の人がすでにpullしている可能性がある場合は、git reset --hardしてforce pushするのは避けるべきです。履歴が書き換わると、他の人のローカルとの整合性が壊れて混乱の元になります。

こういうケースでは git revert を使うのが安全です。

git revert <取り消したいコミットのハッシュ>

これは既存の履歴を書き換えるのではなく、「そのコミットの変更を打ち消す新しいコミット」を追加する形になります。なので普通にgit pushするだけで済み、他の人が既にpullしていても特に問題は起きません。

もしどうしても履歴自体をなかったことにしたい場合（force pushが許容される、個人ブランチ等）は、チーム全員に一声かけてからgit reset --hard + git push --forceを使う、という手順を踏んでください。基本はrevert、force pushは最終手段、と覚えておくと安全です。', false, true, '2026-06-09T20:11:26.296345+00:00', '2026-06-09T20:11:26.296345+00:00');

-- [7/20] Pythonのcopy.deepcopyとcopy.copyの違い
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('b70e134f-ad6e-48f2-adcc-19de7a5cfd55', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'Pythonのcopy.deepcopyとcopy.copyの違い', 'リストの中にリストが入っているようなネストしたデータをコピーしたいのですが、copy.copyだと元のデータも一緒に変わってしまいます。なぜですか？', 'seed-solved-7-b70e134f', 'solved', '2026-06-11T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 30, '2026-06-11T14:41:26.296345+00:00', '2026-06-11T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('04ed1980-ea37-4dcf-b0ec-a6363d01daf6', 'b70e134f-ad6e-48f2-adcc-19de7a5cfd55', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'copy.copyは「浅いコピー（シャローコピー）」なので、一番外側のオブジェクトだけを新しく作り、中身の要素（ネストしたリストや辞書など）は元のオブジェクトへの参照をそのまま使い回します。そのため、コピー後にネストした部分を変更すると、コピー元にも影響してしまいます。

copy.deepcopyは「深いコピー（ディープコピー）」で、ネストしている中身も再帰的にすべて新しく複製します。なので完全に独立したコピーが欲しい場合はdeepcopyを使う必要があります。

import copy
a = [[1, 2], [3, 4]]
b = copy.copy(a)       # 浅いコピー：b[0]を変更するとaにも影響
c = copy.deepcopy(a)   # 深いコピー：完全に独立

なお、ネストがない単純なリスト（数値や文字列だけ）であれば copy.copy でも実質的に問題は起きません。ネストした可変オブジェクトが含まれる場合にだけ違いが表面化する、という点を覚えておくとよいです。', false, true, '2026-06-11T20:11:26.296345+00:00', '2026-06-11T20:11:26.296345+00:00');

-- [8/20] flexboxの子要素がはみ出して縮まない
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('ed8dc126-201b-4ba3-973e-0a12d8b26d8a', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'flexboxの子要素がはみ出して縮まない', 'display: flexのコンテナの中に長いテキストを持つ子要素を入れると、コンテナの幅を超えてはみ出してしまいます。flex-shrinkは指定しているのですが効きません。', 'seed-solved-8-ed8dc126', 'solved', '2026-06-13T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 33, '2026-06-13T14:41:26.296345+00:00', '2026-06-13T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('85f04527-cad1-44a6-923c-ea7ffff01115', 'ed8dc126-201b-4ba3-973e-0a12d8b26d8a', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'これはflexboxの仕様上、子要素のmin-widthのデフォルト値がautoになっていることが原因であるケースがほとんどです。flex-shrinkを指定していても、子要素の内容（特に改行されない長いテキストや画像）が「最小コンテンツサイズ」として扱われ、その幅より縮まなくなってしまいます。

対処法として、はみ出している子要素に

min-width: 0;

を追加してみてください。これでflex-shrinkが正しく効くようになり、テキストがコンテナ内で折り返されるようになります。

テキストが改行されずに省略記号（...）で切りたい場合は、min-width: 0と合わせて

overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;

も追加すると綺麗に収まります。縦方向（flex-direction: column）で同じ問題が起きている場合はmin-heightについても同様に考えてください。', false, true, '2026-06-13T20:11:26.296345+00:00', '2026-06-13T20:11:26.296345+00:00');

-- [9/20] Node.jsのイベントループとブロッキング処理の関係が分からない
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('9414f24b-569e-4730-812b-81055394e039', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'Node.jsのイベントループとブロッキング処理の関係が分からない', 'Node.jsはシングルスレッドで非同期処理が得意と聞きますが、重いforループの計算を書いたら他のリクエストの処理も止まってしまいました。なぜですか？', 'seed-solved-9-9414f24b', 'solved', '2026-06-15T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 36, '2026-06-15T14:41:26.296345+00:00', '2026-06-15T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('18485a89-0998-47a0-84d3-f1b8c75185e9', '9414f24b-569e-4730-812b-81055394e039', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'Node.jsが「非同期に強い」のは、I/O（ファイル読み書きやネットワーク通信など）を待っている間に他の処理を進められる、という意味であって、CPUを使う計算処理そのものを裏で並列に実行してくれるわけではありません。

JavaScriptのコード自体はシングルスレッドのイベントループ上で1つずつ順番に実行されるので、重いforループのような同期的な計算処理を書くと、その処理が終わるまでイベントループ全体がブロックされ、他のリクエストの処理（他のタイマーやI/Oのコールバック含む）も一切進まなくなります。

対処法としては、
1. 計算処理を細かく分割してsetImmediateやprocess.nextTickで区切り、他の処理に制御を戻す機会を作る
2. Worker Threads（worker_threadsモジュール）を使って別スレッドで計算処理を行う
3. 計算量が多い処理は別プロセス・別サービスに切り出す

のいずれかを検討してください。特に画像処理や暗号化処理など明確に重い処理がある場合はWorker Threadsに逃がすのが素直な解決策です。', false, true, '2026-06-15T20:11:26.296345+00:00', '2026-06-15T20:11:26.296345+00:00');

-- [10/20] AWSのS3バケットポリシーとIAMポリシーの違いがよく分からない
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('c1bcf8c8-4a5e-4068-9a4d-03c4f34cee4d', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'AWSのS3バケットポリシーとIAMポリシーの違いがよく分からない', 'S3のアクセス制御について調べていますが、バケットポリシーとIAMポリシーのどちらを使えばいいのか判断できません。違いを教えてください。', 'seed-solved-10-c1bcf8c8', 'solved', '2026-06-17T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 39, '2026-06-17T14:41:26.296345+00:00', '2026-06-17T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('7c4f3b9f-fa81-455e-936f-d1f4c7f5012c', 'c1bcf8c8-4a5e-4068-9a4d-03c4f34cee4d', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'どちらも最終的にはAWSの共通のポリシー言語（JSON）でアクセス許可を書く点は同じですが、「誰に紐付くか」が違います。

IAMポリシーは、IAMユーザーやIAMロールに紐付けるポリシーです。「このユーザー（ロール）は何ができるか」を定義します。

バケットポリシーは、S3バケット自体に紐付けるポリシーです。「このバケットに誰がアクセスできるか」を定義します。

使い分けの目安としては、
- 自分のAWSアカウント内のユーザー・サービスに権限を与えたいだけならIAMポリシーで十分
- 他のAWSアカウントや、不特定多数（一般公開）にアクセスを許可したい場合はバケットポリシーが必要

という整理になります。両方が設定されている場合は、IAMポリシーとバケットポリシーの許可の「積」ではなく「和」で評価されます（どちらかで明示的にAllowされていて、かつどちらにもDenyがなければアクセスできる）。ただしAccount全体のパブリックアクセスブロック設定が有効だと、バケットポリシーでpublicに許可していてもブロックされるので、そちらの設定も確認してみてください。', false, true, '2026-06-17T20:11:26.296345+00:00', '2026-06-17T20:11:26.296345+00:00');

-- [11/20] SQLインジェクションをパラメータ化クエリで防げる理由
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('02e4aa47-d8d9-4424-a087-fd65a02ea4f3', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'SQLインジェクションをパラメータ化クエリで防げる理由', 'SQLインジェクション対策として「パラメータ化クエリを使え」とよく言われますが、なぜ文字列連結だと危険でパラメータ化なら安全なのか、仕組みを教えてください。', 'seed-solved-11-02e4aa47', 'solved', '2026-06-19T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 42, '2026-06-19T14:41:26.296345+00:00', '2026-06-19T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('5f0827da-5efd-42ae-af47-692071ae612e', '02e4aa47-d8d9-4424-a087-fd65a02ea4f3', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', '文字列連結でSQLを組み立てる場合、ユーザーの入力値がそのままSQL文の一部として解釈されてしまいます。例えば

"SELECT * FROM users WHERE name = ''" + input + "''"

という書き方だと、inputに'' OR ''1''=''1のような値を入れられると、SQL文の構造そのものが書き換えられてしまい、意図しない全件取得や不正な操作が可能になります。

パラメータ化クエリ（プレースホルダ + バインド変数）は、SQL文の「構造」とユーザーが渡す「値」を最初から別々にデータベースへ渡します。

SELECT * FROM users WHERE name = $1

のようにプレースホルダを使い、$1にはinputの値をパラメータとして渡します。データベース側はSQL文の構文解析を先に完了させた後で、渡された値を純粋な「データ」としてそこにはめ込むだけなので、値の中にどんな文字列が入っていてもSQL文の構造が書き換わることはありません。

つまり文字列連結は「SQL文自体を毎回組み立て直している」のに対し、パラメータ化クエリは「あらかじめ決まった構造に、後から安全にデータを差し込んでいる」という根本的な違いがある、と理解すると分かりやすいと思います。', false, true, '2026-06-19T20:11:26.296345+00:00', '2026-06-19T20:11:26.296345+00:00');

-- [12/20] useMemoとuseCallbackはどちらを使うべきか判断基準が知りたい
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('e0280f3f-90ad-4158-a37c-c4563df1aa7c', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'useMemoとuseCallbackはどちらを使うべきか判断基準が知りたい', 'Reactのパフォーマンス最適化でuseMemoとuseCallbackがよく出てきますが、どちらを使えばいいのか毎回迷います。判断基準はありますか？', 'seed-solved-12-e0280f3f', 'solved', '2026-06-21T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 45, '2026-06-21T14:41:26.296345+00:00', '2026-06-21T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('62d43732-285e-416b-9b6f-7d7e6a105471', 'e0280f3f-90ad-4158-a37c-c4563df1aa7c', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', '実はこの2つ、内部的にやっていることはほぼ同じで、「何をメモ化したいか」が違うだけです。

useMemoは「計算結果の値」をメモ化します。重い計算処理の結果や、オブジェクト・配列を新しく作り直したくない場合に使います。

const sortedList = useMemo(() => list.sort(...), [list])

useCallbackは「関数そのもの」をメモ化します。子コンポーネントにコールバック関数をpropsとして渡す際、親が再レンダリングされるたびに新しい関数が作られて子も不要に再レンダリングされてしまう、というのを防ぎたいときに使います。

const handleClick = useCallback(() => doSomething(id), [id])

実はuseCallback(fn, deps)は useMemo(() => fn, deps) とほぼ同じことをしているだけなので、「値が欲しいならuseMemo、関数が欲しいならuseCallback」というシンプルな基準で選べば大丈夫です。

ただし、どちらもメモ化自体にコストがかかるので、明らかに重い処理でも子コンポーネントの再レンダリングが問題になっているわけでもない場合は、無理に使わない方がコードがシンプルになることが多いです。', false, true, '2026-06-21T20:11:26.296345+00:00', '2026-06-21T20:11:26.296345+00:00');

-- [13/20] TypeScriptのジェネリクスでextendsを使う意味が分からない
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('42b9db70-ffbf-4e47-b1fa-128dd2d731d7', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'TypeScriptのジェネリクスでextendsを使う意味が分からない', 'function foo<T extends string>(x: T) のようなコードを見かけますが、なぜextendsが必要なのか、普通に function foo<T>(x: T) と何が違うのか教えてください。', 'seed-solved-13-42b9db70', 'solved', '2026-06-23T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 48, '2026-06-23T14:41:26.296345+00:00', '2026-06-23T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('f7ac1bb1-f541-42c8-a872-81a89c398d62', '42b9db70-ffbf-4e47-b1fa-128dd2d731d7', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'extendsを付けることで「Tはこの型に当てはまるものに限定する」という制約（constraint）をジェネリクスに課すことができます。

function foo<T>(x: T)だと、Tはどんな型でも受け付けてしまうので、関数の中でxに対してstring特有のメソッド（例えばx.toUpperCase()）を呼び出そうとしても、コンパイラは「Tがstringである保証がない」としてエラーを出します。

function foo<T extends string>(x: T)のようにextends stringを付けると、「呼び出し側が渡せるのはstring（またはstringのサブタイプ）だけ」という制約になるので、関数の中で安全にx.toUpperCase()のようなstringのメソッドを呼び出せるようになります。

オブジェクトの型に対してもよく使われていて、例えば

function getId<T extends { id: string }>(obj: T): string {
  return obj.id
}

のように書くと、「idプロパティを持っているオブジェクトなら何でも受け付けるが、idを持っていない型は渡せない」という汎用的だけど安全な関数を作れます。extendsは「制限」というより「その型が持っていることを保証されている機能を使えるようにする」ためのものだと捉えると理解しやすいと思います。', false, true, '2026-06-23T20:11:26.296345+00:00', '2026-06-23T20:11:26.296345+00:00');

-- [14/20] PostgreSQLでORDER BYが遅い時にインデックスをどう貼ればいいか
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('24f27ea6-0a63-45f5-b008-f2ceaa51fbc5', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'PostgreSQLでORDER BYが遅い時にインデックスをどう貼ればいいか', 'created_atでソートして最新100件を取得するクエリが遅いです。created_atにインデックスは貼っているのですが速くなりません。', 'seed-solved-14-24f27ea6', 'solved', '2026-06-25T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 51, '2026-06-25T14:41:26.296345+00:00', '2026-06-25T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('2ddfb6cd-b1a5-414f-beca-0e714001d310', '24f27ea6-0a63-45f5-b008-f2ceaa51fbc5', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'WHERE句の条件とORDER BYを両方使っている場合、created_at単体のインデックスだけでは不十分なケースがよくあります。EXPLAIN ANALYZEを実行して、Sort処理が発生していないか、Index Scanではなく Seq Scan になっていないかをまず確認してください。

よくある原因は「WHERE tenant_id = ''xxx'' ORDER BY created_at DESC LIMIT 100」のようなクエリで、tenant_idの絞り込みとcreated_atのソートを1つのインデックスでまかなえていないケースです。

この場合、複合インデックスを作ると改善することが多いです。

CREATE INDEX idx_questions_tenant_created ON questions (tenant_id, created_at DESC);

こうすることで、tenant_idで絞り込んだ後の並び順がすでにインデックスの物理的な順序と一致するため、PostgreSQLが追加のソート処理をせずに済むようになります。EXPLAIN ANALYZEの結果でSortというノードが消えて、Index Scanだけで完結するようになっていれば改善できている証拠です。', false, true, '2026-06-25T20:11:26.296345+00:00', '2026-06-25T20:11:26.296345+00:00');

-- [15/20] Dockerのマルチステージビルドでイメージサイズを減らす方法
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('85874d12-5b76-4299-83ca-f75a3cf9000a', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'Dockerのマルチステージビルドでイメージサイズを減らす方法', 'Node.jsアプリのDockerイメージが1GB近くになってしまいます。ビルドツールなどは本番では不要なはずなのですが、どう減らせばいいですか？', 'seed-solved-15-85874d12', 'solved', '2026-06-27T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 54, '2026-06-27T14:41:26.296345+00:00', '2026-06-27T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('58dab62f-5f0a-482a-8417-d293b5bdb4c5', '85874d12-5b76-4299-83ca-f75a3cf9000a', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'マルチステージビルドを使うのが定番の解決策です。ビルド用のステージと、実行用の最終的なステージを分けて、必要なファイルだけを最終イメージにコピーする書き方です。

# ビルド用ステージ
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 実行用ステージ（軽量なイメージを使う）
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]

こうすると、TypeScriptのコンパイラやdevDependencies、ソースコードそのものなど、ビルド時にしか使わないものは最終イメージに含まれなくなります。加えて、ベースイメージをnode:20ではなくnode:20-alpine（Alpine Linuxベースの軽量版）にするだけでも数百MB単位でサイズが減ることが多いです。

.dockerignoreファイルでnode_modulesや.gitなどを除外しておくのも忘れずに。ビルドコンテキストが小さくなりビルド自体も速くなります。', false, true, '2026-06-27T20:11:26.296345+00:00', '2026-06-27T20:11:26.296345+00:00');

-- [16/20] git rebaseとgit mergeはどちらを使うべきか
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('1a4dd6a9-b3e3-4fd2-ab5f-3c6b1f64e72b', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'git rebaseとgit mergeはどちらを使うべきか', 'featureブランチをmainに取り込む際、rebaseとmergeのどちらを使うべきか、チームでいつも議論になります。判断基準を教えてください。', 'seed-solved-16-1a4dd6a9', 'solved', '2026-06-29T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 57, '2026-06-29T14:41:26.296345+00:00', '2026-06-29T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('280d1f1f-5abb-4c39-b559-d1e0e601ac32', '1a4dd6a9-b3e3-4fd2-ab5f-3c6b1f64e72b', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'どちらも「正解」というより、履歴をどう残したいかというチームの方針の問題です。

git mergeは、2つのブランチの履歴をそのまま保持し、マージコミットを1つ追加します。「実際に何が起きたか」の履歴がそのまま残るので、後から追いやすいという利点があります。

git rebaseは、featureブランチのコミットをmainの最新の上に「積み直す」ので、マージコミットが作られず、まるで最初からmainの上で作業していたかのような一直線の履歴になります。見た目はきれいになりますが、実際のコミット日時と履歴の順序が食い違ったり、コミットハッシュが変わってしまうという副作用があります。

実務上よくある使い分けは、
- 自分のfeatureブランチの中で、pushする前にコミットを整理する目的でrebaseを使う（このときはまだ誰も見ていないので安全）
- 一度リモートにpushして他の人と共有した後の履歴は、rebaseせずmergeで取り込む（履歴の書き換えによる混乱を避けるため）

という方針です。「pushする前は自由にrebase、pushした後はmerge」と覚えておくと、チームでのトラブルをかなり避けられます。', false, true, '2026-06-29T20:11:26.296345+00:00', '2026-06-29T20:11:26.296345+00:00');

-- [17/20] PythonのasyncioはGILを回避できると聞いたのですが本当ですか？
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('56ed03ff-f2a6-4221-836a-80b803c589b0', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'PythonのasyncioはGILを回避できると聞いたのですが本当ですか？', 'asyncioで非同期処理を書けばマルチコアを活かして並列に処理が速くなると思っていたのですが、CPUを使う処理を並べても速くなりませんでした。', 'seed-solved-17-56ed03ff', 'solved', '2026-07-01T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 60, '2026-07-01T14:41:26.296345+00:00', '2026-07-01T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('de525aea-e4a1-4329-8e57-f5cbbbece25a', '56ed03ff-f2a6-4221-836a-80b803c589b0', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'それは誤解です。asyncioはGIL（グローバルインタプリタロック）を回避する仕組みではなく、あくまで「I/O待ち（ネットワーク通信やファイル読み書きなど）の間に他のタスクへ処理を譲る」ための仕組みです。CPUを使う計算処理自体は相変わらずシングルスレッド・GILの制約下で1つずつ順番に実行されます。

asyncioが効果を発揮するのは、例えば複数のAPIへのリクエストを同時に投げて、レスポンスを待っている間に他のリクエストの処理を進める、というようなI/Oバウンドな処理です。CPUバウンドな重い計算処理を速くしたい場合は、

- multiprocessingモジュールを使って複数プロセスに分散する（GILはプロセスごとに独立しているので真の並列処理になる）
- concurrent.futures.ProcessPoolExecutorを使う

といった方法を検討してください。「asyncio = I/Oを賢く待つための仕組み」「multiprocessing = CPU処理を並列化する仕組み」と役割を分けて覚えておくと混同しにくくなります。', false, true, '2026-07-01T20:11:26.296345+00:00', '2026-07-01T20:11:26.296345+00:00');

-- [18/20] z-indexを指定しても要素が最前面に来ない
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('c19b9d31-a78b-48d0-8012-72a02c01211e', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'z-indexを指定しても要素が最前面に来ない', 'position: relativeとz-index: 999を指定した要素が、他の要素の後ろに隠れてしまいます。z-indexの値はもっと大きい他の要素より確実に高いはずなのですが。', 'seed-solved-18-c19b9d31', 'solved', '2026-07-03T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 63, '2026-07-03T14:41:26.296345+00:00', '2026-07-03T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('f1f72789-86e5-4db4-8b10-6ac02e232add', 'c19b9d31-a78b-48d0-8012-72a02c01211e', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'z-indexは単純に「数字が大きい方が勝つ」わけではなく、「同じスタッキングコンテキストの中でだけ」比較される、という点が見落とされがちです。

親要素にtransform、opacity（1未満）、filterなどのプロパティが指定されていると、その親要素自身が新しいスタッキングコンテキストを作ってしまいます。そうなると、子要素にどれだけ大きいz-indexを指定しても、その数値は「親が作った箱の中」でしか通用せず、兄弟にあたる別のスタッキングコンテキストの要素とは直接比較されなくなります。

確認手順としては、ブラウザの開発者ツールで、隠れてしまっている要素から親をたどっていき、transformやopacityなどスタッキングコンテキストを生成するプロパティが指定されている要素がないか探してみてください。

対処法は主に2つです。
1. 不要にスタッキングコンテキストを作っている親のtransform等を取り除く
2. 最前面に出したい要素を、問題の親要素の外（DOM構造上、より上位の階層）に移動する

特にモーダルやドロップダウンメニューを実装するときにこの問題によくぶつかるので、覚えておくと役立ちます。', false, true, '2026-07-03T20:11:26.296345+00:00', '2026-07-03T20:11:26.296345+00:00');

-- [19/20] Node.jsのEventEmitterでメモリリークが起きていると警告が出た
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('885b9cca-7f0b-4c03-880d-eede00c87c07', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'Node.jsのEventEmitterでメモリリークが起きていると警告が出た', 'MaxListenersExceededWarningという警告が出るようになりました。何が原因で、どう対処すればいいですか？', 'seed-solved-19-885b9cca', 'solved', '2026-07-05T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 66, '2026-07-05T14:41:26.296345+00:00', '2026-07-05T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('58d56b35-d1f4-49ab-a0de-c1592b477edb', '885b9cca-7f0b-4c03-880d-eede00c87c07', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'この警告は、同じEventEmitterインスタンスに対してリスナー（.on()で登録したコールバック）が既定の上限（デフォルト10個）を超えて登録されたときに出るものです。多くの場合、リクエストのたびにリスナーを追加しているのに、対応する解除（.off()やremoveListener()）を忘れている、というのが根本原因です。

ありがちなパターンとして、リクエストごとに何らかの共有オブジェクト（DBコネクションやWebSocketなど）に対してon(''data'', ...)のようなリスナーを登録しているが、リクエストが終わった後にリスナーを外していない、というケースがあります。これが積み重なるとメモリリークにつながり、警告が出ます。

対処法は次の通りです。
1. リスナーを登録した箇所と対になる解除処理（off/removeListener）が本当にすべての経路（正常終了・エラー時両方）で呼ばれているか確認する
2. 一度きりで十分な場合はon()の代わりにonce()を使う（自動的に1回実行後に解除される）
3. どうしても意図的に10個以上のリスナーが必要な設計であれば、emitter.setMaxListeners(適切な数)で上限を明示的に引き上げる（ただし根本原因を確認しないまま数字だけ上げるのは対症療法なので注意）

まずは1番のリスナー解除漏れを疑って調査してみることをおすすめします。', false, true, '2026-07-05T20:11:26.296345+00:00', '2026-07-05T20:11:26.296345+00:00');

-- [20/20] JWTとセッションCookie、どちらを使うべきか判断基準
insert into questions (id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) values ('8b322ac9-e6fe-4424-b977-339fbc89be2a', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'JWTとセッションCookie、どちらを使うべきか判断基準', '認証方式としてJWTとセッションCookieのどちらを採用するか迷っています。それぞれのメリット・デメリットを教えてください。', 'seed-solved-20-8b322ac9', 'solved', '2026-07-07T20:41:26.296345+00:00', '6e196709-800b-49dd-b475-0c8b6f4a5019', 69, '2026-07-07T14:41:26.296345+00:00', '2026-07-07T20:41:26.296345+00:00', 'ja');
insert into answers (id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) values ('2fdd387c-ea01-46c2-a042-ab36db9bf2f7', '8b322ac9-e6fe-4424-b977-339fbc89be2a', 'debug', '6e196709-800b-49dd-b475-0c8b6f4a5019', 'どちらも「ログイン状態を維持する」という目的は同じですが、状態をどこで管理するかが根本的に違います。

セッションCookieは、サーバー側（DBやRedis等）にセッション情報を保持し、クライアントにはセッションIDだけを渡す方式です。サーバー側で強制的にセッションを無効化（ログアウトさせる）ことが簡単にでき、実装もシンプルです。ただしサーバーが状態を持つ（ステートフル）ので、複数サーバーでスケールする際にはセッションストアの共有が必要になります。

JWTは、ユーザー情報や権限などを署名付きのトークンそのものに含めてクライアント側に保持させる方式です。サーバー側は署名を検証するだけで済むので、サーバーが状態を持たない（ステートレス）形にでき、マイクロサービス間での認証情報の受け渡しなどと相性が良いです。ただし、発行したトークンを途中で強制的に無効化するのが難しい（有効期限が切れるまで基本的に有効であり続ける）というデメリックがあります。

目安としては、
- 単一のWebアプリケーションで、ログアウトの即時反映などを重視するならセッションCookie
- 複数サービス間でまたがる認証や、モバイルアプリ・SPAなど多様なクライアントに対応する必要があるならJWT

という使い分けが一般的です。なお、JWTを使う場合でも、即時無効化をしたい場面（不正利用が発覚した場合など）のためにトークンのブラックリスト（失効リスト）をサーバー側に持たせるハイブリッドな設計もよく使われます。', false, true, '2026-07-07T20:11:26.296345+00:00', '2026-07-07T20:11:26.296345+00:00');

-- [hard 1/5] Next.jsでHydration failedエラーが出るが原因が特定できない
insert into questions (id, tenant_id, user_id, title, body, slug, status, view_count, created_at, updated_at, source_locale) values ('76fe6a3b-f1b3-4fbf-a0f3-53c736d7d334', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'Next.jsでHydration failedエラーが出るが原因が特定できない', '本番環境でだけ「Hydration failed because the initial UI does not match what was rendered on the server」というエラーが出ます。ローカルでは再現しません。原因の切り分け方が分かりません。', 'seed-hard-1-76fe6a3b', 'hard', 30, '2026-07-04T16:41:26.296345+00:00', '2026-07-04T16:41:26.296345+00:00', 'ja');

-- [hard 2/5] TypeScriptでarray.includes()を使った型の絞り込みが効かない
insert into questions (id, tenant_id, user_id, title, body, slug, status, view_count, created_at, updated_at, source_locale) values ('bea9500f-3c62-4c53-ae2a-9921331d1d7c', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'TypeScriptでarray.includes()を使った型の絞り込みが効かない', 'const arr = [''a'', ''b''] as const; と定義した配列に対してarr.includes(value)でtrueだったのに、その後value の型がまだ絞り込まれず string のままです。なぜでしょうか。', 'seed-hard-2-bea9500f', 'hard', 35, '2026-07-05T16:41:26.296345+00:00', '2026-07-05T16:41:26.296345+00:00', 'ja');

-- [hard 3/5] PostgreSQLでデッドロックが時々発生する原因の調査方法
insert into questions (id, tenant_id, user_id, title, body, slug, status, view_count, created_at, updated_at, source_locale) values ('eda0caf7-2acb-4459-8f69-101d6d05f035', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'PostgreSQLでデッドロックが時々発生する原因の調査方法', '本番環境で稀にdeadlock detectedのエラーログが出ます。再現条件が分からず、どのクエリの組み合わせが原因か特定できずに困っています。', 'seed-hard-3-eda0caf7', 'hard', 40, '2026-07-06T16:41:26.296345+00:00', '2026-07-06T16:41:26.296345+00:00', 'ja');

-- [hard 4/5] React useEffectの依存配列が原因で無限ループになる
insert into questions (id, tenant_id, user_id, title, body, slug, status, view_count, created_at, updated_at, source_locale) values ('aedfa538-0339-409c-bc1d-0b7574a64d23', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'React useEffectの依存配列が原因で無限ループになる', 'useEffect内でsetStateを呼んでいて、依存配列にオブジェクトを指定しているのですが、無限に再レンダリングされてしまいます。オブジェクトの中身は変わっていないはずなのですが。', 'seed-hard-4-aedfa538', 'hard', 45, '2026-07-07T16:41:26.296345+00:00', '2026-07-07T16:41:26.296345+00:00', 'ja');

-- [hard 5/5] Docker Composeでコンテナ同士が名前解決できない
insert into questions (id, tenant_id, user_id, title, body, slug, status, view_count, created_at, updated_at, source_locale) values ('34fa1c63-15df-4252-bb58-5da3f4dba4a4', 'debug', '43069043-ff84-4e1a-966d-c75b0dfbdec9', 'Docker Composeでコンテナ同士が名前解決できない', 'docker-compose.ymlで同じネットワークに定義しているはずのapp・dbコンテナ間で、appからdbへホスト名で接続しようとするとgetaddrinfo ENOTFOUNDになります。', 'seed-hard-5-34fa1c63', 'hard', 50, '2026-07-08T16:41:26.296345+00:00', '2026-07-08T16:41:26.296345+00:00', 'ja');

commit;

-- 投入件数確認用: 実行後に以下で確認できます
-- select count(*) from questions where tenant_id = 'debug';
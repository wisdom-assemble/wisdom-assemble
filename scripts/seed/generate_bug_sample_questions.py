#!/usr/bin/env python3
"""
BUG DEBUGテナント用のサンプル質問・回答を生成するスクリプト。
実行すると scripts/seed/bug_sample_questions.sql が生成される。
生成されたSQLはSupabaseのSQL Editorで手動実行する（このスクリプト自体はDBに接続しない）。
"""
import uuid
from datetime import datetime, timedelta, timezone

TENANT_ID = "debug"
ASKER_ID = "43069043-ff84-4e1a-966d-c75b0dfbdec9"
ANSWERER_ID = "6e196709-800b-49dd-b475-0c8b6f4a5019"

def esc(s: str) -> str:
    return s.replace("'", "''")

# (title, body, answer_or_None)
# answer_or_None が None のものは status='hard'（未解決・全員公開）として投入する
QA = [
    (
        "setTimeoutの中でuseStateの値を更新しても古い値のまま",
        "Reactでカウントアップ機能を作っています。setTimeoutの中でsetCount(count + 1)を呼んでいるのですが、何度実行しても1しか増えません。なぜでしょうか？",
        "それは典型的な「stale closure（古いクロージャ）」の問題です。setTimeoutのコールバックが生成された時点のcountの値をずっと参照し続けてしまうので、毎回同じ値に+1しているだけになります。\n\n解決策はsetCountに関数を渡す形にすることです。\n\nsetCount(prev => prev + 1)\n\nこうすればReactが最新のstateを引数として渡してくれるので、クロージャの古い値を参照する問題を回避できます。setInterval等、非同期処理の中でstateを更新するときはほぼ必ずこの関数型の更新を使うと覚えておくと安全です。",
    ),
    (
        "Next.jsのApp RouterでServer ComponentとClient Componentの使い分けが分からない",
        "Next.js 14のApp Routerを使い始めましたが、'use client'をどこに付ければいいか判断に迷っています。基準を教えてください。",
        "基本方針は「デフォルトは全部Server Component、必要な場所だけClient Componentにする」です。\n\nClient Componentが必要になるのは主に次のケースです。\n- useState/useEffectなどReactのフックを使う\n- onClickなどのイベントハンドラが必要\n- ブラウザ専用API（window, localStorage等）を使う\n- Context APIを使う\n\n逆に、データ取得だけして表示するだけのコンポーネントはServer Componentのままにしておくと、JSバンドルサイズが減ってパフォーマンスが良くなります。よくあるパターンとして、ページ全体はServer Componentにしておき、ボタンやフォームなどインタラクティブな部分だけを小さいClient Componentに切り出す設計にすると綺麗にまとまります。",
    ),
    (
        "TypeScriptのsatisfiesとasの違いがよく分からない",
        "TypeScript 4.9で追加されたsatisfiesキーワードと、従来のas構文の違いがいまいち理解できません。使い分けを教えてください。",
        "一番の違いは「型の絞り込みを保ったまま検証できるかどうか」です。\n\nasは強制的に型をキャストするので、間違った型を指定してもコンパイラは基本的に黙って通してしまいます（実質的に型チェックをすり抜けられる）。\n\n一方satisfiesは、指定した型に合致しているかをチェックしつつも、変数自体の型は元の（より具体的な）推論結果のまま保持してくれます。\n\n例えば\nconst config = { color: 'red' } satisfies { color: string }\nと書くと、configの型は{ color: string }ではなく{ color: 'red' }のリテラル型として保持されるので、後続のコードで自動補完やより厳密なチェックが効きます。\n\n「型が合っているか検証したいだけで、変数の型そのものは緩めたくない」場合はsatisfies、「どうしても型を上書きしたい」場合だけasを使う、という使い分けがおすすめです。",
    ),
    (
        "PostgreSQLでN+1クエリが発生していないか調べる方法",
        "ORMを使わず生のSQLでAPIを書いているのですが、一覧取得のたびにループの中で個別クエリを投げてしまっている気がします。N+1になっているかどうかの確認方法と対処法を教えてください。",
        "確認方法としては、まずEXPLAIN ANALYZEでクエリの実行回数を見るより先に、アプリ側のログ（またはpg_stat_statementsのcalls列）を見るのが手っ取り早いです。1回のリクエストで同じパターンのSQLが件数分だけ発行されていたら、それがN+1です。\n\n対処法の基本は「ループの中でクエリを投げるのをやめて、1回のJOINまたはIN句にまとめる」ことです。\n\n例えば投稿一覧＋各投稿の著者名を取りたい場合、\n\nSELECT p.*, u.name FROM posts p JOIN users u ON u.id = p.user_id\n\nのように1本のJOINクエリにまとめれば、投稿件数が増えてもクエリ回数は常に1回で済みます。どうしてもJOINが複雑になりすぎる場合は、関連するIDを先にまとめて集めておき、WHERE id = ANY(array)で1回だけ取得してからアプリ側でマッピングする方法も有効です。",
    ),
    (
        "docker runしてもコンテナがすぐ終了してしまう",
        "自作のNode.jsアプリのDockerイメージをdocker runで起動しても、すぐにExitedになってしまいます。ログには特にエラーが出ていません。",
        "多くの場合、コンテナの中でメインプロセス（PID 1）がすぐに終了してしまっているのが原因です。Dockerコンテナは「フォアグラウンドで動き続けるプロセスがある間だけ」起動し続ける仕組みなので、たとえばCMDで指定したコマンドが一瞬で処理を終えて終了するタイプのスクリプトだと、コンテナ自体もそこで終了してしまいます。\n\nチェックすべきポイントは以下の通りです。\n1. Dockerfileの CMD がnode server.jsのように「起動し続けるプロセス」を指しているか（npm run buildのような一度で終わるコマンドになっていないか）\n2. server.jsの中でapp.listen()などが正しく呼ばれていてイベントループが待機し続ける状態になっているか\n3. コンテナ内で例外が発生してクラッシュしていないか → docker logs <コンテナID>で直前のログを確認する\n\ndocker logsでエラーが何も出ていない場合は、docker run -it --entrypoint sh イメージ名のようにシェルで直接入って手動でコマンドを実行し、何が起きているか確認するのが確実です。",
    ),
    (
        "pushしてしまったコミットを安全に取り消す方法",
        "リモートに間違えてpushしてしまったコミットがあります。他の人もすでにpullしているかもしれない状況で、安全に取り消す方法を教えてください。",
        "他の人がすでにpullしている可能性がある場合は、git reset --hardしてforce pushするのは避けるべきです。履歴が書き換わると、他の人のローカルとの整合性が壊れて混乱の元になります。\n\nこういうケースでは git revert を使うのが安全です。\n\ngit revert <取り消したいコミットのハッシュ>\n\nこれは既存の履歴を書き換えるのではなく、「そのコミットの変更を打ち消す新しいコミット」を追加する形になります。なので普通にgit pushするだけで済み、他の人が既にpullしていても特に問題は起きません。\n\nもしどうしても履歴自体をなかったことにしたい場合（force pushが許容される、個人ブランチ等）は、チーム全員に一声かけてからgit reset --hard + git push --forceを使う、という手順を踏んでください。基本はrevert、force pushは最終手段、と覚えておくと安全です。",
    ),
    (
        "Pythonのcopy.deepcopyとcopy.copyの違い",
        "リストの中にリストが入っているようなネストしたデータをコピーしたいのですが、copy.copyだと元のデータも一緒に変わってしまいます。なぜですか？",
        "copy.copyは「浅いコピー（シャローコピー）」なので、一番外側のオブジェクトだけを新しく作り、中身の要素（ネストしたリストや辞書など）は元のオブジェクトへの参照をそのまま使い回します。そのため、コピー後にネストした部分を変更すると、コピー元にも影響してしまいます。\n\ncopy.deepcopyは「深いコピー（ディープコピー）」で、ネストしている中身も再帰的にすべて新しく複製します。なので完全に独立したコピーが欲しい場合はdeepcopyを使う必要があります。\n\nimport copy\na = [[1, 2], [3, 4]]\nb = copy.copy(a)       # 浅いコピー：b[0]を変更するとaにも影響\nc = copy.deepcopy(a)   # 深いコピー：完全に独立\n\nなお、ネストがない単純なリスト（数値や文字列だけ）であれば copy.copy でも実質的に問題は起きません。ネストした可変オブジェクトが含まれる場合にだけ違いが表面化する、という点を覚えておくとよいです。",
    ),
    (
        "flexboxの子要素がはみ出して縮まない",
        "display: flexのコンテナの中に長いテキストを持つ子要素を入れると、コンテナの幅を超えてはみ出してしまいます。flex-shrinkは指定しているのですが効きません。",
        "これはflexboxの仕様上、子要素のmin-widthのデフォルト値がautoになっていることが原因であるケースがほとんどです。flex-shrinkを指定していても、子要素の内容（特に改行されない長いテキストや画像）が「最小コンテンツサイズ」として扱われ、その幅より縮まなくなってしまいます。\n\n対処法として、はみ出している子要素に\n\nmin-width: 0;\n\nを追加してみてください。これでflex-shrinkが正しく効くようになり、テキストがコンテナ内で折り返されるようになります。\n\nテキストが改行されずに省略記号（...）で切りたい場合は、min-width: 0と合わせて\n\noverflow: hidden;\ntext-overflow: ellipsis;\nwhite-space: nowrap;\n\nも追加すると綺麗に収まります。縦方向（flex-direction: column）で同じ問題が起きている場合はmin-heightについても同様に考えてください。",
    ),
    (
        "Node.jsのイベントループとブロッキング処理の関係が分からない",
        "Node.jsはシングルスレッドで非同期処理が得意と聞きますが、重いforループの計算を書いたら他のリクエストの処理も止まってしまいました。なぜですか？",
        "Node.jsが「非同期に強い」のは、I/O（ファイル読み書きやネットワーク通信など）を待っている間に他の処理を進められる、という意味であって、CPUを使う計算処理そのものを裏で並列に実行してくれるわけではありません。\n\nJavaScriptのコード自体はシングルスレッドのイベントループ上で1つずつ順番に実行されるので、重いforループのような同期的な計算処理を書くと、その処理が終わるまでイベントループ全体がブロックされ、他のリクエストの処理（他のタイマーやI/Oのコールバック含む）も一切進まなくなります。\n\n対処法としては、\n1. 計算処理を細かく分割してsetImmediateやprocess.nextTickで区切り、他の処理に制御を戻す機会を作る\n2. Worker Threads（worker_threadsモジュール）を使って別スレッドで計算処理を行う\n3. 計算量が多い処理は別プロセス・別サービスに切り出す\n\nのいずれかを検討してください。特に画像処理や暗号化処理など明確に重い処理がある場合はWorker Threadsに逃がすのが素直な解決策です。",
    ),
    (
        "AWSのS3バケットポリシーとIAMポリシーの違いがよく分からない",
        "S3のアクセス制御について調べていますが、バケットポリシーとIAMポリシーのどちらを使えばいいのか判断できません。違いを教えてください。",
        "どちらも最終的にはAWSの共通のポリシー言語（JSON）でアクセス許可を書く点は同じですが、「誰に紐付くか」が違います。\n\nIAMポリシーは、IAMユーザーやIAMロールに紐付けるポリシーです。「このユーザー（ロール）は何ができるか」を定義します。\n\nバケットポリシーは、S3バケット自体に紐付けるポリシーです。「このバケットに誰がアクセスできるか」を定義します。\n\n使い分けの目安としては、\n- 自分のAWSアカウント内のユーザー・サービスに権限を与えたいだけならIAMポリシーで十分\n- 他のAWSアカウントや、不特定多数（一般公開）にアクセスを許可したい場合はバケットポリシーが必要\n\nという整理になります。両方が設定されている場合は、IAMポリシーとバケットポリシーの許可の「積」ではなく「和」で評価されます（どちらかで明示的にAllowされていて、かつどちらにもDenyがなければアクセスできる）。ただしAccount全体のパブリックアクセスブロック設定が有効だと、バケットポリシーでpublicに許可していてもブロックされるので、そちらの設定も確認してみてください。",
    ),
    (
        "SQLインジェクションをパラメータ化クエリで防げる理由",
        "SQLインジェクション対策として「パラメータ化クエリを使え」とよく言われますが、なぜ文字列連結だと危険でパラメータ化なら安全なのか、仕組みを教えてください。",
        "文字列連結でSQLを組み立てる場合、ユーザーの入力値がそのままSQL文の一部として解釈されてしまいます。例えば\n\n\"SELECT * FROM users WHERE name = '\" + input + \"'\"\n\nという書き方だと、inputに' OR '1'='1のような値を入れられると、SQL文の構造そのものが書き換えられてしまい、意図しない全件取得や不正な操作が可能になります。\n\nパラメータ化クエリ（プレースホルダ + バインド変数）は、SQL文の「構造」とユーザーが渡す「値」を最初から別々にデータベースへ渡します。\n\nSELECT * FROM users WHERE name = $1\n\nのようにプレースホルダを使い、$1にはinputの値をパラメータとして渡します。データベース側はSQL文の構文解析を先に完了させた後で、渡された値を純粋な「データ」としてそこにはめ込むだけなので、値の中にどんな文字列が入っていてもSQL文の構造が書き換わることはありません。\n\nつまり文字列連結は「SQL文自体を毎回組み立て直している」のに対し、パラメータ化クエリは「あらかじめ決まった構造に、後から安全にデータを差し込んでいる」という根本的な違いがある、と理解すると分かりやすいと思います。",
    ),
    (
        "useMemoとuseCallbackはどちらを使うべきか判断基準が知りたい",
        "Reactのパフォーマンス最適化でuseMemoとuseCallbackがよく出てきますが、どちらを使えばいいのか毎回迷います。判断基準はありますか？",
        "実はこの2つ、内部的にやっていることはほぼ同じで、「何をメモ化したいか」が違うだけです。\n\nuseMemoは「計算結果の値」をメモ化します。重い計算処理の結果や、オブジェクト・配列を新しく作り直したくない場合に使います。\n\nconst sortedList = useMemo(() => list.sort(...), [list])\n\nuseCallbackは「関数そのもの」をメモ化します。子コンポーネントにコールバック関数をpropsとして渡す際、親が再レンダリングされるたびに新しい関数が作られて子も不要に再レンダリングされてしまう、というのを防ぎたいときに使います。\n\nconst handleClick = useCallback(() => doSomething(id), [id])\n\n実はuseCallback(fn, deps)は useMemo(() => fn, deps) とほぼ同じことをしているだけなので、「値が欲しいならuseMemo、関数が欲しいならuseCallback」というシンプルな基準で選べば大丈夫です。\n\nただし、どちらもメモ化自体にコストがかかるので、明らかに重い処理でも子コンポーネントの再レンダリングが問題になっているわけでもない場合は、無理に使わない方がコードがシンプルになることが多いです。",
    ),
    (
        "TypeScriptのジェネリクスでextendsを使う意味が分からない",
        "function foo<T extends string>(x: T) のようなコードを見かけますが、なぜextendsが必要なのか、普通に function foo<T>(x: T) と何が違うのか教えてください。",
        "extendsを付けることで「Tはこの型に当てはまるものに限定する」という制約（constraint）をジェネリクスに課すことができます。\n\nfunction foo<T>(x: T)だと、Tはどんな型でも受け付けてしまうので、関数の中でxに対してstring特有のメソッド（例えばx.toUpperCase()）を呼び出そうとしても、コンパイラは「Tがstringである保証がない」としてエラーを出します。\n\nfunction foo<T extends string>(x: T)のようにextends stringを付けると、「呼び出し側が渡せるのはstring（またはstringのサブタイプ）だけ」という制約になるので、関数の中で安全にx.toUpperCase()のようなstringのメソッドを呼び出せるようになります。\n\nオブジェクトの型に対してもよく使われていて、例えば\n\nfunction getId<T extends { id: string }>(obj: T): string {\n  return obj.id\n}\n\nのように書くと、「idプロパティを持っているオブジェクトなら何でも受け付けるが、idを持っていない型は渡せない」という汎用的だけど安全な関数を作れます。extendsは「制限」というより「その型が持っていることを保証されている機能を使えるようにする」ためのものだと捉えると理解しやすいと思います。",
    ),
    (
        "PostgreSQLでORDER BYが遅い時にインデックスをどう貼ればいいか",
        "created_atでソートして最新100件を取得するクエリが遅いです。created_atにインデックスは貼っているのですが速くなりません。",
        "WHERE句の条件とORDER BYを両方使っている場合、created_at単体のインデックスだけでは不十分なケースがよくあります。EXPLAIN ANALYZEを実行して、Sort処理が発生していないか、Index Scanではなく Seq Scan になっていないかをまず確認してください。\n\nよくある原因は「WHERE tenant_id = 'xxx' ORDER BY created_at DESC LIMIT 100」のようなクエリで、tenant_idの絞り込みとcreated_atのソートを1つのインデックスでまかなえていないケースです。\n\nこの場合、複合インデックスを作ると改善することが多いです。\n\nCREATE INDEX idx_questions_tenant_created ON questions (tenant_id, created_at DESC);\n\nこうすることで、tenant_idで絞り込んだ後の並び順がすでにインデックスの物理的な順序と一致するため、PostgreSQLが追加のソート処理をせずに済むようになります。EXPLAIN ANALYZEの結果でSortというノードが消えて、Index Scanだけで完結するようになっていれば改善できている証拠です。",
    ),
    (
        "Dockerのマルチステージビルドでイメージサイズを減らす方法",
        "Node.jsアプリのDockerイメージが1GB近くになってしまいます。ビルドツールなどは本番では不要なはずなのですが、どう減らせばいいですか？",
        "マルチステージビルドを使うのが定番の解決策です。ビルド用のステージと、実行用の最終的なステージを分けて、必要なファイルだけを最終イメージにコピーする書き方です。\n\n# ビルド用ステージ\nFROM node:20 AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# 実行用ステージ（軽量なイメージを使う）\nFROM node:20-alpine\nWORKDIR /app\nCOPY --from=builder /app/package*.json ./\nRUN npm ci --omit=dev\nCOPY --from=builder /app/dist ./dist\nCMD [\"node\", \"dist/server.js\"]\n\nこうすると、TypeScriptのコンパイラやdevDependencies、ソースコードそのものなど、ビルド時にしか使わないものは最終イメージに含まれなくなります。加えて、ベースイメージをnode:20ではなくnode:20-alpine（Alpine Linuxベースの軽量版）にするだけでも数百MB単位でサイズが減ることが多いです。\n\n.dockerignoreファイルでnode_modulesや.gitなどを除外しておくのも忘れずに。ビルドコンテキストが小さくなりビルド自体も速くなります。",
    ),
    (
        "git rebaseとgit mergeはどちらを使うべきか",
        "featureブランチをmainに取り込む際、rebaseとmergeのどちらを使うべきか、チームでいつも議論になります。判断基準を教えてください。",
        "どちらも「正解」というより、履歴をどう残したいかというチームの方針の問題です。\n\ngit mergeは、2つのブランチの履歴をそのまま保持し、マージコミットを1つ追加します。「実際に何が起きたか」の履歴がそのまま残るので、後から追いやすいという利点があります。\n\ngit rebaseは、featureブランチのコミットをmainの最新の上に「積み直す」ので、マージコミットが作られず、まるで最初からmainの上で作業していたかのような一直線の履歴になります。見た目はきれいになりますが、実際のコミット日時と履歴の順序が食い違ったり、コミットハッシュが変わってしまうという副作用があります。\n\n実務上よくある使い分けは、\n- 自分のfeatureブランチの中で、pushする前にコミットを整理する目的でrebaseを使う（このときはまだ誰も見ていないので安全）\n- 一度リモートにpushして他の人と共有した後の履歴は、rebaseせずmergeで取り込む（履歴の書き換えによる混乱を避けるため）\n\nという方針です。「pushする前は自由にrebase、pushした後はmerge」と覚えておくと、チームでのトラブルをかなり避けられます。",
    ),
    (
        "PythonのasyncioはGILを回避できると聞いたのですが本当ですか？",
        "asyncioで非同期処理を書けばマルチコアを活かして並列に処理が速くなると思っていたのですが、CPUを使う処理を並べても速くなりませんでした。",
        "それは誤解です。asyncioはGIL（グローバルインタプリタロック）を回避する仕組みではなく、あくまで「I/O待ち（ネットワーク通信やファイル読み書きなど）の間に他のタスクへ処理を譲る」ための仕組みです。CPUを使う計算処理自体は相変わらずシングルスレッド・GILの制約下で1つずつ順番に実行されます。\n\nasyncioが効果を発揮するのは、例えば複数のAPIへのリクエストを同時に投げて、レスポンスを待っている間に他のリクエストの処理を進める、というようなI/Oバウンドな処理です。CPUバウンドな重い計算処理を速くしたい場合は、\n\n- multiprocessingモジュールを使って複数プロセスに分散する（GILはプロセスごとに独立しているので真の並列処理になる）\n- concurrent.futures.ProcessPoolExecutorを使う\n\nといった方法を検討してください。「asyncio = I/Oを賢く待つための仕組み」「multiprocessing = CPU処理を並列化する仕組み」と役割を分けて覚えておくと混同しにくくなります。",
    ),
    (
        "z-indexを指定しても要素が最前面に来ない",
        "position: relativeとz-index: 999を指定した要素が、他の要素の後ろに隠れてしまいます。z-indexの値はもっと大きい他の要素より確実に高いはずなのですが。",
        "z-indexは単純に「数字が大きい方が勝つ」わけではなく、「同じスタッキングコンテキストの中でだけ」比較される、という点が見落とされがちです。\n\n親要素にtransform、opacity（1未満）、filterなどのプロパティが指定されていると、その親要素自身が新しいスタッキングコンテキストを作ってしまいます。そうなると、子要素にどれだけ大きいz-indexを指定しても、その数値は「親が作った箱の中」でしか通用せず、兄弟にあたる別のスタッキングコンテキストの要素とは直接比較されなくなります。\n\n確認手順としては、ブラウザの開発者ツールで、隠れてしまっている要素から親をたどっていき、transformやopacityなどスタッキングコンテキストを生成するプロパティが指定されている要素がないか探してみてください。\n\n対処法は主に2つです。\n1. 不要にスタッキングコンテキストを作っている親のtransform等を取り除く\n2. 最前面に出したい要素を、問題の親要素の外（DOM構造上、より上位の階層）に移動する\n\n特にモーダルやドロップダウンメニューを実装するときにこの問題によくぶつかるので、覚えておくと役立ちます。",
    ),
    (
        "Node.jsのEventEmitterでメモリリークが起きていると警告が出た",
        "MaxListenersExceededWarningという警告が出るようになりました。何が原因で、どう対処すればいいですか？",
        "この警告は、同じEventEmitterインスタンスに対してリスナー（.on()で登録したコールバック）が既定の上限（デフォルト10個）を超えて登録されたときに出るものです。多くの場合、リクエストのたびにリスナーを追加しているのに、対応する解除（.off()やremoveListener()）を忘れている、というのが根本原因です。\n\nありがちなパターンとして、リクエストごとに何らかの共有オブジェクト（DBコネクションやWebSocketなど）に対してon('data', ...)のようなリスナーを登録しているが、リクエストが終わった後にリスナーを外していない、というケースがあります。これが積み重なるとメモリリークにつながり、警告が出ます。\n\n対処法は次の通りです。\n1. リスナーを登録した箇所と対になる解除処理（off/removeListener）が本当にすべての経路（正常終了・エラー時両方）で呼ばれているか確認する\n2. 一度きりで十分な場合はon()の代わりにonce()を使う（自動的に1回実行後に解除される）\n3. どうしても意図的に10個以上のリスナーが必要な設計であれば、emitter.setMaxListeners(適切な数)で上限を明示的に引き上げる（ただし根本原因を確認しないまま数字だけ上げるのは対症療法なので注意）\n\nまずは1番のリスナー解除漏れを疑って調査してみることをおすすめします。",
    ),
    (
        "JWTとセッションCookie、どちらを使うべきか判断基準",
        "認証方式としてJWTとセッションCookieのどちらを採用するか迷っています。それぞれのメリット・デメリットを教えてください。",
        "どちらも「ログイン状態を維持する」という目的は同じですが、状態をどこで管理するかが根本的に違います。\n\nセッションCookieは、サーバー側（DBやRedis等）にセッション情報を保持し、クライアントにはセッションIDだけを渡す方式です。サーバー側で強制的にセッションを無効化（ログアウトさせる）ことが簡単にでき、実装もシンプルです。ただしサーバーが状態を持つ（ステートフル）ので、複数サーバーでスケールする際にはセッションストアの共有が必要になります。\n\nJWTは、ユーザー情報や権限などを署名付きのトークンそのものに含めてクライアント側に保持させる方式です。サーバー側は署名を検証するだけで済むので、サーバーが状態を持たない（ステートレス）形にでき、マイクロサービス間での認証情報の受け渡しなどと相性が良いです。ただし、発行したトークンを途中で強制的に無効化するのが難しい（有効期限が切れるまで基本的に有効であり続ける）というデメリックがあります。\n\n目安としては、\n- 単一のWebアプリケーションで、ログアウトの即時反映などを重視するならセッションCookie\n- 複数サービス間でまたがる認証や、モバイルアプリ・SPAなど多様なクライアントに対応する必要があるならJWT\n\nという使い分けが一般的です。なお、JWTを使う場合でも、即時無効化をしたい場面（不正利用が発覚した場合など）のためにトークンのブラックリスト（失効リスト）をサーバー側に持たせるハイブリッドな設計もよく使われます。",
    ),
]

# 未解決（高難度）として投入する質問。回答なし。
HARD_QA = [
    (
        "Next.jsでHydration failedエラーが出るが原因が特定できない",
        "本番環境でだけ「Hydration failed because the initial UI does not match what was rendered on the server」というエラーが出ます。ローカルでは再現しません。原因の切り分け方が分かりません。",
    ),
    (
        "TypeScriptでarray.includes()を使った型の絞り込みが効かない",
        "const arr = ['a', 'b'] as const; と定義した配列に対してarr.includes(value)でtrueだったのに、その後value の型がまだ絞り込まれず string のままです。なぜでしょうか。",
    ),
    (
        "PostgreSQLでデッドロックが時々発生する原因の調査方法",
        "本番環境で稀にdeadlock detectedのエラーログが出ます。再現条件が分からず、どのクエリの組み合わせが原因か特定できずに困っています。",
    ),
    (
        "React useEffectの依存配列が原因で無限ループになる",
        "useEffect内でsetStateを呼んでいて、依存配列にオブジェクトを指定しているのですが、無限に再レンダリングされてしまいます。オブジェクトの中身は変わっていないはずなのですが。",
    ),
    (
        "Docker Composeでコンテナ同士が名前解決できない",
        "docker-compose.ymlで同じネットワークに定義しているはずのapp・dbコンテナ間で、appからdbへホスト名で接続しようとするとgetaddrinfo ENOTFOUNDになります。",
    ),
]

now = datetime.now(timezone.utc)
lines = []
lines.append("-- ============================================================")
lines.append("-- BUG DEBUGテナント サンプル質問追加スクリプト（自動生成）")
lines.append(f"-- 生成日時: {now.isoformat()}")
lines.append(f"-- solved済み: {len(QA)}件 / hard(未解決・公開): {len(HARD_QA)}件 / 合計 {len(QA) + len(HARD_QA)}件")
lines.append("-- 実行方法: Supabase SQL Editorで「新規タブ」を開いて全文を貼り付けて実行")
lines.append("-- ============================================================")
lines.append("")
lines.append("begin;")
lines.append("")

for i, (title, body, answer) in enumerate(QA):
    q_id = str(uuid.uuid4())
    a_id = str(uuid.uuid4())
    slug = f"seed-solved-{i+1}-{q_id[:8]}"
    created = now - timedelta(days=(len(QA) - i) * 2, hours=3)
    solved_at = created + timedelta(hours=6)
    answered_created = created + timedelta(hours=5, minutes=30)
    view_count = 12 + i * 3

    lines.append(f"-- [{i+1}/{len(QA)}] {title}")
    lines.append(
        "insert into questions "
        "(id, tenant_id, user_id, title, body, slug, status, solved_at, solved_by, view_count, created_at, updated_at, source_locale) "
        "values ("
        f"'{q_id}', '{TENANT_ID}', '{ASKER_ID}', "
        f"'{esc(title)}', '{esc(body)}', '{slug}', 'solved', "
        f"'{solved_at.isoformat()}', '{ANSWERER_ID}', {view_count}, "
        f"'{created.isoformat()}', '{solved_at.isoformat()}', 'ja'"
        ");"
    )
    lines.append(
        "insert into answers "
        "(id, question_id, tenant_id, user_id, body, is_ai, is_accepted, created_at, updated_at) "
        "values ("
        f"'{a_id}', '{q_id}', '{TENANT_ID}', '{ANSWERER_ID}', "
        f"'{esc(answer)}', false, true, "
        f"'{answered_created.isoformat()}', '{answered_created.isoformat()}'"
        ");"
    )
    lines.append("")

for i, (title, body) in enumerate(HARD_QA):
    q_id = str(uuid.uuid4())
    slug = f"seed-hard-{i+1}-{q_id[:8]}"
    created = now - timedelta(days=(len(HARD_QA) - i), hours=1)
    view_count = 30 + i * 5

    lines.append(f"-- [hard {i+1}/{len(HARD_QA)}] {title}")
    lines.append(
        "insert into questions "
        "(id, tenant_id, user_id, title, body, slug, status, view_count, created_at, updated_at, source_locale) "
        "values ("
        f"'{q_id}', '{TENANT_ID}', '{ASKER_ID}', "
        f"'{esc(title)}', '{esc(body)}', '{slug}', 'hard', {view_count}, "
        f"'{created.isoformat()}', '{created.isoformat()}', 'ja'"
        ");"
    )
    lines.append("")

lines.append("commit;")
lines.append("")
lines.append(f"-- 投入件数確認用: 実行後に以下で確認できます")
lines.append(f"-- select count(*) from questions where tenant_id = 'debug';")

output_path = "scripts/seed/bug_sample_questions.sql"
with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Generated {output_path}")
print(f"solved: {len(QA)}, hard: {len(HARD_QA)}, total: {len(QA) + len(HARD_QA)}")

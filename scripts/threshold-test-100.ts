/**
 * 閾値決定テスト - 100問 × 3回実行
 * 目的：カテゴリ別の推奨閾値をデータで決定する
 * 実行: npx tsx scripts/threshold-test-100.ts
 * 所要時間: 約8〜10分
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const NOTION_PAGE_ID = '38bf5fa8-bcb9-80f1-bede-f2876b7ef115' // ③ 閾値決めのテスト

type Expected = 'correct' | 'partial' | 'needs_human'
type Difficulty = 'easy' | 'medium' | 'hard'

interface Q {
  id: number
  category: string
  title: string
  body: string
  difficulty: Difficulty
  expected: Expected
}

// ============================================================
// 100問（現実的・具体的）
// ============================================================

const QUESTIONS: Q[] = [
  // ── React / Next.js（15問）──────────────────────────────
  { id:1, category:'React', difficulty:'easy', expected:'correct',
    title:'useStateで配列を更新しても再レンダリングされない',
    body:'Reactでconst [list, setList] = useState([])と定義し、list.push(item)で要素を追加しています。画面が更新されません。なぜですか？' },
  { id:2, category:'React', difficulty:'easy', expected:'correct',
    title:'useEffectが無限ループする',
    body:'useEffect内でsetStateを呼んでいます。依存配列に[]を渡しているのに無限ループになります。原因はなんですか？' },
  { id:3, category:'React', difficulty:'easy', expected:'correct',
    title:'Propsをコンポーネントに渡せない',
    body:'親コンポーネントから子コンポーネントにonClick関数をPropsで渡しています。子側でprops.onClickを呼ぶと「is not a function」エラーが出ます。' },
  { id:4, category:'React', difficulty:'medium', expected:'partial',
    title:'React.memoを使っても再レンダリングが止まらない',
    body:'React.memoで子コンポーネントをラップしましたが、親が再レンダリングされると子も再レンダリングされます。Propsはオブジェクト型です。' },
  { id:5, category:'React', difficulty:'medium', expected:'partial',
    title:'useContextで値が更新されない',
    body:'React ContextのProviderでvalueを更新しても、Consumerのコンポーネントが再レンダリングされません。ContextはuseStateで管理しています。' },
  { id:6, category:'Next.js', difficulty:'easy', expected:'correct',
    title:'Next.js 14でgetServerSidePropsが使えない',
    body:'Next.js 14のApp RouterでgetServerSidePropsを使おうとしたらエラーになります。どうすればいいですか？' },
  { id:7, category:'Next.js', difficulty:'easy', expected:'correct',
    title:'Next.jsでimport画像がエラーになる',
    body:'Next.jsでimport logo from "../../public/logo.png"としたら「cannot find module」エラーが出ます。next.config.jsの設定が必要ですか？' },
  { id:8, category:'Next.js', difficulty:'medium', expected:'partial',
    title:'Next.jsのApp RouterでCookieが取得できない',
    body:'Next.js 14のServer ComponentでCookieを取得しようとしています。cookies()を使っていますがundefinedになります。' },
  { id:9, category:'Next.js', difficulty:'medium', expected:'partial',
    title:'Next.jsのMiddlewareが本番でだけ動かない',
    body:'middleware.tsをプロジェクトルートに置いています。ローカルでは動くのに、Vercelにデプロイすると無視されます。matcherの設定は合っています。' },
  { id:10, category:'Next.js', difficulty:'hard', expected:'needs_human',
    title:'Next.js本番環境でメモリリークが発生している',
    body:'Vercelにデプロイ後、数時間でサーバーのメモリ使用量が増加してリスタートが必要になります。ローカルでは再現しません。どこを調べればいいですか？' },
  { id:11, category:'React', difficulty:'hard', expected:'needs_human',
    title:'ReactアプリがモバイルSafariでだけクラッシュする',
    body:'iPhoneのSafariでReactアプリを開くと、特定の操作後に白画面になってクラッシュします。Chromeでは正常です。エラーログが取れません。' },
  { id:12, category:'React', difficulty:'medium', expected:'partial',
    title:'React 18でStrictModeにするとuseEffectが2回走る',
    body:'React 18にアップグレードしたらuseEffectが開発環境で2回実行されるようになりました。APIが2回呼ばれています。これは仕様ですか？' },
  { id:13, category:'Next.js', difficulty:'easy', expected:'correct',
    title:'next/imageでExternal URLの画像が表示されない',
    body:'next/imageコンポーネントで外部URLの画像を表示しようとすると「hostname is not configured」エラーが出ます。' },
  { id:14, category:'React', difficulty:'medium', expected:'partial',
    title:'Zustandのstoreが複数タブで同期しない',
    body:'ZustandでグローバルなCartステートを管理しています。タブAで追加した商品がタブBに反映されません。どうすれば同期できますか？' },
  { id:15, category:'Next.js', difficulty:'hard', expected:'needs_human',
    title:'Next.js APIルートが本番でTimeout 504になる',
    body:'Vercelにデプロイしたテスト環境では動くのに、本番環境でAPIルートを叩くと504 Gateway Timeoutが返ります。処理時間は2秒程度のはずです。' },

  // ── TypeScript（8問）──────────────────────────────
  { id:16, category:'TypeScript', difficulty:'easy', expected:'correct',
    title:'TypeScriptでType is not assignable to type never',
    body:'switch文でexhaustive checkをしようとすると「Type string is not assignable to type never」エラーが出ます。どう修正しますか？' },
  { id:17, category:'TypeScript', difficulty:'easy', expected:'correct',
    title:'TypeScriptでObject is possibly undefined',
    body:'APIレスポンスのデータをそのまま使おうとすると「Object is possibly undefined」エラーが出ます。型ガードはどう書けばいいですか？' },
  { id:18, category:'TypeScript', difficulty:'medium', expected:'partial',
    title:'TypeScriptのジェネリクスでConstraintエラー',
    body:'function getData<T>(key: string): T という関数を定義したら「Type T does not satisfy the constraint」エラーが出ます。' },
  { id:19, category:'TypeScript', difficulty:'medium', expected:'partial',
    title:'TypeScriptでas constとreadonlyの違い',
    body:'配列をas constにするとreadonlyになりますが、typeofで型を取ると想定と違う型になります。as constとreadonlyの使い分けを教えてください。' },
  { id:20, category:'TypeScript', difficulty:'medium', expected:'partial',
    title:'TypeScript 5.xのdecoratorsが動かない',
    body:'TypeScript 5.xでデコレーターを使おうとしています。tsconfig.jsonにexperimentalDecoratorsをtrueにしても「Unable to resolve signature」エラーが出ます。' },
  { id:21, category:'TypeScript', difficulty:'hard', expected:'needs_human',
    title:'TypeScriptのビルドが本番だけ型エラーで失敗する',
    body:'ローカルではtsc --noEmitが通るのに、GitHub ActionsでCI実行するとtype errorで失敗します。tsconfig.jsonは同じファイルです。nodeのバージョンは同じです。' },
  { id:22, category:'TypeScript', difficulty:'easy', expected:'correct',
    title:'TypeScriptでenumの値を文字列として使いたい',
    body:'enumで定義した値を文字列として扱いたいのですが、型エラーが出ます。string enumとconst enumの違いを教えてください。' },
  { id:23, category:'TypeScript', difficulty:'hard', expected:'needs_human',
    title:'TypeScriptのpath aliasがJestだけで解決されない',
    body:'tsconfig.jsonでpathsを設定しています。アプリ本体は動くのにJestのテストだけ「Cannot find module @/components」になります。jest.config.tsは設定済みです。' },

  // ── SQL / DB設計（10問）──────────────────────────────
  { id:24, category:'SQL', difficulty:'easy', expected:'correct',
    title:'SQLのJOINとLEFT JOINの違いがわからない',
    body:'JOINとLEFT JOINの違いを教えてください。どちらを使えばいいか判断基準はありますか？' },
  { id:25, category:'SQL', difficulty:'easy', expected:'correct',
    title:'PostgreSQLでNULLの比較がおかしい',
    body:'WHERE column = NULLとしても結果が返ってきません。NULLの比較はどうすれば正しくできますか？' },
  { id:26, category:'SQL', difficulty:'medium', expected:'partial',
    title:'PostgreSQLで100万件のSELECTが10秒かかる',
    body:'WHERE created_at > 2024-01-01で検索すると10秒以上かかります。created_atにインデックスを貼っているはずですが改善しません。EXPLAIN ANALYZEの結果はSeq Scanになっています。' },
  { id:27, category:'SQL', difficulty:'medium', expected:'partial',
    title:'N+1問題をSQLで解消したい',
    body:'ORMを使ってユーザー一覧を取得しています。各ユーザーの投稿数を取得するために、ユーザーごとにSQLが発行されています。どう解消しますか？' },
  { id:28, category:'SQL', difficulty:'medium', expected:'partial',
    title:'PostgreSQLのトランザクションでデッドロックが発生する',
    body:'2つのトランザクションが同時に実行されるとデッドロックエラーが出ます。テーブルAとテーブルBを更新する処理です。' },
  { id:29, category:'SQL', difficulty:'hard', expected:'needs_human',
    title:'本番DBのSELECTが突然遅くなった',
    body:'昨日まで0.1秒で返っていたクエリが今日から5秒かかっています。データ量は変わっていません。インデックスも変更していません。本番環境です。' },
  { id:30, category:'SQL', difficulty:'easy', expected:'correct',
    title:'SQLでGROUP BYとHAVINGの使い方',
    body:'カテゴリごとの商品数を取得して、10件以上あるカテゴリだけ絞り込みたいです。GROUP BYとHAVINGの書き方を教えてください。' },
  { id:31, category:'SQL', difficulty:'medium', expected:'partial',
    title:'PostgreSQLのJSONBカラムへのインデックス',
    body:'JSONBカラムに格納されたデータをWHERE data->>"name" = "John"で検索しています。インデックスはどう貼ればいいですか？' },
  { id:32, category:'SQL', difficulty:'hard', expected:'needs_human',
    title:'マスターデータ移行後に外部キー制約エラーが大量発生',
    body:'本番環境で別システムからのデータ移行を行いました。移行後から外部キー制約違反エラーが発生しています。移行前のデータ検証は通っていました。' },
  { id:33, category:'SQL', difficulty:'medium', expected:'partial',
    title:'PostgreSQLでUPSERTを使いたい',
    body:'INSERT時に同じプライマリキーが存在する場合はUPDATEしたいです。PostgreSQLでのUPSERTの書き方を教えてください。' },

  // ── Docker / インフラ（10問）──────────────────────────────
  { id:34, category:'Docker', difficulty:'easy', expected:'correct',
    title:'M1 MacでDockerがarm64エラーになる',
    body:'M1 MacでDocker Composeを起動したら「platform linux/amd64 does not match host platform linux/arm64」と出てコンテナが起動しません。' },
  { id:35, category:'Docker', difficulty:'easy', expected:'correct',
    title:'Dockerコンテナ間で通信できない',
    body:'Docker Composeで複数のコンテナを起動しています。コンテナAからコンテナBにlocalhost:3000でアクセスできません。' },
  { id:36, category:'Docker', difficulty:'medium', expected:'partial',
    title:'Dockerのビルドが毎回キャッシュされない',
    body:'Dockerfileを変更していないのに毎回フルビルドされます。package.jsonをCOPYした後にnpm installをしています。キャッシュが効きません。' },
  { id:37, category:'Docker', difficulty:'medium', expected:'partial',
    title:'DockerコンテナのNode.jsがメモリ不足でクラッシュ',
    body:'DockerコンテナでNode.jsアプリを動かしています。しばらくするとOOM Killedになります。メモリ制限は512MBに設定しています。' },
  { id:38, category:'Docker', difficulty:'hard', expected:'needs_human',
    title:'本番KubernetesでPodが断続的にRestartする',
    body:'本番のKubernetesクラスターでPodが1〜2時間おきにRestartしています。ログには特にエラーなし。MemoryLimitはアプリの使用量より十分大きい値です。' },
  { id:39, category:'Docker', difficulty:'easy', expected:'correct',
    title:'DockerfileのCMDとENTRYPOINTの違い',
    body:'DockerfileにCMDとENTRYPOINTがありますが、違いがわかりません。どちらをどう使えばいいですか？' },
  { id:40, category:'Docker', difficulty:'medium', expected:'partial',
    title:'Docker Composeのvolumesでファイルが同期されない',
    body:'volumes: - ./src:/app/srcとしてホストのファイルをコンテナにマウントしています。ホストでファイルを変更してもコンテナに反映されません。' },
  { id:41, category:'Docker', difficulty:'hard', expected:'needs_human',
    title:'DockerイメージのCIビルドが本番で動かない',
    body:'GitHub ActionsでビルドしたDockerイメージをGCRにプッシュしています。ローカルでは動くのに本番サーバーにデプロイするとコンテナが即終了します。' },
  { id:42, category:'Docker', difficulty:'medium', expected:'partial',
    title:'マルチステージビルドで最終イメージが大きい',
    body:'マルチステージビルドを使っているのに最終イメージが1GB以上あります。node_modulesが含まれていないはずなのにサイズが小さくなりません。' },
  { id:43, category:'Docker', difficulty:'easy', expected:'correct',
    title:'Dockerで環境変数を.envファイルから読み込みたい',
    body:'Docker Composeで.envファイルの環境変数をコンテナに渡したいです。env_fileとenvironmentの違いと正しい書き方を教えてください。' },

  // ── AWS / クラウド（10問）──────────────────────────────
  { id:44, category:'AWS', difficulty:'easy', expected:'correct',
    title:'AWS S3のバケットポリシーでアクセス拒否される',
    body:'S3バケットにパブリックアクセスを許可するポリシーを設定しましたが、URLにアクセスすると403 Forbiddenが返ります。' },
  { id:45, category:'AWS', difficulty:'medium', expected:'partial',
    title:'Lambda関数のコールドスタートを改善したい',
    body:'AWS Lambdaで書いたAPIがたまに5〜10秒かかります。コールドスタートが原因と思われます。改善する方法はありますか？' },
  { id:46, category:'AWS', difficulty:'medium', expected:'partial',
    title:'API GatewayとLambdaでCORSエラーが出る',
    body:'AWS API GatewayとLambdaで作ったAPIにフロントからアクセスするとCORSエラーが出ます。Lambda側でAccess-Control-Allow-Originヘッダーを返しています。' },
  { id:47, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'Lambda関数が本番だけタイムアウトする',
    body:'ローカル実行では1秒以内に完了するLambda関数が、本番環境でだけ30秒タイムアウトになります。環境変数はSTAGE=productionだけ違います。CloudWatchログに特記なし。' },
  { id:48, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'RDSへのLambda接続でToo many connectionsエラー',
    body:'Lambda関数からRDS PostgreSQLに接続しています。高負荷時に「too many connections」エラーが発生します。RDS Proxyを入れましたが改善しません。' },
  { id:49, category:'AWS', difficulty:'medium', expected:'partial',
    title:'CloudFrontのキャッシュが即座に反映されない',
    body:'S3にファイルをアップロードしてもCloudFrontが古いファイルを返します。Invalidationを実行していますが数分かかります。即座に反映する方法はありますか？' },
  { id:50, category:'AWS', difficulty:'easy', expected:'correct',
    title:'IAMロールとIAMユーザーの違い',
    body:'AWSでIAMロールとIAMユーザーの違いがわかりません。LambdaにS3アクセス権を与えたい場合はどちらを使えばいいですか？' },
  { id:51, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'ECSタスクが断続的にExitCode137で終了する',
    body:'AWS ECSのFargateでタスクが1日に数回ExitCode137で終了します。メモリ使用量はタスク定義の上限を下回っています。ログには何も出ません。' },
  { id:52, category:'AWS', difficulty:'medium', expected:'partial',
    title:'SQSのメッセージが重複処理される',
    body:'AWS SQSを使ったキュー処理で、同じメッセージが2回処理されることがあります。Lambdaのバッチサイズは1に設定しています。' },
  { id:53, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'本番でAWS Cognitoのトークンが突然無効になった',
    body:'昨日から本番環境のユーザーが突然ログアウトされています。Cognitoのユーザープールは変更していません。全ユーザーではなく一部のユーザーだけです。' },

  // ── Supabase / 認証（8問）──────────────────────────────
  { id:54, category:'Supabase', difficulty:'easy', expected:'correct',
    title:'SupabaseのRLSポリシーの基本的な書き方',
    body:'Supabaseでテーブルにrow level securityを設定したいです。ログインユーザーが自分のデータだけ読み書きできるポリシーの書き方を教えてください。' },
  { id:55, category:'Supabase', difficulty:'medium', expected:'partial',
    title:'SupabaseのRLSでINSERTだけ403になる',
    body:'Supabaseでテーブルにポリシーを設定しています。SELECT・UPDATEは動くのにINSERTだけ「new row violates row-level security policy」になります。' },
  { id:56, category:'Supabase', difficulty:'easy', expected:'correct',
    title:'Supabaseのリアルタイム機能の使い方',
    body:'Supabaseでデータの変更をリアルタイムに検知したいです。supabase.channel()を使ったリアルタイムサブスクリプションの基本的な書き方を教えてください。' },
  { id:57, category:'Supabase', difficulty:'medium', expected:'partial',
    title:'SupabaseのStorageで画像アップロードが403になる',
    body:'Supabase Storageにファイルをアップロードしようとすると403エラーが返ります。バケットはpublicに設定しています。認証済みユーザーです。' },
  { id:58, category:'Supabase', difficulty:'hard', expected:'needs_human',
    title:'Supabaseの本番DBに突然接続できなくなった',
    body:'本番のSupabaseプロジェクトにアプリから接続できなくなりました。Supabaseのダッシュボードは開けます。エラーは「connection refused」です。今朝から突然です。' },
  { id:59, category:'Supabase', difficulty:'medium', expected:'partial',
    title:'SupabaseのEdge FunctionでCORSエラー',
    body:'Supabase Edge FunctionにフロントエンドからPOSTするとCORSエラーが出ます。Edge Function内でcorsヘッダーを返していますがOPTIONSリクエストに対応できていないようです。' },
  { id:60, category:'Supabase', difficulty:'easy', expected:'correct',
    title:'Supabaseで外部キー付きのデータを一度に取得したい',
    body:'Supabaseでpostsテーブルとusersテーブルがあります。投稿一覧を取得する時に投稿者の名前も一緒に取得したいです。どう書けばいいですか？' },
  { id:61, category:'Supabase', difficulty:'hard', expected:'needs_human',
    title:'SupabaseのRLSが本番でだけ動かない',
    body:'ローカルのSupabaseではRLSポリシーが正しく動くのに、本番プロジェクトにデプロイするとRLSが全て通過してしまいます。同じSQLを実行しています。' },

  // ── CSS / UI（9問）──────────────────────────────
  { id:62, category:'CSS', difficulty:'easy', expected:'correct',
    title:'CSSでFlexboxの要素が縦に並んでしまう',
    body:'display: flexを設定していますが、子要素が縦に並んでしまいます。横並びにしたいです。どこが間違っていますか？' },
  { id:63, category:'CSS', difficulty:'easy', expected:'correct',
    title:'CSSでmargin: autoが効かない',
    body:'div要素をmargin: 0 autoで中央寄せしようとしていますが効きません。widthは指定しています。' },
  { id:64, category:'CSS', difficulty:'medium', expected:'partial',
    title:'z-indexがSafariだけ効かない',
    body:'Safariブラウザだけz-indexが無視されてモーダルが他要素の後ろに隠れます。position: fixedとz-index: 9999を指定しています。ChromeとFirefoxは正常です。' },
  { id:65, category:'CSS', difficulty:'medium', expected:'partial',
    title:'TailwindCSSのクラスが本番だけ消える',
    body:'開発環境ではTailwindCSSのスタイルが当たっているのに、本番ビルドすると一部のクラスが消えます。動的にクラス名を生成しています。' },
  { id:66, category:'CSS', difficulty:'easy', expected:'correct',
    title:'CSSのposition: stickyが効かない',
    body:'ヘッダーをposition: stickyにしたいのですが、スクロールしても固定されません。top: 0は指定しています。' },
  { id:67, category:'CSS', difficulty:'medium', expected:'partial',
    title:'iOSのSafariで100vhが正しくない',
    body:'height: 100vhを指定しても、iPhoneのSafariではURLバーの分だけコンテンツが隠れてしまいます。どう対処すればいいですか？' },
  { id:68, category:'CSS', difficulty:'hard', expected:'needs_human',
    title:'CSSアニメーションがAndroid Chromeだけカクつく',
    body:'CSSのtransformでアニメーションを実装しています。PCとiOSでは滑らかですが、特定のAndroid端末（Chrome）でだけカクつきます。will-changeは設定済みです。' },
  { id:69, category:'CSS', difficulty:'medium', expected:'partial',
    title:'Tailwind CSSでダークモードが動かない',
    body:'TailwindCSSのdark:クラスを使ってダークモードを実装しています。tailwind.config.jsでdarkMode: classを設定しましたが、htmlタグにdarkクラスを追加しても変わりません。' },
  { id:70, category:'CSS', difficulty:'hard', expected:'needs_human',
    title:'印刷時だけCSSレイアウトが崩れる',
    body:'@media printで印刷用スタイルを書いています。ブラウザのプレビューでは正しく表示されますが、実際に印刷するとレイアウトが崩れます。プリンターによって結果が違います。' },

  // ── Python / AI（8問）──────────────────────────────
  { id:71, category:'Python', difficulty:'easy', expected:'correct',
    title:'asyncio.run()でイベントループエラー',
    body:'Jupyter Notebookでasyncio.run()を呼ぶと「RuntimeError: This event loop is already running」が出ます。非同期関数をどう実行すればいいですか？' },
  { id:72, category:'Python', difficulty:'easy', expected:'correct',
    title:'PythonでリストのコピーがShallow Copyになる',
    body:'list2 = list1としてリストをコピーしましたが、list2を変更するとlist1も変わります。独立したコピーはどう作りますか？' },
  { id:73, category:'Python', difficulty:'medium', expected:'partial',
    title:'Pandasでメモリ不足になる',
    body:'1GBのCSVファイルをpd.read_csv()で読み込もうとするとMemoryErrorになります。メモリは8GBあります。どうすればいいですか？' },
  { id:74, category:'Python', difficulty:'medium', expected:'partial',
    title:'OpenAI APIのRate Limitエラーを回避したい',
    body:'OpenAI APIを大量に呼び出す処理でRateLimitErrorが頻発します。リトライロジックを入れていますが429エラーが出続けます。' },
  { id:75, category:'Python', difficulty:'hard', expected:'needs_human',
    title:'本番のPythonサーバーがランダムにSegfaultする',
    body:'本番環境のFastAPIサーバーが1日に1〜2回Segmentation faultでクラッシュします。ローカルでは再現しません。使用しているライブラリはnumpy、scipy、scikit-learnです。' },
  { id:76, category:'Python', difficulty:'medium', expected:'partial',
    title:'LangChainでDocument Loaderがタイムアウトする',
    body:'LangChainのWebBaseLoaderで外部URLからドキュメントを取得しています。特定のサイトでTimeout Errorが出ます。requestsで直接取得はできています。' },
  { id:77, category:'Python', difficulty:'easy', expected:'correct',
    title:'Pythonの仮想環境でpipインストールが反映されない',
    body:'venvで仮想環境を作成してpip installをしました。pythonを実行するとModuleNotFoundErrorが出ます。仮想環境は正しくactivateしています。' },
  { id:78, category:'Python', difficulty:'hard', expected:'needs_human',
    title:'PyTorchモデルの推論が本番でGPUを使わない',
    body:'開発環境ではGPUで推論していたPyTorchモデルが、本番サーバーにデプロイするとCPUで動いています。nvidia-smiではGPUが認識されています。' },

  // ── セキュリティ（10問）──────────────────────────────
  { id:79, category:'セキュリティ', difficulty:'easy', expected:'correct',
    title:'JWTトークンはどこに保存すべきか',
    body:'JWTトークンをLocalStorageとCookieのどちらに保存するか悩んでいます。それぞれのセキュリティリスクと推奨される方法を教えてください。' },
  { id:80, category:'セキュリティ', difficulty:'easy', expected:'correct',
    title:'SQLインジェクション対策の基本',
    body:'Node.jsとPostgreSQLでWebアプリを作っています。SQLインジェクション対策として何をすればいいですか？プリペアドステートメントとは何ですか？' },
  { id:81, category:'セキュリティ', difficulty:'medium', expected:'partial',
    title:'CSRF対策をSPA+APIで実装したい',
    body:'ReactのSPAとAPIサーバーが別ドメインにあります。CSRF攻撃への対策はどうすればいいですか？Cookieを使った認証です。' },
  { id:82, category:'セキュリティ', difficulty:'medium', expected:'partial',
    title:'APIキーがGitHubに流出してしまった',
    body:'誤ってAPIキーをGitHubのpublicリポジトリにコミットしてプッシュしてしまいました。すぐにコミットを削除しましたが、どんな対応が必要ですか？' },
  { id:83, category:'セキュリティ', difficulty:'hard', expected:'needs_human',
    title:'本番サーバーへの不審なアクセスを検知した',
    body:'CloudWatchのログで深夜に大量の不審なAPIアクセスを検知しました。IPは海外から複数。一部のエンドポイントにSQLインジェクションを試みた形跡があります。今何をすべきですか？' },
  { id:84, category:'セキュリティ', difficulty:'hard', expected:'needs_human',
    title:'本番サーバーでJWTが突然全員無効になった',
    body:'昨日のデプロイ後から全ユーザーのJWTが無効になっています。JWT_SECRETの環境変数は変更した覚えはありません。デプロイはDockerイメージの更新だけです。' },
  { id:85, category:'セキュリティ', difficulty:'medium', expected:'partial',
    title:'パスワードのハッシュ化にMD5を使っている',
    body:'既存のシステムがパスワードをMD5でハッシュ化して保存しています。bcryptに移行したいのですが、既存ユーザーのパスワードはどう扱えばいいですか？' },
  { id:86, category:'セキュリティ', difficulty:'hard', expected:'needs_human',
    title:'XSS攻撃の痕跡をログで見つけた',
    body:'本番のアクセスログで、クエリパラメータに<script>タグが含まれるリクエストを大量に発見しました。現在のところ被害は確認できていません。対応策を教えてください。' },
  { id:87, category:'セキュリティ', difficulty:'medium', expected:'partial',
    title:'OAuthのcallback URLが奪取される可能性',
    body:'GoogleのOAuth 2.0でログイン機能を実装しています。redirect_uriをユーザーが操作できる状態になっていることを指摘されました。どう対処すればいいですか？' },
  { id:88, category:'セキュリティ', difficulty:'hard', expected:'needs_human',
    title:'本番DBのデータが無断で削除された可能性',
    body:'本番DBのレコードが数千件消えていることに気づきました。バックアップは3日前のものしかありません。削除のログは残っていません。何から調査すべきですか？' },

  // ── Git / CI/CD（8問）──────────────────────────────
  { id:89, category:'Git', difficulty:'easy', expected:'correct',
    title:'Gitでコミットを取り消したい',
    body:'直前のコミットを取り消したいです。変更はワーキングディレクトリに残したまま取り消す方法と、完全に取り消す方法の両方を教えてください。' },
  { id:90, category:'Git', difficulty:'easy', expected:'correct',
    title:'Gitのマージコンフリクトの解消方法',
    body:'git mergeでコンフリクトが発生しました。コンフリクトマーカー（<<<<<<<、=======、>>>>>>>）の意味と解消手順を教えてください。' },
  { id:91, category:'Git', difficulty:'medium', expected:'partial',
    title:'GitHub Actionsが特定のブランチだけ失敗する',
    body:'GitHub Actionsのワークフローがmainブランチでは成功しますが、feature/xブランチでだけ失敗します。同じyamlファイルを使っています。シークレットの設定は同じです。' },
  { id:92, category:'Git', difficulty:'medium', expected:'partial',
    title:'git rebaseでコミット履歴を整理したい',
    body:'featureブランチに10個のコミットがあります。mainにマージする前に、関連するコミットをまとめて1つにしたいです。interactive rebaseの使い方を教えてください。' },
  { id:93, category:'Git', difficulty:'hard', expected:'needs_human',
    title:'git push --forceで本番ブランチのコミットが消えた',
    body:'誰かがgit push --force-with-leaseをmainブランチに実行して、過去3日分のコミットが消えました。GitHub上のコミット履歴も消えています。復元できますか？' },
  { id:94, category:'Git', difficulty:'medium', expected:'partial',
    title:'GitHub Actionsでnpm installが毎回フルインストールされる',
    body:'GitHub ActionsでNode.jsのCIを実行しています。キャッシュアクションを設定しましたがnpm installが毎回フルで走ります。cache-hitがfalseになり続けます。' },
  { id:95, category:'Git', difficulty:'easy', expected:'correct',
    title:'GitのブランチをリモートにPushしたい',
    body:'ローカルで新しいブランチを作りました。リモートリポジトリ（GitHub）にこのブランチをPushする方法を教えてください。' },
  { id:96, category:'Git', difficulty:'hard', expected:'needs_human',
    title:'本番デプロイ後にCIが通っていたコードでエラー',
    body:'GitHub ActionsのCIが全て通過してmainにマージしました。本番デプロイ後にエラーが発生しています。テストは全てパスしているのに本番だけエラーです。' },

  // ── Node.js（4問）──────────────────────────────
  { id:97, category:'Node.js', difficulty:'easy', expected:'correct',
    title:'Node.jsでrequireとimportの違い',
    body:'Node.jsプロジェクトでrequireとimportが混在しています。「Cannot use import statement in a module」エラーが出ます。どう統一すればいいですか？' },
  { id:98, category:'Node.js', difficulty:'medium', expected:'partial',
    title:'Node.jsサーバーのメモリ使用量が増え続ける',
    body:'Express.jsサーバーを長時間動かすとメモリ使用量が増え続けます。数時間でOOM Killerに落とされます。メモリリークの調査方法を教えてください。' },
  { id:99, category:'Node.js', difficulty:'hard', expected:'needs_human',
    title:'Node.jsのCPUが本番で突然100%になる',
    body:'本番のNode.jsサーバーのCPU使用率が突然100%になり、リクエストが処理できなくなります。1日に数回発生します。再現性がなく原因不明です。' },
  { id:100, category:'Node.js', difficulty:'medium', expected:'partial',
    title:'Node.jsのfsモジュールでパスが解決できない',
    body:'fs.readFileSync("./data.json")としていますが、実行する場所によってパスが変わってエラーになります。常に正しいパスで読み込む方法はありますか？' },
]

// ============================================================
// Groq API
// ============================================================

async function callGroq(system: string, user: string, attempt = 0): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // 70bはTPM厳しいので8b-instantで閾値テスト
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 10, // スコア数字のみ（節約）
    }),
  })

  // 429 レート制限 → 60秒待機してリトライ（最大2回）
  if (res.status === 429) {
    if (attempt >= 2) return ''
    const wait = 62000 // Groqの1分ウィンドウリセット
    process.stdout.write(`\n  [429: ${wait/1000}秒待機中...] `)
    await new Promise(r => setTimeout(r, wait))
    return callGroq(system, user, attempt + 1)
  }

  if (!res.ok) return ''
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

async function askOnce(q: Q): Promise<{ score: number; answer: string }> {
  // スコアのみ取得（数字1〜3文字を返させる）
  const scorePrompt = `以下のプログラミング質問に対して、あなたが正確に回答できる自信度を0〜100の整数で答えてください。
数字だけを返してください。説明不要。

判断基準:
90〜100: 確実に正しい（公式ドキュメントレベル）
70〜89: ほぼ正しい（環境依存あり）
50〜69: 一般的な回答（個別状況で異なる）
30〜49: 推測が含まれる
0〜29: わからない・情報不足

質問: ${q.title}
詳細: ${q.body.slice(0, 150)}`

  const raw = await callGroq('あなたはプログラミングの専門家AIです。', scorePrompt)

  // 数字を抽出
  const numMatch = raw.match(/\d{1,3}/)
  const score = numMatch ? Math.min(100, Math.max(0, parseInt(numMatch[0]))) : -1
  return { score, answer: raw.slice(0, 100) }
}

// ============================================================
// Notion書き込み
// ============================================================

async function appendBlocks(blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 40) {
    await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ children: blocks.slice(i, i + 40) }),
    })
    await new Promise(r => setTimeout(r, 500))
  }
}

const blk = {
  h2: (t: string) => ({ object:'block', type:'heading_2', heading_2:{ rich_text:[{type:'text',text:{content:t}}] } }),
  h3: (t: string) => ({ object:'block', type:'heading_3', heading_3:{ rich_text:[{type:'text',text:{content:t}}] } }),
  p:  (t: string) => ({ object:'block', type:'paragraph', paragraph:{ rich_text:[{type:'text',text:{content:t}}] } }),
  li: (t: string) => ({ object:'block', type:'bulleted_list_item', bulleted_list_item:{ rich_text:[{type:'text',text:{content:t}}] } }),
  div: ()         => ({ object:'block', type:'divider', divider:{} }),
  code: (t: string) => ({ object:'block', type:'code', code:{ rich_text:[{type:'text',text:{content:t}}], language:'plain text' } }),
}

// ============================================================
// メイン
// ============================================================

async function run() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('ja-JP')
  const timeStr = now.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' })

  console.log(`\n🧪 閾値決定テスト 100問×3回（llama-3.1-8b-instant）　${dateStr} ${timeStr}`)
  console.log('='.repeat(60))

  const RUNS = 3
  const THRESHOLDS = [70, 75, 80, 85, 90]

  // 結果格納
  interface Result {
    q: Q
    scores: number[]
    answers: string[]
    avg: number
    stddev: number
    min: number
    max: number
  }
  const results: Result[] = []

  // 全問3回ずつ実行
  for (const q of QUESTIONS) {
    const scores: number[] = []
    const answers: string[] = []

    process.stdout.write(`[${String(q.id).padStart(3)}] ${q.title.slice(0, 30).padEnd(30)} → `)

    for (let r = 0; r < RUNS; r++) {
      const res = await askOnce(q)
      scores.push(res.score)
      answers.push(res.answer)
      process.stdout.write(`${res.score} `)
      await new Promise(r => setTimeout(r, 2000)) // 8b-instantは30,000 TPM、短い出力なので2秒で安全
    }

    const validScores = scores.filter(s => s >= 0) // -1（パースエラー）を除外
    const effectiveScores = validScores.length > 0 ? validScores : [0]
    const avg = effectiveScores.reduce((a, b) => a + b, 0) / effectiveScores.length
    const variance = effectiveScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / effectiveScores.length
    const stddev = Math.sqrt(variance)
    const min = Math.min(...scores)
    const max = Math.max(...scores)

    console.log(`→ avg:${avg.toFixed(1)} ±${stddev.toFixed(1)} [${min}-${max}]`)
    results.push({ q, scores, answers, avg, min, max, stddev })
  }

  // ============ 分析 ============
  console.log('\n' + '='.repeat(60))
  console.log('閾値別分析：')

  const categories = [...new Set(QUESTIONS.map(q => q.category))]

  // カテゴリ別・閾値別の危険件数
  const analysis: Record<number, {
    aiAnswered: number
    humanRouted: number
    dangerous: number  // needs_humanなのにAI回答
    unstable: number   // stddev > 10
  }> = {}

  for (const th of THRESHOLDS) {
    let aiAnswered = 0, humanRouted = 0, dangerous = 0, unstable = 0
    for (const r of results) {
      if (r.avg >= th) {
        aiAnswered++
        if (r.q.expected === 'needs_human') dangerous++
      } else {
        humanRouted++
      }
      if (r.stddev > 10) unstable++
    }
    analysis[th] = { aiAnswered, humanRouted, dangerous, unstable }
    console.log(`  閾値${th}: AI${aiAnswered}問 人間${humanRouted}問 危険${dangerous}問`)
  }

  // ============ Notion書き込み ============
  console.log('\n📝 Notionに書き込み中...')

  const blocks: any[] = []

  blocks.push(blk.div())
  blocks.push(blk.h2(`🕐 ${dateStr} ${timeStr}　閾値決定テスト（100問×3回）`))
  blocks.push(blk.p('目的：AIスコアのブレを3回平均で吸収し、カテゴリ別の推奨閾値をデータで決定する。'))
  blocks.push(blk.div())

  // 閾値サマリー表（テキスト形式）
  blocks.push(blk.h3('📊 閾値別サマリー'))
  blocks.push(blk.p('閾値 | AI回答 | 人間ルーティング | 危険（嘘）| 判定'))
  for (const th of THRESHOLDS) {
    const a = analysis[th]
    const danger = a.dangerous === 0 ? '✅ 0件' : a.dangerous === 1 ? `🟡 ${a.dangerous}件` : `🔴 ${a.dangerous}件`
    const verdict = a.dangerous === 0 ? '安全' : a.dangerous <= 1 ? '許容範囲' : '危険'
    blocks.push(blk.li(`閾値${th}：AI${a.aiAnswered}問 / 人間${a.humanRouted}問 / 危険${danger} → ${verdict}`))
  }

  blocks.push(blk.div())

  // カテゴリ別結果
  blocks.push(blk.h3('📂 カテゴリ別 平均スコア・ブレ幅'))

  for (const cat of categories) {
    const catResults = results.filter(r => r.q.category === cat)
    const catAvg = catResults.reduce((a, r) => a + r.avg, 0) / catResults.length
    const catMaxStd = Math.max(...catResults.map(r => r.stddev))
    const dangerousInCat = catResults.filter(r => r.q.expected === 'needs_human' && r.avg >= 80).length

    blocks.push(blk.li(
      `【${cat}】平均スコア：${catAvg.toFixed(1)} / 最大ブレ：±${catMaxStd.toFixed(1)}` +
      (dangerousInCat > 0 ? ` / ⚠️ 危険${dangerousInCat}件（閾値80時）` : '')
    ))
  }

  blocks.push(blk.div())

  // 全質問の結果一覧
  blocks.push(blk.h3('📋 全100問の結果一覧'))
  blocks.push(blk.p('ID | カテゴリ | 難易度 | 期待値 | スコア1 | スコア2 | スコア3 | 平均 | ブレ | 判定'))

  for (const r of results) {
    const diff = r.q.difficulty === 'easy' ? '易' : r.q.difficulty === 'medium' ? '中' : '難'
    const isDangerous85 = r.q.expected === 'needs_human' && r.avg >= 85
    const isDangerous80 = r.q.expected === 'needs_human' && r.avg >= 80
    const flag = isDangerous85 ? '🔴' : isDangerous80 ? '🟡' : r.stddev > 10 ? '⚠️' : '🟢'

    blocks.push(blk.li(
      `Q${r.q.id} [${r.q.category}/${diff}/${r.q.expected}] ` +
      `${r.scores.join('/')} → 平均${r.avg.toFixed(1)} ±${r.stddev.toFixed(1)} ${flag}` +
      ` 「${r.q.title}」`
    ))
  }

  blocks.push(blk.div())

  // 推奨閾値の決定
  const recommended = THRESHOLDS.find(th => analysis[th].dangerous === 0) ?? 85
  blocks.push(blk.h3('✅ 推奨閾値の決定'))
  blocks.push(blk.p(`推奨デフォルト閾値：${recommended}`))
  blocks.push(blk.p('カテゴリ別推奨閾値（ブレ幅とdangerous件数から算出）：'))

  for (const cat of categories) {
    const catResults = results.filter(r => r.q.category === cat)
    const needsHumanAvgs = catResults
      .filter(r => r.q.expected === 'needs_human')
      .map(r => r.avg)
    const maxDangerousAvg = needsHumanAvgs.length > 0 ? Math.max(...needsHumanAvgs) : 0
    const suggestedThreshold = maxDangerousAvg > 0
      ? Math.min(95, Math.ceil(maxDangerousAvg / 5) * 5 + 5)
      : recommended
    blocks.push(blk.li(`${cat}：推奨閾値 ${suggestedThreshold}（needs_humanの最高avg：${maxDangerousAvg.toFixed(1)}）`))
  }

  blocks.push(blk.div())
  blocks.push(blk.p(`テスト実施：${dateStr} ${timeStr} / モデル：llama-3.3-70b-versatile / 100問×3回=${RUNS*QUESTIONS.length}回API呼び出し`))

  await appendBlocks(blocks)
  console.log('✅ Notion書き込み完了！')
  console.log('\n🎉 テスト完了\n')
}

run().catch(console.error)

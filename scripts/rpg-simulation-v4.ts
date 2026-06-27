/**
 * テスト④ AIユーザーRPG - 12ペルソナ × 100問
 * 12人が質問者と回答者に入り乱れてフルフローを検証
 * 実行: npx tsx scripts/rpg-simulation-v4.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const NOTION_PAGE_ID = '38bf5fa8-bcb9-80e6-85d7-dd26c7b40883' // ④ AIユーザーRPG

// テスト③結果（2026/06/27）で確定した閾値
const AI_THRESHOLD = 87

// ============================================================
// キャラクター定義
// ============================================================

type TimeLimit = 1 | 6 | 24

interface Persona {
  id: string
  name: string
  class: string
  personality: string
  strengths: string[]
  weaknesses: string[]
  preferredTimeLimit: TimeLimit
  reputation: number
  solvedCount: number
  passCount: number
  timeoutCount: number
  notifyCount: number
  isResting: boolean     // true の間は通知を受けない
  joinAfterQ: number     // この問番以降に参加（途中参加ペルソナ）
}

const PERSONAS: Persona[] = [
  {
    id: 'takeshi', name: 'Takeshi', class: '古参魔法使い',
    personality: '「昔はな…」が口癖。C言語とLinuxなら何でも知っているが最新JSを毛嫌い。',
    strengths: ['C言語', 'Linux', '低レイヤー', 'システムプログラミング', 'Unix'],
    weaknesses: ['React', 'Vue', 'TypeScript', '最新JavaScript', 'モバイル'],
    preferredTimeLimit: 24,
    reputation: 40, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'yuki', name: 'Yuki', class: 'フロント妖精',
    personality: 'テンション高め✨絵文字多用。Reactが大好き。DBやサーバーの話になると急に静かになる。',
    strengths: ['React', 'CSS', 'TypeScript', 'フロントエンド', 'UI', 'Next.js'],
    weaknesses: ['データベース', 'SQL', 'インフラ', 'バックエンド', 'セキュリティ'],
    preferredTimeLimit: 6,
    reputation: 35, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'ryo', name: 'Ryo', class: 'DB番人',
    personality: '無口で答えは短い。でも正確。SQLとPostgreSQLなら神レベル。',
    strengths: ['SQL', 'PostgreSQL', 'データベース', 'クエリ最適化', 'インデックス'],
    weaknesses: ['React', 'CSS', 'フロントエンド', 'モバイル', 'デザイン'],
    preferredTimeLimit: 24,
    reputation: 38, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'mia', name: 'Mia', class: 'クラウド騎士',
    personality: '英語が混じる。コスト意識強め。「それAWS Lambdaで解決できるよ」が口癖。',
    strengths: ['AWS', 'Docker', 'インフラ', 'DevOps', 'CI/CD', 'クラウド'],
    weaknesses: ['細かいコーディング', 'アルゴリズム', 'CSS', 'デザイン'],
    preferredTimeLimit: 6,
    reputation: 36, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'shin', name: 'Shin', class: '見習い修行者',
    personality: '自信がなく「たぶん…」「違ったらすみません」が多い。基礎は分かるが応用で不安になる。',
    strengths: ['Python基礎', '基本文法', '初歩的なアルゴリズム'],
    weaknesses: ['応用全般', 'フレームワーク', 'インフラ', 'DB設計', '最新技術'],
    preferredTimeLimit: 24,
    reputation: 5, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'hana', name: 'Hana', class: 'セキュリティ巫女',
    personality: '慎重でリスク視点が強い。「それ、セキュリティ的に危ないですよ」と必ず一言添える。',
    strengths: ['セキュリティ', '認証', 'JWT', 'OAuth', 'XSS', 'SQLインジェクション'],
    weaknesses: ['モバイル', 'CSS', 'フロントエンド', '機械学習', 'データ分析'],
    preferredTimeLimit: 6,
    reputation: 30, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'ken', name: 'Ken', class: 'モバイル侍',
    personality: '職人気質。モバイル開発なら一切妥協しない。Webは「ネイティブに劣る」と思っている。',
    strengths: ['iOS', 'Swift', 'ReactNative', 'モバイル', 'Xcode'],
    weaknesses: ['バックエンド', 'データベース', 'インフラ', 'クラウド', 'Webフロントエンド'],
    preferredTimeLimit: 6,
    reputation: 25, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'aoi', name: 'Aoi', class: 'AI錬金術師',
    personality: '論文読むのが好き。PythonとMLの話になると止まらない。実装よりも理論派。',
    strengths: ['Python', 'ML', 'LLM', '機械学習', 'データ分析', 'PyTorch'],
    weaknesses: ['フロントエンド', 'インフラ', 'モバイル', 'DB設計', 'CSS'],
    preferredTimeLimit: 24,
    reputation: 28, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'taro', name: 'Taro', class: '何でも屋（浅め）',
    personality: '広く浅く。Qiita記事を3本読んだらエキスパートだと思っている。返信は速い。',
    strengths: ['何でも少し', 'ソフトスキル', '情報収集', 'ドキュメント'],
    weaknesses: ['深い実装', '本番インシデント', 'パフォーマンスチューニング', 'セキュリティ'],
    preferredTimeLimit: 1,
    reputation: 8, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'noa', name: 'Noa', class: 'タイムトラベラー',
    personality: 'PHP4時代の知識が豊富。jQuery使いこなせる。「jQueryで解決できるでしょ」が口癖。',
    strengths: ['PHP', 'jQuery', '古いJavaScript', 'WordPress', 'MySQL（古い）'],
    weaknesses: ['TypeScript', 'モダンReact', 'Docker', 'クラウド', 'CI/CD'],
    preferredTimeLimit: 24,
    reputation: 12, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 0,
  },
  {
    id: 'john', name: 'John', class: '野心家ハッカー（途中参加）',
    personality: '自信過剰。「余裕っしょ」が口癖。得意分野は広いと自称するが深さは怪しい。',
    strengths: ['ハッキング（自称）', '全分野（自称）', 'Git'],
    weaknesses: ['深い専門知識', 'セキュリティ本番対応', '低レイヤー'],
    preferredTimeLimit: 1,
    reputation: 3, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 20, // Q20以降に参加
  },
  {
    id: 'anthony', name: 'Anthony', class: 'ソーシャルエンジニア（途中参加）',
    personality: 'コミュ力お化け。技術より人間関係の調整が得意。「それ、誰かに聞いてみた？」が口癖。',
    strengths: ['コミュニケーション', '説明力', 'ドキュメント', 'チームワーク'],
    weaknesses: ['深い技術実装', 'インフラ', 'セキュリティ', 'コーディング'],
    preferredTimeLimit: 6,
    reputation: 10, solvedCount: 0, passCount: 0, timeoutCount: 0, notifyCount: 0,
    isResting: false, joinAfterQ: 35, // Q35以降に参加
  },
]

// ============================================================
// 100問（テスト③と同じ）
// ============================================================

interface Q {
  id: number
  category: string
  title: string
  body: string
  difficulty: 'easy' | 'medium' | 'hard'
  expected: 'correct' | 'partial' | 'needs_human'
}

const QUESTIONS: Q[] = [
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
  { id:16, category:'TypeScript', difficulty:'easy', expected:'correct',
    title:'TypeScriptでType is not assignableエラー',
    body:'TypeScriptで型エラー「Type string is not assignable to type number」が出ます。変数をstringで定義してnumberを代入しようとしました。どう直せばいいですか？' },
  { id:17, category:'TypeScript', difficulty:'easy', expected:'correct',
    title:'TypeScriptでObject is possibly undefinedエラー',
    body:'TypeScriptで「Object is possibly undefined」エラーが大量に出ます。Optional Chainingの使い方を教えてください。' },
  { id:18, category:'TypeScript', difficulty:'medium', expected:'partial',
    title:'TypeScriptのジェネリクスでConstraintエラー',
    body:'TypeScriptでジェネリクス関数を書いています。「Type T does not satisfy the constraint」エラーが出ます。extendsの使い方がわかりません。' },
  { id:19, category:'TypeScript', difficulty:'easy', expected:'correct',
    title:'TypeScriptでas constとreadonlyの違い',
    body:'TypeScriptでas constとreadonlyはどう違いますか？どちらを使うべきか判断基準を教えてください。' },
  { id:20, category:'TypeScript', difficulty:'medium', expected:'partial',
    title:'TypeScript 5.xのdecoratorsが動かない',
    body:'TypeScript 5.xでデコレーターを使おうとしています。「Decorators are not valid here」エラーが出ます。tsconfig.jsonの設定が必要ですか？' },
  { id:21, category:'TypeScript', difficulty:'hard', expected:'needs_human',
    title:'TypeScriptのビルドが本番だけ型エラーで失敗する',
    body:'ローカルではtsc --noEmitが通るのに、GitHub ActionsのCI環境でだけ型エラーになります。Node.jsのバージョンは合わせています。' },
  { id:22, category:'TypeScript', difficulty:'easy', expected:'correct',
    title:'TypeScriptでenumの値を文字列として使いたい',
    body:'TypeScriptのenumをAPIレスポンスの文字列と比較したいです。enumの値を文字列として取得する方法を教えてください。' },
  { id:23, category:'TypeScript', difficulty:'medium', expected:'partial',
    title:'TypeScriptのpath aliasがJestだけで解決できない',
    body:'tsconfig.jsonでpathsを設定してimport aliasを使っています。Jestでテストを実行するとModule not foundエラーになります。' },
  { id:24, category:'SQL', difficulty:'easy', expected:'correct',
    title:'SQLのJOINとLEFT JOINの違いがわからない',
    body:'SQLでJOINとLEFT JOINの使い分けがわかりません。どちらを使うべきか、具体例で教えてください。' },
  { id:25, category:'SQL', difficulty:'easy', expected:'correct',
    title:'PostgreSQLでNULLの比較がおかしい',
    body:'PostgreSQLでWHERE column = NULLとしてもレコードが取得できません。NULLの比較方法を教えてください。' },
  { id:26, category:'SQL', difficulty:'medium', expected:'partial',
    title:'PostgreSQLで100万件のSELECTが10秒かかる',
    body:'PostgreSQLのテーブルに100万件のレコードがあります。WHERE email = $1のクエリが10秒かかります。インデックスは設定済みです。' },
  { id:27, category:'SQL', difficulty:'medium', expected:'partial',
    title:'N+1問題をSQLで解消したい',
    body:'ORMを使っているとN+1問題が発生します。JOINを使って1クエリで解消する方法と、ORMでの対処法を教えてください。' },
  { id:28, category:'SQL', difficulty:'hard', expected:'needs_human',
    title:'PostgreSQLのトランザクションでデッドロックが発生する',
    body:'本番のPostgreSQLで1日に数回デッドロックエラーが発生します。同時更新が多いテーブルです。どのように調査・対処すればいいですか？' },
  { id:29, category:'SQL', difficulty:'hard', expected:'needs_human',
    title:'本番DBのSELECTが突然遅くなった',
    body:'昨日まで100ms以下だったクエリが、突然5秒以上かかるようになりました。データ量は変わっていません。インデックスは存在します。' },
  { id:30, category:'SQL', difficulty:'easy', expected:'correct',
    title:'SQLでGROUP BYとHAVINGの使い方',
    body:'SQLでGROUP BYとHAVINGの違いがわかりません。集計関数（COUNT, SUM）と組み合わせた使い方を教えてください。' },
  { id:31, category:'SQL', difficulty:'medium', expected:'partial',
    title:'PostgreSQLのJSONBカラムへのインデックス',
    body:'PostgreSQLのJSONBカラムに対してインデックスを張りたいです。GINインデックスとBTreeインデックスの使い分けを教えてください。' },
  { id:32, category:'SQL', difficulty:'hard', expected:'needs_human',
    title:'マスターデータ移行後に外部キー制約エラーが大量発生',
    body:'本番DBのマスターデータを移行したところ、外部キー制約エラーが数万件発生しました。アプリケーションが動かなくなっています。' },
  { id:33, category:'SQL', difficulty:'medium', expected:'partial',
    title:'PostgreSQLでUPSERTを使いたい',
    body:'PostgreSQLでINSERT OR UPDATE（UPSERT）を実装したいです。ON CONFLICT句の使い方を教えてください。' },
  { id:34, category:'Docker', difficulty:'easy', expected:'correct',
    title:'M1 MacでDockerがarm64エラーになる',
    body:'M1 MacでDockerコンテナを起動するとplatformエラーが出ます。arm64/amd64の問題だと思いますが、どう対処すればいいですか？' },
  { id:35, category:'Docker', difficulty:'easy', expected:'correct',
    title:'Dockerコンテナ間で通信できない',
    body:'Docker Composeで2つのサービスを立ち上げています。serviceAからserviceBのポートに接続できません。ネットワーク設定はどうすればいいですか？' },
  { id:36, category:'Docker', difficulty:'medium', expected:'partial',
    title:'Dockerのビルドが毎回キャッシュされない',
    body:'Dockerfileのビルドでnpm installのステップが毎回フルで実行されます。package.jsonは変更していないのにキャッシュが効きません。' },
  { id:37, category:'Docker', difficulty:'medium', expected:'partial',
    title:'DockerコンテナのNode.jsがメモリ不足でクラッシュ',
    body:'DockerコンテナでNode.jsアプリを動かしていますが、メモリ制限に引っかかって落ちます。NODE_OPTIONS=--max-old-space-sizeの設定方法を教えてください。' },
  { id:38, category:'Docker', difficulty:'hard', expected:'needs_human',
    title:'本番KubernetesでPodが断続的にRestartする',
    body:'本番のKubernetesクラスタでPodが1時間に1回程度Restart(CrashLoopBackOff)します。ログには特定のエラーはありません。どこを調べればいいですか？' },
  { id:39, category:'Docker', difficulty:'easy', expected:'correct',
    title:'DockerfileのCMDとENTRYPOINTの違い',
    body:'DockerfileのCMDとENTRYPOINTの違いを教えてください。どちらをいつ使うべきですか？' },
  { id:40, category:'Docker', difficulty:'medium', expected:'partial',
    title:'Docker Composeのvolumesでファイルが同期しない',
    body:'Docker Composeでローカルのソースコードをコンテナにマウントしていますorローカルでファイルを更新してもコンテナに反映されません。' },
  { id:41, category:'Docker', difficulty:'hard', expected:'needs_human',
    title:'DockerイメージのCIビルドが本番で動かない',
    body:'GitHub Actionsでビルドしたイメージをpullして本番サーバーで動かすと、ローカルとCIでは動くのに本番だけエラーになります。' },
  { id:42, category:'Docker', difficulty:'medium', expected:'partial',
    title:'マルチステージビルドで最終イメージが大きい',
    body:'Dockerfileでマルチステージビルドを使っているのに、最終イメージが1GB以上になります。Node.jsアプリです。サイズを小さくするコツを教えてください。' },
  { id:43, category:'Docker', difficulty:'easy', expected:'correct',
    title:'Dockerで環境変数を.envファイルから読み込みたい',
    body:'Docker Composeで.envファイルの環境変数をコンテナに渡す方法を教えてください。env_fileとenvironmentの使い分けも知りたいです。' },
  { id:44, category:'AWS', difficulty:'easy', expected:'correct',
    title:'AWS S3のバケットポリシーでアクセス拒否される',
    body:'AWS S3のバケットに外部からアクセスしようとすると403エラーが返ります。バケットポリシーの設定方法を教えてください。' },
  { id:45, category:'AWS', difficulty:'medium', expected:'partial',
    title:'Lambda関数のコールドスタートを改善したい',
    body:'AWS LambdaのNode.js関数のコールドスタート時間が3秒以上あります。改善方法を教えてください。Provisioned Concurrencyは使いたくないです。' },
  { id:46, category:'AWS', difficulty:'medium', expected:'partial',
    title:'API GatewayとLambdaでCORSエラーが出る',
    body:'API GatewayとLambdaで構築したAPIをブラウザから叩くとCORSエラーが出ます。API GatewayのCORS設定とLambdaのレスポンスヘッダーの両方に設定が必要ですか？' },
  { id:47, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'Lambda関数が本番だけタイムアウトする',
    body:'テスト環境では2秒で完了するLambda関数が、本番だけタイムアウト（15分）します。VPC内にあり、RDSに接続しています。' },
  { id:48, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'RDSへのLambda接続でToo many connectionsエラー',
    body:'LambdaからRDS Postgresに接続するとToo many connectionsエラーが出ます。Lambda関数は1000並列以上動く可能性があります。RDS Proxyを使うべきですか？' },
  { id:49, category:'AWS', difficulty:'medium', expected:'partial',
    title:'CloudFrontのキャッシュが即座に反映されない',
    body:'S3に新しいファイルをアップロードしたのに、CloudFront経由でアクセスすると古いファイルが返ってきます。キャッシュを即座にクリアする方法を教えてください。' },
  { id:50, category:'AWS', difficulty:'easy', expected:'correct',
    title:'IAMロールとIAMユーザーの違い',
    body:'AWSのIAMロールとIAMユーザーの違いを教えてください。EC2やLambdaにはどちらを使うべきですか？' },
  { id:51, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'ECSタスクが断続的にExitCode137で終了する',
    body:'AWS ECSでコンテナが断続的にExitCode137で終了します。OOM Killerだと思いますが、タスク定義のメモリ制限は十分あるはずです。' },
  { id:52, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'SQSのメッセージが重複処理される',
    body:'AWS SQSでメッセージを処理するLambdaがあります。1つのメッセージが2回処理されることがあります。冪等性をどう担保すればいいですか？' },
  { id:53, category:'AWS', difficulty:'hard', expected:'needs_human',
    title:'本番でAWS Cognitoのトークンが突然無効になった',
    body:'本番環境で突然全ユーザーのCognitoトークンが無効になりました。ユーザープールの設定は変更していません。原因の調査方法を教えてください。' },
  { id:54, category:'Supabase', difficulty:'easy', expected:'correct',
    title:'SupabaseのRLSポリシーの基本的な書き方',
    body:'SupabaseでRow Level Security（RLS）を設定したいです。ログインユーザーが自分のデータだけ取得できるポリシーの書き方を教えてください。' },
  { id:55, category:'Supabase', difficulty:'medium', expected:'partial',
    title:'SupabaseのRLSでINSERTだけ403になる',
    body:'SupabaseのSELECTは成功するのに、INSERTだけ403エラーになります。RLSポリシーはSELECTとINSERT両方設定しました。' },
  { id:56, category:'Supabase', difficulty:'easy', expected:'correct',
    title:'Supabaseのリアルタイム機能の使い方',
    body:'SupabaseのリアルタイムサブスクリプションをReactで使いたいです。テーブルの変更をリアルタイムに受け取る方法を教えてください。' },
  { id:57, category:'Supabase', difficulty:'medium', expected:'partial',
    title:'Supabaseの認証でメール確認をスキップしたい',
    body:'Supabaseの認証でユーザーが登録後すぐにログインできるようにしたいです。メール確認（email verification）をスキップする方法を教えてください。' },
  { id:58, category:'Supabase', difficulty:'medium', expected:'partial',
    title:'SupabaseのJWTトークンが期限切れで401になる',
    body:'SupabaseクライアントでAPIを叩くと定期的に401エラーが出ます。JWTの有効期限が切れているようです。自動リフレッシュの設定方法を教えてください。' },
  { id:59, category:'Supabase', difficulty:'hard', expected:'needs_human',
    title:'Supabaseのストレージで本番のファイルが消えた',
    body:'Supabaseのストレージバケットのファイルが本番環境で突然消えました。バケットポリシーは変更していません。ログの調査方法を教えてください。' },
  { id:60, category:'Supabase', difficulty:'hard', expected:'needs_human',
    title:'SupabaseのRLSパフォーマンスが著しく低下',
    body:'RLSを有効にした後からクエリの速度が10倍遅くなりました。100万件のテーブルです。インデックスは設定済みです。' },
  { id:61, category:'Supabase', difficulty:'hard', expected:'needs_human',
    title:'Supabaseのマイグレーションが本番で失敗',
    body:'ローカルとステージングでは成功するSupabaseのマイグレーションが、本番だけ失敗します。エラーは外部キー制約違反です。' },
  { id:62, category:'Supabase', difficulty:'medium', expected:'partial',
    title:'SupabaseでGoogleログインを実装したい',
    body:'SupabaseでGoogle OAuthを使ったソーシャルログインを実装したいです。設定手順とNext.jsでの実装方法を教えてください。' },
  { id:63, category:'CSS', difficulty:'easy', expected:'correct',
    title:'CSSのFlexboxで要素を中央揃えしたい',
    body:'Flexboxで子要素を縦横中央に配置したいです。justify-contentとalign-itemsの使い方を教えてください。' },
  { id:64, category:'CSS', difficulty:'easy', expected:'correct',
    title:'CSSのz-indexが効かない',
    body:'CSSでz-indexを設定しても要素が期待通りに重ならない問題があります。z-indexが効くための条件を教えてください。' },
  { id:65, category:'CSS', difficulty:'medium', expected:'partial',
    title:'Tailwind CSSのクラスが動的に適用されない',
    body:'Tailwind CSSでJavaScriptの変数を使ってクラス名を動的に生成していますが、スタイルが適用されません。' },
  { id:66, category:'CSS', difficulty:'easy', expected:'correct',
    title:'CSSのGrid Layoutで均等な列を作りたい',
    body:'CSS Gridで均等な3列レイアウトを作りたいです。repeat()とfr単位の使い方を教えてください。' },
  { id:67, category:'CSS', difficulty:'medium', expected:'partial',
    title:'レスポンシブデザインでモバイルだけ崩れる',
    body:'デスクトップでは正常に見えるレイアウトが、スマートフォンで崩れます。特定の端末だけで発生します。デバッグ方法を教えてください。' },
  { id:68, category:'CSS', difficulty:'medium', expected:'partial',
    title:'CSSアニメーションがiOSで動かない',
    body:'CSS transitionとkeyframesアニメーションがiOS Safariでだけ動きません。他のブラウザでは正常です。' },
  { id:69, category:'CSS', difficulty:'medium', expected:'partial',
    title:'Next.jsでCSSモジュールとTailwindが競合する',
    body:'Next.jsでCSS ModulesとTailwind CSSを混在させています。クラス名の優先度が意図しない結果になります。' },
  { id:70, category:'CSS', difficulty:'hard', expected:'needs_human',
    title:'本番のCSS Criticalパスで白画面が発生',
    body:'本番環境でFCPが遅く、ユーザーが白画面を見る時間が長いです。Critical CSSのインライン化を試みましたが改善しません。' },
  { id:71, category:'CSS', difficulty:'medium', expected:'partial',
    title:'CSSのカスタムプロパティ（CSS変数）の使い方',
    body:'CSSのカスタムプロパティ（--my-color: #ff0000など）の使い方を教えてください。JavaScriptから変更することもできますか？' },
  { id:72, category:'Python', difficulty:'easy', expected:'correct',
    title:'PythonのリストとタプルとSetの違い',
    body:'Pythonのlist、tuple、setの違いを教えてください。それぞれいつ使うべきですか？' },
  { id:73, category:'Python', difficulty:'easy', expected:'correct',
    title:'Pythonで非同期処理をしたい',
    body:'Pythonでasync/awaitを使った非同期処理の基本的な書き方を教えてください。asyncioとは何ですか？' },
  { id:74, category:'Python', difficulty:'medium', expected:'partial',
    title:'PythonのVirtual Environmentが毎回リセットされる',
    body:'Python venvで環境を作って pip installしましたが、ターミナルを再起動するとパッケージが見つかりません。' },
  { id:75, category:'Python', difficulty:'easy', expected:'correct',
    title:'Pythonで日付の計算をしたい',
    body:'Pythonで日付の差分を計算したいです。datetimeモジュールを使って「今日から30日後」などを求める方法を教えてください。' },
  { id:76, category:'Python', difficulty:'medium', expected:'partial',
    title:'PythonのOpenAI APIでRate Limitエラーが出る',
    body:'PythonでOpenAI APIを呼び出すとRate LimitエラーとContext Length Exceededエラーが出ます。リトライ処理の実装方法を教えてください。' },
  { id:77, category:'Python', difficulty:'hard', expected:'needs_human',
    title:'本番PythonサーバーのCPUが突然100%になる',
    body:'本番のFastAPIサーバーのCPUが突然100%になり、リクエストが詰まります。再現性はなく、数時間に1回発生します。プロファイリング方法を教えてください。' },
  { id:78, category:'Python', difficulty:'medium', expected:'partial',
    title:'PythonのPandasでメモリ不足になる',
    body:'Pandasで1GBのCSVファイルを読み込もうとするとメモリエラーになります。大きなファイルを効率的に処理する方法を教えてください。' },
  { id:79, category:'Python', difficulty:'hard', expected:'needs_human',
    title:'機械学習モデルの精度が本番で急に落ちた',
    body:'本番で使っている機械学習モデルの予測精度が先週から急に落ちています。訓練データとの乖離（data drift）の検知方法を教えてください。' },
  { id:80, category:'セキュリティ', difficulty:'easy', expected:'correct',
    title:'SQLインジェクションの基本的な対策',
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
// ユーティリティ
// ============================================================

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// スキルマッチングスコア（ペルソナ × カテゴリ）
function calcMatchScore(persona: Persona, category: string): number {
  const cat = category.toLowerCase()
  let score = 0
  for (const s of persona.strengths) {
    const sl = s.toLowerCase()
    if (cat.includes(sl) || sl.includes(cat) ||
        (cat === 'react' && (sl.includes('react') || sl.includes('frontend') || sl.includes('フロント'))) ||
        (cat === 'next.js' && (sl.includes('next') || sl.includes('react') || sl.includes('フロント'))) ||
        (cat === 'sql' && (sl.includes('sql') || sl.includes('db') || sl.includes('データベース'))) ||
        (cat === 'docker' && (sl.includes('docker') || sl.includes('インフラ') || sl.includes('devops'))) ||
        (cat === 'aws' && (sl.includes('aws') || sl.includes('クラウド') || sl.includes('インフラ'))) ||
        (cat === 'supabase' && (sl.includes('supabase') || sl.includes('認証') || sl.includes('セキュリティ'))) ||
        (cat === 'css' && (sl.includes('css') || sl.includes('デザイン') || sl.includes('ui') || sl.includes('フロント'))) ||
        (cat === 'python' && (sl.includes('python') || sl.includes('ml') || sl.includes('ai'))) ||
        (cat === 'セキュリティ' && (sl.includes('セキュリティ') || sl.includes('認証') || sl.includes('jwt') || sl.includes('oauth'))) ||
        (cat === 'git' && (sl.includes('git') || sl.includes('ci') || sl.includes('devops') || sl.includes('ci/cd'))) ||
        (cat === 'typescript' && (sl.includes('typescript') || sl.includes('react') || sl.includes('フロント'))) ||
        (cat === 'node.js' && (sl.includes('node') || sl.includes('バックエンド') || sl.includes('javascript')))
    ) {
      score += 20
    }
  }
  return score + persona.reputation * 0.1
}

// タイムアウト確率（時間制限別）
function didTimeout(timeLimit: TimeLimit): boolean {
  const rate = { 1: 0.55, 6: 0.20, 24: 0.05 }
  return Math.random() < rate[timeLimit]
}

// ギブアップ確率（スキルマッチが低いほど高い）
function didGiveUp(matchScore: number): boolean {
  if (matchScore >= 30) return Math.random() < 0.1
  if (matchScore >= 10) return Math.random() < 0.3
  return Math.random() < 0.6  // スキルなし → 6割ギブアップ
}

// Groq API呼び出し（429リトライ付き）
async function callGroq(system: string, user: string, attempt = 0): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 500,
    }),
  })

  if (res.status === 429) {
    if (attempt >= 2) return ''
    await sleep(62000) // Groqの1分ウィンドウリセット
    return callGroq(system, user, attempt + 1)
  }

  if (!res.ok) return ''
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

// AI回答判定
async function aiJudge(q: Q): Promise<{ score: number; answer: string }> {
  const raw = await callGroq(
    'あなたはプログラミング専門家AIです。正直に回答してください。',
    `以下のプログラミング質問に回答し、自信度スコア（0〜100）を付けてください。
確信がない場合は低いスコアをつけること。JSON形式のみで返してください：{"score": 85, "answer": "回答"}

【質問】${q.title}
【詳細】${q.body}`
  )

  try {
    const match = raw.match(/\{[\s\S]*?\}/)
    if (match) {
      const p = JSON.parse(match[0])
      return {
        score: Math.min(100, Math.max(0, Number(p.score) || 0)),
        answer: String(p.answer ?? ''),
      }
    }
  } catch {}
  return { score: 0, answer: '' }
}

// 次の回答者を選ぶ（スキルマッチング）
function selectResponder(
  personas: Persona[],
  excludeIds: string[],
  category: string,
  questionIndex: number
): Persona | null {
  const NOTIFY_CAP = 5

  const candidates = personas
    .filter(p =>
      p.joinAfterQ <= questionIndex &&
      !excludeIds.includes(p.id) &&
      !p.isResting &&
      p.notifyCount < NOTIFY_CAP
    )
    .map(p => ({ persona: p, score: calcMatchScore(p, category) }))
    .sort((a, b) => b.score - a.score)

  if (candidates.length === 0) return null

  // スキルが最高の人を70%、2番目を20%、その他10%で選ぶ
  const top = candidates.slice(0, Math.min(3, candidates.length))
  const roll = Math.random()
  if (roll < 0.70 || top.length === 1) return top[0].persona
  if (roll < 0.90 || top.length === 2) return top[1]?.persona ?? top[0].persona
  return top[2]?.persona ?? top[0].persona
}

// ============================================================
// Notion書き込み
// ============================================================

async function appendBlocks(blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 40) {
    const chunk = blocks.slice(i, i + 40)
    await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ children: chunk }),
    })
    if (blocks.length > 40) await sleep(300)
  }
}

function text(content: string) {
  return { type: 'paragraph' as const, paragraph: { rich_text: [{ type: 'text', text: { content } }] } }
}
function heading(content: string, level: 2 | 3 = 2) {
  const key = `heading_${level}` as 'heading_2' | 'heading_3'
  return { type: key, [key]: { rich_text: [{ type: 'text', text: { content } }] } }
}
function divider() { return { type: 'divider' as const, divider: {} } }
function codeBlock(content: string) {
  return { type: 'code' as const, code: { rich_text: [{ type: 'text', text: { content } }], language: 'plain text' } }
}

// ============================================================
// メインシミュレーション
// ============================================================

interface QResult {
  id: number
  title: string
  category: string
  difficulty: string
  questioner: string
  aiScore: number
  resolution: 'ai_solved' | 'B_solved' | 'C_solved' | 'high_quest'
  responderB: string | null
  responderC: string | null
  timeLimit: TimeLimit
  narrative: string
}

async function runSimulation() {
  const personas = PERSONAS.map(p => ({ ...p }))
  const results: QResult[] = []

  const runDate = new Date().toLocaleString('ja-JP')
  console.log(`\n🎮 テスト④ AIユーザーRPG  ${runDate}`)
  console.log('='.repeat(60))
  console.log(`AI閾値: ${AI_THRESHOLD}  ペルソナ: ${personas.length}人  問題: ${QUESTIONS.length}問`)
  console.log('='.repeat(60))

  // ランダムに質問者を割り当て
  const questionerAssign: Persona[] = []
  let pIdx = 0
  for (let i = 0; i < QUESTIONS.length; i++) {
    // 参加条件を満たすペルソナから選ぶ
    const available = personas.filter(p => p.joinAfterQ <= i)
    questionerAssign.push(available[pIdx % available.length])
    pIdx++
  }

  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const q = QUESTIONS[qi]
    const questioner = questionerAssign[qi]
    const timeLimit = questioner.preferredTimeLimit
    const triedIds = [questioner.id]

    let line = `[${String(q.id).padStart(3)}] ${q.title.substring(0, 35).padEnd(35)} [${questioner.name}]`
    process.stdout.write(line + ' → ')

    // ─── ① AI判定 ───
    const ai = await aiJudge(q)
    await sleep(1500)

    let resolution: QResult['resolution']
    let responderB: string | null = null
    let responderC: string | null = null
    let narrative = ''

    if (ai.score >= AI_THRESHOLD) {
      resolution = 'ai_solved'
      process.stdout.write(`AI✅(${ai.score}) `)
      narrative = `${questioner.name}が質問。AIがスコア${ai.score}で回答し解決。`
    } else {
      process.stdout.write(`AI❌(${ai.score}) `)
      narrative = `${questioner.name}が質問。AIスコア${ai.score}で閾値未満。人間へルーティング。`

      // ─── ② 人間B ───
      const personaB = selectResponder(personas, triedIds, q.category, qi)

      if (!personaB) {
        resolution = 'high_quest'
        process.stdout.write(`→ 高難度クエスト（候補なし）`)
        narrative += ` 対応できるメンバーがいないため高難度クエストへ。`
      } else {
        personaB.notifyCount++
        triedIds.push(personaB.id)
        responderB = personaB.name
        const matchB = calcMatchScore(personaB, q.category)

        const bTimeout = didTimeout(timeLimit)
        const bGiveup = !bTimeout && didGiveUp(matchB)

        if (!bTimeout && !bGiveup) {
          resolution = 'B_solved'
          personaB.solvedCount++
          personaB.reputation += 5
          process.stdout.write(`B:${personaB.name}✅ `)
          narrative += ` ${personaB.name}（${personaB.class}）がマッチング。スキルスコア${matchB.toFixed(0)}で時間内に回答し解決。`
        } else {
          const reason = bTimeout ? 'タイムアウト' : 'ギブアップ'
          personaB.passCount++
          process.stdout.write(`B:${personaB.name}❌(${reason}) `)
          narrative += ` ${personaB.name}が${reason}。Cへ。`

          // ─── ③ 人間C ───
          const personaC = selectResponder(personas, triedIds, q.category, qi)

          if (!personaC) {
            resolution = 'high_quest'
            process.stdout.write(`→ 高難度クエスト`)
            narrative += ` Cの候補なし → 高難度クエストへ。`
          } else {
            personaC.notifyCount++
            triedIds.push(personaC.id)
            responderC = personaC.name
            const matchC = calcMatchScore(personaC, q.category)

            const cTimeout = didTimeout(timeLimit)
            const cGiveup = !cTimeout && didGiveUp(matchC)

            if (!cTimeout && !cGiveup) {
              resolution = 'C_solved'
              personaC.solvedCount++
              personaC.reputation += 3
              process.stdout.write(`C:${personaC.name}✅ `)
              narrative += ` ${personaC.name}（スキルスコア${matchC.toFixed(0)}）が回答し解決。`
            } else {
              const reason2 = cTimeout ? 'タイムアウト' : 'ギブアップ'
              personaC.passCount++
              resolution = 'high_quest'
              process.stdout.write(`C:${personaC.name}❌(${reason2}) → 高難度クエスト`)
              narrative += ` ${personaC.name}も${reason2} → 高難度クエストへ昇格。`
            }
          }
        }
      }
    }

    console.log()

    results.push({
      id: q.id,
      title: q.title,
      category: q.category,
      difficulty: q.difficulty,
      questioner: questioner.name,
      aiScore: ai.score,
      resolution,
      responderB,
      responderC,
      timeLimit,
      narrative,
    })
  }

  // ============================================================
  // 集計
  // ============================================================

  const aiSolved = results.filter(r => r.resolution === 'ai_solved').length
  const bSolved = results.filter(r => r.resolution === 'B_solved').length
  const cSolved = results.filter(r => r.resolution === 'C_solved').length
  const highQuest = results.filter(r => r.resolution === 'high_quest').length

  console.log('\n' + '='.repeat(60))
  console.log('📊 集計結果')
  console.log('='.repeat(60))
  console.log(`AI解決:       ${aiSolved}問 (${(aiSolved / 100 * 100).toFixed(1)}%)`)
  console.log(`人間B解決:    ${bSolved}問 (${(bSolved / 100 * 100).toFixed(1)}%)`)
  console.log(`人間C解決:    ${cSolved}問 (${(cSolved / 100 * 100).toFixed(1)}%)`)
  console.log(`高難度クエスト: ${highQuest}問 (${(highQuest / 100 * 100).toFixed(1)}%)`)
  console.log()
  console.log('ペルソナ別実績:')
  for (const p of personas.filter(p => p.joinAfterQ === 0 || p.solvedCount > 0 || p.passCount > 0)) {
    if (p.solvedCount + p.passCount + p.notifyCount === 0) continue
    console.log(`  ${p.name.padEnd(10)}: 解決${p.solvedCount} ギブ${p.passCount} 通知${p.notifyCount} 評価${p.reputation}`)
  }

  // カテゴリ別集計
  const cats = [...new Set(QUESTIONS.map(q => q.category))]
  console.log('\nカテゴリ別 高難度クエスト率:')
  for (const cat of cats) {
    const catResults = results.filter(r => r.category === cat)
    const hq = catResults.filter(r => r.resolution === 'high_quest').length
    console.log(`  ${cat.padEnd(15)}: ${hq}/${catResults.length} (${(hq / catResults.length * 100).toFixed(0)}%)`)
  }

  // ============================================================
  // Notion書き込み
  // ============================================================

  console.log('\n📝 Notionに書き込み中...')

  const summaryBlocks: any[] = [
    heading(`🎮 テスト④ 実行結果  ${runDate}`),
    text(`AI閾値: ${AI_THRESHOLD}  ペルソナ: ${personas.length}人  問題: ${QUESTIONS.length}問`),
    heading('📊 解決経路サマリー', 3),
    codeBlock([
      `AI解決:         ${aiSolved}問 (${(aiSolved).toFixed(0)}%)`,
      `人間B解決:      ${bSolved}問 (${(bSolved).toFixed(0)}%)`,
      `人間C解決:      ${cSolved}問 (${(cSolved).toFixed(0)}%)`,
      `高難度クエスト:   ${highQuest}問 (${(highQuest).toFixed(0)}%)`,
    ].join('\n')),
    heading('👥 ペルソナ別実績', 3),
    codeBlock(personas
      .filter(p => p.solvedCount + p.passCount + p.notifyCount > 0)
      .map(p => `${p.name.padEnd(10)}: 解決${p.solvedCount} ギブ${p.passCount} 通知${p.notifyCount} 評価${p.reputation}`)
      .join('\n')),
    heading('📂 カテゴリ別 高難度クエスト率', 3),
    codeBlock(cats.map(cat => {
      const catR = results.filter(r => r.category === cat)
      const hq = catR.filter(r => r.resolution === 'high_quest').length
      return `${cat.padEnd(15)}: ${hq}/${catR.length} (${(hq / catR.length * 100).toFixed(0)}%)`
    }).join('\n')),
    divider(),
    heading('📖 問題別ナラティブ（TTRPG形式）', 3),
  ]

  await appendBlocks(summaryBlocks)
  await sleep(500)

  // 問題別ナラティブを20問ずつ書き込み
  for (let i = 0; i < results.length; i += 20) {
    const chunk = results.slice(i, i + 20)
    const blocks: any[] = chunk.flatMap(r => {
      const icon = r.resolution === 'ai_solved' ? '🤖' :
                   r.resolution === 'B_solved' ? '🟢' :
                   r.resolution === 'C_solved' ? '🟡' : '🔴'
      return [
        text(`${icon} Q${r.id} [${r.category}/${r.difficulty}] ${r.title}`),
        text(r.narrative),
      ]
    })
    await appendBlocks(blocks)
    await sleep(300)
  }

  console.log('✅ Notionへの書き込み完了')
  console.log(`📌 Notion: https://notion.so/${NOTION_PAGE_ID.replace(/-/g, '')}`)
}

runSimulation().catch(console.error)

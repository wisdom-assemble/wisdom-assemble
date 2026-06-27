/**
 * テスト⑥：AIペルソナ意見収集（時間制限） + notifyCount=20でRPG再実行
 * パートA: 12ペルソナに「何時間待てるか・答えられるか」を聞く
 * パートB: テスト⑤と同じRPGをnotifyCount=20で再実行
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
config({ path: resolve(process.cwd(), '.env.local') })

const GROQ_API_KEY = process.env.GROQ_API_KEY!
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const NOTION_TOKEN = process.env.NOTION_TOKEN ?? ''
const NOTION_PAGE_ID = '38cf5fa8-bcb9-8193-9028-cde3ebdd98e6'

const SUPABASE_URL = 'https://scnkpmxvtwtsxzbhfdnf.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmtwbXh2dHd0c3h6YmhmZG5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM5Njk0MSwiZXhwIjoyMDk3OTcyOTQxfQ.NhV3RuD_St9YhNapBjs9tYi42zO0TS3PwkcdScSPUQY'

const AI_THRESHOLD = 87
const NOTIFY_CAP = 10  // テスト⑥：本番5の2日分相当

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ============================================================
// キャラクター定義（テスト⑤と同じ）
// ============================================================

type TimeLimit = 1 | 6 | 24

interface Persona {
  id: string; name: string; email: string; class: string
  personality: string; strengths: string[]; weaknesses: string[]
  preferredTimeLimit: TimeLimit
  reputation: number; solvedCount: number; passCount: number
  timeoutCount: number; notifyCount: number; isResting: boolean
  joinAfterQ: number; uid?: string
}

const PERSONAS: Persona[] = [
  { id:'takeshi', name:'Takeshi', email:'takeshi@test.com', class:'古参魔法使い',
    personality:'「昔はな…」が口癖。C言語とLinuxなら何でも知っているが最新JSを毛嫌い。',
    strengths:['C言語','Linux','低レイヤー','システムプログラミング','Unix'],
    weaknesses:['React','Vue','TypeScript','最新JavaScript','モバイル'],
    preferredTimeLimit:24, reputation:40, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'yuki', name:'Yuki', email:'yuki@test.com', class:'フロント妖精',
    personality:'おしゃれ大好き。CSSを詩のように書く。バックエンドは苦手で「サーバーサイドはお任せ」が口癖。',
    strengths:['React','CSS','TypeScript','UI/UX','フロントエンド','Next.js'],
    weaknesses:['SQL','データベース','インフラ','AWS','セキュリティ深部'],
    preferredTimeLimit:6, reputation:35, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'ryo', name:'Ryo', email:'ryo@test.com', class:'DB番人',
    personality:'クエリを見ると語りだす。インデックスの話を振ると止まらない。',
    strengths:['SQL','PostgreSQL','データベース設計','クエリ最適化','Redis'],
    weaknesses:['React','CSS','モバイル','フロントエンド全般'],
    preferredTimeLimit:24, reputation:38, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'mia', name:'Mia', email:'mia@test.com', class:'クラウド騎士',
    personality:'「それ、コンテナ化しましょう」が口癖。インフラをコードで管理することに喜びを感じる。',
    strengths:['AWS','Docker','Kubernetes','DevOps','CI/CD','インフラ'],
    weaknesses:['CSS','デザイン','React','フロントエンド'],
    preferredTimeLimit:6, reputation:36, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'shin', name:'Shin', email:'shin@test.com', class:'見習い修行者',
    personality:'「勉強中です…」が口癖。Pythonを始めて半年。エラーを見ると固まる。',
    strengths:['Python基礎','スクリプト'],
    weaknesses:['フレームワーク全般','インフラ','データベース設計','非同期処理'],
    preferredTimeLimit:24, reputation:5, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'hana', name:'Hana', email:'hana@test.com', class:'セキュリティ巫女',
    personality:'「それ、脆弱性ありますよ」が口癖。セキュリティ診断が趣味。',
    strengths:['セキュリティ','JWT','OAuth','認証','Supabase','ペネトレーションテスト'],
    weaknesses:['React','CSS','フロントエンド'],
    preferredTimeLimit:6, reputation:30, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'ken', name:'Ken', email:'ken@test.com', class:'モバイル侍',
    personality:'「ネイティブが一番」が口癖。ReactとReactNativeを混同させることが得意。',
    strengths:['iOS','Swift','ReactNative','モバイル','JavaScript','React'],
    weaknesses:['バックエンド','インフラ','データベース設計'],
    preferredTimeLimit:6, reputation:25, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'aoi', name:'Aoi', email:'aoi@test.com', class:'AI錬金術師',
    personality:'「LLMに任せましょう」が口癖。機械学習モデルのデバッグなら任せろ。',
    strengths:['Python','機械学習','LLM','データサイエンス','AWS'],
    weaknesses:['フロントエンド','インフラ','セキュリティ'],
    preferredTimeLimit:24, reputation:28, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'taro', name:'Taro', email:'taro@test.com', class:'何でも屋（浅め）',
    personality:'「なんか知ってます！」が口癖。広く浅く、本番対応は逃げる。',
    strengths:['JavaScript','React','Python','SQL','基本的なWebdev'],
    weaknesses:['深い実装','本番障害対応','パフォーマンスチューニング','セキュリティ'],
    preferredTimeLimit:1, reputation:8, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:0 },
  { id:'noa', name:'Noa', email:'noa@test.com', class:'タイムトラベラー',
    personality:'「jQueryの時代は良かった」が口癖。古い技術に詳しすぎる。',
    strengths:['PHP','jQuery','古いJavaScript','WordPress','レガシーシステム'],
    weaknesses:['TypeScript','React','Vue','モダンフレームワーク','Docker'],
    preferredTimeLimit:24, reputation:12, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:20 },
  { id:'john', name:'John', email:'john@test.com', class:'野心家ハッカー',
    personality:'「余裕です」が口癖。自称全分野エキスパート。実際は浅い。',
    strengths:['React','Node.js','TypeScript','AWS','Docker','SQL'],
    weaknesses:['深いデバッグ','本番インシデント','セキュリティ詳細'],
    preferredTimeLimit:1, reputation:3, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:20 },
  { id:'anthony', name:'Anthony', email:'anthony@test.com', class:'ソーシャルエンジニア',
    personality:'「チームワークが大事」が口癖。技術より人間関係に投資する。',
    strengths:['React','TypeScript','Node.js','コミュニケーション','ドキュメント'],
    weaknesses:['深い技術問題','パフォーマンス','セキュリティ','インフラ'],
    preferredTimeLimit:6, reputation:10, solvedCount:0, passCount:0, timeoutCount:0, notifyCount:0, isResting:false, joinAfterQ:35 },
]

// ============================================================
// 100問（テスト⑤と同じ）
// ============================================================

interface Q {
  id: number; category: string; title: string; body: string
  difficulty: 'easy' | 'medium' | 'hard'; expected: 'correct' | 'partial' | 'needs_human'
}

// 50問（各カテゴリ3〜5問、Git/Node.jsは多め）
const QUESTIONS: Q[] = [
  // React (4問)
  { id:1,  category:'React',      difficulty:'easy',   expected:'correct',     title:'useStateで配列を更新しても再レンダリングされない', body:'Reactでconst [list, setList] = useState([])と定義し、list.push(item)で要素を追加しています。画面が更新されません。なぜですか？' },
  { id:4,  category:'React',      difficulty:'medium', expected:'partial',     title:'React.memoを使っても再レンダリングが止まらない', body:'React.memoで子コンポーネントをラップしましたが、親が再レンダリングされると子も再レンダリングされます。Propsはオブジェクト型です。' },
  { id:11, category:'React',      difficulty:'hard',   expected:'needs_human', title:'ReactアプリがモバイルSafariでだけクラッシュする', body:'iPhoneのSafariでReactアプリを開くと、特定の操作後に白画面になってクラッシュします。Chromeでは正常です。エラーログが取れません。' },
  { id:12, category:'React',      difficulty:'medium', expected:'partial',     title:'React 18でStrictModeにするとuseEffectが2回走る', body:'React 18にアップグレードしたらuseEffectが開発環境で2回実行されるようになりました。APIが2回呼ばれています。これは仕様ですか？' },
  // Next.js (4問)
  { id:6,  category:'Next.js',    difficulty:'easy',   expected:'correct',     title:'Next.js 14でgetServerSidePropsが使えない', body:'Next.js 14のApp RouterでgetServerSidePropsを使おうとしたらエラーになります。どうすればいいですか？' },
  { id:8,  category:'Next.js',    difficulty:'medium', expected:'partial',     title:'Next.jsのApp RouterでCookieが取得できない', body:'Next.js 14のServer ComponentでCookieを取得しようとしています。cookies()を使っていますがundefinedになります。' },
  { id:10, category:'Next.js',    difficulty:'hard',   expected:'needs_human', title:'Next.js本番環境でメモリリークが発生している', body:'Vercelにデプロイ後、数時間でサーバーのメモリ使用量が増加してリスタートが必要になります。ローカルでは再現しません。どこを調べればいいですか？' },
  { id:15, category:'Next.js',    difficulty:'hard',   expected:'needs_human', title:'Next.js APIルートが本番でTimeout 504になる', body:'Vercelにデプロイしたテスト環境では動くのに、本番環境でAPIルートを叩くと504 Gateway Timeoutが返ります。処理時間は2秒程度のはずです。' },
  // TypeScript (3問)
  { id:16, category:'TypeScript', difficulty:'easy',   expected:'correct',     title:'TypeScriptでType is not assignableエラー', body:'TypeScriptで型エラー「Type string is not assignable to type number」が出ます。変数をstringで定義してnumberを代入しようとしました。どう直せばいいですか？' },
  { id:18, category:'TypeScript', difficulty:'medium', expected:'partial',     title:'TypeScriptのジェネリクスでConstraintエラー', body:'TypeScriptでジェネリクス関数を書いています。「Type T does not satisfy the constraint」エラーが出ます。extendsの使い方がわかりません。' },
  { id:21, category:'TypeScript', difficulty:'hard',   expected:'needs_human', title:'TypeScriptのビルドが本番だけ型エラーで失敗する', body:'ローカルではtsc --noEmitが通るのに、GitHub ActionsのCI環境でだけ型エラーになります。Node.jsのバージョンは合わせています。' },
  // SQL (4問)
  { id:24, category:'SQL',        difficulty:'easy',   expected:'correct',     title:'SQLのJOINとLEFT JOINの違いがわからない', body:'SQLでJOINとLEFT JOINの使い分けがわかりません。どちらを使うべきか、具体例で教えてください。' },
  { id:26, category:'SQL',        difficulty:'medium', expected:'partial',     title:'PostgreSQLで100万件のSELECTが10秒かかる', body:'PostgreSQLのテーブルに100万件のレコードがあります。WHERE email = $1のクエリが10秒かかります。インデックスは設定済みです。' },
  { id:28, category:'SQL',        difficulty:'hard',   expected:'needs_human', title:'PostgreSQLのトランザクションでデッドロックが発生する', body:'本番のPostgreSQLで1日に数回デッドロックエラーが発生します。同時更新が多いテーブルです。どのように調査・対処すればいいですか？' },
  { id:32, category:'SQL',        difficulty:'hard',   expected:'needs_human', title:'マスターデータ移行後に外部キー制約エラーが大量発生', body:'本番DBのマスターデータを移行したところ、外部キー制約エラーが数万件発生しました。アプリケーションが動かなくなっています。' },
  // Docker (4問)
  { id:34, category:'Docker',     difficulty:'easy',   expected:'correct',     title:'M1 MacでDockerがarm64エラーになる', body:'M1 MacでDockerコンテナを起動するとplatformエラーが出ます。arm64/amd64の問題だと思いますが、どう対処すればいいですか？' },
  { id:36, category:'Docker',     difficulty:'medium', expected:'partial',     title:'Dockerのビルドが毎回キャッシュされない', body:'Dockerfileのビルドでnpm installのステップが毎回フルで実行されます。package.jsonは変更していないのにキャッシュが効きません。' },
  { id:38, category:'Docker',     difficulty:'hard',   expected:'needs_human', title:'本番KubernetesでPodが断続的にRestartする', body:'本番のKubernetesクラスタでPodが1時間に1回程度Restart(CrashLoopBackOff)します。ログには特定のエラーはありません。どこを調べればいいですか？' },
  { id:41, category:'Docker',     difficulty:'hard',   expected:'needs_human', title:'DockerイメージのCIビルドが本番で動かない', body:'GitHub Actionsでビルドしたイメージをpullして本番サーバーで動かすと、ローカルとCIでは動くのに本番だけエラーになります。' },
  // AWS (4問)
  { id:44, category:'AWS',        difficulty:'easy',   expected:'correct',     title:'AWS S3のバケットポリシーでアクセス拒否される', body:'AWS S3のバケットに外部からアクセスしようとすると403エラーが返ります。バケットポリシーの設定方法を教えてください。' },
  { id:47, category:'AWS',        difficulty:'hard',   expected:'needs_human', title:'Lambda関数が本番だけタイムアウトする', body:'テスト環境では2秒で完了するLambda関数が、本番だけタイムアウト（15分）します。VPC内にあり、RDSに接続しています。' },
  { id:48, category:'AWS',        difficulty:'hard',   expected:'needs_human', title:'RDSへのLambda接続でToo many connectionsエラー', body:'LambdaからRDS Postgresに接続するとToo many connectionsエラーが出ます。Lambda関数は1000並列以上動く可能性があります。RDS Proxyを使うべきですか？' },
  { id:53, category:'AWS',        difficulty:'hard',   expected:'needs_human', title:'本番でAWS Cognitoのトークンが突然無効になった', body:'本番環境で突然全ユーザーのCognitoトークンが無効になりました。ユーザープールの設定は変更していません。原因の調査方法を教えてください。' },
  // Supabase (4問)
  { id:54, category:'Supabase',   difficulty:'easy',   expected:'correct',     title:'SupabaseのRLSポリシーの基本的な書き方', body:'SupabaseでRow Level Security（RLS）を設定したいです。ログインユーザーが自分のデータだけ取得できるポリシーの書き方を教えてください。' },
  { id:57, category:'Supabase',   difficulty:'medium', expected:'partial',     title:'Supabaseの認証でメール確認をスキップしたい', body:'Supabaseの認証でユーザーが登録後すぐにログインできるようにしたいです。メール確認（email verification）をスキップする方法を教えてください。' },
  { id:59, category:'Supabase',   difficulty:'hard',   expected:'needs_human', title:'Supabaseのストレージで本番のファイルが消えた', body:'Supabaseのストレージバケットのファイルが本番環境で突然消えました。バケットポリシーは変更していません。ログの調査方法を教えてください。' },
  { id:61, category:'Supabase',   difficulty:'hard',   expected:'needs_human', title:'Supabaseのマイグレーションが本番で失敗', body:'ローカルとステージングでは成功するSupabaseのマイグレーションが、本番だけ失敗します。エラーは外部キー制約違反です。' },
  // CSS (3問)
  { id:63, category:'CSS',        difficulty:'easy',   expected:'correct',     title:'CSSのFlexboxで要素を中央揃えしたい', body:'Flexboxで子要素を縦横中央に配置したいです。justify-contentとalign-itemsの使い方を教えてください。' },
  { id:65, category:'CSS',        difficulty:'medium', expected:'partial',     title:'Tailwind CSSのクラスが動的に適用されない', body:'Tailwind CSSでJavaScriptの変数を使ってクラス名を動的に生成していますが、スタイルが適用されません。' },
  { id:70, category:'CSS',        difficulty:'hard',   expected:'needs_human', title:'本番のCSS Criticalパスで白画面が発生', body:'本番環境でFCPが遅く、ユーザーが白画面を見る時間が長いです。Critical CSSのインライン化を試みましたが改善しません。' },
  // Python (4問)
  { id:72, category:'Python',     difficulty:'easy',   expected:'correct',     title:'PythonのリストとタプルとSetの違い', body:'Pythonのlist、tuple、setの違いを教えてください。それぞれいつ使うべきですか？' },
  { id:76, category:'Python',     difficulty:'medium', expected:'partial',     title:'PythonのOpenAI APIでRate Limitエラーが出る', body:'PythonでOpenAI APIを呼び出すとRate LimitエラーとContext Length Exceededエラーが出ます。リトライ処理の実装方法を教えてください。' },
  { id:77, category:'Python',     difficulty:'hard',   expected:'needs_human', title:'本番PythonサーバーのCPUが突然100%になる', body:'本番のFastAPIサーバーのCPUが突然100%になり、リクエストが詰まります。再現性はなく、数時間に1回発生します。プロファイリング方法を教えてください。' },
  { id:79, category:'Python',     difficulty:'hard',   expected:'needs_human', title:'機械学習モデルの精度が本番で急に落ちた', body:'本番で使っている機械学習モデルの予測精度が先週から急に落ちています。訓練データとの乖離（data drift）の検知方法を教えてください。' },
  // セキュリティ (4問)
  { id:80, category:'セキュリティ', difficulty:'easy',   expected:'correct',   title:'SQLインジェクションの基本的な対策', body:'Node.jsとPostgreSQLでWebアプリを作っています。SQLインジェクション対策として何をすればいいですか？プリペアドステートメントとは何ですか？' },
  { id:82, category:'セキュリティ', difficulty:'medium', expected:'partial',   title:'APIキーがGitHubに流出してしまった', body:'誤ってAPIキーをGitHubのpublicリポジトリにコミットしてプッシュしてしまいました。すぐにコミットを削除しましたが、どんな対応が必要ですか？' },
  { id:83, category:'セキュリティ', difficulty:'hard',   expected:'needs_human', title:'本番サーバーへの不審なアクセスを検知した', body:'CloudWatchのログで深夜に大量の不審なAPIアクセスを検知しました。IPは海外から複数。一部のエンドポイントにSQLインジェクションを試みた形跡があります。今何をすべきですか？' },
  { id:88, category:'セキュリティ', difficulty:'hard',   expected:'needs_human', title:'本番DBのデータが無断で削除された可能性', body:'本番DBのレコードが数千件消えていることに気づきました。バックアップは3日前のものしかありません。削除のログは残っていません。何から調査すべきですか？' },
  // Git (5問 - 多め)
  { id:89, category:'Git',         difficulty:'easy',   expected:'correct',   title:'Gitでコミットを取り消したい', body:'直前のコミットを取り消したいです。変更はワーキングディレクトリに残したまま取り消す方法と、完全に取り消す方法の両方を教えてください。' },
  { id:91, category:'Git',         difficulty:'medium', expected:'partial',   title:'GitHub Actionsが特定のブランチだけ失敗する', body:'GitHub Actionsのワークフローがmainブランチでは成功しますが、feature/xブランチでだけ失敗します。同じyamlファイルを使っています。' },
  { id:93, category:'Git',         difficulty:'hard',   expected:'needs_human', title:'git push --forceで本番ブランチのコミットが消えた', body:'誰かがgit push --force-with-leaseをmainブランチに実行して、過去3日分のコミットが消えました。GitHub上のコミット履歴も消えています。復元できますか？' },
  { id:95, category:'Git',         difficulty:'easy',   expected:'correct',   title:'GitのブランチをリモートにPushしたい', body:'ローカルで新しいブランチを作りました。リモートリポジトリ（GitHub）にこのブランチをPushする方法を教えてください。' },
  { id:96, category:'Git',         difficulty:'hard',   expected:'needs_human', title:'本番デプロイ後にCIが通っていたコードでエラー', body:'GitHub ActionsのCIが全て通過してmainにマージしました。本番デプロイ後にエラーが発生しています。テストは全てパスしているのに本番だけエラーです。' },
  // Node.js (4問 - 全問使用)
  { id:97, category:'Node.js',     difficulty:'easy',   expected:'correct',   title:'Node.jsでrequireとimportの違い', body:'Node.jsプロジェクトでrequireとimportが混在しています。「Cannot use import statement in a module」エラーが出ます。どう統一すればいいですか？' },
  { id:98, category:'Node.js',     difficulty:'medium', expected:'partial',   title:'Node.jsサーバーのメモリ使用量が増え続ける', body:'Express.jsサーバーを長時間動かすとメモリ使用量が増え続けます。数時間でOOM Killerに落とされます。メモリリークの調査方法を教えてください。' },
  { id:99, category:'Node.js',     difficulty:'hard',   expected:'needs_human', title:'Node.jsのCPUが本番で突然100%になる', body:'本番のNode.jsサーバーのCPU使用率が突然100%になり、リクエストが処理できなくなります。1日に数回発生します。再現性がなく原因不明です。' },
  { id:100, category:'Node.js',    difficulty:'medium', expected:'partial',   title:'Node.jsのfsモジュールでパスが解決できない', body:'fs.readFileSync("./data.json")としていますが、実行する場所によってパスが変わってエラーになります。常に正しいパスで読み込む方法はありますか？' },
]

// ============================================================
// ユーティリティ
// ============================================================

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function calcMatchScore(persona: Persona, category: string): number {
  const cat = category.toLowerCase()
  let score = 0
  for (const s of persona.strengths) {
    const sl = s.toLowerCase()
    if (cat.includes(sl) || sl.includes(cat) ||
        (cat === 'react'       && (sl.includes('react') || sl.includes('フロント'))) ||
        (cat === 'next.js'     && (sl.includes('next') || sl.includes('react') || sl.includes('フロント'))) ||
        (cat === 'sql'         && (sl.includes('sql') || sl.includes('データベース'))) ||
        (cat === 'docker'      && (sl.includes('docker') || sl.includes('インフラ') || sl.includes('devops'))) ||
        (cat === 'aws'         && (sl.includes('aws') || sl.includes('クラウド') || sl.includes('インフラ'))) ||
        (cat === 'supabase'    && (sl.includes('supabase') || sl.includes('認証') || sl.includes('セキュリティ'))) ||
        (cat === 'css'         && (sl.includes('css') || sl.includes('ui') || sl.includes('フロント'))) ||
        (cat === 'python'      && (sl.includes('python') || sl.includes('ml'))) ||
        (cat === 'セキュリティ' && (sl.includes('セキュリティ') || sl.includes('認証') || sl.includes('jwt'))) ||
        (cat === 'git'         && (sl.includes('git') || sl.includes('ci') || sl.includes('devops'))) ||
        (cat === 'typescript'  && (sl.includes('typescript') || sl.includes('react') || sl.includes('フロント'))) ||
        (cat === 'node.js'     && (sl.includes('node') || sl.includes('javascript')))
    ) { score += 20 }
  }
  return score + persona.reputation * 0.1
}

function didTimeout(timeLimit: TimeLimit): boolean {
  const rate = { 1: 0.55, 6: 0.20, 24: 0.05 }
  return Math.random() < rate[timeLimit]
}

function didGiveUp(matchScore: number): boolean {
  if (matchScore >= 30) return Math.random() < 0.1
  if (matchScore >= 10) return Math.random() < 0.3
  return Math.random() < 0.6
}

async function callGroq(system: string, user: string, attempt = 0): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: 500,
    }),
  })
  if (res.status === 429) {
    if (attempt >= 2) return ''
    console.log('\n⏳ Groq rate limit、60秒待機...')
    await sleep(62000)
    return callGroq(system, user, attempt + 1)
  }
  if (!res.ok) return ''
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

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
      return { score: Math.min(100, Math.max(0, Number(p.score) || 0)), answer: String(p.answer ?? '') }
    }
  } catch {}
  return { score: 0, answer: '' }
}

function selectResponder(personas: Persona[], excludeIds: string[], category: string, qi: number): Persona | null {
  const candidates = personas
    .filter(p => p.joinAfterQ <= qi && !excludeIds.includes(p.id) && !p.isResting && p.notifyCount < NOTIFY_CAP)
    .map(p => ({ persona: p, score: calcMatchScore(p, category) }))
    .sort((a, b) => b.score - a.score)
  if (candidates.length === 0) return null
  const top = candidates[0]
  if (top.score === 0) return null
  return top.persona
}

// ============================================================
// DB操作
// ============================================================

async function fetchPersonaUids(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const { data } = await db.from('profiles').select('id, username')
  if (data) {
    for (const row of data) {
      const persona = PERSONAS.find(p => p.email.split('@')[0] === row.username)
      if (persona) map.set(persona.id, row.id)
    }
  }
  return map
}

async function insertQuestion(q: Q, userId: string): Promise<string | null> {
  const { data, error } = await db.from('questions').insert({
    tenant_id: 'debug',
    user_id: userId,
    title: q.title,
    body: q.body,
    slug: `t6-q${q.id}-${Date.now()}`,
    status: 'open',
  }).select('id').single()
  if (error) { console.error('insertQuestion error:', error.message); return null }
  return data.id
}

async function insertAnswer(questionId: string, userId: string, body: string, isAi: boolean, aiScore: number): Promise<string | null> {
  const { data, error } = await db.from('answers').insert({
    question_id: questionId,
    tenant_id: 'debug',
    user_id: userId,
    body,
    is_ai: isAi,
    ai_score: aiScore,
    is_accepted: false,
  }).select('id').single()
  if (error) { console.error('insertAnswer error:', error.message); return null }
  return data.id
}

async function resolveQuestion(questionId: string, answerId: string, solvedBy: string) {
  await db.from('answers').update({ is_accepted: true }).eq('id', answerId)
  await db.from('questions').update({ status: 'solved', solved_at: new Date().toISOString(), solved_by: solvedBy }).eq('id', questionId)
  await db.rpc('increment_answer_count', { uid: solvedBy }).then(() => {}).catch(() => {})
}

async function escalateToHard(questionId: string) {
  await db.from('questions').update({ status: 'hard' }).eq('id', questionId)
}

// ============================================================
// Notion書き込み
// ============================================================

function p(text: string) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function h2(text: string) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function h3(text: string) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function bullet(text: string) {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] } }
}
function divider() { return { object: 'block', type: 'divider', divider: {} } }

async function appendBlocks(blocks: any[]) {
  for (let i = 0; i < blocks.length; i += 40) {
    const chunk = blocks.slice(i, i + 40)
    const res = await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ children: chunk })
    })
    if (!res.ok) { const err = await res.json(); console.error('Notion error:', JSON.stringify(err)) }
    if (blocks.length > 40) await sleep(300)
  }
}

// ============================================================
// パートA: AIペルソナ意見収集（時間制限）
// ============================================================

async function partA() {
  console.log('\n========================================')
  console.log('パートA: AIペルソナ意見収集（時間制限）')
  console.log('========================================')

  const results: { name: string; class: string; asQuestioner: string; asAnswerer: string; idealHours: number }[] = []

  for (const persona of PERSONAS) {
    console.log(`\n[${persona.name}] 意見収集中...`)

    const questionerResponse = await callGroq(
      `あなたは「${persona.name}」というエンジニアです。
クラス：${persona.class}
性格：${persona.personality}
得意：${persona.strengths.join('、')}
苦手：${persona.weaknesses.join('、')}

このキャラクターとして、自然に答えてください。`,
      `Q&Aサービスで質問をしました。専門家にマッチングされるシステムです。
質問者として、マッチングした専門家から何時間以内に返事が来ないと不安になりますか？
また、その理由も教えてください。（2〜3文で）`
    )

    const answererResponse = await callGroq(
      `あなたは「${persona.name}」というエンジニアです。
クラス：${persona.class}
性格：${persona.personality}
得意：${persona.strengths.join('、')}
苦手：${persona.weaknesses.join('、')}

このキャラクターとして、自然に答えてください。`,
      `Q&Aサービスで、あなたのスキルにマッチした質問の通知が来ました。
回答者として、通知を受けてから何時間以内なら余裕を持って回答できますか？
また、忙しい場合の限界は何時間ですか？（2〜3文で）`
    )

    // 意見から理想時間を抽出
    const hoursMatch = answererResponse.match(/(\d+)\s*時間/)
    const idealHours = hoursMatch ? parseInt(hoursMatch[1]) : persona.preferredTimeLimit

    results.push({
      name: persona.name,
      class: persona.class,
      asQuestioner: questionerResponse,
      asAnswerer: answererResponse,
      idealHours,
    })

    console.log(`  質問者として: ${questionerResponse.substring(0, 60)}...`)
    console.log(`  回答者として: ${answererResponse.substring(0, 60)}...`)
  }

  // 統計
  const avgIdealHours = Math.round(results.reduce((s, r) => s + r.idealHours, 0) / results.length)
  const distribution: Record<string, number> = {}
  for (const r of results) {
    const key = `${r.idealHours}h`
    distribution[key] = (distribution[key] || 0) + 1
  }

  console.log('\n[パートA 集計]')
  console.log(`平均理想時間: ${avgIdealHours}h`)
  console.log('分布:', distribution)

  return { results, avgIdealHours, distribution }
}

// ============================================================
// パートB: RPGテスト（notifyCount=20）
// ============================================================

async function partB(uidMap: Map<string, string>) {
  console.log('\n========================================')
  console.log('パートB: RPGテスト（notifyCount=20）')
  console.log('========================================')

  const personas = PERSONAS.map(p => ({ ...p, uid: uidMap.get(p.id) }))
  const questioner = personas.find(p => p.id === 'taro')!

  const stats = { ai: 0, b: 0, c: 0, hard: 0, noCandidate: 0 }
  const categoryStats: Record<string, { ai: number; b: number; c: number; hard: number; total: number }> = {}
  const narratives: string[] = []

  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const q = QUESTIONS[qi]
    if (!categoryStats[q.category]) categoryStats[q.category] = { ai: 0, b: 0, c: 0, hard: 0, total: 0 }
    categoryStats[q.category].total++

    process.stdout.write(`Q${q.id.toString().padStart(3)} [${q.category}] `)

    const userId = questioner.uid ?? uidMap.values().next().value
    const qId = await insertQuestion(q, userId!)
    if (!qId) { process.stdout.write('DB挿入失敗\n'); continue }

    // AI判定
    const { score, answer } = await aiJudge(q)
    const isSecurityEmergency = q.category === 'セキュリティ' && /本番|突然|インシデント|痕跡|削除|無断|不審/.test(q.body)
    const effectiveScore = isSecurityEmergency ? 0 : score

    if (effectiveScore >= AI_THRESHOLD && answer) {
      await insertAnswer(qId, userId!, answer, true, effectiveScore)
      await db.from('questions').update({ status: 'ai_answered', ai_score: effectiveScore }).eq('id', qId)
      stats.ai++
      categoryStats[q.category].ai++
      process.stdout.write(`AI解決 (score:${effectiveScore})\n`)
      narratives.push(`Q${q.id} 「${q.title}」→ AI解決（信頼度${effectiveScore}）`)
      continue
    }

    process.stdout.write(`AI不可(${effectiveScore}) → `)

    // B選出
    const personaB = selectResponder(personas, [questioner.id], q.category, qi)
    if (!personaB || !personaB.uid) {
      await escalateToHard(qId)
      stats.hard++
      stats.noCandidate++
      categoryStats[q.category].hard++
      process.stdout.write(`候補なし → 高難度\n`)
      narratives.push(`Q${q.id} 「${q.title}」→ 候補なし → 高難度クエスト`)
      continue
    }

    personaB.notifyCount++
    const scoreB = calcMatchScore(personaB, q.category)
    process.stdout.write(`B:${personaB.name}(${scoreB}) → `)

    if (didTimeout(personaB.preferredTimeLimit) || didGiveUp(scoreB)) {
      process.stdout.write(`B失敗 → `)
      personaB.passCount++

      // C選出
      const personaC = selectResponder(personas, [questioner.id, personaB.id], q.category, qi)
      if (!personaC || !personaC.uid) {
        await escalateToHard(qId)
        stats.hard++
        categoryStats[q.category].hard++
        process.stdout.write(`C候補なし → 高難度\n`)
        narratives.push(`Q${q.id} 「${q.title}」→ B(${personaB.name})失敗 → C候補なし → 高難度クエスト`)
        continue
      }

      personaC.notifyCount++
      const scoreC = calcMatchScore(personaC, q.category)
      process.stdout.write(`C:${personaC.name}(${scoreC}) → `)

      if (didTimeout(personaC.preferredTimeLimit) || didGiveUp(scoreC)) {
        await escalateToHard(qId)
        stats.hard++
        categoryStats[q.category].hard++
        personaC.passCount++
        process.stdout.write(`C失敗 → 高難度\n`)
        narratives.push(`Q${q.id} 「${q.title}」→ B(${personaB.name})失敗 → C(${personaC.name})失敗 → 高難度クエスト`)
      } else {
        const ansId = await insertAnswer(qId, personaC.uid!, `${personaC.name}が解決しました。`, false, 0)
        if (ansId) await resolveQuestion(qId, ansId, personaC.uid!)
        stats.c++
        categoryStats[q.category].c++
        personaC.solvedCount++
        personaC.reputation += 3
        process.stdout.write(`C解決\n`)
        narratives.push(`Q${q.id} 「${q.title}」→ B(${personaB.name})失敗 → C(${personaC.name})解決`)
      }
    } else {
      const ansId = await insertAnswer(qId, personaB.uid!, `${personaB.name}が解決しました。`, false, 0)
      if (ansId) await resolveQuestion(qId, ansId, personaB.uid!)
      stats.b++
      categoryStats[q.category].b++
      personaB.solvedCount++
      personaB.reputation += 5
      process.stdout.write(`B解決\n`)
      narratives.push(`Q${q.id} 「${q.title}」→ B(${personaB.name})解決`)
    }
  }

  return { stats, categoryStats, narratives, personas }
}

// ============================================================
// メイン
// ============================================================

async function writeConditionsToNotion() {
  console.log('Notion: 実行条件を書き込み中...')
  const blocks: any[] = [
    h2('📋 テスト⑥ 実行条件'),
    p(`実施日時: ${new Date().toLocaleString('ja-JP')}`),
    bullet(`質問数: 50問（12カテゴリ、easy/medium/hard混在。Git・Node.jsを多め）`),
    bullet(`NOTIFY_CAP: ${NOTIFY_CAP}（本番5の2日分相当）`),
    bullet(`AI閾値: ${AI_THRESHOLD}`),
    bullet(`Groq API: llama-3.3-70b-versatile`),
    bullet(`マッチング: スキルタグ×レピュテーションスコアでB→C選出`),
    bullet(`タイムアウト確率: 1h=55%, 6h=20%, 24h=5%`),
    bullet(`ギブアップ確率: スキルスコア≥30→10%, ≥10→30%, 未満→60%`),
    bullet(`実DB書き込み: questions/answers/profilesをSupabaseに挿入`),
    divider(),
  ]
  await appendBlocks(blocks)
}

async function main() {
  console.log('テスト⑥ 開始')
  console.log(`NOTIFY_CAP = ${NOTIFY_CAP}`)
  console.log(`問題数 = ${QUESTIONS.length}問`)

  // UID取得
  const uidMap = await fetchPersonaUids()
  console.log(`UID取得: ${uidMap.size}人`)

  // Notion条件書き込み
  if (NOTION_TOKEN) await writeConditionsToNotion()

  // パートA
  const partAResult = await partA()

  // パートB
  const partBResult = await partB(uidMap)

  // 集計
  const total = QUESTIONS.length
  const { stats, categoryStats, narratives, personas } = partBResult

  console.log('\n========================================')
  console.log('テスト⑥ 最終結果')
  console.log('========================================')
  console.log(`AI解決:    ${stats.ai}問 (${Math.round(stats.ai/total*100)}%)`)
  console.log(`B解決:     ${stats.b}問 (${Math.round(stats.b/total*100)}%)`)
  console.log(`C解決:     ${stats.c}問 (${Math.round(stats.c/total*100)}%)`)
  console.log(`高難度:    ${stats.hard}問 (${Math.round(stats.hard/total*100)}%)`)
  console.log(`  うち候補なし: ${stats.noCandidate}問`)

  // Notion書き込み
  if (NOTION_TOKEN) {
    console.log('\nNotion書き込み中...')
    const blocks: any[] = []

    // パートA結果
    blocks.push(divider())
    blocks.push(h2('🎤 パートA：AIペルソナ意見収集（時間制限）'))
    blocks.push(p(`実施日時: ${new Date().toLocaleString('ja-JP')}`))
    blocks.push(p(`平均理想回答時間: ${partAResult.avgIdealHours}時間`))
    blocks.push(p(`分布: ${Object.entries(partAResult.distribution).map(([k,v]) => `${k}: ${v}人`).join(' / ')}`))

    for (const r of partAResult.results) {
      blocks.push(h3(`${r.name}（${r.class}）`))
      blocks.push(bullet(`質問者として: ${r.asQuestioner}`))
      blocks.push(bullet(`回答者として: ${r.asAnswerer}`))
      blocks.push(bullet(`理想時間: ${r.idealHours}時間`))
    }

    // パートB結果
    blocks.push(divider())
    blocks.push(h2('🎮 パートB：RPGテスト結果（notifyCount=20）'))
    blocks.push(p(`実施日時: ${new Date().toLocaleString('ja-JP')}`))
    blocks.push(bullet(`AI解決: ${stats.ai}問 (${Math.round(stats.ai/total*100)}%)`))
    blocks.push(bullet(`人間B解決: ${stats.b}問 (${Math.round(stats.b/total*100)}%)`))
    blocks.push(bullet(`人間C解決: ${stats.c}問 (${Math.round(stats.c/total*100)}%)`))
    blocks.push(bullet(`高難度クエスト: ${stats.hard}問 (${Math.round(stats.hard/total*100)}%)  うち候補なし: ${stats.noCandidate}問`))

    blocks.push(h3('カテゴリ別内訳'))
    for (const [cat, s] of Object.entries(categoryStats).sort((a,b) => b[1].hard - a[1].hard)) {
      const hardRate = Math.round(s.hard / s.total * 100)
      blocks.push(bullet(`${cat}（${s.total}問）: AI ${s.ai} / B ${s.b} / C ${s.c} / 高難度 ${s.hard}（${hardRate}%）`))
    }

    blocks.push(h3('ペルソナ別スコア'))
    const activePersonas = personas.filter(p => p.solvedCount + p.passCount + p.notifyCount > 0)
    for (const p of activePersonas.sort((a,b) => b.reputation - a.reputation)) {
      blocks.push(bullet(`${p.name.padEnd(10)}: 解決${p.solvedCount} ギブ${p.passCount} 通知${p.notifyCount} 評価${p.reputation}`))
    }

    blocks.push(h3('全問ナラティブ'))
    for (const n of narratives) blocks.push(bullet(n))

    await appendBlocks(blocks)
    console.log('Notion書き込み完了')
  }

  console.log('\nテスト⑥ 完了')
}

main().catch(console.error)

/**
 * 100問テストスクリプト
 * 実行: npx tsx scripts/test-100-questions.ts
 *
 * 前提: .env.local に GROQ_API_KEY と SUPABASE_SERVICE_ROLE_KEY が必要
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // テスト用にservice_roleを使う（本番コードでは絶対使わない）
)

// テスト用ユーザーID（Supabaseに実在するユーザーのIDを入れる）
const TEST_USER_ID = process.env.TEST_USER_ID!
const TENANT_ID = 'debug'

const TEST_QUESTIONS = [
  // カテゴリ1: 基本文法・定番API（期待スコア80〜100）
  { title: 'JavaScriptでArray.mapとArray.forEachの違いは何ですか？', body: '戻り値の違いや使い分けのベストプラクティスを教えてください。' },
  { title: 'Pythonのリスト内包表記の書き方を教えてください', body: '通常のforループとの違いも合わせて教えてほしいです。' },
  { title: 'SQLのINNER JOINとLEFT JOINの違いを教えてください', body: 'どちらをどのような場面で使うのかが分かりません。' },
  { title: 'Gitのmergeとrebaseはどちらをいつ使うべきですか？', body: 'チーム開発での推奨プラクティスも教えてください。' },
  { title: 'HTTPのGETとPOSTの使い分けを教えてください', body: 'RESTful APIを設計するときの基本ルールを知りたいです。' },
  { title: 'JavaScriptのPromiseとasync/awaitの関係を教えてください', body: '非同期処理の書き方の違いと使い分けを知りたいです。' },
  { title: 'CSSのflexboxとgridの使い分けを教えてください', body: 'どのようなレイアウトにどちらが向いているか教えてください。' },
  { title: 'Pythonのdecoratorとは何ですか？', body: '具体的なコード例とともに説明してください。' },
  { title: 'TypeScriptのinterfaceとtypeの違いは何ですか？', body: 'どちらを使うべきかの判断基準も教えてください。' },
  { title: 'Linuxのchmodコマンドの数字の意味を教えてください', body: '755や644などの意味が分かりません。' },
  { title: 'JavaScriptのclosureとは何ですか？', body: '実際の使用例とともに説明してください。' },
  { title: 'SSHの公開鍵認証の仕組みを教えてください', body: 'パスワード認証との違いも知りたいです。' },
  { title: 'Dockerのimageとcontainerの違いは何ですか？', body: '初心者向けに分かりやすく教えてください。' },
  { title: 'JSONとXMLの違いと使い分けを教えてください', body: 'どちらが現在主流なのかも教えてください。' },
  { title: 'CSSのpositionプロパティの値の違いを教えてください', body: 'static, relative, absolute, fixedの違いが分かりません。' },
  { title: 'Pythonのジェネレータとは何ですか？', body: '通常の関数との違いとメリットを教えてください。' },
  { title: 'RESTとGraphQLの違いを教えてください', body: 'どちらをプロジェクトで選ぶべきかの判断基準も知りたいです。' },
  { title: 'JavaScriptのeventBubblingとは何ですか？', body: 'イベントの伝播の仕組みを教えてください。' },
  { title: 'データベースのインデックスとは何ですか？', body: 'なぜクエリが速くなるのかの仕組みを教えてください。' },
  { title: 'CIとCDの違いを教えてください', body: 'CI/CDパイプラインの全体像を理解したいです。' },

  // カテゴリ2: フレームワーク固有・バージョン依存（期待スコア50〜79）
  { title: 'Next.js 14のApp RouterとPages Routerどちらを使うべきですか？', body: '新規プロジェクトを始める際に迷っています。2024年現在の推奨は？' },
  { title: 'React 18のSuspenseとuseTransitionをどう使い分けますか？', body: '並行レンダリングの新機能の使いどころが分かりません。' },
  { title: 'Tailwind CSS v3とv4の主な変更点を教えてください', body: '移行に際して何を変更すべきか知りたいです。' },
  { title: 'Vite vs webpack、どちらを選ぶべきですか？', body: '2024年現在のフロントエンドビルドツールの選択基準を教えてください。' },
  { title: 'Prismaのmigrationがエラーになります', body: 'prisma migrate devを実行すると「The migration is already applied」というエラーが出ます。' },
  { title: 'Next.js App RouterでgetServerSidePropsはどう書きますか？', body: '従来のPages Routerの書き方との対応関係を知りたいです。' },
  { title: 'Supabase RLSポリシーが効かないのはなぜですか？', body: 'ポリシーを設定しても認証なしでデータが取れてしまいます。' },
  { title: 'React Query v5の主な変更点を教えてください', body: 'v4からのマイグレーションで何を変更すべきか知りたいです。' },
  { title: 'TypeScript 5.xの新機能で特に重要なものは何ですか？', body: 'アップグレードする価値のある機能を教えてください。' },
  { title: 'Astroフレームワークはどんなプロジェクトに向いていますか？', body: 'Next.jsやRemixとの使い分けを教えてください。' },
  { title: 'Zustandの使い方を教えてください', body: 'ReduxやContext APIとの違いと移行のメリットを知りたいです。' },
  { title: 'Drizzle ORMとPrismaどちらを選ぶべきですか？', body: '型安全性やパフォーマンスの観点から比較してください。' },
  { title: 'shadcn/uiのコンポーネントのカスタマイズ方法を教えてください', body: 'デフォルトのスタイルを変更する方法が分かりません。' },
  { title: 'Bun vs Node.js、本番環境で使えますか？', body: 'Bunのメリットとリスクを教えてください。' },
  { title: 'tRPCとGraphQLどちらを使うべきですか？', body: 'フルスタックTypeScriptプロジェクトでの型安全なAPI設計について教えてください。' },
  { title: 'Cloudflare WorkersとVercel Edge Functionsの違いを教えてください', body: 'エッジコンピューティングの選択基準を知りたいです。' },
  { title: 'pnpmとnpmとyarnの違いと使い分けを教えてください', body: '2024年現在どれを選ぶべきか判断基準が欲しいです。' },
  { title: 'Turbopackは本番環境で使えますか？', body: 'Next.jsのデフォルトバンドラーになりましたが安定性が気になります。' },
  { title: 'BiomeとESLint+Prettierどちらを選ぶべきですか？', body: '移行コストとメリットを比較したいです。' },
  { title: 'Remixフレームワークの特徴とNext.jsとの違いを教えてください', body: 'どちらのプロジェクトにどちらを選ぶべきか知りたいです。' },

  // カテゴリ3: 最新技術・新ライブラリ（期待スコア30〜60）
  { title: 'React 19の新機能で特に重要なものを教えてください', body: 'Server Actionsの安定化以外に何が変わりましたか？' },
  { title: 'AI SDKを使ったストリーミングレスポンスの実装方法を教えてください', body: 'Vercel AI SDKとOpenAI SDKどちらを使うべきですか？' },
  { title: 'WebGPUを使ったブラウザでの機械学習推論の実装例を教えてください', body: 'WebAssemblyとの使い分けも知りたいです。' },
  { title: 'Denoの最新バージョンでNode.jsとの互換性はどこまで改善されましたか？', body: 'npm パッケージは全て使えますか？' },
  { title: 'LangChainとLlamaIndexの使い分けを教えてください', body: 'RAGアプリケーション開発でどちらを選ぶべきですか？' },
  { title: 'Temporal APIはブラウザで使えますか？', body: 'Dateオブジェクトの代替として本番環境で使用できますか？' },
  { title: 'Rustで書かれたJavaScriptツールのエコシステムを教えてください', body: 'Oxc, SWC, Biome以外に注目のツールはありますか？' },
  { title: 'HTMXとモダンフレームワーク（React/Vue）はどう使い分けますか？', body: 'どんなプロジェクトにHTMXが向いていますか？' },
  { title: 'Effect-TSとは何ですか？実務での採用メリットを教えてください', body: 'Zodや他のTypeScriptライブラリとの違いを知りたいです。' },
  { title: 'Hono.jsとExpressの違いと使い分けを教えてください', body: 'エッジ環境での動作についても知りたいです。' },
  { title: 'Server Componentsでデータフェッチングのベストプラクティスは何ですか？', body: 'キャッシュの扱いとウォーターフォール問題の解決策を教えてください。' },
  { title: 'Partykit/Liveblocks/Yjsリアルタイムコラボレーションの実装を比較してください', body: 'Notion風のリアルタイム編集機能を実装したいです。' },
  { title: 'Vaul/Radix UI/Headless UIどれを使うべきですか？', body: 'アクセシビリティ対応のUIコンポーネントライブラリを選びたいです。' },
  { title: 'OpenTelemetryの実装方法をNext.jsで教えてください', body: '分散トレーシングを本番環境に導入したいです。' },
  { title: 'React Compilerは今すぐ使えますか？', body: 'useMemoやuseCallbackが不要になるという話の現状を教えてください。' },
  { title: 'Zod v4の主な変更点を教えてください', body: 'パフォーマンス改善以外に何が変わりましたか？' },
  { title: 'Million.js（React高速化ライブラリ）は本番で使えますか？', body: '実際のパフォーマンス改善効果はどのくらいですか？' },
  { title: 'Tanstack Startとは何ですか？', body: 'Tanstack Routerとの関係とNext.jsとの違いを教えてください。' },
  { title: 'CSS Houdiniを実務で使えますか？', body: 'ブラウザサポートの状況と使用可能なユースケースを教えてください。' },
  { title: 'Neon DBのサーバーレスPostgreSQLはSupabaseと比べてどうですか？', body: 'コールドスタートの問題と料金体系を知りたいです。' },

  // カテゴリ4: 環境依存・個別設定（期待スコア20〜50）
  { title: 'M1 MacでDockerが遅いのはなぜですか？', body: 'arm64のイメージを使っているのに体感的に重いです。何か設定が必要ですか？' },
  { title: 'WSL2でのNode.jsのファイル変更検知が遅い問題を解決したい', body: 'Windowsのファイルシステム上でNext.jsを動かすとHMRが数秒かかります。' },
  { title: 'VPN使用時にSupabaseへの接続がタイムアウトする', body: '特定のVPNを使っているときだけ接続できなくなります。企業のプロキシが原因？' },
  { title: 'GitHub ActionsのCI環境でprisma migrate deployが失敗する', body: 'ローカルでは動くのにCI環境だけエラーになります。環境変数は設定済みです。' },
  { title: 'Cloudflare Workersで外部APIへのfetchが一部ブロックされる', body: '同じコードがNode.jsでは動くのにWorkersでは接続できないAPIがあります。' },
  { title: '日本語を含むファイルパスでビルドエラーになる', body: 'Windows環境でnpm buildを実行するとマルチバイト文字が原因でエラーになります。' },
  { title: 'Safari 17でのCSS Grid Subgridが期待通りに動かない', body: 'ChromeとFirefoxでは正常に表示されるのにSafariだけレイアウトが崩れます。' },
  { title: 'NginxのリバースプロキシでNext.jsのWebSocketが切断される', body: 'デプロイ後にリアルタイム機能だけが動作しません。設定例を教えてください。' },
  { title: 'Vercelにデプロイするとローカルと環境変数の挙動が違う', body: 'NEXT_PUBLIC_プレフィックスをつけているのに本番でundefinedになります。' },
  { title: '会社のプロキシ環境でnpm installが失敗する', body: 'HTTPSプロキシ経由でnpmを使う設定方法を教えてください。' },
  { title: 'Node.js 20にアップグレードしたらパッケージが動かなくなった', body: 'node-gypを使うネイティブモジュールのビルドが失敗します。' },
  { title: 'PostgreSQL 16にアップグレード後にクエリが遅くなった', body: 'EXPLAIN ANALYZEを見るとインデックスが使われていません。統計情報の問題？' },
  { title: 'Apple Silicon（M3）でのクロスコンパイルの方法を教えてください', body: 'amd64向けのDockerイメージをM3 Macでビルドしたいです。' },
  { title: 'GitHubのシークレットでJSONを扱う方法を教えてください', body: 'サービスアカウントキー（JSON全体）を安全にGitHub Actionsに渡す方法が分かりません。' },
  { title: 'ESMとCJSの混在でimportエラーが出る', body: 'require is not defined in ES module scopeというエラーを解決したいです。' },
  { title: 'Dockerのマルチステージビルドでnode_modulesのキャッシュが効かない', body: 'package.jsonを変更するたびに全依存関係が再インストールされます。' },
  { title: 'ARM64サーバー（Oracle Cloud無料枠）でx86のnpmパッケージが動かない', body: 'ネイティブバイナリが含まれるパッケージのインストールが失敗します。' },
  { title: 'ChromeのSameSite Cookie制限でセッションが切れる', body: 'ローカルではログイン状態が維持されるのに本番環境で毎回ログアウトされます。' },
  { title: 'TypeScriptのパスエイリアスがJestのテストで解決されない', body: 'tsconfig.jsonに@のエイリアスを設定していますがJestで使えません。' },
  { title: 'monorepoでのESLintの設定共有の方法を教えてください', body: 'pnpm workspacesでパッケージ間のルールを統一したいです。' },

  // カテゴリ5: 曖昧・答えにくい（期待スコア0〜40）
  { title: '10年後もJavaScriptは使われていますか？', body: 'AIの台頭でプログラミング自体が不要になる可能性はありますか？' },
  { title: '最強のプログラミング言語はどれですか？', body: 'これから学ぶなら何が一番将来性がありますか？' },
  { title: 'AIがコードを書けるなら、プログラマーはいつ不要になりますか？', body: 'GitHub Copilotなどの登場でエンジニアの仕事はどう変わりますか？' },
  { title: '独学とプログラミングスクール、どちらが良いですか？', body: 'エンジニア転職を目指しています。費用対効果で比較してください。' },
  { title: 'スタートアップと大企業、どちらでエンジニアとして成長できますか？', body: '技術力とキャリアアップの観点から教えてください。' },
  { title: '次に流行るプログラミング言語・フレームワークは何ですか？', body: '2025年以降のトレンド予測を教えてください。' },
  { title: 'Web3・ブロックチェーン開発は今からでも学ぶ価値がありますか？', body: '市場の縮小が指摘されていますが将来性はありますか？' },
  { title: 'コードレビューで何を見ればいいか教えてください', body: '良いコードレビューと悪いコードレビューの違いを教えてください。' },
  { title: 'テスト駆動開発は本当に効果がありますか？', body: 'TDDを採用している現場と採用していない現場の違いを教えてください。' },
  { title: 'アーキテクチャ設計で最も重要な考え方は何ですか？', body: 'マイクロサービスとモノリス、いつ移行すべきか判断基準を教えてください。' },
  { title: 'オープンソースへのコントリビューションはキャリアに有利ですか？', body: '日本のエンジニア転職市場でのOSS活動の評価について教えてください。' },
  { title: 'エンジニアリングマネージャーとテックリードの違いを教えてください', body: 'どちらのキャリアパスを選ぶべきか迷っています。' },
  { title: '技術的負債はどこまで許容すべきですか？', body: 'リファクタリングと新機能開発のバランスの取り方を教えてください。' },
  { title: 'ペアプログラミングは本当に効果がありますか？', body: '生産性が下がるという意見と上がるという意見があります。' },
  { title: '自社開発エンジニアとSES/受託開発エンジニアの違いを教えてください', body: '技術力やキャリアの観点から比較してください。' },
  { title: 'プログラミングの才能がある人とない人の違いは何ですか？', body: '向き不向きはどこで判断できますか？' },
  { title: '英語ができないエンジニアは将来的に不利になりますか？', body: 'グローバル化の中での日本人エンジニアの立ち位置を教えてください。' },
  { title: 'リモートワークはエンジニアの成長に影響しますか？', body: 'オフィス勤務とリモートワーク、どちらが技術力向上に良いですか？' },
  { title: 'ChatGPTやClaudeを使ったコーディングの注意点を教えてください', body: 'AIに頼りすぎると自分のスキルが落ちますか？' },
  { title: '副業でフリーランスエンジニアとして成功するコツを教えてください', body: '案件獲得から単価アップまでの方法を教えてください。' },
]

async function runTest() {
  console.log(`\n🚀 100問テスト開始 (tenant: ${TENANT_ID})\n`)

  const results: {
    no: number
    title: string
    score: number
    routed: string
    answer_preview: string
  }[] = []

  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const q = TEST_QUESTIONS[i]
    process.stdout.write(`[${i + 1}/100] ${q.title.slice(0, 40)}... `)

    try {
      // スラッグ生成
      const slug = `test-${Date.now()}-${i}`

      // 質問をDBに投稿
      const { data: question, error } = await supabase
        .from('questions')
        .insert({
          tenant_id: TENANT_ID,
          user_id: TEST_USER_ID,
          title: q.title,
          body: q.body,
          slug,
          ip_address: '127.0.0.1',
          status: 'open',
        })
        .select('id')
        .single()

      if (error || !question) {
        console.log('❌ DB insert error:', error?.message)
        continue
      }

      // Groqでスコア付き回答を取得
      const { askWithScore } = await import('../src/lib/gemini')
      const result = await askWithScore(TENANT_ID, `${q.title}\n\n${q.body}`)

      // 結果をDBに反映
      if (result.routed === 'ai') {
        await supabase.from('answers').insert({
          question_id: question.id,
          tenant_id: TENANT_ID,
          body: result.answer,
          is_ai: true,
          ai_score: result.score,
        })
        await supabase
          .from('questions')
          .update({ status: 'ai_answered', ai_score: result.score })
          .eq('id', question.id)
      } else {
        await supabase
          .from('questions')
          .update({ status: 'open', ai_score: result.score })
          .eq('id', question.id)
      }

      results.push({
        no: i + 1,
        title: q.title,
        score: result.score,
        routed: result.routed,
        answer_preview: result.answer.slice(0, 50),
      })

      console.log(`score=${result.score} → ${result.routed === 'ai' ? '🤖 AI回答' : '👤 人間へ'}`)

      // Groqのレートリミット対策（1秒待機）
      await new Promise((r) => setTimeout(r, 1000))
    } catch (e: any) {
      console.log(`❌ Error: ${e.message}`)
    }
  }

  // 結果サマリー
  const aiCount = results.filter((r) => r.routed === 'ai').length
  const humanCount = results.filter((r) => r.routed === 'human').length
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

  console.log('\n===== テスト結果サマリー =====')
  console.log(`総問数: ${results.length}`)
  console.log(`AI回答: ${aiCount}問 (${Math.round((aiCount / results.length) * 100)}%)`)
  console.log(`人間へ: ${humanCount}問 (${Math.round((humanCount / results.length) * 100)}%)`)
  console.log(`平均スコア: ${Math.round(avgScore)}`)
  console.log('==============================\n')

  // CSVで出力
  const csv = [
    'No,タイトル,スコア,ルーティング',
    ...results.map((r) => `${r.no},"${r.title}",${r.score},${r.routed}`),
  ].join('\n')

  const fs = await import('fs')
  fs.writeFileSync('test-results.csv', csv, 'utf-8')
  console.log('📄 test-results.csv に出力しました')
}

runTest().catch(console.error)

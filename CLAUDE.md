@AGENTS.md

# Wisdom Assemble - Claude向けプロジェクト情報

## プロジェクト概要
マルチテナントQ&Aプラットフォーム。AIが先に回答し、答えられない場合は人間の専門家にマッチングする。
「AIの隙間を人間が埋める」コンセプト。

## ビジネスモデル
- ジャンル別サブドメイン（例: debug.wisdomassemble.com）
- 20〜100サイト展開予定
- 収益（優先順）: Google AdSense（メイン）> アフィリエイト ASP（サブ）> 投げ銭（補助）
- **投げ銭（チップ）機能**: 質問者がベストアンサー選択後に専門家へチップを送れる
  - Stripe Connect を使用
  - 専門家 90% / プラットフォーム 10% の手数料モデル
  - donations テーブルで管理（donor_id・recipient_id・question_id・amount・platform_fee）
  - 「使い方」ページ・利用規約・FAQへの文言追加も必要
- アフィリエイト: ASP登録（A8.net・もしもアフィリエイト等）してリンクを貼るだけ、カスタム追跡システムは不要

## 技術スタック
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS
- Groq API (llama-3.3-70b-versatile) for AI answers
- Cloudflare Pages（デプロイ先）※ Vercel は使わない

## セッション管理ルール
- 開発のキリがいいタイミングで**セッションを切り替える**
- セッション切り替え前に必ず **CLAUDE.md を最新状態に更新**してコミットする
- Notionの開発ログ・バグトラックも同時に更新する
- 次セッション開始時は「Wisdom Assembleの続きです。○○から始めてください」で再開

## 重要ポリシー
- 📘 **新しいテナントを作るときは、着手前に必ず Notion「テナント作成マニュアル」を読むこと**（https://app.notion.com/p/Wisdom-Assemble-3bdf5fa8bcb981a28bffc084f459fae3）。手順の全体像・毎回ミスる11項目・確認コマンド・初期コンテンツの作り方が1ページにまとまっている。**テナントビルダーの実装依頼文にも同じ指示が入る**ので、Claude側でも必ず参照される
- **セキュリティ・有料サービスは必ず事前に確認してから進める**
- **認証はGoogleログインのみ** - 個人情報を自社で持たない方針（テスト用メールログインは削除予定）
- **service_roleキーは絶対に公開しない**（RLSをバイパスするため）
- バグ・懸念事項はNotionバグトラックに最新が上になるよう追記
- 開発ログはNotionに定期的にアーカイブする
- **RLS回避が必要なAPI routeは必ずservice_roleクライアントを使う**
- **高難度移行ボタンは2回目の回答者（matched_c）が存在 かつ 回答済みの場合のみ表示**（絶対ルール）

## 本番デプロイ手順
- **Cloudflare WorkersがGitHub連携（Workers Builds）で`main`ブランチを監視しており、`git push origin main`するだけで自動ビルド・自動デプロイされる**
- `npm run deploy`（wrangler CLI直接デプロイ）は**使わない・使えない**。ローカルのwranglerはCloudflareにログインしておらず`CLOUDFLARE_API_TOKEN`も未設定のため、実行すると`wrangler login`を要求されて失敗する（2026-07-11に発生・原因判明済み）
- 手順は常に: ①コード修正 → ②`git add`＋`git commit` → ③`git push origin main` → ④Cloudflareダッシュボード（Workers & Pages → wisdom-assemble → Deployments）で自動デプロイの進行を確認、これだけでよい
- ユーザーから「基本、修正は本番環境にデプロイしていいですよ」と2026-07-11に明示的な標準許可を得ている。緊急性の低いUI微修正等は確認を挟まずcommit→pushしてよい（大規模な変更やDBスキーマ変更など影響範囲が大きいものは念のため一声かける）

## Notionドキュメント
- バグトラック page_id: 38af5fa8-bcb9-802c-862b-dd515be9f586
- 開発ログ page_id: 38af5fa8-bcb9-80d1-ac24-d3b3478d0fde
- 基本用語 page_id: 38af5fa8-bcb9-80a7-8b9b-da2f6d7064ae
- プロジェクト仕様書 page_id: 38af5fa8-bcb9-8065-9ccb-c55550c8d4ed
- **ローンチタスクチェックリスト page_id: 390f5fa8-bcb9-80c6-bacb-f23143389627**
- **テナント作成マニュアル page_id: 3bdf5fa8-bcb9-81a2-8bff-c084f459fae3**（2026-08-15新設・新テナントを作るときはまずこれを読む）
  https://app.notion.com/p/Wisdom-Assemble-3bdf5fa8bcb981a28bffc084f459fae3

## Supabase
- URL: https://scnkpmxvtwtsxzbhfdnf.supabase.co
- プロジェクト名: wisdom-assemble

## Google OAuth
- Client ID: 1004222264906-2nlc88pq3irlve65ul8b95ju5mbbm3ns.apps.googleusercontent.com
- テストユーザー: wisdomassemble@gmail.com

## テストアカウント（開発用・リリース前削除）
※パスワードはリポジトリに書かない（公開リポジトリのため。2026-08-15に直書きを削除）。必要ならSupabaseのAuth画面で確認する
- wisdomassemble@gmail.com（オーナー・Googleログイン）
- takeshi@test.com / yuki@test.com / ryo@test.com / mia@test.com / shin@test.com
- hana@test.com / ken@test.com / aoi@test.com / taro@test.com / noa@test.com / john@test.com / anthony@test.com

## 開発進捗

### ✅ フェーズ①② 完了 + フロントエンドテスト完了（2026-06-30時点）
- Supabase DB設計・RLS・マイグレーション
- Next.js マルチテナント基盤
- 質問投稿・一覧・詳細ページ
- Google OAuth + メールログイン（メールはリリース前削除）
- Groq API AI自動回答（llama-3.3-70b-versatile）
- スキルタグ×回答数スコアリングによるマッチング（B→C→hard昇格）
- 質問投稿後オーバーレイアニメーション（AIが考え中 / マッチング中）
- 投稿後バナー（AI回答 / マッチング成功 / 受付中）
- 重複回答防止（同一ユーザーは1回のみ）
- オーナー向け段階的アクション（別メンバーに依頼 / 高難度移行）
- マイページ：あなたへの依頼タブ・回答が届いた質問タブ・メール通知トグル
- ヘッダーバッジ（依頼数 + 未読回答数、既読で消える）
- owner_reviewed_at による既読管理（service_role API経由）
- 一覧でマッチングユーザーに「あなたに依頼」バッジ表示
- RLS回避：escalate/review/admin系はservice_role使用
- findMatch のnot inフィルター修正（UUID引用符バグfix）
- **モバイルヘッダー：ハンバーガーメニュー（Tailwind v4 sm:非対応→JSのwindow.innerWidth判定）**
- **表示名デフォルト：「ユーザー#{UUID先頭6文字}」自動生成、デフォルト時に案内文表示**
- **管理者ページ：質問/ユーザー検索、BAN/解除トグル（自分BANは不可）、slug修正**
- **高難度ページ：未解決/解決済みタブ分け・解決時間表示**
- **重複質問チェック：解決済みのみ対象（.eq('status','solved')追加）**
- **高難度ヘッダーバッジ：localStorage既読管理・赤ポッチ表示**
- 管理者アカウントis_available=false設定済み（質問を受け取らない）
- **No.28 マッチングロジック重み付きランダム選択（weightedRandom実装・SCOREオブジェクトで定数化）**
- **No.27 回答実績タグ自動蓄積（ベストアンサー時にanswered_tagsに追記）**
- **No.29 称号システムUI（マイページに称号バッジ・rarity別カラー・active_title自動設定）**
- **称号を質問詳細ページの回答者名横にも表示（active_title_id → titles JOIN）**
- **バグ修正：hardBadge グローバル→per-user（localStorage key: hard_seen_at_${uid}）**
- **バグ修正：NEWバッジ StrictMode2重実行→setTimeout(1000)+cleanup cancelパターン**
- **バグ修正：user_titles / titles テーブルのRLSポリシー・GRANT追加**

### 🔜 フェーズ③ 次回から

**⚠️ 次セッション開始前の必須作業：なし**

### ✅ 称号システム v2 完了（2026-07-05）
- 25種称号（回答7・高難度7・質問投稿4・質問解決済み7）
- scripts/titles-v2.sql 実行済み（Supabase本番DB適用済み）
- profiles に question_count / solved_question_count カラム追加済み
- increment_question_count / increment_solved_question_count RPC追加済み
- check_and_award_titles 関数更新済み
- マイページ：称号クリックで表示称号選択UI
- マイページ：「解決した回答」アーカイブタブ追加
- トップページ：1ページ50件表示・スティッキー検索バー（top-[73px]）
- 管理画面：スティッキー検索バー（top-[73px]）

### ✅ 期限切れUXテスト #1-#16・ベストアンサー選択 全項目PASSで完了（2026-07-05）
- Notion テスト⑦: https://app.notion.com/p/Wisdom-Assemble-UX-390f5fa8bcb981a5a33fdc749975a099
- **バグ修正①**：期限切れ後、B本人以外の一般ユーザーにも「現在、専門家にマッチング中です」が表示され続けていた。`src/app/questions/[slug]/page.tsx` のマッチング待ち表示条件に `(alreadyAnswered || !bExpired)` / `(alreadyAnswered || !cExpired)` を追加して修正
- **バグ修正②**：ヘッダー／マイページの「あなたへの依頼」バッジが期限切れ後も消えなかった。`Header.tsx`・`src/app/profile/page.tsx` のタスク集計クエリに期限切れ除外フィルターを追加
- #13（C候補なし→即hard昇格）はClaudeがAPIを直接叩いて検証。テストで一時変更したis_availableは全員trueに復元済み

### ✅ ドメイン取得・Cloudflare Workers本番デプロイ完了（2026-07-06）
- `wisdomassemble.com` をCloudflare Registrarで取得（年間$10.46・自動更新オン）
- `@opennextjs/cloudflare` アダプターを導入（`wrangler.jsonc`・`open-next.config.ts`追加）。Next.js 16対応、Cloudflare Workers上で動作
- GitHubリポジトリ（wisdom-assemble/wisdom-assemble）とCloudflare Workers Buildsを連携。mainブランチにpushすると自動デプロイ
- Build command: `npm run build` / Deploy command: `npm run deploy`
- 暫定URL: https://wisdom-assemble.wisdomassemble.workers.dev （まだカスタムドメイン未接続）
- **ハマったポイント**: Cloudflare Workers Buildsの「Build variables」（ビルド時のみ有効）と、Worker本体の「Settings > Variables and secrets」（実行時に必要）は別物。最初Build variablesだけ設定して500エラーになった。両方に同じ4つの環境変数（NEXT_PUBLIC_SUPABASE_URL・NEXT_PUBLIC_SUPABASE_ANON_KEY・SUPABASE_SERVICE_ROLE_KEY・GROQ_API_KEY）を設定する必要がある
- `tsconfig.json`から`scripts/`を除外（本番ビルドが検証用スクリプトの型エラーで落ちていたのを修正）
- **重大バグ修正**: デプロイ直後、サイト全体でデータが0件になる障害が発生（高難度一覧が空・質問詳細404等）。`middleware.ts`の`response.headers.set()`では下流のServer Componentsに実際にはヘッダーが伝わっておらず、`tenant.ts`の本番ロジックがホスト名の最初のセグメント（`wisdom-assemble.wisdomassemble.workers.dev`の場合「wisdom-assemble」）をそのままテナントIDにしていたため、テナント不一致で全クエリが空になっていた。middlewareで`request.headers`自体を書き換えて`NextResponse.next`に渡す方式に修正し、`tenant.ts`はmiddlewareが検証済みの`x-tenant-id`ヘッダーを信頼するだけに単純化して解決

### ✅ カスタムドメイン接続・Google/Supabase Auth本番設定完了（2026-07-06）
- Workerの「Domains」タブから`wisdomassemble.com`をゾーンとしてOnboardし、Custom Domainとして`debug.wisdomassemble.com`を追加（他テナントも同じ手順で追加可能）
- Google Cloud ConsoleのOAuthクライアント「承認済みのJavaScript生成元」に`https://debug.wisdomassemble.com`を追加（リダイレクトURIはSupabase自身のコールバックを使うため変更不要）
- Supabase AuthのRedirect URLsに`https://*.wisdomassemble.com/**`を追加
  - **ハマったポイント**: 最初`https://*.wisdomassemble.com/auth/callback`（末尾ワイルドカードなし）で登録したところ、アプリ側が`?next=...`のクエリパラメータ付きでredirectToを送るため一致せず、Site URL（`http://localhost:3000`）にフォールバックしてログイン後localhostに飛ばされるバグが発生。末尾を`/**`にして解決
- `debug.wisdomassemble.com`でGoogleログイン・データ表示とも動作確認済み

### ✅ ドメイン表記統一・favicon動的化・GENRE_CONFIG不一致修正（2026-07-06）
- テナントごとに動的favicon生成（`icon.tsx`がテナントのname・color_themeから自動生成、debugテナントのみ完了・他9テナントは中身待ち）
- `TENANT_NAME_MAP`をテナント名ベース→テナントIDベースに変更（DBの名前に補足が付くと一致しないバグを修正）
- `gemini.ts`の`GENRE_CONFIG`キーが実テナントIDと不一致（tax→tax-japan、workingholiday→australia-whv、migration→bali/chiangmai/portugal/philippines/canadaの5つに複製）で専用AI設定が効いていなかったバグを修正
- スコープ判定拒否時のエラー文言のハードコードをテナント共通文言に修正
- 古いドメイン表記`wisdom-assemble.com`（ハイフンあり）が`contentFilter.ts`（外部URL自動ブロック除外規則）・`layout.tsx`・本ファイルに残っていて、自サイトへのリンクまでブロックされるバグを修正。正しい`wisdomassemble.com`に統一
- 禁止ワード（スパム・連絡先ブロック）は管理画面化せず、都度コードに追加してデプロイする運用で確定
- 詳細は Notion「テナント作成ワークフロー」ページ: https://app.notion.com/p/Wisdom-Assemble-394f5fa8bcb9806eb516f9430b35e4e6

### ✅ Brevoメール設定完了・マッチング通知/問い合わせフォーム実装（2026-07-08）
- Brevoアカウント作成（無料プラン・wisdomassemble@gmail.com）
- `wisdomassemble.com`のドメイン認証完了。CloudflareにBrevo code(TXT)・DKIM1/DKIM2(CNAME)・DMARC(TXT)の4レコード追加、即Authenticated。送信者`noreply@wisdomassemble.com`を追加
- APIキー発行、Cloudflare WorkerのSecret環境変数`BREVO_API_KEY`として登録
- `src/lib/email.ts`新規作成：Brevo Transactional Email API(`v3/smtp/email`)を叩く共通関数。`notifyMatchedUser()`（マッチング通知）と`sendContactInquiry()`（問い合わせ転送）を実装
- `questions/route.ts`・`escalate/route.ts`に`notifyMatchedUser`を組み込み。質問がB/Cにマッチング、またはエスカレーションでCに割り当てられた際、`profiles.email_notify=true`のユーザーに通知メール送信
- 問い合わせフォーム(`/contact`)を`mailto:`リンク（宛先メアドが見えてしまう）から`/api/contact`経由のBrevo送信に変更。`replyTo`にユーザーメールを設定し、返信すればそのまま届く
- **コードレビューで2件検出・修正**：①質問タイトルをエスケープせずHTMLメールに埋め込んでいた（HTMLインジェクション対策で`escapeHtml`追加）②Cloudflare Workersでfire-and-forget送信だと処理が打ち切られる恐れがあったため`await`に変更
- 本番デプロイ後に実地テスト。問い合わせフォーム→実際に`wisdomassemble@gmail.com`に届き開封確認・返信テストも成功。マッチング通知→質問投稿してBにマッチング、Brevo Logsで送信ログ確認（テストアカウント`ken@test.com`は実在しないためSoft bounceだが、送信ロジック自体は正常動作を確認）
- GitHub commit: `caf530f`「feat: Brevoによるマッチング通知メール実装」・`31f1d88`「feat: 問い合わせフォームをBrevo経由の送信に変更」をmainにpush、Cloudflare Workers Buildsで自動デプロイ済み

### ✅ 多言語対応・AdSense戦略の全設計完了（2026-07-08・実装はまだ）
- **優先8言語確定**（World人口の約45-48%カバー）: 英語・日本語・中国語（簡体字）・インドネシア語・ベトナム語・韓国語・スペイン語・ポルトガル語。留学/WHV/税金系ジャンルとの相性と「英語で代替しづらいか」を基準に選定（ヒンディー語・タガログ語は英語で代替しやすいため除外）
- **アーキテクチャ確定**: next-intlでURL prefix方式（localePrefix: 'always'、デフォルトロケールも含め常に/en・/jaを表示）。`profiles.language`（text型、Google locale自動取得はあくまで初期値の参考程度で、確定にはしない）。質問・回答は投稿時に8言語へ自動翻訳してDB保存（翻訳ボタン方式は不採用、SEO優位性のため）。翻訳は`llama-3.1-8b-instant`、AI回答は`llama-3.3-70b-versatile`と使い分けてコスト約10分の1に削減
- **言語選択UIの方針（2026-07-09修正）**: Google locale自動取得を「取得できたら自動確定」にはせず、**マイページで本人に明示的に言語を選ばせるUI**を用意する（ヘッダーではなくマイページに設置）。サブドメインのテナント一覧（debug/tax-japan/australia-whv/bali/chiangmai/portugal/dtm/keyboard/philippines/canada）は現状の開発用の暫定リストであり、正式なジャンルラインナップとしてはまだ確定していない点に注意
- **コスト試算**: 目標規模（100テナント×20問/日）で月額約$90〜140。Groq無料枠は1日約50問が上限のため支払い方法登録が必須。広告収益は月$300〜1,800程度の見込みでカバー可能性大
- **セキュリティ・運用タスクを新規追加**: 質問投稿のレート制限（1ユーザー1日3件まで、既存`rate_limits`テーブルは未使用と判明）・文字数制限の言語別調整・不審ユーザー自動検知→Brevoアラートメール
- **実装優先順位を5フェーズに再構成**（詳細はNotionローンチチェックリスト最上部）:
  1. 基盤固め: Brevo(完了)→多言語対応→ドネーション
  2. コンテンツ: AdSense審査用2テナント＋20問（人間回答版含む）＋ルートドメインTOP＋プラポリ事業者名記載
  3. マネタイズ: その2テナントでAdSense申請（アフィリエイトは承認が下りるまで追加しない）→アフィリエイト
  4. ローンチ拡大: 残り8テナント追加（合計10、承認後なので再審査不要）＋20問×8
  5. 告知: Hacker News・Reddit等
- **AdSense審査対策**: 事業者名非開示・AI回答中心・コンテンツ薄いままだと審査通過リスクが高いと判断。ルートドメインのプラポリに事業者名記載・人間回答版の質問を混ぜる・少数精鋭（2テナント）で先に審査を通す方針に修正
- 詳細・全設計はNotionローンチチェックリスト参照。今回は設計のみで実装はまだ着手していない

### ✅ 質問投稿レート制限 実装完了（2026-07-09）
- Notion仕様（グローバル1日10件・全テナント横断＋テナント別1日3件の二段構え）に基づき実装
- 旧`rate_limits`テーブル（ip_address+tenant_idのみでコード側から一切未参照）を`user_id + scope`（'global'またはtenant_id）構成に再設計
- `check_and_increment_rate_limit(p_user_id, p_tenant_id)` RPCを追加（security definer、24時間ウィンドウでリセット、グローバル/テナント別を同一トランザクションでアトミックに判定・カウント）
- `supabase/migrations/20260709000001_rate_limits_v2.sql`をSupabase本番DBに適用済み
- `src/app/api/questions/route.ts`の認証直後・バリデーション前にRPC呼び出しを追加、上限超過時は429エラー
- 本番DBでSQL Editorから`check_and_increment_rate_limit`を4回連続呼び出して動作確認（1〜3回目true・4回目false）。テストで使ったカウントは削除済み

### ✅ 多言語対応 実装完了（2026-07-09）
- next-intl v4導入、優先8言語（en/ja/zh/id/vi/ko/es/pt）すべて対応。`localePrefix: 'always'`で常に`/en`等のURLプレフィックス付き。共通コンポーネント・全主要ページ・利用規約/プライバシー（免責条項付き、日本語版が正文と明記）まで翻訳キー化完了
- マイページに言語選択UIを実装（`profiles.language`カラム、選択は即時反映・保存ボタン不要）。Google locale自動取得はあくまでヒントで、本人の明示選択が確定値
- 質問・回答は投稿時に`llama-3.1-8b-instant`で8言語へ自動翻訳しDB保存（`title_i18n`/`body_i18n`、`source_locale`で元言語を記録）。テナントの`description_i18n`（タグライン）も同様にJSONBで多言語化
- **重大バグ修正（根本原因・解決済み）**: 言語切替後、ソフトナビゲーション（Linkクリック等）で遷移すると一部の文言（ページ本文のサーバーコンポーネント部分）だけ既定言語(英語)に戻って見える不具合があった。原因は`middleware.ts`で、テナントID解決後にリクエストヘッダーを丸ごと作り直しており、next-intlミドルウェアが設定する`X-NEXT-INTL-LOCALE`ヘッダー（レイアウトが再実行されない場合に`getLocale()`/`getTranslations()`が読みに行くフォールバック値）が下流に伝わっていなかったこと。`x-tenant-id`をintlミドルウェア呼び出し**前**にリクエストヘッダーへ設定し、next-intl側のヘッダー複製に相乗りさせる形で解消（コミット`ce6a6fe`、本番で動作確認済み）
- 途中で試した「フルリロード化」「`staleTimes.dynamic=0`」「Link `prefetch={false}`」は対症療法で、いずれも根本解決には至らなかった（副作用はないため残置）
- 注意: サブドメインのテナント一覧（debug/tax-japan/australia-whv/bali/chiangmai/portugal/dtm/keyboard/philippines/canada）は開発用の暫定リストで、正式なジャンルラインナップとしてはまだ確定していない。タグライン文言等で勝手にジャンルを統合しないこと

### ✅ 運営支援Ko-fi実装・多言語まわりの既存バグ修正・投げ銭機能の設計確定（2026-07-10）
- **Ko-fi応援ボタン実装完了**: `ko-fi.com/wisdomassemble`でPayPal連携・本人確認済み。使い方ページの「質問してみる」ボタン群の下に控えめに設置（フッターは文脈がなく訴求力に欠けるため撤回）。8言語対応
  - 注意: PayPalは現在パーソナルアカウント。不特定多数からの支援受取は規約上ビジネスアカウント推奨（手数料はほぼ同水準）なので後でアップグレード必要
- **重大な誤実装からの方針修正**: 当初「投げ銭機能」をKo-fiの運営支援リンクと誤解して実装してしまった（コミットa9fd260、revert済み）。正しい仕様は**質問者→専門家への個別チップ**（CLAUDE.md冒頭のビジネスモデル節に明記されていた）。今後同様の作業前は必ずCLAUDE.mdの該当セクションを確認すること
- **投げ銭（チップ）機能の設計確定**: Stripe Connect Express採用。ベストアンサー選択後にダイアログ表示→カード決済→`on_behalf_of`設定で決済手数料(約3.6%)を専門家側(90%)から差し引き、運営取り分(10%)は満額keep。専門家はStripeホスト型オンボーディングで口座情報を直接入力（運営は一切保持しない）。詳細な文言案・懸念事項はNotionローンチチェックリスト「専門家への投げ銭（チップ）機能」セクション参照
  - **未解決の法的懸念**: 資金決済法上の資金移動業に該当するか確定情報が取れておらず、実際の決済有効化前に専門家（弁護士・税理士）へ要相談
  - **Stripe Connect自体の審査リスク**: 個人開発者は「アグリゲーション」（禁止業種）と判定され差し戻される実例あり。AdSense同様サイトの実態を見て審査されるため、機能を完成させてから申請する方針
- **既存バグの発見・修正**（多言語対応の副産物として発覚）:
  - middleware.tsで`X-NEXT-INTL-LOCALE`ヘッダーが失われるバグの根本原因を修正（コミット`ce6a6fe`）
  - ブラウザタブタイトルがDBの生の日本語`name`のままだったのを英語表記(`TENANT_NAME_MAP`)に統一
  - `/icon`・`/opengraph-image`がロケールリダイレクトに巻き込まれ404していたバグを修正（debug/bug両方で発生していた全テナント共通の不具合だった）
  - 称号（バッジ）25種の名称が未翻訳だったのを8言語対応（`messages/*.json`の`titles`ネームスペース）
- **bugサブドメイン運用開始**: Cloudflare Custom Domain登録・DNS反映済み。`bug.wisdomassemble.com`が正式な公開用URL（今後はこちらを使っていく）
- **2つ目のAdSense/Stripe審査用テナントを`dtm`（音楽制作）に決定**（2026-07-10）。理由: 留学/税金/ビザ系はYMYL（Your Money or Your Life）に該当しAdSense審査基準が厳しく、AI生成サンプルでの正確性リスクも高いため見送り。dtmはYMYL非該当かつユーザー自身が実体験で内容検証しやすい

### ✅ 夜間作業完了（2026-07-10未明・ユーザー就寝中に実施、コミット`8e316e3`）
- **BUGテナント用サンプル質問25件を生成**（解決済み20件＋高難度(未解決・公開)5件）。`scripts/seed/generate_bug_sample_questions.py`で生成し、実行結果を`scripts/seed/bug_sample_questions.sql`として保存。**このSQLはまだ実行していない**（DB投入は毎回Supabase SQL Editorでユーザーが手動実行する運用のため）。既存の質問投稿者(`43069043-...`)・回答者(`6e196709-...`)のuser_idを再利用しているため、投入前に該当プロフィールが存在することを確認すること
- **ルートサイト（wisdomassemble.com）のポータルページを実装**: middleware.tsで`wisdomassemble.com`/`www.wisdomassemble.com`を特別な`root`テナントIDとして解決し、`PortalHome`コンポーネント（`src/components/PortalHome.tsx`）を表示。`TENANT_NAME_MAP`の全10ジャンルをカード表示し、`LIVE_TENANT_IDS`（現状`['debug']`のみ）に含まれるテナントだけリンク有効化、それ以外は「準備中」バッジで無効化。8言語対応（`portalPage`ネームスペース）
  - 新しいテナントのサブドメインが稼働したら`src/lib/tenantNames.ts`の`LIVE_TENANT_IDS`に追加すること
- **AdSense・Stripe Connect審査の必要項目チェックリストを作成**しNotionに追記（一般的な要件の調査結果であり確定情報ではない点に注意。特にStripe Connectの資金決済法上の懸念は専門家への相談が引き続き必要）
- ローカルdev環境の既知の制約（middleware.tsが実行されない）のため、ポータルページの多言語表示は一時的な検証用ルートを作って`headers()`呼び出しを追加することで動的レンダリングを強制し確認した（本番のhome page.tsxは元々`searchParams`・`getTenantId()`経由で動的レンダリングになるため問題なし）

### ✅ DTM/MUSIC PRODUCTIONテナント公開・命名ルール確定・投げ銭の法務対応方針（2026-07-10）
- BUG・DTMともサンプル質問(各25件)をSupabase SQL Editorで実行し投入完了
- **命名ルール新設**: 公開サブドメインはテナント表示名（`TENANT_NAME_MAP`）に合わせ、複数単語はハイフン区切りにする（`tax-japan`と同様）。dtmの公開サブドメインは`music-prod.wisdomassemble.com`（`musicprod`から修正）、表示名は省略しない`MUSIC PRODUCTION`に確定。Cloudflare Custom Domain追加済み・`LIVE_TENANT_IDS`にも追加しポータルで有効化済み
  - 参考: 「dtm」は和製英語で海外では通じない（本家DTMは独ツーリングカーレース等を指す）。表示名は最初から`MUSIC PRODUCTION`等の英語表記にしていたため実害なし
- **投げ銭機能の特定商取引法対応方針が確定**: ユーザーが専門家に依頼して作成した法務まとめ資料（`~/Downloads/投げ銭機能 法的記載事項まとめ.md`）により、投げ銭は特定商取引法の表示義務対象になる可能性が高いと判明。事業者名・住所・電話番号の常時公開は避け、「開示請求ベースの省略」＋バーチャルオフィス（候補: GMOオフィスサポート月額660円〜）＋050番号（050plus/SMARTalkは共にサービス終了済み、現在は基本料0円+従量課金タイプが主流）で対応する方針。**もっと安いサービスがないか引き続き調査中**
- **フェーズ順序を再確定**: ①直近はAdSense申請用バージョンを完成させる（対象はルートサイト＋BUGテナントのみ、DTMは含めない）②そのバージョンでGoogle AdSenseとStripe Connectを両方申請する③Stripe Connect申請が承認されたら投げ銭機能の実装に着手する（「機能を作らなくても申請できる」という情報があり、実装より先に申請を進める順番に変更）

### ✅ AdSense申請準備 進捗（2026-07-10）
- ルートポータルにAboutセクション追加・sitemap.xml実装（未翻訳ロケール除外で174件）・質問詳細ページにパンくずリスト実装・プライバシーポリシーにGoogle広告Cookie開示文言追加・ナビゲーション/モバイル表示確認・特定商取引法ページはAdSense申請には不要と確認、すべて完了・本番デプロイ済み
- debugテナントの旧テストデータ重複32件を検出、削除SQL(`scripts/seed/cleanup_debug_duplicates.sql`)を用意済み（実行はユーザー判断で後日まとめて対応、**未実行**）
- BUG・MUSIC PRODUCTIONの質問一覧をNotionにページ化: [BUG](https://app.notion.com/p/399f5fa8bcb9811e85bacfc0a91ea024) / [MUSIC PRODUCTION](https://app.notion.com/p/399f5fa8bcb981d5b954cdc01ba028d9)

**⭐今後の方針（2026-07-10確定・最重要）**: 「①AdSense・Stripe Connect申請用バージョン作成」と「②Stripe Connectの投げ銭機能の実装」は明確に別フェーズ。今はまだ①（申請用バージョンのクオリティを上げる段階）。②の投げ銭機能のコード実装は、Stripe Connectの審査が通ってから着手する。

### ✅ ルートポータルのAdSense審査向け作り込み・ロゴ全面刷新（2026-07-11）

**ルートポータルをAdSense審査用に簡素化**
- 10ジャンル分の検索付きグリッドは審査の混乱を避けるため、実際に稼働中の2テナント（BUG DEBUG / MUSIC PRODUCTION）のみのカード表示に変更。残り8ジャンルはジャンル名を出さない汎用の「Coming soon」枠1つにまとめた
- 各カードは実際のロゴ（`SiteLogo`、DBの`color_theme`をその場で取得）＋一言説明（`portalPage.debugCardTagline` / `dtmCardTagline`、8言語）を表示
- 検索バー自体は`PortalTenantSearch`（新規、`PortalGenreGrid`は将来の再拡大用に未使用のまま残置）で維持。`TENANT_SEARCH_TAGS`（8言語ぶんのキーワード）で検索可能
- 「Wisdom Assembleについて」を常時表示から、共通`Footer.tsx`の「利用規約」の左（アンダーラインなし）のリンク＋クリックでオーバーレイ表示に変更。`Footer`に`about`propを追加し、`layout.tsx`がテナントIDが`root`の時だけ内容を渡す
- 「About」があった場所には、マイページと同じ見た目・並びの言語選択（`PortalLanguageSwitcher`、8言語ピルボタン、選択でフルリロード遷移）を設置
- サブタイトルの文字サイズを一回り小さく（`text-sm`）

**ルートサイト専用ロゴ（WISDOM ASSEMBLE）を新調**
- Sample Logo builder（Artifactツールで作成した100種の見本カタログ＋組み合わせビルダー）でデザインを検討し、以下の仕様で確定：Georgia serif・Two-tone split（`#929292`→`#606060`グラデーション）・letter-spacing 0.20em・font-weight 800・TM（未登録商標）表記付き
- `WisdomAssembleWordmark`コンポーネントとして切り出し、ルートポータルの見出しだけでなく**共通Header・ログインページでも使用**（後述のバグ修正参照）
- ルート専用favicon（`src/app/icon.tsx`）も実装。当初フラットな「W」だったが、明朝体（Shippori Mincho）が良いとの指示でGoogle Fontsから実データを取得しImageResponseに埋め込む方式に変更（`next/og`はシステムフォントを描画できないため）

**MUSIC PRODUCTIONテナント専用ロゴ**
- `SiteLogo.tsx`にテナントごとのロゴスタイル上書き機構（`LOGO_STYLE_OVERRIDES`、`src/lib/tenantNames.ts`）を追加。dtmのみGeometric Modernフォント（Century Gothic/Futura）・`#74a7fe`→`#606060`グラデーション・letter-spacing -0.05emを適用（他テナントは既存の3D押し出しのまま）
- dtmの`color_theme`を青系(`#2563EB`)に変更するSQLを用意（`scripts/seed/update_dtm_color_theme.sql`）。**まだ未実行**、Supabase SQL Editorでユーザーが実行する必要あり

**全ロゴにTM表記追加**
- `SiteLogo.tsx`にtspanで実際の文字幅の直後にTM表記を追加。共通コンポーネントなので既存・将来の全テナントに自動適用される

**バグ修正の連鎖（ロゴ関連、教訓として重要）**
1. ルートページでBUG DEBUGの色が正しく出ない → 原因はSiteLogoのメインテキストが`fill="var(--color-primary)"`という**ページ全体で1つしか値を持てないCSS変数**を参照していたため（各テナント自身のサブドメインでは偶然一致するので気づきにくい）。`colorTheme`プロパティを直接使うよう修正
2. ロゴがカードからはみ出す → SVGの`width`を固定pxで指定していたため。`max-width:100%; height:auto`でレスポンシブに（ただし3D押し出し分岐にだけ付け忘れる再発あり、両分岐に適用して解決）
3. センタリングされない → 外側の`<span>`が`flex`（block相当）で親の幅いっぱいに広がり中身が左寄せのままだった。`inline-flex`+`justify-center`に修正
4. それでも中央に見えない → SVG内部のテキストは`x=0`の左端揃えのまま、文字数から概算した（実際より広い）viewBoxの中に描画されていたため、箱自体は中央でも文字が左に寄って見えていた。`text-anchor="middle"`で対処 →
5. **しかしtext-anchor="middle"が3D押し出し6層の見た目を崩す（二重に見える）副作用があり、この方式は撤回**。最終的にはcanvas.measureTextで実測したフォント幅（Impact系: 約0.494em/文字、Century Gothic系: 約0.70em/文字）でviewBoxの幅を文字幅にきつく合わせることで、x=0の左端揃えのまま自然にセンタリングされるようにした
6. `/terms` `/privacy` `/contact`等、ルートドメイン配下の全ページで使われる共通Headerとログインページ（`/auth/login`）が、テナント不在時にSiteLogoのデフォルト（3D押し出し・indigo色）にフォールバックしていた → 両方とも`WisdomAssembleWordmark`に切り替え。判定用に`TenantProvider`へ`useTenantId()`を追加（テナントDBレコードがnullになるケースと区別するため、生のtenantId文字列を別contextで持つ）
7. ルートドメインには質問投稿・高難度・ログインといったテナント固有機能がないため、Headerのナビ（使い方/高難度/ログイン）もルートでは非表示にし、ロゴのみのシンプルなヘッダーにした

**教訓**: ロゴ関連の見た目の変更は、ローカルでは`middleware.ts`が実行されないため`x-tenant-id`ヘッダーを直接付けたcurlや一時テストルートでの確認が必須（特に本番でのみ再現するCSS変数スコープの問題は、実際にルートテナント＝テナントレコードnullの状態で確認しないと気づけない）。

**次にやること（確定）**:
①ルートサイト＋BUG＋MUSIC PRODUCTIONをAdSense・Stripe Connect申請用バージョンとして仕上げる（品質を上げる段階。ads.txtはAdSense登録後、重複データ削除はユーザー判断のタイミングで）
②Google AdSense・Stripe Connectを申請（ユーザーのアクション）
③Stripe Connect承認後に投げ銭（チップ）機能の実装に着手

**次セッションでやること（2026-07-11時点でユーザーから指示済み）**:
1. ルートページのスマホでのデザインズレを直す
2. ルートページの文言整理
3. 各テナント（BUG・MUSIC PRODUCTION）側の同様の修正・仕上げ
4. AdSense申請のためのバージョンとしてレビューできる状態まで持っていく

**リリース前必須**
1. Googleログインのみに絞る（メールログイン削除・テストアカウント削除）
2. テストデータ削除・本番DBクリーンアップ
3. 回答最小文字数バリデーション（20文字以上、AnswerForm + API両方）
4. 法的ページ内容精査（/terms /privacy /contact 内容の確認・修正）

**機能追加（優先度高）**
6. No.34 タグフィルター検索（questionsにtagsカラム追加済み・UIのみ実装残り）
7. No.26 質問下書き保存（localStorage）
8. **専門家への投げ銭（チップ）機能**（Stripe Connect）
   - donations テーブル設計・Stripe アカウント作成
   - 回答下に「チップを送る」ボタン UI
   - 専門家プロフィールに Stripe Connect 登録フロー
   - マイページに受取履歴
   - /how-it-works・利用規約・FAQ の文言更新

**フロントエンド未対応**
10. モバイル細かい修正（デプロイ後の実機確認後）
11. スケルトンローディング（デプロイ後に実機確認してから）
12. OGP画像対応（SNSシェア時のサムネイル）
13. 404・エラーページのデザイン

**インフラ**
14. ドメイン取得・Cloudflare 設定（wisdomassemble.com）
15. Cloudflare Pages 本番デプロイ（※ Vercel は使わない）
16. サブドメインマルチテナント本番確認

**実装済み（フェーズ②末）**
- ✅ 投稿直後に類似の解決済み質問を最大4件表示（status=solvedのみ対象）

### ✅ AdSense申請前バージョン 技術面完了（2026-07-13）

**質問投稿の自動翻訳が本番で100%失敗していた重大バグ修正（根本原因判明・解決済み）**
- ユーザーが「投稿しても翻訳されていない」と報告 → Cloudflare Workers Observability（Logs）を有効化し実際に投稿しながらライブログを確認、`translateToLocales: failed for locale=* Error: Groq translate API error: 429`が全ロケールでほぼ毎回発生していることを突き止めた
- 原因: タイトル・本文それぞれ最大7ロケール=14件のGroq翻訳リクエストを完全に無制限並行実行しており、Groqのレート制限に確実に引っかかっていた
- 1段階目の修正（コミット`e3cfde8`）: ロケール単位で同時実行数を2に制限 → それでも本番では6割前後が429で失敗（`askWithScore`等の他のGroq呼び出しと重なるため、ローカルの単体テストでは再現しなかった）
- 2段階目の修正（コミット`e6b8c18`）: 言語ごとの個別リクエストをやめ、**対応7言語ぶんを1回のGroq呼び出しでJSON形式にまとめて取得**する方式に変更（`response_format: json_object`）。タイトル・本文それぞれ1回、合計2回のGroq呼び出しに削減。本番で再テストしエラーゼロ・翻訳成功を確認済み
- `wrangler.jsonc`にObservability/Logs設定を永続化（コミット`2668240`、ダッシュボードでの一時トグルだと次回自動デプロイで消える可能性があったため）

**Cookie同意バナー（CMP）を8言語で新規実装**
- `src/components/CookieConsentBanner.tsx`・`src/lib/cookieConsent.ts`。画面下部固定、「同意する」/「必須以外を拒否」の2択＋プライバシーポリシーへのリンク。選択は`localStorage`に保存し以後表示しない
- **注意**: これはGoogle Funding Choices（AdSense公式CMP）ではなく自前実装。AdSenseの初回審査自体はこれで通る想定だが、EEA/UKユーザーに実際に広告配信する段階では、AdSense管理画面の「プライバシーとメッセージ」タブでFunding Choicesを別途有効化する必要がある（承認後にダッシュボードで設定するだけで追加コード実装は基本不要）。**承認後のタスクとして必ず対応すること**

**質問投稿できないバグ修正: LINE ID誤検知**
- MUSIC PRODUCTIONで「Linearカーブ」を含む質問が「個人の連絡先情報は投稿できません」で弾かれる不具合。原因は連絡先フィルターのLINE ID検出用正規表現が単語境界なしで`line`にマッチしており、`Linear`の部分文字列`Line`に誤反応していた
- `\bline\b`で単語境界必須にし、さらにコロンや@等の区切り記号を伴う実際のLINE ID共有パターンのみ検知するよう修正（`timeline`/`offline`/`underline`等のDAW・技術用語には反応しなくなった）

**得意なこと・検索キーワードの音楽用語タグが常に日本語表示だった不具合修正**
- `ミキシング`/`マスタリング`等がロケールに関係なく常にハードコードされた日本語で表示されていた。DB保存値・検索クエリ用のキーはそのまま維持しつつ、表示ラベルのみ`messages.skillTags`名前空間でロケールに応じて翻訳するよう修正

**APIルートのエラーメッセージを8言語対応**
- `/api`配下はnext-intlのミドルウェア対象外（`[locale]`配下に存在しないため）で、質問投稿・回答投稿・お問い合わせ・ベストアンサー選択・エスカレーションのエラーメッセージがロケールに関係なく常に日本語だった
- `src/lib/apiErrors.ts`を新設。next-intlが設定する`NEXT_LOCALE`クッキーを直接読み、`messages/*.json`の`apiErrors`名前空間からロケールに応じたメッセージを返す。`contentFilter.checkContent()`もハードコードされた日本語reasonの代わりに`reasonCode`を返す方式に変更し、呼び出し側で翻訳する構成に統一
- 管理者用API（`/api/admin/*`）は日本語話者の管理者のみ使うため対象外のまま

**称号の自動装備を「初回獲得時のみ」に変更**
- `check_and_award_titles()`が称号チェックのたび（質問投稿・回答のたび）に保有称号中で最もレア度が高いものへ**毎回強制上書き**しており、マイページで手動選択した称号が次のアクションで勝手に戻ってしまう仕様だった
- 未装備（`active_title_id IS NULL`）の場合のみ自動装備し、以降はユーザーの手動選択を尊重するよう変更（マイグレーション`20260713000001_titles_first_equip_only.sql`、Supabase SQL Editorで実行済み）
- マイページの称号選択ヒント文言に「選んだ称号は他のユーザーにも見えます」を追記（8言語）

**Aboutを「クリックでオーバーレイ表示」から独立ページ`/about`に変更**
- 従来は`aboutOpen`状態が`false`の間、モーダルの中身（サービス概要・運営体制の説明文）がDOMに一切存在せず、クローラーには「無いもの」として見えていた（Googlebotはクリック操作をシミュレートしないため）
- `/terms` `/privacy`と同じSSRパターンの静的ページに統一。`Footer.tsx`から`about` propを削除しシンプルなLinkに変更。ルートテナントの時だけリンク表示（非rootには出ない、確認済み）。sitemap.xmlのルート静的パスにも`/about`を追加

**AdSense申請向け文言追加（8言語）**
- プライバシーポリシーに運営者名（「本サービスは『Wisdom Assemble』として運営しています」）を追加。法人格・登記名までは不要、屋号レベルの名称で信頼性シグナルとしては十分と判断
- 利用規約に「AI自動翻訳の正確性は保証せず、翻訳に起因する誤解・損害について運営者は責任を負わない」旨の免責文言を追加
- 使い方ページに「質問・回答はAIにより自動翻訳され誤りを含む場合がある」「タイトル・本文の文字数制限は言語により異なる」旨の注記を追加

**質問一覧ページに`QAPage`構造化データ（schema.org）を実装**
- 既存の質問・回答データから動的にJSON-LDを生成（新規コンテンツ作成は不要）。ベストアンサーがあれば`acceptedAnswer`、なければ`suggestedAnswer`として出力。回答が1件も無い質問には出力しない。ユーザー投稿文中の`<`はエスケープしXSS/タグ崩れを防止。実データで動作確認済み
- FAQPageスキーマ（AdSense審査には無関係、純粋にSEO/リッチスニペット向け）は今回未実装、必要になったら対応

**デザイントンマナ統一（フォントサイズ・余白を全体的に一回り詰めた）**
- 質問一覧のページサイズを50件→25件に変更
- 質問一覧のタイトル文字を`text-base`→`text-sm`、行のpaddingを`py-4`→`py-2.5`
- 高難度一覧・マイページ各リスト（対応依頼/回答あり/投稿した質問等）も同じ`py-2.5`・`text-sm`に統一
- ヘッダーのナビ文字（使い方/高難度/マイページ/ログアウト等）を`text-sm`→`text-xs`
- ページネーションを一回り小さく・上の余白を`mt-8`→`mt-4`に詰める
- music-prod（dtm）の`color_theme`をロゴのC色に合わせて`#4A90E2`に変更（Supabase SQL Editorで実行済み、`PortalHome.tsx`のフォールバック値も同期）

**パンくずナビについて（判断・現状維持）**
- 「訪問履歴を蓄積表示する」案を検討したが、一般的なパンくずは閲覧履歴ではなくページの階層構造を表すものであり、プラポリ/高難度/マイページ等は全てホーム直下の並列ページなので履歴蓄積方式は誤解を招くと判断。質問詳細ページの「ホーム / 質問タイトル」という現状の2階層パンくずのまま維持することで確定

**言語選択UIについて（判断・現状維持）**
- ログイン前はnext-intlのデフォルト動作（`Accept-Language`ヘッダーによる自動リダイレクト）、ログイン後はマイページ下部の8言語ピルボタンで明示選択、という既存仕様のまま維持することで確定。オーバーレイでの強制選択UIは追加しない

**Googleログインのみ化について（意図的に保留）**
- メール/パスワードログインは、既存25問seedデータ用の複数テストアカウントの切り替えに必要なため、現時点ではあえて残す。AdSense審査に提出するタイミングで、入り口（UI）だけ隠す予定（認証テーブル自体・データは削除しない）

**構造化データ(QAPage)はSEOを自動で積み上げる仕組みではない（2026-07-13追記・誤解防止のため明記）**
- Googleに「質問・回答ページであること」を伝えるだけで、リッチスニペット表示は保証されない（GoogleはQAPageリッチリザルトの対象を実績ある大手サイトに絞り込む方向）
- SEOが実際に積み上がるのは、①各言語で実際に翻訳されたコンテンツが存在すること ②量と多様性 ③クロール・インデックスの時間（数週〜数ヶ月） ④被リンク等の組み合わせ次第。構造化データはあくまで中身（25問以上の新規質問）を前提とした後押しであり、代わりにはならない

**既存11(13)テストアカウントのペルソナ付け方針（2026-07-13確定・実装は別セッション）**
- ニックネーム・口調のキャラ付け自体は別のClaude.aiセッションで検討予定
- 称号（title）は既存24種のIDから選ぶだけで良い。`messages/*.json`の`titles`名前空間で既に8言語対応済みなので追加の翻訳作業は不要
- ニックネーム（`profiles.display_name`）は多言語カラムがないプレーンテキストなので、日本語の意味を持つ単語を避け、ローマ字・ハンドルネーム風（例: `Yuki_dev`, `CodeNinja92`）にする方針で確定。実際のSNS/フォーラムのハンドルネームが翻訳されないのと同じ発想
- 投入方法: ペルソナ一覧（`username` → ニックネーム・title ID）をコード側に共有し、UPDATE文（未獲得のtitleを指定する場合は`user_titles`へのINSERTも合わせて）を用意しSupabase SQL Editorで実行する方式
- 既存アカウント一覧（2026-07-13時点のDB実データ、参考値）: `anthony`(answers:8) `aoi`(12) `hana`(18) `john`(24) `ken`(29) `mia`(34) `noa`(14) `ryo`(27) `shin`(8) `takeshi`(13) `taro`(q:86,solved:65) `yuki`(answers:107)。`user_c6630e47`は実運用中の本人アカウントなのでペルソナ付け対象外

**次セッションでやること（このセッションの最後に確定）**
1. 各テナント25問以上のSEO対策済み質問を新規作成・投稿する（既存25問のseedデータは全て日本語のみ・投稿者が全員同じ・日付が均等間隔でAI生成感が強いため、新規作成時にまとめて全削除の予定。既存データのtitle_i18n/body_i18n多言語化backfillは新規作成後の作業に統合）
2. 上記が完了したら、Google AdSense・Stripe Connectへ申請（ユーザーのアクション）

### ✅ テナント間データ漏洩の重大バグ修正・スケルトンローディング実装（2026-07-14）

**発端**: ユーザーからの指摘「称号・マッチング・マイページ・通知メールがテナントを跨いで共有されていないか」の確認依頼から、実際に複数の重大なテナント分離バグが見つかった。

**称号・実績・マッチング候補・スキルタグ等がテナント間で完全に共有されていた重大バグ（修正済み）**
- `profiles`テーブルが「ユーザー×テナント」ではなく「ユーザー」単位の1行構成だったため、`display_name`/`username`/`skill_tags`/`answered_tags`/`is_available`/`email_notify`/`answer_count`/`hard_quest_count`/`question_count`/`solved_question_count`/`active_title_id`が全テナント共通になっていた
- 実害が一番大きかったのは`src/lib/matching.ts`の`findMatch()`: マッチング候補をテナントで絞り込まずグローバルの`profiles`から選んでいたため、**無関係なテナントの人が回答依頼メールを受け取る**バグがあった
- 新設した`tenant_profiles`テーブル（`tenant_id, user_id`複合キー）に上記カラムを移行。既存データは`questions`/`answers`の`tenant_id`から正確に再集計してバックフィル（`hard_quest_count`のみ、hard状態の判定条件が履歴に残っていないため近似値）。マイグレーション: `20260713000002_tenant_scoped_profiles.sql`
- `user_titles`にも`tenant_id`を追加し複合キー化。`increment_*`系RPC・`check_and_award_titles()`もテナント引数つきでオーバーロード追加（旧シグネチャは後方互換のため残置）
- マイページ（`profile/page.tsx`）・質問詳細ページの称号バッジ・ヘッダーの通知バッジ（担当タスク数・高難度NEW・レビュー待ち）の全クエリにテナント絞り込み(`tenant_id`)を追加。以前はこれらも全テナント横断で混ざって表示されていた
- 管理者ページ（`/admin`）だけは運営者が全テナント横断管理する内部ツールという位置づけのため、意図的にそのまま（全テナント串刺し表示）

**RLS安全網の追加中に発生した重大インシデント（原因判明・解決済み）**
- 上記の是正に加え、「アプリ側がテナント絞り込みを書き忘れても大丈夫なように」`questions`/`answers`/`tenant_profiles`/`user_titles`のRLSにテナント制約（`current_tenant_id()`、PostgRESTの`request.headers`のx-tenant-idヘッダーを参照）を追加
- 追加直後、**両テナントで質問投稿が一切マッチングされず即座に高難度になる重大な回帰**が発生。RLSを一旦フェイルオープンにロールバックしても直らず、実際の原因は別にあった
- 真因: 新設した`tenant_profiles`テーブルに対して`anon`/`authenticated`ロールへの**GRANT（SELECT/INSERT/UPDATE/DELETE権限）を付与し忘れていた**ため、RLSの判定以前にPostgRESTから権限エラー（`42501 insufficient_privilege`）で弾かれていた。Cloudflare Workers Observabilityのログで`[findMatch] candidates fetch error: {"code":"42501",...}`を確認して特定
- `grant select, insert, update, delete on tenant_profiles to anon, authenticated;`で解決。原因究明後、RLSのテナント制約は安全に再有効化した（マイグレーション`20260713000003`→ロールバック→`20260713000004`で再有効化）
- **教訓**: 新規テーブルを作るマイグレーションでは、RLSポリシーだけでなく`anon`/`authenticated`へのGRANTも必ずセットで書くこと。既存テーブル（`questions`等）は初期スキーマ時にGRANT済みだったため今まで気づかなかった

**通知メールのテナント名・リンクURL修正＋多言語化**
- `notifyMatchedUser()`が`tenants.name`（リネーム前の古い日本語名）と`tenants.subdomain`（内部ID、公開URLの`bug.`/`music-prod.`とは別物）をそのまま使っていたため、メールの件名が「バグ・デバッグ」等の古い表記になり、リンクも`debug.wisdomassemble.com`のような存在しないサブドメインを指していた。`TENANT_NAME_MAP`・`PUBLIC_SUBDOMAIN_MAP`（`tenantNames.ts`）を使うよう修正
- メール本文は当初「テナントの言語」（`tenants.language`）で出し分けていたが、ユーザー指摘により**「マッチされた本人がマイページで選んでいる表示言語（`profiles.language`）」を見る仕様に修正**（8言語フルテンプレート化）。質問タイトルも既存の自動翻訳結果（`title_i18n`）から受信者の言語に対応するものを選ぶようにし、テンプレートと本文の言語が混在しないようにした（優先順位: 受信者の言語 → テナント言語 → 英語）

**質問投稿ごとのGroq API呼び出し最適化＋翻訳エラー修正**
- 1回の質問投稿で`checkInScope`＋`askWithScore`（70bモデル）、タイトル翻訳＋本文翻訳（8b-instantモデル）の計4回Groqを呼んでいたことが判明。タイトル・本文の翻訳を1回のGroq呼び出しに統合し、8b-instantモデルへの呼び出しを2回→1回に削減（`translateQuestionToLocales`、`src/lib/translate.ts`）
- 統合直後、通知メールの質問タイトル翻訳が反映されない不具合が発生。原因は2段階：①連続テスト投稿によるGroqの429レート制限、②統合時にネストしたJSON構造（`{"en":{"title":..,"body":..}}`）を要求していたため、タイトルに含まれる引用符（「」）のエスケープにAIが失敗し`400 json_validate_failed`が発生
- JSONのキーをフラット化（`title_en`, `body_en`など）し、それでも失敗した場合は従来の個別呼び出し方式（`translateToLocales`を2回）に自動フォールバックする実装に変更。本番で英語メールのタイトル翻訳が正しく反映されることを確認済み

**スケルトンローディングの実装**
- `QuestionListSkeleton.tsx`は以前から存在したが、どこからも呼ばれていない未配線のデッドコードだった
- トップの質問一覧は`Suspense`でリスト部分を切り出しフォールバックに設定。高難度一覧・質問詳細ページはroute-level`loading.tsx`を追加

**日付表示のタイムゾーン修正**
- サーバーレンダリング（Cloudflare Workers=UTC）の`toLocaleDateString`だと日本のユーザーには最大1日ずれて見える問題があった。トップの質問一覧・質問詳細ページの日付表示を`LocalDate`クライアントコンポーネント（`src/components/LocalDate.tsx`）に切り出し、閲覧者のブラウザのタイムゾーンで表示するように変更

**テナントビルダー（Artifactツール）の作成**
- 新しいジャンル（テナント）を追加する際に必要な設定一式（Supabase `tenants`テーブルへのSQL・`middleware.ts`のVALID_SUBDOMAINS/SUBDOMAIN_ALIASES・`src/lib/gemini.ts`のGENRE_CONFIG・`src/lib/tenantNames.ts`の各マップ）をフォーム入力から一括生成するツールを作成
- AIジャンル判定（inScope/outScope/threshold/dangerKeywords）は「Claudeにお任せ（自動設計）」と「手動入力」を選択可能。知らないジャンルを無理に手動で決め打ちしなくてよい設計
- ロゴは`SiteLogo.tsx`・`logoColor.ts`と同一のSVG生成ロジックをツール内に移植し、実際の見た目に近いプレビュー（ヘッダー・ヒーロー見出し・ルートポータルカード）を表示
- 現在DB・コードに下書きが存在する8テナント（tax-japan/australia-whv/bali/chiangmai/portugal/keyboard/philippines/canada）はクイック読み込み可能。それ以外の全く新しいジャンルもテナントIDを直接入力してゼロから作成できる
- 生成した仕様をボタン一つでチャットへ送信でき、そこから実際の実装（DB反映・5ファイル編集・デプロイ）を行う。使い方の詳細はNotion「テナントビルダー 使い方・新テナント追加手順」ページに記載
- **AdSense審査中の運用**: ローカルで実装・型チェックまで済ませてレビューできる状態にし、明示的にデプロイ指示があるまで`git push origin main`は保留する
- **重要な発見（v8で修正済み）**: ルートポータル（wisdomassemble.com）の表示制御は`tenantNames.ts`の`LIVE_TENANT_IDS`（どこからも参照されていない不使用定数）ではなく、`src/components/PortalHome.tsx`内の`REVIEW_TENANT_IDS`配列が実体。さらに同ファイルのタグライン取得が`tenantId === 'debug' ? 'debugCardTagline' : 'dtmCardTagline'`という2値決め打ちの三項演算子になっており、3件目以降を追加すると誤って`dtmCardTagline`が使われる潜在バグがある。新規テナントをルートポータルに公開する際は、`REVIEW_TENANT_IDS`・`FALLBACK_COLOR_THEME`への追記に加え、タグライン取得を`t(\`${tenantId}CardTagline\`)`のような動的キーに修正し、`messages/`配下8言語すべてに`{tenantId}CardTagline`キーを追加すること
- **v1.0.0として確定（2026-07-15）**: 初期コンテンツ（SEO用Q&A）生成機能を内蔵。ユーザー提供の「seed content knowhow.md」（ペルソナ設計・自然さを出す技術・6パターンの解決フロー）をコード内に常時埋め込み、デフォルトで25問・テナント作成と同時に依頼される。ツール自体のデザインもルートサイト（`globals.css`のトークン・`rounded-lg`系）に合わせ、`WisdomAssembleWordmark`と同一のSVGロゴをツールのブランディングにも使用。テナントの配色を選ぶとツール全体のアクセントが連動する。「🔍実装前にコードとの整合性チェックを依頼」ボタンで、ツールの前提とコードの実態がズレていないか事前確認できる。詳細はNotion「テナントビルダー（Artifactツール）v1.0.0」ページ（パラメータ一覧・使い方・既知の制約を網羅）参照

**Claude Team移行にあたっての引き継ぎ整理（2026-07-15）**
- ユーザーがClaude Teamプランに移行予定。現アカウントは17日後に無料版になるため、Notion全ページ（開発ログ・バグトラック・残タスクリスト・テナントビルダー関連ページ）とこのCLAUDE.mdを棚卸・更新した
- プロジェクトメモリ（`/Users/apple/.claude/projects/-Users-apple-Music-Ableton/memory/`）はローカルファイルベースであり、Claudeのアカウント/プランに紐付いていない。同じMac・同じプロジェクトパスで使い続ける限り、アカウントを切り替えても記憶は引き継がれる
- ⚠️**【2026-07-27 訂正・重要】この「記憶は引き継がれる」は"同じcwd"の話で、2シート間では共有されない**（エンジニアが実測）。`~/.claude/projects/`配下に`-Users-apple-wisdom-assemble`（エンジニア）と`-Users-apple-Music-Ableton`（プランナー）が独立して存在し、`memory/`の中身も別物（重複なし）。**2つのシートで共有したい事実は、メモリではなく必ずこのCLAUDE.mdかNotionに書くこと**。メモリに書いても相手には届かない。
- 外部サービス（Supabase・Cloudflare・Groq・Brevo等）の認証情報はClaudeアカウントと無関係なので影響なし。`.env.local`はgitignore対象のためローカルにしか存在しない点だけ留意（バックアップ推奨）

**次回やること**
1. Claude.aiセッションでのペルソナ・新規質問作成（BUG DEBUG 3問＋MUSIC PRODUCTION 5問、Notion「質問作成用」ページに詳細記載済み）に戻る
2. 新規質問が固まり次第、既存の未使用データ（ダミー回答・重複等）を削除するSQLを用意
3. 今回のGRANT忘れの教訓を踏まえ、今後新規テーブルを作る際はGRANT文をマイグレーションのチェックリストに含める
4. AdSense/Stripe Connect審査通過後、テナントビルダーで残り8テナントを順次展開

### ✅ 全体監査＋大規模修正セッション（2026-07-17）

調査専用のつもりで開始した全体監査（UX/ロジック/多言語/AdSense観点）で多数の問題が見つかり、そのまま順次修正した。**すべて本番デプロイ済み。DB系はユーザーがSupabase SQL Editorで適用済み。**

**🔴 致命的（DB権限が実質無効化）を修正・SQL適用済み**
- `questions_update`が`using(true)`で誰でも全質問改ざん可能だった → 質問投稿の書き込みを全てservice_role(admin)経由に移し(`questions/route.ts`)、`questions_update`を`auth.uid()=user_id`に是正（migration `20260717000002`）
- `answers_insert`が`or is_ai=true`で未認証の偽AI回答挿入可能だった → AI回答挿入をadmin化し`answers_insert`を`with check(auth.uid()=user_id)`に
- security definer RPC（increment_*・check_and_award_titles・check_and_increment_rate_limit）が全ロールで実行可能だった → 全RPC呼び出しをadmin経由にし、`revoke execute from public/anon/authenticated`（DOブロックで動的revoke＋service_roleにgrant）
- 高難度移行の絶対ルールがサーバー側に無かった → `escalate/route.ts`のforceHardにガード追加（B段階=open+matched_b+回答/期限切れ、C段階=matched_c+C回答済みのUI条件と一致。solved→hard戻し等を400で拒否）
- 称号「初回のみ自動装備」修正が2引数版で回帰 → migration `20260717000001`で修正
- **教訓**: 締める系のマイグレーションは、書き込みをservice_role経由に変えたコードを**デプロイした後**に適用すること（逆順だと投稿が壊れる）

**🟠 ログイン済みユーザーのAPI直叩きバイパスを修正（SQL適用済み `20260717000003`/`20260717000004`）**
- 質問・回答INSERTをservice_role化し、`questions_insert`/`answers_insert`を`with check(false)`で直接INSERT全面禁止（レート制限/フィルタ/文字数/重複チェックの回避を防止）
- BAN未適用だった → questions・answers POSTに`is_banned`チェック追加＋`profiles`を`language`列のみ更新可に列単位GRANT（BAN自己解除防止）
- `tenant_profiles`自己改ざん（実績カウント水増し＝マッチング順位操作、未獲得称号装備）→ 本人編集列のみ列単位GRANT＋active_title_idは保有称号のみ(WITH CHECK)

**🟡 UX/ロジック/多言語（コードのみ・デプロイ済み）**
- **表示名がサイトに反映されない**（`profiles`のJOIN取り残し）→ home/hard/詳細で`tenant_profiles`から取得
- **類似質問サジェストが本番で常に0件**（hostname直取り）→ `useTenantId()`で内部ID解決＋`.or()`サニタイズ
- **contentFilter誤検知**（電話regexが日付「2026-07-14」、@mentionが`@types/node`、LINEが`line: 42`を誤爆）→ 高精度化（実データ相当テストで誤ブロック0件）
- **AI回答が常に日本語・翻訳対象外**（多言語SEOの穴）→ AI回答も`translateToLocales`で8言語翻訳して保存（source='ja'）
- **人間回答の翻訳がRLSで無音失敗**していた → 回答INSERT・翻訳保存をadmin化して解消
- **オープンリダイレクト**（`?next=//evil.com`）→ auth callbackで相対パスのみ許可
- **PortalHomeのタグライン2値決め打ち三項**（3テナント目で壊れる）→ `t(\`${tenantId}CardTagline\`)`動的キー化
- **MUSIC PRODUCTIONロゴ崩れ**（override系がCSS固定px・幅制限なしで溢れる）→ 通常ロゴと同じSVG+viewBox+maxWidth:100%に統一（gradientはSVG linearGradient）

**🟢 AdSense/SEO/機能**
- debug.重複ホスト → middlewareで`debug.`/`dtm.`を公開エイリアス(bug./music-prod.)へ301
- プラポリ第三者提供にBrevo・Cloudflare追加（8言語）
- OGP画像をx-tenant-idからテナント別動的生成（BUG DEBUG固定を解消）
- robots.txt追加（`src/app/robots.ts`＋middleware除外。従来307→404だった）
- hreflang/canonical追加（質問詳細＋ホーム、実在ロケールのみ＋x-default、未翻訳ロケールのcanonicalは元言語に寄せる）＋質問詳細のtitle/descを多言語化
- カスタム404（`[locale]/not-found.tsx`、テナントロゴ＋同テナントトップへ、8言語。not-found文脈でgetTranslationsが効かないのでNEXT_LOCALEクッキー+messages直import）
- No.26 質問下書き自動保存（localStorage・テナント別）
- No.34 AI自動タグ付け（`askWithScoreInScope`がtags2〜3個も返す→質問INSERTに保存）＋ホーム一覧のタグフィルター（?tag・押せるchip）

**⚡ AIコスト最適化**
- checkInScope＋askWithScoreを`askWithScoreInScope()`に統合し70B呼び出しを2回→1回（約25%減・無料枠消費30%減・実質70問/日超）。Groqエラー時はaskWithScoreへ自動フォールバック
- 料金（2026-07時点）: 70b=$0.59/$0.79・8b=$0.05/$0.08（入/出 per 1M tokens）。100テナント×20問=2000問/日で月$70前後の試算

**⏰ 自動高難度移行（pg_cron・SQL適用済み `20260717000005`）**
- `auto_escalate_expired()`を15分ごとに実行。open(matched_b期限切れ＆人間回答なし)/matched_c(期限切れ＆C未回答)を自動でhard化し質問の滞留を防ぐ
- 旧`auto_escalate_to_hard`（matched_cのみ・回答済みでもhard化する劣った版・リポジトリ外）を発見し、`cron.unschedule`＋`drop function`で削除して新版に一本化済み

**判断メモ（ユーザー確定）**: 稼働トグル（今日は答えられます）は不要＝削除しスキルタグ設定が実質オプトイン（使い方文言も修正）／AI回答に不満時の人再マッチは実装しない（閾値87で十分）／AI回答不満時の導線は無し

**残タスク（ユーザーアクション）**: ①審査用シード質問の作成＋投入時にテスト投稿削除 ②メールログインUIを審査前に隠す ③AdSense/Stripe Connect申請 ④承認後: ads.txt設置・Funding Choices有効化

### 🧭 2026-07-18 コンテンツ方針の確定・ロゴ恒久対策・テナントビルダー刷新（次セッション引き継ぎ）

**コンテンツ方針（確定・最重要）**: シードは「AI回答主体＋本物の質問」で正直に立ち上げる。**架空の人物による質問・回答の量産（過去別Claudeが提案し方針転換）はしない**。①質問はユーザー本人の実際の疑問（本物ならOK）②AI回答は「AI回答」ラベル付き＝正直なので問題なし③各テナント10問前後で量より質④自分の複数アカウントで自問自答する自作自演もしない⑤ローンチと収益化を切り離し、公開→運用で貯めてから AdSense 申請。→ 実質「本物の質問を各テナント10問前後投稿しAIに回答させる」だけで立ち上げ可能。人間回答の量産は不要。

**ロゴ恒久対策（完了）**: override系ロゴをSVG+viewBox+maxWidth:100%化（第8弾）に加え、`LogoStyleOverride`に`widthEmPerChar`（ロゴビルダーが`canvas.measureText`で実測した1文字あたりのem幅）を追加。指定すればどのフォントでも右切れ・中央ズレなし、未指定は0.70フォールバック。**今後の全テナントで崩れない**。テナント追加チェックリスト(#2)もコード実態に合わせ完全版に更新済み。

**テナントビルダー(Artifact)刷新（v2・完了）**: URL = https://claude.ai/code/artifact/cad8ed82-9f1f-4131-b389-5be73c9ada22 （ユーザーアカウントに保存）。旧版の抜け3点を修正＝①`skillTags.ts`(TENANT_SKILL_OPTIONS/TENANT_SUGGESTED_KEYWORDS)出力追加②`OG_COLORS`出力追加③ロゴ`widthEmPerChar`を実測出力。ペルソナ生成機能は撤去。デザインはWAにシームレス統一（白背景・WAグレーワードマーク・「テナントビルダー」はGeorgia＋テナントのテーマカラー動的表示）。生成コードは実ファイル構造と一致することをnodeで検証済み。使い勝手は今後さらに改善予定。

**次セッションでやること（ユーザー指示）**: 上記コンテンツ方針で、テスト/seed質問の削除→本物の質問投稿、を進める。着手タイミング（サイトが一時空になるので本物質問の準備後）はユーザーが決める。メールログイン非表示・AdSense申請はその後。

### ✅ 収益化・宣伝・コンテンツ戦略 FIX（2026-07-19・プランナーセッション）

**役割分担を確定**: エンジニア＝別Claudeアカウント（コード実装）／プランナー＝Ableton側アカウント（戦略・コンテンツ・申請系）。

**コンテンツ方針の大転換（ユーザー確定）**
- 旧seed 57問（BUG 32/MUSIC 25、偽ペルソナ方式）は**全部破棄**。偽ペルソナ廃止。
- **正直な立ち上げ**: 質問=ユーザー/友人の本物の疑問、AI回答（明示ラベル）主体＋少数の本物の人間回答。**開設ライン=各テナント10問／AdSense申請ライン=各テナント25〜30問**（10問での申請は承認率2〜4割と低いため、小規模宣伝＋週次投稿で25〜30問まで育ててから申請する。2026-07-19確定）。
- 投入方法: SQL投入をやめ**実サイトに実際に投稿**（タイムスタンプ・AI回答・8言語翻訳がすべて自動で本物になる）。レート制限3件/日で数日分散＝自然な時系列。
- BUGテナントの質問ネタ: Notionバグトラック/本ファイルの実際にハマった問題（middlewareヘッダー、RLS GRANT 42501、Groq 429等）が本物の質問の宝庫。質問者=運営者は隠さない。

**広告戦略（コントロール優先＝宣伝より申請が先）**
- 無審査系(PropellerAds/Adsterra)は**不採用**（アダルト/ポップ系でブランド毀損＋AdSense審査に不利）。承認まで広告ゼロ。
- 出世コース: AdSense（トラフィック不要・最初）→月1,000セッションでMediavine Journey乗換検討（独占）→月1万UU(MAU、Tier1中心)でMedia.net併用→25kPVでRaptive乗換検討。Ezoicは新規25万UU要件で不可（Incubator月20枠のみダメ元可）。
- AdSense再申請は回数制限なし（原因修正→2-4週再クロール→再申請）。

**アフィリエイト タイミング表**
- 今すぐ登録OK: A8.net（審査なし）・サウンドハウス。質問投入後: もしも/afb（独自5記事）。**リンク設置はAdSense承認後**。Amazonはトラフィック後（180日3成約要件）。ステマ規制PR表記必須。

**Stripe Connect申請条件（投げ銭フェーズで）**
- 質問数の形式要件なし。ただしサイト実態を見られる＝質問投入後・チップ機能の説明がある状態で申請（実装はtest modeで可）。
- 要件: 利用規約に「チップ＝回答役務への対価」明記（寄付/応援NG・日本は個人への寄付不可）／返金ポリシー／特商法表記（Stripe登録情報と完全一致）／Connect申込書を開設と同時提出。弁護士確認（資金決済法）は「本番で資金分配する前」でよい。

**宣伝・SEO**
- 順序（2026-07-19改訂）: 質問10問投入→**小規模宣伝**（Indie Hackers→r/SideProject→dev.to記事の順で2〜3週かけ1本ずつ、feedback-wanted型・作者明記・Redditは事前1〜2週カルマ作り）→25〜30問/テナント到達→AdSense申請→承認→広告ON→**本命ローンチ弾**（Show HN/Product Huntは温存）。承認前も「答える側」のコミュニティ参加は継続。
- 立ち上げ期のGroqコストは質問数比例（訪問者数ではない）＋無料枠約70問/日のため、承認前に宣伝してもコストはほぼゼロ＝「収益前の宣伝は赤字」は当てはまらない。

**質問投稿の運用ルール（2026-07-19確定）**
- 投稿アカウントは**本人＋妻の実在2アカウントのみ**。別人を装う追加アカウントは作らない（偽ペルソナ禁止の原則）。
- 質問ソース: ①本人の実体験（Notionバグトラック・Ableton）②妻の疑問 ③友人への雑談インタビュー起こし（サイトの存在は明かさない→副業疑いリスク回避。聞いた悩みを本人の言葉で質問文化し本人/妻のアカウントから投稿=正直な代理投稿）。
- 回答パターン: 妻の質問→本人が本物の回答（マッチング経由）／本人の質問→AI回答で解決。**2〜3割は未解決のまま残す**（100%即解決は不自然）。ベストアンサーは半日〜数日後・一括処理しない。
- 投稿ペース: 1テナント1日1〜3件・毎日同数はNG・投稿しない日と時間帯のバラつきを入れる（自然な時系列）。
- **BUG系質問は英語で投稿が理想**（エラーメッセージ検索は英語圏。日本語ドラフト→Claude翻訳→本人確認の人間監修つき英文をソース言語に）。MUSIC系・妻の質問は日本語でOK。
- タイムライン目安: Week0=エンジニア前提作業→Week1〜4=投稿＋小規模宣伝→Week4〜5=申請→承認まで1.5〜2ヶ月。ゲートはカレンダーでなく25〜30問/テナントの達成。
- テナント追加は品質ゲート方式: 「監修済み10問を用意できるジャンルだけ」追加、月1-2上限、10問到達までnoindex+sitemap除外（量産＝スケールドコンテンツ判定の回避）。テナント追加は質問総数を増やさない＝薄く広がるだけなので不要。閉鎖/追加の最適化はSearch Consoleデータが数ヶ月出てから。

**エンジニア側の新規タスク（このセッションで追加）**
- Groq課金の蓋: 日次予算超過でAI回答停止→人間マッチング直行フォールバック＋Brevo警告
- DAU日次メールレポート: pg_cron+Brevo（テナント別DAU/質問数/Groqコスト推定/有料化判断）
- テナントnoindex閾値方式（10問未満はnoindex+sitemap除外、到達で自動解禁）
  - ⚠️⚠️**【2026-08-25 未実装と判明】この「閾値方式」はコードになっていない。** 実際の noindex 判定は `src/lib/tenantNames.ts:61` の **`DORMANT_TENANT_IDS = ['debug']` という手動リストだけ**で、**質問数のカウントも閾値判定も存在しない**（`layout.tsx` の `isDormantTenant(tenantId) || !INDEXABLE_LOCALES.includes(locale)` が全て）。
  - ⛔**つまり新テナントを作った瞬間からインデックス対象になる。** 10問揃う前の薄いページがクロールされる＝**scaled content リスクの安全網が無い**。
  - **当面の運用（実装するまで）**：⚠️**新テナントを作ったら必ず `DORMANT_TENANT_IDS` に入れ、10問揃ってから外す。** 忘れると薄いページが公開される。「新テナント追加チェックリスト」にも入れること
  - **実装するなら**：questions の件数を数えて10未満なら `robots:{index:false}` ＋ sitemap から除外。⚠️エンジニア作業なので着手はmtさんの判断
- **多言語インデックス絞り込み**: 当面en/jaのみインデックス、他6言語（zh/id/vi/ko/es/pt）は翻訳データ保持のままnoindex+sitemap除外（人間レビューなし機械翻訳ページの量産=スケールドコンテンツ判定の回避）。流入シグナルが出た言語から解禁

**参照**: 比較ダッシュボード（Artifact） https://claude.ai/code/artifact/95dbabc4-e444-45ad-b515-ddf577d980aa ／詳細リサーチ4本（広告/アフィリ/Stripe/宣伝SEO・出典つき）はプランナーセッション2026-07-18〜19の会話ログ

### ✅ 管理ダッシュボード刷新・ファビコン刷新・ロゴ作成システム・テナント別ダークモード（2026-07-20・大規模実装セッション）

すべて本番デプロイ済み・本番で実物検証済み。DB系はSupabase SQL Editorで適用済み。

**1. `/admin` を全テナント横断KPIダッシュボードに刷新**
- **重大バグ修正**: `/admin`のデータ読取が通常ユーザークライアントで、2026-07-13追加のRLS(`current_tenant_id()`)により**現在のサブドメイン1テナントにしか絞られていなかった**（rootで開くと空）。データ読取を`createAdminClient()`(service_role)に変更しRLS迂回で全テナント串刺しに。上部statsの`.limit(200)`頭打ち、回答数/表示名が旧`profiles`凍結列参照だったのを`tenant_profiles`解決に修正。
- `admin_dashboard_stats()` RPC追加（read-only・service_roleのみ・**JST集計**・migration `20260718000001`）。全体サマリー＋テナント別表＋DAU/MAU（投稿者ベース＝質問/回答した一意ユーザー）。認証はcookieクライアント、データ読取はadminクライアント、と分離。
- 「サマリー」タブ新設（`AdminSummary.tsx`）。

**2. 訪問者タブ（Cloudflare Web Analytics統合）**
- `src/lib/cloudflareAnalytics.ts`＋`AdminVisitors.tsx`。CF GraphQL Analytics API(`rumPageloadEventsAdaptiveGroups`)からPV/訪問/日別/ホスト別(=テナント別)/流入元/人気ページ/国。
- Worker Secret: `CF_ANALYTICS_API_TOKEN`（「Read analytics and logs」テンプレのread-onlyトークン）＋`CF_ACCOUNT_ID=c17c4b1e3c6733389ab7cf097141bd18`。Web Analyticsは既に有効(automatic setup)。siteTag省略(単一サイト)。5分キャッシュ。
- **注意: CFはサンプリング推定なので数値は10刻みで丸められる＝正常**。訪問者DAU/MAU(ROM含む)はCFダッシュ、投稿者ベースは自作サマリータブ、の役割分担。

**3. ファビコン刷新（`icon.tsx`）**
- ロゴのstyleに追従。override(LOGO_STYLE_OVERRIDES持ち)は`treatment`を gradient/3d/solid に振り分けて近似、フォントは30書体→Google Font代替(`faviconFont()`: 幾何学→Jost/Impact系→Anton/セリフ→Lora/手書き→Caveat/等幅→Roboto Mono/スラブ→Roboto Slab/丸→Baloo2/ディドネ→Playfair)。デフォルトロゴのテナントはImpact系Anton＋3D＋センター。文字色はロゴ実色(`gradientFrom`)。※next/og(Satori)はシステムフォント不可のためGoogle Font代替が必須。

**4. ロゴ作成システム（大）— foreignObject + fx-* CSS方式**
- **SiteLogo.tsx**: override分岐で`treatment`指定時は**SVGの`foreignObject`＋`globals.css`のfx-* CSS**で描画（→ロゴビルダーとピクセル一致・自動縮小維持）。treatment未指定(既存dtm)は従来のSVG平面グラデ(後方互換・見た目不変)。**本番でMUSIC PRODUCTIONを一時3D化して`foreignObject`描画を実証済み**。
- **globals.css**: 25種のfx-*(flat/3d/outline/gradient/split/diagsplit/vertgradient/fade/stripe/shadow/longshadow/duo/skew/underline/dotted/doublerule/glitch/engrave/deboss/varsity/duplicate/bracket/marker/pill/emblem)。`--c`/`--c2`(=gradientFrom/To)、`--sh1..sh5`(3D影・getLogoShadowShades相当)。**除外5種**(neon/neonoutline/sticker/stamp/radialglow)は発光blur/回転でviewBox外に切れる/コンテナ依存のため。`LogoTreatment`型を25種に拡張。
- **テナントビルダー(Artifact)**: 30書体×25スタイル＋メイン/サブ色＋太さ/サイズ/字間＋🎲randomize＋🔒6ロック(書体/スタイル/色/サイズ/字間/太さ)。プレビューは本番と同じfx-* CSS＝**レビュー=本番のピクセル一致**。出力`LOGO_STYLE_OVERRIDES`に`treatment`追加。widthEmPerCharはcanvas実測。

**5. テナント別ダークモード（大）— CSS上書き層方式**
- **globals.css**に`[data-theme="dark"]`層。全ページの**使用中の全グレー階調(text/bg/border-gray)＋白＋バッジ色(赤緑青黄橙紫の50/700系)を網羅**して`!important`で上書き。**455箇所のTailwind色クラスは無改修**。`--page-bg`でテナントごとに背景色を個別変更可。
- `tenants`に`theme`(light/dark・default light)/`bg_color`列追加（migration `20260720000001`・**SQL適用済み**）。`layout.tsx`で`tenant.theme==='dark'`→`<html data-theme="dark">`、`bg_color`→`--page-bg`。types.tsのTenantにも追加。
- **ルートポータルのカードもテナントのtheme/bg_colorに追従**(`PortalTenantSearch`でカードに`data-theme="dark"`＋背景色→内部text/border/hoverが自動ダーク化)。dark=暗色カードで100テナント時の見た目に変化。**本番でMUSIC PRODUCTIONをダーク＋ポータルのダークカードを実証済み**(確認後revert・既存は全てlightで見た目不変)。
- ビルダーにダークモードトグル＋背景色ピッカー。

**6. ビルダーその他**: ロゴのメイン色→`color_theme`自動同期(独自ロゴON時)。ポータル掲載トグルを**既定ON**(ステージング用にOFF可)。手順書に`?tenant=root`(ポータルに新カード追加状態を確認)追記。

**確立した検証手法**: ローカルで確認できないもの(foreignObject/Satoriレンダリング/ダークCSS層)は「本番デプロイ→md5/HTMLをポーリングで反映検知→ブラウザpaneでスクショ or /iconのPNGをReadで目視」の**本番実証ループ**。一時的にdtmへ強制適用→確認→revert、で安全に検証。

### ✅ AIコスト管理（三重ストッパー）＋ダッシュボード拡張（2026-07-20）

Groqコスト暴走/赤字対策の三層防御。①アプリレート制限(既存3回/テナント・10回/日) ②アプリ自主上限(今回追加) ③Groq Spend Limit(ユーザー手作業・有料化時)。**物理的に請求を止めるのは③のみ**。①②は挙動制御。現在は無料枠=コスト¥0。

- **DB(migration `20260720000002`/`20260720000003`・SQL適用済み)**: `ai_usage`(日次Groq使用量/テナント別)・`ai_budget`(日次AI質問上限・default 60)・`daily_revenue`(収益stub)・`ai_alert_log`(アラートdedup)。RPC: `check_and_reserve_ai_budget`(AI呼出前に上限判定＋予約・reset_at=翌JST0時)・`record_ai_tokens`(使用量記録)・`try_mark_ai_alert`(1日1レベル1回)。
- **gemini.ts**: `callGroq`がトークン数を返す＋429/`blocked_api_access`を`GroqUnavailableError`で検知。`askWithScore(InScope)`が`usage`(コスト込み)を返す。
- **questions/route.ts**: AI呼出前に予算チェック→超過ならAIスキップ。人間ルーティングを`routeToHuman`に抽出し、**上限/Groq障害/低スコア すべてで人間へ回す**（=Groq失敗で質問がopenのまま孤立するバグも修正）。レスポンスに`aiCapped`/`aiResetAt`。90%/上限で運営者にBrevoアラート(日本語・件名【重要】)。**RPC未適用時はフェイルオープン(AI許可)で安全**。
- **QuestionForm.tsx**: `aiCapped`時にモーダル（8言語・resetAtから「あとHH:MM:SS」をJSでライブ計算＝**AIコストゼロ**）。閲覧/検索は止めない。
- 利用規約に`aiAvailabilityDisclaimer`・使い方に`aiLimitNote`(共に8言語・AI上限時は人間対応の旨)。
- **ダッシュボード拡張(AdminSummary)**: 運営ヘルス(稼働数/目標100・人間ルーティング率・本日AI使用/上限)、テナント別にルート率/AI費列、**人気タグ集計**、**収益プレースホルダ**。

### ✅ AI上限のオン/オフ化（無料=制限なし・有料=上限）＋運営ヘルスの誤指標是正（2026-07-20夜）
- **上限をダッシュボードから変更可能に**（`AiBudgetEditor`＋`/api/admin/ai-budget`→`set_ai_budget` RPC）。`ai_budget.cap_enabled`列を追加（migration `20260720000005`）。**既定OFF＝無料プランは制限なし**（AIは投稿のたびに実行、Groq無料枠約70件/日でGroq自身が429→人間ルーティング）。有料化時にダッシュボードでオン＋上限件数を設定。
- **ユーザーに無料/有料の区別は見せない**方針を確定。AIが使えない理由（自主上限 or Groqの無料枠429）に関わらず、`route.ts`が**必ず具体的な復活時刻**(`aiResetAt`=予算RPCの`reset_at`＝翌JST0時、取れなければJSで計算)をモーダルへ渡す。曖昧文言(`aiCapVague`)は保険として残置だがほぼ出ない。
- **check_and_reserve_ai_budget**: cap_enabled=falseなら常にallowed（集計callsのみ加算・reset_atは常に返す）。90%/上限アラートはオン時のみ（オフ時はremaining=nullで発火しない）。
- **運営ヘルスの誤指標を是正**（この夜のセッションで発覚・修正）: ①「稼働テナント数」は`count(*) from tenants`（下書き含む10）だったのを**質問がある実稼働数(2)＋登録総数を補足表示**に（migration `20260720000004`）。②「人間ルーティング率」は**低いほど健全**なのに15%を異常扱いしていた誤報を修正→**80%超(AI障害/バグ疑い)のみ赤**に反転。③本日AI質問数は上限到達/超過を赤で明示（`70/60`等の超過はテキスト表示・バーは100%止め）。
- Groqコンソール(`Settings→Billing→Limits`)へのリンクをダッシュボードに設置（層③）。
- **本番でトグルON/OFF・保存を実物確認済み**（無料の今はOFF＝「無料プラン・制限なし」表示、が正しい状態）。無料でONにしてもGroqが約70件で先に止めるため上限は発動せず無意味＝OFF推奨、で確定。

### ✅ 訪問者ダッシュボードにテナント別の流入元を追加＋ホスト重複の解消（2026-07-20夜）
- **テナント別の流入元クロス集計**を追加（`cloudflareAnalytics.ts`に`requestHost × refererHost`のクエリ`byHostReferer`を1本追加＝`VisitorStats.refByTenant`。SQL/Secret追加不要、既存`CF_ANALYTICS_API_TOKEN`で取得）。訪問者タブにテナント別カードで「どの流入元→どのテナント」を表示（コミット`af9e0cf`）。
- **CFはホスト名別集計のため同一テナントが重複表示される問題を解消**（コミット`2b4fc64`）: 旧`debug.`（現`bug.`へ301）と`bug.`が別行、`dtm`↔`music-prod`も同様だった。`AdminVisitors.tsx`に`tenantKeyOf()`（`debug→bug`/`dtm→music-prod`/`wisdomassemble.com→root`）を追加し、ホスト別訪問・テナント別流入元・人気ページ・リファラーすべてを**正規化キーで合算＋実装順（bug→music-prod→root）で表示**。リファラーの自サイト各サブドメインも公開ホストに正規化。

### ✅ 多言語インデックス絞り込み（en/jaのみ）＋tenant_profiles grant修正（2026-07-21・企画側からの確認依頼2件）
- **en/ja以外の6言語(zh/id/vi/ko/es/pt)をnoindex＋sitemap除外**（コミット`e52902c`・本番検証済み）。Googleの「人間レビューなしの機械翻訳ページ量産＝scaled content abuse」対策。`INDEXABLE_LOCALES=['en','ja']`(`i18n/routing.ts`)を定義し、①`layout.tsx`の`generateMetadata`でen/ja以外に`robots:{index:false,follow:true}`(layout配下の全ページに継承・ページ側はrobots未指定なので1箇所でOK) ②`sitemap.ts`を`INDEXABLE_LOCALES`で絞る(静的・質問詳細とも)。**翻訳データ自体は保持**＝言語ごとに人力レビュー/流入実績が出たら`INDEXABLE_LOCALES`に足すだけで解禁できる。検証: `/zh`に`noindex,follow`付与・`/en``/ja`は無し・sitemapはen/jaのみ(bug/music-prod両方)。※`/sitemap.xml`はCFエッジキャッシュで一時的に旧版が出ることがある(数分で更新)。
- **tenant_profilesにservice_roleのSELECT権限を付与**（migration `20260721000001`・要適用）。新設時(20260713000002)にanon/authenticatedにはGRANTしたがservice_roleに付け忘れていた。マッチング(`matching.ts`)は認証クライアント読みなので無事だが、**管理ダッシュボード(`admin/page.tsx`)はadmin(service_role)でtenant_profilesを読むため42501で失敗し、質問一覧/ユーザー一覧の投稿者名・回答数がuser_xxxxxxフォールバックに劣化**していた。`grant select on public.tenant_profiles to service_role;`一行で解消（純粋な追加・重複や副作用なし）。→ **新規テーブルのGRANTはanon/authenticated/service_role全部に付ける**の教訓を再確認。
- **本人アカウント(`c6630e47…`)のdtm(MUSIC)スキルタグを設定**（ユーザーがSQL実行済み）。`is_available`は元からtrueだが`skill_tags`が空`[]`だった。dtmの音楽タグ15種(Ableton Live/Logic Pro/ミキシング/DAW等)をセット。※マッチングは全員に`BASE_SCORE=20`が付くので空でも候補にはなるが、タグ一致で+5され選ばれやすくなる。**妻の質問が確実に本人へ回るのはテストアカウント削除後(候補=本人のみ)**。

### ✅ マイページ保存の403修正（重大・マッチング設定）＋表示言語の不一致解消（2026-07-21）
- **【重大】マイページの「保存」が全ユーザーで失敗していた**（コミット`bdb9c69`）。スキルタグ/稼働状態/表示名＝マッチングに直結する設定が保存不能だった。原因: 2026-07-17のlock-down(`20260717000003`)で`tenant_profiles`の`authenticated`のUPDATE権限を本人編集5列(display_name/skill_tags/is_available/email_notify/active_title_id)に絞ったが、`profile/page.tsx`の`save()`が`upsert`で、**PostgRESTは`ON CONFLICT DO UPDATE`のSET句に主キー列(tenant_id/user_id)も含める**ため、UPDATE権限の無いその列を触って`42501 permission denied`(HTTP403)になっていた。→ **`upsert`を廃止し、既存行は`update`(許可5列のみ)・初回のみ`insert`に分割**。takeshi@test.comのJWTで実際に再現(upsert=403 / update=200)し修正を確認。**教訓: 列単位GRANTのテーブルに`upsert`は使わない**（PostgRESTが主キー列もSET句に入れるため）。
  - ※再現時にtakeshiのdebug profileの`skill_tags`を`[JavaScript,React]`に変更した（テストアカウント・削除予定のため実害なし）。
- **表示言語の不一致(軽微)を解消**: ログイン後にブラウザ言語/デフォルトで別ロケール(/en等)へ着地すると、本文(URLロケール)とマイページの言語セレクタ(`profiles.language`)がズレて見えた。`profile/page.tsx`の`load()`で、保存済み言語が有効ロケールかつ現URLロケールと異なる時だけ`window.location.href=/${lang}/profile`で開き直す(loading解除前に遷移＝ちらつき無し・authフロー不変・ループ防止ガード付き)。※他ページはURLロケールに一貫追従しており不一致は無い(マイページだけがDB保存値をセレクタに出す特殊ケースだった)。サイト全体の徹底(authコールバックで希望ロケールへ着地)は不要と判断。
- **同根の追加バグ3件も修正（全て2026-07-17 lock-downの副作用・upsert/RLS）**:
  - **称号選択(active_title_id)**の保存も同じupsertで403→`update`に変更(コミット`3933ea5`)。
  - **ベストアンサー時のanswered_tags蓄積(No.27・マッチング実績ボーナス)**がadmin(service_role)upsertで42501失敗し続けていた（service_roleにtenant_profiles書込権限が無かった）→`grant insert, update on tenant_profiles to service_role`(migration `20260721000002`)。**実測204で復活確認**。
  - **閲覧数(view_count)**がlock-downで所有者以外/匿名の閲覧で増えなくなっていた→RLS迂回のsecurity definer RPC`increment_view_count`(同migration・anon/authenticated実行可)。**匿名から実測+1確認**。
  - **教訓（再確認）**: ①列単位GRANTのテーブルに`.upsert()`は使わない(PostgRESTがON CONFLICT時に主キー列もSET句へ入れる) ②新規テーブルのGRANTはanon/authenticated/service_role全てに ③RLSを`auth.uid()=user_id`等で締めた後、匿名・非所有者が正当に書く必要のある操作(閲覧数等)はsecurity definer RPCに逃がす。

### 🏁 現状サマリー（2026-07-20時点・アプリ/運営の実装はほぼ完了）
- **実装済み・本番稼働**: マルチテナント基盤・多言語8言語・マッチング/エスカレーション・AI回答＋コスト三重ストッパー・管理ダッシュボード(KPI/訪問者/AIコスト上限)・メール通知・SEO/AdSense準備(構造化データ/sitemap/hreflang/robots/OGP/404)・法的ページ・レート制限・自動高難度移行(pg_cron)・ロゴ/ファビコン/ダークモード・テナントビルダー。回答最小文字数(30字)もAnswerForm+API両方で実装済み。
- **残っている「コード」タスクは実質1つ**: ログインをGoogleのみにする（メールログインUIを隠す。認証テーブル/データは消さない）。ユーザーが指示を出すのを待って着手する段取り。
- **ユーザー側の作業（コンテンツ/操作）**: ①テスト/seed質問の削除→本物の質問投稿 ②AdSense/Stripe Connect申請 ③（有料化時）Groq有料化＋Spend Limit設定。
- 法的ページ(/terms /privacy /contact)の最終文言精査だけユーザーの目視確認の余地あり（AdSense申請に必要な要素は投入済み）。

## ⚠️ ユーザー手作業タスク（コードでは完結しない・忘れ防止）
私(Claude)のコードでは完結せず、ユーザーの手作業が必要。忘れないこと。
- **【2026-07-22 Gemini移行に伴い変更】層③はGoogle Cloudの割り当て(Quota)に**: 回答生成がGeminiになったため、有料化時の蓋は **GCP → Generative Language API → 割り当て(Quota)** で「1日あたりリクエスト数」に上限を設定する。**GCPの「予算アラート」は通知するだけで課金を止めないので不可**。翻訳はGroq継続なので、Groqを有料化する場合はGroq側のSpend Limitも別途設定する。以下のGroq記述は翻訳用として読むこと。
- **Groq有料化＋Spend Limit（翻訳用・赤字の物理的な蓋＝③）**: 全体AU100到達時に判断。Developer planへ切替 → `Settings→Billing→Limits` で **Spend Limit ¥1,000スタート**（アラート50/75/90%）→ 実績を見て段階引き上げ（DAU500で¥3,000〜5,000、採算ラインで¥1万〜、スケール後¥2万目安）。無料枠ではSpend Limit設定不可。有料化後はアプリ自主上限も**ダッシュボード（管理→サマリー→AIコスト上限）でトグルON＋件数設定**（旧SQL手打ちは不要に）。反映10〜15分ラグあり＝上限は余裕を持たせる。
- **AdSense**: 申請 → 承認後に `public/ads.txt` 設置・Funding Choices(CMP)有効化。
- **Stripe Connect**: 投げ銭機能実装後に申請（承認後に本番決済有効化。資金決済法の専門家相談は本番で資金分配する前に）。
- **収益/黒字のダッシュボード表示**: AdSense/Stripe/アフィリのAPI連携で`daily_revenue`表に投入後に有効化（黒字額=収益−Groqコスト）。
- **✅【2026-07-22 完了】Google Search Console 設定済み**: ドメインプロパティ`wisdomassemble.com`（Cloudflare DNS自動連携で所有権確認）＋`sitemap.xml`送信済み（検出10）。**Google Cloud MFA（2段階認証）有効化済み**。※GSC確認用のTXTレコードはCloudflareから削除しないこと（消すと確認が外れる）。
- **【2026-07-22 追加タスク①】Google OAuthアプリの本番公開（一般公開の直前に必須）**: Google Cloud → Google Auth Platform → 「対象」の公開ステータスが現在**「テスト中」**（＝テストユーザーのみログイン可・上限100・全期間カウント）。実ユーザーがGoogleログインするには「アプリを公開」で**本番へ切替が必須**。ログイン用の基本スコープ（email/profile/openid）のみなら**審査不要で即公開可**。seed段階（本人＋妻をテストユーザー登録）は「テスト中」のままでOK＝今は触らない。
- **【2026-07-22 追加タスク②】メール通知(Brevo)の本番到達確認（実ユーザー相手のローンチ前）**: `notifyMatchedUser`が実際に受信箱に届くか＝妻→本人マッチ時に本人が気づけるか。Brevoの送信ドメイン認証（SPF/DKIM を Cloudflare DNS に設定）＋テスト配信で迷惑メール送りされないか確認。seed段階は本人が両アカウントを手動運用するので必須ではないが、実ユーザー対応では必須。
- **【2026-07-22 追加タスク④】SEO対象言語の追加（AdSense承認後・必要なテナントができてから）**: 現在インデックスするのは en/ja のみで、他6言語(zh/id/vi/ko/es/pt)はnoindex＋sitemap除外。解禁するかは以下の順で判断する。
  - **(a) 機械翻訳ページの解禁**（現noindexの6言語をindexに戻す）: **AdSense承認後に限る**。審査前に未検証の機械翻訳ページを増やすのは不利材料を増やすだけ。解禁の前提条件は①翻訳品質（2026-07-22にGemini化して型番・Markdown保持を検証済み＝条件はクリア）②**Search Consoleでその言語圏からの表示回数＝需要の証拠が出ていること**。需要がないのに増やしても流入は増えず、薄いページが増えるだけ。解禁は`i18n/routing.ts`の`INDEXABLE_LOCALES`に足すだけ。**⭐解禁の作法（2026-07-25確定・リスクを取らない方針）＝一律6言語を解禁しない。GSCでその言語圏の表示回数が出たものだけ「1言語ずつ」解禁し、解禁後もGSCを見てインデックスされずに終わるなら戻す。**（理由: 需要のない言語を解禁しても流入は増えず、ページ数だけ7倍になり「薄いページの量産」判定リスクが戻る）
  - **(b) その言語のオリジナルテナント新設**（例: 中国語圏向け留学、スペイン語圏向け）: 機械翻訳ではなく原語コンテンツなので**ポリシーリスクなし**。ただし「その言語で本物の質問と回答を出せる人が必要」＝本人一人では書けない。AIシード方式(よく検索される10問にAIが答える)で開設ラインに乗せ、実ユーザーが埋めるのを待つ形になる。承認後・トラフィックが出てからの話。
- **【2026-07-22 追加タスク③】About/運営者情報の最終確認（AdSense申請前）**: 「誰が運営しているか」が分かる記載が十分か目視確認（AdSenseは運営者の明確さを見る）。現状Footerに統合済みだが内容の十分性をチェック。

### ✅ 実装ほぼ完了・質問作り着手（2026-07-20 プランナーセッション）

**エンジニア側の実装が大きく進捗（運用しながら直す段階へ）**
- AIコストの蓋（三重ストッパー）: 日次AI上限＋AI不可時の人間ルーティング＋トークン記録。AI上限はオン/オフ化（無料=制限なし・有料=上限）、ダッシュボードから変更可。Groqコストアラート(Brevo・日本語)＋利用規約/使い方にAI上限文言(8言語)
- 管理ダッシュボード拡張: 運営ヘルス・タグ集計・収益枠・訪問者統計（テナント正規化で debug.↔bug. 重複解消）・テナント別流入元クロス集計
- **en/jaのみインデックス化 対応済み**（他6言語 zh/id/vi/ko/es/pt は noindex＋sitemap除外、機械翻訳量産のスケールドコンテンツ判定回避）
- **本人アカウントに音楽制作スキルタグ＋is_available=true 設定済み**（妻の質問がマッチングで本人に回るため）

**⏳ 質問が揃ってから（投稿開始の直前＝Phase 2）に実施**
- 旧seed質問の全削除（先に消すと空期間が伸びるため、下書きが揃った合図で実行）
- Googleログインのみ化（メールログインUI非表示）

**🔄 質問作り（Phase 1）の進捗**
- MUSIC PRODUCTION: **8問ドラフト完成**（#6を「展開の作り方」「メロディが思いつかない」の2問に分割済み）。開設ライン10問まであと2問。仕分け＝AI解決5・人間回答2(#1 B'zハーフワウ音・#7 Quad Cortex Mini機材相性)・未解決1(#6b メロディ)。言語はJPのまま（B'z/ONE OK ROCK/Logic系はJP検索されるため）
- 8問のタイトルはSEOロングテール化済み（詳細は下記Notion手順書/戦略ページ）。**清書＝投稿用リスト（タイトル＋本文＋仕分け＋投稿アカウント）作成は次セッションで**
- #1・#7は「本当に答えられる場合のみ人間回答」（嘘の専門家回答はしない）。#1/#7は機材が自然に出る=承認後アフィリの金脈
- BUG DEBUG: 未着手。次セッションでNotionバグトラックから英語で起こす

**次セッションの入り口**: 「Wisdom Assembleの続き。MUSIC 8問の投稿用リスト清書 or MUSICあと2問追加 or BUG起こし、から」。質問ソースは本人実体験(バグトラック/Ableton)＋妻＋友人インタビュー起こし。投稿は本人＋妻の2アカウントのみ。運用ルール詳細はNotion「実行手順書」参照

**関連Notion**: [実行手順書（完全チェックリスト）](https://app.notion.com/p/Wisdom-Assemble-3a1f5fa8bcb981db8f07f5eee4992b41) ／ [収益化・宣伝戦略FIX](https://app.notion.com/p/Wisdom-Assemble-FIX-2026-07-19-3a1f5fa8bcb981709827cff15cad9a3d)

### 🎯 2026-07-22 コンテンツ&テナント戦略FIX（最新・最優先／プランナーセッション）
**この節が現在の最優先方針。上の2026-07-20の8問配分・BUG英語化などより新しい。**
- **根本転換：BUG DEBUGは"作らない/seedしない"**。理由＝ユーザーは非エンジニア（ゲーム会社のクリエイティブディレクター）で、デバッグを本物で問えも答えもできない。開発ログのバグはClaudeが解いたもので本人の知識ではない。BUGは前セッションのClaudeが集客目的で勧めた枠だった。`bug.`サブドメインは消さず**noindex＋sitemap除外で休眠**（将来リアルな開発者ユーザーが来たら開放）。旧seedはPhase2の全削除でBUGぶんも消してカラにする。
- **seedするのは"本人が本物で語れる厚いテナントだけ"**（薄い5問テナントは作らない・出さない）。確定2本＋3本目候補：
  - 🎵 **音楽制作**＝DAW全般＋ギターのレコーディング（DAW内の録り方/音作り）。#1ハーフワウはここ。
  - 🎸 **ギター・エフェクター**＝ビンテージギター/ギター全般/エフェクター/マルチ（機材・ギア文化）。#7 Quad Cortexはここ。アフィリの本命。
  - **3本目＝未定**（30問を本物で作れる分野があれば追加。無理なら2本で申請）。
- **AdSense段階申請プラン（確定）**：①まず**2テナント×30＝60問**で申請 → ②落ちたら**3本目追加＝90問** → ③さらに落ちたら**各+10問**。「1回で通す前提でなく通るまで出す」（再申請は回数無制限・ペナルティなし・2〜4週あけて再クロール）。薄い/空のテナントはindexしない。作った質問は全て資産で無駄打ちゼロ。
- **コンテンツ言語＝全部日本語**（旧「BUGは英語で投稿」から変更。BUG廃止で実質全ジャンルJP）。
- **投稿モデル（プレサービスの仕込みとして合意済み・蒸し返さない）**：本人＋妻の2アカウントのみ。🤖AI解決=本人投稿→サイトAIが回答（明示ラベル）。👤人間回答=妻投稿→スキルタグ&is_available=trueの本人にマッチ→本人が本物回答。⬜未解決=投稿放置。2〜3割は未解決で残す。1テナント1日1〜3件・同数連続NG・時間帯バラす。ベストアンサーは回答から半日〜数日後。
- **⭐Claudeの役割（最重要教訓）**：質問本文・人間回答は"必ず本人が本物で書く"。Claudeが代筆すると57問問題（AI作のニセ物）になる。**Claudeはネタ出し/SEOタイトル整え/翻訳/構成の補助のみ**。技術系に限らず全テナントで、質問/回答の完成品をClaudeが書き上げない。ユーザーの実体験を引き出す→本人が書く→SEO/翻訳を手伝う。**※SEOタイトルも整えすぎ厳禁（2026-07-22ユーザー指摘）＝要点だけ綺麗に要約するとAI感が出る。原文の口調・人間っぽさ・多少の冗長さを残す。型番/機種名などの検索キーワードは入れるが「きれいなAI要約」にしない。最終文言は本人が調整する前提。**
- ⭐**【2026-08-25 mtさん決定】目標は「1年で100テナント」＝ペース換算で週2。** ただし**数字で固定しない**――「週どれくらい実際にできるか」と「AdSenseに問題が出ないか」を見て決める。以下が下の行の上限（月3〜4本＝週1・年50本）との差分になるので、**両方を読むこと**。
  - ⚠️**リスクの本体はテナント数ではない。** Googleが問題視するのは **scaled content abuse＝中身の薄いページの大量生産**。危ないのは下の行にある「**未経験ジャンルはAIに10問答えさせて開設ラインを満たす**」の部分で、**AI生成だけで埋めたテナントが週2で増えること**が引っかかる。人間の回答が入っているテナント（dtm・guitarのように実回答67問がある形）なら、同じ週2でも性質が違う
  - **運用**：①**承認前は月1〜2のまま**（ここは動かさない）②承認後は**週1から始めて**Search Consoleを見ながら週2へ ③週2にするときは**AI埋めテナントを連続させない**（人間回答が入るものと交互）④手動対策・インデックス異常が出たら**即ペースを落とす**
  - ⛔**一気に週2から始めない。戻せる形で上げる。** 年100は週2の余裕がない数字なので、序盤で手動対策を食らうと取り返せない
- **将来スケール（〜100テナント構想）**：承認後は"宣伝1発→放置"でスロー展開。未経験ジャンルは「よく検索される質問を10個選び、サイトのAIに答えさせる（明示ラベル）」で開設ライン10を満たす（人間回答は後から実ユーザーが埋める）。**1〜3問しかないテナントはnoindexのまま**（薄いページはドメイン全体のSEO/審査を下げる）。展開ペースは**承認まで&直後は月1〜2本**、その後は品質維持を条件に**月3〜4本（週1・年50本）まで許容**。一気の量産はscaled-content判定リスク。判断軸はカレンダーでなく質と各テナントの生存シグナル。Search Consoleで手動対策/インデックス異常を監視（カナリア）。
- **宣伝＝トラフィック用（質問集めではない）**。ジャンル別マップ：音楽=r/WeAreTheMusicMakers・r/Logic_Studio・Gearspace・KVR／X DTM界隈。ギター=r/guitar・r/guitarpedals・r/effectspedals・Ultimate Guitar／Xギター界隈。ゲーム=r/gamedev・r/IndieDev・itch.io。アート=r/learnart・ArtStation・pixiv。（BUGは休眠だが将来用=IndieHackers・r/webdev・dev.to・Zenn/Qiita/teratail）。原則：まず"答える側"で参加し信用を作る→作者として正直に1回紹介。スパム/票依頼禁止。戦う土俵はコミュニティでなく**Google検索**（ロングテール）。
- **収益化の順番（FIX）**：①**AdSense**（承認が当面ゴール・申請前はサイトをクリーンに=アフィリ貼らない）→②**アフィリエイト**（PR表記必須・トラフィック不要ですぐ効く・A8/サウンドハウス/もしも/afb）→③**Stripe Connect**（投げ銭・法務準備が整えば・トラフィック非依存）→④**広告網は"トラフィックのハシゴ"として後段（自動発生）**：月1,000セッション→Mediavine Journey／月1万UU→Media.net／月10万PV級→Raptive（RPM高いが要件が高くかなり先の目標）。※Media.net/Raptiveは"順番の1ステップ"でなくUUが伸びたら開く上位互換。
- **次アクション**：音楽制作の質問集めから（原典＝ユーザー提供メモ「music production 質問 7月20日版」＝本人の実質問。SEOタイトル整え＋残りは本人が実体験から）。3本目テナントは本人が検討中。

### 🏭 テナント量産の型（2026-07-25 確定・AdSense後の運用設計）
新テナントを継続的に増やすための分業。**律速はAPI枠でなく「本人の時間」と「Googleの目」**なので、そこを削る設計にする。

**① Seedパイプライン（1テナント10問を作る）**
1. **収集＝Claude**：そのジャンルで実際に検索・質問されている内容をWeb調査（※文章はコピーせず傾向を拾って書き起こす）。**20〜30問の候補**を出す
2. **AI回答可否の検証＝Claude**：`scripts/calibrate-threshold.mts`で全候補をGeminiに通し、**score≥91かつ回答が正しい問だけ**に絞る
3. **選定・文章直し＝本人**：候補から**10問**を選び、人間の言葉に直す（＝本人の価値。ここは代筆しない）
4. **投稿＝実サイトから本人**（❌SQL一括はNG：タイムスタンプが偽物になる＋AI回答/8言語翻訳/マッチングを全部バイパスするため）。**Claudeが「貼るだけパケット＋投稿スケジュール」を用意**し、本人はコピペとクリックのみ。**2アカウント×2日に分散**すれば自然
- **なぜこの型か**：閾値91だとAI回答率は約20%。何も考えずに10問seedすると8問が無回答＝死んだテナントに見える。**「AIが答えられる質問」を先に選抜する**ことで、開設時点で回答が揃い、本人は回答を書かなくて済む。**量産用の10問はAI回答が多くて構わない（むしろSEO的に有利）**＝答えのあるページの方が価値があるため。※AdSense用の65問（本人の実体験＝ニッチな機材質問中心）とは別物なので混同しないこと。65問での選抜率20%は「本人の実体験＝AIが苦手な領域」だったからで、量産用の「よく検索される基本的な質問」なら選抜率はもっと高くなる見込み（実際は較正ツールで測って確定する）。
- **⭐ポリシー違反にならない根拠（2026-07-25 ユーザー確定）**：Googleが規制するのは「**人間のレビューを経ていない**大量生成コンテンツ」。この型は ①AIで答えられるかの機械的選抜のあとに **②本人の検閲・選定・清書（人間のレビュー＋自分の言葉への書き直し＝価値付加）** が必ず入り、③AI回答は「AI回答」ラベル付きで正直、という3点が揃うので該当しない。**手順②を省略して機械的に投稿すると、この根拠が崩れる**ので絶対に飛ばさないこと（Claudeが質問文を代筆しないのも同じ理由）。

**② メディア出し（トラフィック作り）**
- **アカウント作成＝本人**（Claudeは作成不可）。必要なメディアを一緒にリストアップして本人が作る
- **どのメディアに出すか＝Claudeが判断**（テナントのジャンルに合わせて複数選定）
- **記事・ポスト・動画台本＝Claudeが下書き**（テキストは全部可。**映像生成は不可**＝台本/構成/字幕まで）
- **公開＝本人が押す**（❌自動公開はNG：Reddit/TikTok/Instagramは自動投稿・宣伝botを規約で禁止＝BANリスク。加えてClaudeは投稿に都度許可が必要）
- ＝**「下書きを全部用意しておいて、本人が押すだけ」**で労力の9割をClaudeが持つ
- **あるあるショートの型**：「◯◯したいけどどうすれば（あるある）→ こんなサイトある → とりあえず相談してみよう」。押し付けがましくない導線。**テンプレ化してテナントごとに差し替える**
- **宣伝の量の割り切り（2026-07-25）**：テナント追加ごとに毎回フル宣伝はしない。**1テナント＝あるある動画1本を作り、TikTok/Instagram Reels/YouTube Shorts/X に横展開**（同じ動画を自分のアカウントに上げるのは各社とも標準的な使い方でポリシー問題なし。Redditで同じ宣伝を複数subに撒くのとは別物）。**Redditは信用作り(9:1の不文律・低カルマだと即消される)が重いので"ここぞ"の大きい時だけ**。本命はSEOで宣伝は着火剤なので1発で十分。
- **動画の実務**：①**透かしなしで書き出す**（TikTokの透かし入りをReelsに上げると各社が自社以外の透かしを嫌い伸びない）②**YouTube Shortsを必ず入れる**（同じ動画で4媒体＋YouTubeはGoogle検索にも出る＝SEO直結）③**テナントとの相性**：音楽・ギターは機材が映る/音が出るので動画が強い。抽象的なジャンルは静止画＋テキストで割り切る
- **ポリシー整合の要点**：各媒体が禁じるのは「bot/自動投稿」「偽の複数アカウント」「宣伝しかしないアカウント」「正体を隠した宣伝」。この型は**人間が最終的に押す＋実在2アカウントのみ＋作者と名乗る**を守るのでセーフ側。
- **⭐媒体リスト確定（2026-07-25）**
  - **【動画｜毎回やる】1本を7媒体へ横展開**：TikTok / Instagram Reels / **Facebook Reels**（Metaから同時投稿できる）/ **YouTube Shorts**（Google検索にも出る＝SEO直結・必須）/ X / **Threads**（IGアカウントで即開設）/ **Pinterest**（Pinはストック型で半永久的に検索される穴場）。手間は「動画1本＋7回アップ」だけ。
  - **【記事｜2本だけ】note（日本語・実体験寄り）＋ dev.to（英語・build-in-public）**。**直訳の使い回しはしない＝読者が違うので書き分ける**（重複コンテンツ回避も兼ねる）。dev.toを選ぶ理由＝英語ネタが「非エンジニアがAIとサービスを作った話」になるためdev.toの文化のど真ん中。Mediumは無名だと埋もれる/有料の壁があるので当面見送り。※自サイトの記事を転載する場合のみcanonicalを元記事に向ける（書き下ろしなら不要）。
  - **【やらない】はてなブログ**（記事は数を撒いても効かない。note+dev.toに集中）／**Qiita・Zenn**（BUG系テナットがない今は場違い）／**Medium**（当面）／Discord常駐
  - **【施策リストに入れない】はてなブックマーク**：自分でやる施策ではなく良い記事に"起きる"現象。セルフブクマ/依頼はバレるし嫌われる。
  - **【その場判断】Reddit**：カルマ・9:1の不文律で手間が重く1投稿の寿命も短い。**"ここぞ"（Show HN/Product Hunt級のローンチ弾）の時だけ**検討。
  - **⚠️動画と記事の決定的な違い**：**動画は"同じ物の横展開"が効く**（各プラットフォームのアルゴリズムが別々に配るため）。**記事は横展開が効かない**（Googleが1つしか評価しない＝重複コンテンツ）。だから動画は7媒体、記事は2本に絞る。
  - **最初に作るアカウント（7系統・本人の作業）**：Google(YouTube) / Meta(IG+FB+Threads) / TikTok / X / Pinterest / note / dev.to
- **宣伝の言語＝en/jaのみ**（サイトのインデックス対象と揃える）。他言語で宣伝しても受け皿(ページ)がnoindexなので意味がない。SEO言語を解禁したら合わせて増やす。
- **動画の言語対応（2026-07-25確定）**：**アカウントは分けない＝7つのまま、1アカウントに日本語版と英語版の両方を上げる**（14アカウントは管理破綻＋フォロワー分散＋作成の手間2倍でNG）。各プラットフォームのアルゴリズムは**動画ごとに視聴者を判断**するので、日本語字幕は日本人へ、英語字幕は英語圏へ勝手に配られる。実務＝①**映像素材は1つ（セリフなし＋字幕）** ②**字幕だけ差し替えて2本書き出す** ③**同じアカウントに1日ずらして2本上げる**（同時だと重複扱いされることがある）④**キャプション・ハッシュタグは動画の言語に合わせる**（配信先を決める最大の要因）⑤**リンク先の言語を揃える**（英語版→/en、日本語版→/ja。バラバラだと離脱）。音楽・ギターは「音」と「機材の絵」が主役＝言語依存が低く字幕だけで両対応できる。「あるある」も万国共通。※ショート動画は日本より**海外の方が桁違いに市場が大きい**（TikTok/Reels/Shortsとも米国・東南アジア・南米が主戦場）。
- **⭐AdSense申請「前」のトラフィック作り（2026-07-25確定・これだけやる）**
  - **前提**：AdSense審査で見られるのは**サイトの中身**でトラフィック量ではない（アクセスゼロでも承認される）。だから審査前に無理な集客は不要。目的は**①動画の型が機能するかのテスト ②Googleにサイトを認知させる**の2つだけ。
  - **やること4つ**：①**あるあるショート1本を作って7媒体へ**（音楽 or ギター。反応を見て本番の量産前に型を改善する）②**アカウント7系統を作る**（今のうちに作って"アカウント年齢"を稼ぐ＝作りたてより有利）③**noteに記事1本**（例「非エンジニアがAIとQ&Aサイトを作った話」＝被リンク1本でGoogleに存在を知らせる）④**GSCで新しい質問ページのインデックス登録をリクエスト**（審査時に中身が検索に載っている状態にする＝一番効く）
  - **やらないこと**：Reddit／Show HN／Product Hunt＝**本命の弾は温存**（1回しか使えないカードを中身が薄いうちに切らない）。アフィリンクも承認後まで貼らない。大量投稿はしない。
  - **順番**：**質問投稿 → 上記①〜④ → AdSense申請 →（承認）→ 本格的な宣伝・テナント展開**（中身が無い状態で宣伝しても離脱するだけ）
  - **Show HN / Product Hunt の位置づけ（2026-07-25）**：観客がテック系なので「ギターの質問しに来て」では刺さらない。**刺さる角度は「非エンジニアがAIとQ&Aプラットフォームを作った」というプロダクトの話**。＝**ユーザー獲得の弾ではなく「お披露目＋被リンクの弾」**。使うならサイト完成後に1回だけ。BUG系テナントを復活させたら本領を発揮する。**Redditはほぼやらない見込み**。

**③ テナント棚卸し（実装済み 2026-07-25）**
- 管理→サマリー→テナント別サマリーに**「勢い」列**を追加。📈伸び（直近7日が前3週平均の1.2倍以上）/→横ばい/📉減速（半分以下）/💤休眠（30日ゼロ）。既存のq_7d・q_30dから算出＝SQL変更なし。**月1で開いて、伸ばすテナントと畳むテナントを判断する**

### ✅ ローンチ準備 総点検（2026-07-22・抜け漏れチェック結果）
- **✅ 揃っている（対応済み）**：法的ページ（利用規約／プライバシー[広告Cookie開示込み]／コンタクト）・About（Footer統合）・構造化データ・sitemap.xml・hreflang・robots・OGP・カスタム404・en/jaのみindex（他6言語noindex＋sitemap除外）・レート制限・AIコスト三重ストッパー・自動高難度移行(pg_cron)・回答最小文字数(30字)・**GSC設定＆sitemap送信（今日）**・**Google Cloud MFA有効化（今日）**。
- **⚠️ ローンチ直前の要対応3件**（詳細は上の「⚠️ユーザー手作業タスク」節）：①Google OAuthアプリの本番公開 ②メール通知(Brevo)の本番到達確認 ③About/運営者情報の十分性チェック。※①②はseed段階（本人＋妻の手動運用）では不要、実ユーザー公開の直前に対応。
- **🔹 任意・後段**：GA4（自前の訪問者ダッシュボードがあるので必須でない）・クッキー同意CMP（Funding Choicesを承認後に有効化予定）・旧コンテンツ削除(Phase2)後の404をGSCで監視。
- **🧭 未確定（ユーザーの宿題）**：3本目テナントの決定（音楽・ギターは確定）／各テナント30問の質問作り（＝本丸・実質9割の作業）。
- **総評**：技術・法的・SEOの土台はほぼ完成。残りは「本物の質問を貯める」ことが実質9割。上記⚠️3件はローンチ直前チェックとして保持。

### 🧪 AI閾値キャリブレーション（新テナント作成の"肝"・2026-07-22 実測で確立）
- **最大の教訓：Groqの自己申告スコアは「正しさ」を保証しない。** 実測で、正しい回答も間違った回答も同じ〜80が付いた（例: Max for Liveデバッグで存在しない`println`を score80／BOSS OD-1のオペアンプをμA741(実際はRC4558)と score80で誤答／Les Paul比較を score90でも粗く）。**機材・ビンテージ系は特に自信満々でハルシネーションする。**
- **だから閾値はスコアだけで決められない。必ず回答の正誤レビュー（Claude＋初期はユーザー）を併用する。**
- ~~**音楽・ギターの閾値は87を維持**~~ ※**2026-07-22のGemini移行で91に変更済み**（以下はGroq時代の記録）
- （Groq時代）音楽・ギターの閾値は87を維持（80に下げると誤答がAI回答に混じる＝「嘘ばっかり」になる）。87では実質ほとんど人間ルートになるので、**ユーザーが「自分で本物回答するもの／高難度(公開)にするもの」を選ぶ**運用でいく。
- **ギターは特にAIハルシネーションが多い＝ほぼ人間回答が正解**。弱点でなく「AIが失敗する隙間を本物の専門家(ユーザー)が埋める」というサービス思想がドンピシャで機能するジャンル。
- **キャリブレーション方法（テナント作成の標準手順）**：①代表10問（易しめ〜ニッチまで混ぜる）を用意 ②Groqに通しscore＋回答を取得 ③**Claude(+初期はユーザー)が回答の正誤をレビュー** ④**閾値＝「間違い」と判定した回答の最高スコアのすぐ上** ⑤正しい回答と間違い回答が同スコアで分離不能なら→閾値を高く(ほぼ人間)＝そのジャンルは人間専門家型。「AI回答〜5割」は目標だが**正誤ゲートが最優先**。
- **ツール：`scripts/calibrate-threshold.mts`**（`npx tsx`で実行・設定例 `scripts/calibration.sample.json`）。**本番の`askWithScoreInScopeCfg()`を直接importする単一ソース版**（旧`.mjs`は自前コピーで本番とズレたため廃止）。config(label/inScope/outScope/threshold/questions[{text,correct}])を渡すと、各回答＋score＋補正後＋判定を出力し、正誤ラベルがあれば**推奨threshold＋AIカバー率＋現閾値の安全性**を算出、結果を`<config>.results.json`に蓄積(学習用)。**テナントビルダー(Artifact)が候補質問を生成→このツールでキャリブレーション、の併用フロー**。※Artifactはサンドボックスで外部通信不可＝AI実行はClaude Codeセッションで行う。
- **学習運用**：ジャンルごとにラベル付き結果を`.results.json`に蓄積し、最適閾値を再計算していく。初期はユーザーの専門判断を重視、慣れたらClaudeの正誤判定を主にして自動化を進める。
- **モデル選択：Groq(llama-3.3-70b-versatile)を維持**。Geminiに替えてもハルシネーションは解決しない（全LLM共通）うえ、コスト増＋閾値ロジックの全再調整が必要。そもそもGeminiは無料枠limit:0で使えずGroqへ移行した経緯。**人間ルーティングという安全網がある以上、モデル差の重要度は低い**。※将来モデル比較したければツールの`MODEL`を変えて同じconfigで再実行するだけでA/Bできる。

### ▶ 実行タイムライン＆役割分担（2026-07-22 確定）
- **今週**：質問確定＋仕分け（AI解決／人間回答／未解決 or 高難度）＋**人間回答の執筆（本人）**。並行で**Claudeが2テナント（音楽・ギター）のコード設定＋閾値キャリブレーション**を進める（コンテンツ不要な部分は先行可）。
- **来週〜再来週（投稿はレート制限3件/日/テナント＝30問なら最短10日＝実質2週間）**：実サイトへ投稿＆回答を入れる。**投稿スケジュール（何日にどの質問をどのアカウントで投稿／回答／ベストアンサー選択するか）はClaudeが作成**（＋"貼るだけパケット"）。本人は表どおりに実行＋人間回答の中身を記入。
- **3週目後半〜4週目頭**：**AdSense 1回目申請**（段階申請＝落ちたら直して再申請）。
- **アカウント**：本人＋妻の2つのみ（他のGmailは使わない＝ニセ人格回避）。回答はB→Cへ行かせず**本人が直接回答**。
- **役割分担**：Claude＝テナントのコード設定・閾値キャリブレーション・**投稿スケジュール&貼るだけパケット作成**・回答の骨子/構成の手伝い。本人＝クリック（投稿／ベストアンサー選択）＋**人間回答の本文執筆（本物）**＋Cloudflareドメイン追加/Supabase INSERTの操作。
- **注意（再掲）**：AdSenseは「答えのある充実ページ」を評価＝"数"より"ちゃんと答えた質問"。閾値87で大半が人間ルート＝本人の回答執筆が律速。無理なら未解決割合を増やす/申請を後ろ倒す判断。

### 追記（2026-07-22 確定）：閾値の最終方針・全問チェック・BUG非表示の具体
- **閾値（Groq時代の確定値。Gemini移行後は91）：音楽=87・ギターも=87**（ユーザー決定「87のまま＋手動チェック」）。ギターも87では危険な誤答（Les Paulがscore90で誤り等）が通るが、**閾値を上げる代わりに、AI回答になる問（score≥87）を全部あなた＋Claudeが目視チェックし、間違い/空は人間回答or未解決に振り替える運用**にする。
- **全65問キャリブレーション実施済み（2026-07-22）**：`scripts/calibration.{music,guitar}.json`で全問をGroq87判定＋回答取得、Claudeが正誤レビュー。結果は**Notion「投稿用 質問リスト」に各問の仕分けとして反映済み**（🤖✓=AI可/👤=本人回答/👤(AI誤答)=AIが間違えたので本人/⬜=未解決）。AI回答12問中、正確に使えるのは約3問（M14/G26/G30）、残りは間違い・空・浅い＝人間/未解決へ。データ上の注意：G03はAIがジャンル外と誤判定（本文にKlon/エフェクター明記で対処済み）、G15はJSON崩れでスコア0（中身は正しかった）。
- **仕分けは実質3択（2026-07-22追記）**：🤖AI解決／👤本人回答／⬜放置。**⬜放置は「未解決(open)」も「高難度(hard)」も実質同じ扱い**（どちらも本人が答えず開いたまま置く＝ユーザー指摘。厳密にはhardは/hardタブ＋バッジの別ステータスで、hard表示にしたい問だけ投稿後にエスカレーション操作）。**回答に時間がかかる難しい問は無理に人間回答せず放置でOK**（本人は答えられるものから潰す）。質問文（タイトル・本文）は本人が人間の文章に清書 → 清書後に`calibrate-threshold.mts`で**再診断**（AIが見るのは本文なので）。
- **「AIは間違えることがある」注意書きを実装済み（2026-07-22）**：`howItWorksPage.aiAccuracyNote`を全8言語に追加＋how-it-worksページに描画。文言(JA)＝「AIの回答は参考情報です。内容が間違っていることがあります。納得できない場合は、質問を少し言い換えてもう一度投稿してください。」※AIが答えたら人間ルーティングは走らない（そこで完結）ので「人間の回答を待て」とは書かない＝実挙動に一致。方針：Groqが90でも誤答する件は、全部人間に回すのは不自然なので、この注意書き＋再投稿で回収する（AI回答が納得いかなければ言い換えて再投稿）。
- **【2026-07-25 判断】レート制限は現状維持（1テナント3問/日・全体10問/日）**：Gemini移行でAI枠が1日1000問級に広がっても**上げない**。理由＝この上限の目的はAIコストの天井でなく**荒らし/スパム/API乱用の防波堤**で、枠が広がっても目的は変わらない（むしろ悪意ある1人に大量消費されない蓋として重要）。本物の質問を1日5問書く人はほぼおらず、上げても正当なユーザー体験は改善しない（引っかかるのは実質スパムだけ）。seed投稿ルール（1テナント1日1〜3件）とも一致。広い枠は「1人の上限を上げる」でなく「急な流入への耐性」に効かせる。※Geminiは**RPM 15**（Groq30の半分）なので、日次より**瞬間の同時実行**が先にボトルネックになる点に注意。**見直すのは「正当なユーザーが上限に当たっている」がダッシュボードで観測できてから**（実データが出るまで触らない）。
- **✅【2026-07-25 実装・デプロイ済み】Q&A構造化データの推奨項目を追加（GSC指摘4件の解消）**：Search Consoleが「Q&Aの構造化データに問題4件（重大ではない＝推奨項目）」を検出。`src/app/[locale]/questions/[slug]/page.tsx`の`buildQAPageJsonLd()`に **Question.url / Question.author.url / Answer.url / Answer.author.url / Answer.upvoteCount** を追加。`Answer.url`は`{pageUrl}#answer-<id>`を指すので、回答の`<li>`に`id={answer-${a.id}}`も付与（リンク先を実在させる）。`upvoteCount`は**投票機能が無いため0固定**（項目の存在自体がGoogleの推奨）。`pageUrl`はgenerateMetadataのcanonicalと同じ組み立て（`https://{host}/{locale}/questions/{slug}`）。**JSON-LDはGoogle向けメタ情報のみで画面表示・マッチング等のロジックには非関与**。検証: typecheck/本番build通過＋生成JSONの4項目充足・既存項目無傷・XSSエスケープ維持を実データ想定で確認。※GSCの警告表示が消えるのは再クロール後（数日〜数週間）。
- **⚠️共通コピーはテナント共通で出す（per-tenant化しない）**：使い方・注意書き等の共通説明はグローバルなi18n（`messages/*.json`）＋共通ページ（`how-it-works`等）で提供＝**全テナントで同一表示**。テナントビルダーで作る新テナントでも自動で同じ文言が出る。**テナントごとに共通説明の差を作らないこと**（テナント差はロゴ/色/名前/GENRE_CONFIGだけ）。ユーザーが2026-07-22に明示指摘。
- **全問AIチェック**：質問が全部揃ったら、全問を`scripts/calibrate-threshold.mts`に通す（score／**91**判定／回答全文）＋Claudeが正誤レビュー → 「AIに任せる／本人が回答／未解決 or 高難度」の**確定リスト**を作る。
- **ギターテナント作成**：**テナントビルダー(Artifact)で作る**（music-prodは既存）。ビルダーで設定・ロゴ・カラー→Claudeがコード反映＋閾値キャリブレーション。
- **BUG非表示の具体**：ルート`PortalHome.tsx`の`REVIEW_TENANT_IDS`から`bug`を外す（ポータルのカード非表示＝ルートから一時的に外す）＋noindex/sitemap除外は維持＋サブドメイン・DBは消さず休眠。テナント作業のタイミングでClaudeが実施。

### ✅ AI回答をGroq→Gemini 3.5 Flash-Liteへ移行（2026-07-22・品質理由・実測ベース）

**移行理由は「安いから」ではなく「嘘が少ないから」。** 全65問（音楽34＋ギター31＝Notion「投稿用 質問リスト」の実問題）でA/B実測した結果：

| 指標 | Groq llama-3.3-70b | **Gemini 3.5 Flash-Lite** |
|---|---|---|
| 閾値超え回答の誤り | **8/12件(67%)** | **2/28件(7%)** |
| 日本語品質 | 崩壊・独語混入(`Qualität`)・途中切れ多発 | 問題なし |
| ジャンル誤判定 | G03(ケンタウロス)を「ギター無関係」と誤判定 | **0/65件** |
| 無料枠 | 約70問/日で停止 | **RPM15・TPM250K**／実測100問超でも継続 |
| 有料時(2000問/日) | $27/月 | $55/月（**Groqの2倍だが許容**） |

- **Groqの具体的な誤り例**: OD-1のオペアンプを`μA709`(前回は`μA741`＝実行ごとに変わる)。正解は初期=**Raytheon RC3403ADB(クアッド)**／後期=デュアル（ユーザーの専門知識で確定）。他にジャガーのトーン回路・レスポールCustomのピックガード有無なども誤り。
- **確定値**: モデル`gemini-3.5-flash-lite`（固定ピン）／**閾値91**／単価**$0.30/$2.50**（公式ページで3.5FLの行を検証。2.5 Flash無印と同額なので混同注意）／エンドポイントはOpenAI互換。
- **閾値91の根拠**: Geminiはスコアが**90点帯と95点帯に分離**する。既知の誤答(G02:OD-1型番, G23:QC Mini非実在と誤答)はいずれも90点、**95点帯13問は全て正確**だった。よって91以上でAI公開＝誤答を除外できる（Groq時代の87のままだと85%が公開され誤答が混入する）。**AI公開率は20%**。
- **adjustScoreの負の遺産を是正**: ①「500字超で-10」はGroqの簡潔さ(平均241字)前提で、Gemini(平均470字)では**45%が不当減点**→**1200字**に緩和。②ゼロ化ルールの`確認.*ください`はGeminiの親切文言に誤爆し**素点90の正答をゼロ**にしていた(M06)→`最新の情報|私の知識.*まで`のみに限定。
- **429の扱いを二段構えに**: GeminiはRPM15(Groqの半分)で分単位の一時429が起きる。`retryDelay`を解析し**20秒以内はその場で待って再試行**（ユーザーには成功として返る）、長い/不明ならRPD超過として実際の復活秒数を`aiRetryAfterSec`でモーダルへ渡す。「翌0時まで使えません」と誤表示しない。
- **層③の是正（重要）**: **GCPの「予算アラート」は通知するだけで課金を止めない。** 実際の蓋は**Generative Language APIの割り当て(Quota)**で1日のリクエスト数に上限を入れること。ダッシュボードの説明・リンクもこれに合わせて修正済み。
- **ロールバック手段**: `USE_GEMINI = !!process.env.GEMINI_API_KEY`。**Cloudflare Secretの`GEMINI_API_KEY`を消せば即座にGroqへ戻る**（コード変更・再デプロイ不要）。Secret未登録の環境でも停止しない安全策も兼ねる。
  - ⚠️ **ロールバック時は閾値も87に戻すこと**。閾値91はGeminiのスコア分布に合わせた値で、Groqは95がほぼ出ない（65問中1問）ため、91のままGroqへ戻すと**事実上AI回答ゼロで全部人間ルート**になる（安全側だがAIが機能しない）。`GENRE_CONFIG`と`DEFAULT_THRESHOLD`を87へ。
- **【2026-07-25 修正済み】較正ツールが全問401になるバグ**: 単一ソース化のリファクタで旧`.mjs`が持っていた`.env.local`読み込みを落としていた。Next.jsは`.env.local`を自動で読むが**`npx tsx`で直接動かすスクリプトは読まない**→`GEMINI_API_KEY`未定義→Groqへフォールバック→そちらも未定義→`Bearer undefined`で401。**「以前は動いていた」のは実行時にシェルで`set -a; source .env.local; set +a`を前置していたためで、ツール自体は一度も読んでいなかった**。→`loadEnvLocal()`で`process.env`へ注入してから`await import('../src/lib/gemini')`する形に修正（**静的importは巻き上げられて先に評価されるため動的importが必須**。gemini.tsはモジュール読込時にprocess.envを見てUSE_GEMINIを決めるので順序が重要）。インライン指定(`GEMINI_API_KEY=... npx tsx ...`)があればそちらを優先。コミット`82a6cda`。
- **較正configの正誤ラベルは消さないこと**: 質問configを更新する際に`correct: true/false`を消すと、ツールの**推奨threshold自動算出が働かなくなる**（閾値の妥当性チェックが出せない）。2026-07-25に一度全消えし復元済み(`f4e7f92`)。ただし**質問文が書き換わったID(M08/M14/M17/M34)はラベルを戻していない**ので、次に較正を回すときにこの4問だけ正誤レビューが必要。
- **較正ツールは本番コードを共有すること**: `scripts/calibrate-threshold.mts`（`npx tsx`で実行）が本番の`askWithScoreInScopeCfg()`を直接importする。旧`.mjs`はプロンプト・adjustScore・モデルを自前コピーしていて**必ず本番とズレた**（実例: 長文減点500字 vs 1200字で較正結果が9件/13件と食い違った）ため廃止スタブ化済み。**新テナント較正時に自前コピーを作らないこと**。ツールはRPM15に合わせ4.5秒間隔で実行する。
- ⭐⭐**【2026-08-25 mtさん明示】判断の優先順位は「①価値あるコンテンツ ②人間が作った ③AdSenseを通る」。投稿ステータスの配分表（🤖22／✅31／📝8／🔥6）は目的ではなく手段。**
  - ⛔**プランナーは配分表を目的として扱い、「BAを押すと🤖が21になるからダメ」のような数合わせで話していた。これが誤り。** 数字が合うかではなく、**そのページが読む人にとって価値があるか**で決める。配分が合うのは結果であって理由ではない
  - **具体例（同日のG22）**：回答しなければ回答ゼロのページが1枚増える／回答すれば人間の一次情報が載ったページが1枚増える。⚠️**AdSenseの最頻出の不承認理由が Low value content で直撃するのが回答ゼロのページ**――そもそも🔥を6問に絞ったのもこの理由。つまり**回答するほうが優先順位3つすべてに沿う**。配分がピッタリ合うのは副次的な結果にすぎない
  - **具体例（同日のG19）**：人間の回答を足せない以上、`ai_answered` のままでも `solved` にしても**読者が読むものは同じAI回答1本＝価値は変わらない**。よって何もしない。⛔**惜しいからといって似た質問を立て直さない**（重複コンテンツでAdSenseにもSEOにも逆効果）。本人の回答文は取っておき、将来その話題が別の形で来たときに使う
- ⚠️**「奥様アカウントが答えるのは自作自演」は誤った指摘だった（2026-08-25 mtさん訂正）。** 質問も回答も**mtさんと奥様が二人で一緒に考えたもの**で、2つのアカウントは実在する2人。⛔プランナーが方針違反として止めたのは的外れだったので、**同じ指摘を繰り返さないこと**
- ⚠️⚠️**【2026-08-25 実データで反例が出た】「ブレはAI公開率が下がる方向にしか効かない＝安全側」は誤りだった。** Day 9 で**2問が同時に逆方向へブレた**：
  - **G19（Gibsonアコギ/Martin）較正90 → 本番95** ＝ 人間ルートのはずがAIが回答して完結（`ai_answered`）。⭐**AI公開が増える方向のブレが実在する**
  - **G22（HX Stomp）較正95 → 本番90** ＝ AI公開のはずが人間ルートに落ち、質問者(本人)以外＝奥様にマッチ
  - **G10 は 90→90 で想定どおり**。同じ日の3問で2問がブレた＝**発生率は低くない**
  - ⚠️**含意：投稿ステータス一覧（🤖/✅/📝/🔥の割り当て）は「予定」であって「確定」ではない。** 較正はあくまで事前の目安で、本番のスコアは投稿のたびに引き直される。**毎回ズレる前提で運用する**こと
  - **G19の実害はゼロ**（AI回答の内容は正確で、本人の回答とも方向が一致していた）
  - ⛔⛔**【重要な仕様】`ai_answered` になった質問には、誰も回答を追加できない。** プランナーが「本人が回答を追加すればいい」と提案したが**確認せずに言ったもので、成立しなかった**（mtさん指摘）。`questions/[slug]/page.tsx` の回答フォームは3箇所あるが、G19はどれにも当てはまらない：
    - `422行 isOpen && !matched_b_id` → status が `ai_answered` なので `isOpen` が false ❌
    - `429行 showAnswerForm = (isMatchedB || isMatchedCUser) && !isSolved && !alreadyAnswered` → AIが答えた質問は **`matched_b_id` が null**（誰も割り当てられない）ので false ❌
    - `439行 isHard` → hard ではない ❌
  - **よってG19は何もしない。** ⛔「ベストアンサーにして解決」も押さない（📝枠＝BAを選ばない方針に一番近いのは `ai_answered` のまま残すこと）。本人の回答文（1966年のLG1／1950年のOO）は**今回は使えないが消さない**――将来この質問が別の形で立ったときや記事の素材として価値がある
  - ⚠️**プランナーへの教訓：UIの挙動を「たぶんできる」で提案しない。** 回答フォームの表示条件は1行（`showAnswerForm`）で読めば済んだ。**画面の話をする前にコードを見る。**
  - **実際の配分の変化**：🤖22→22問（G19が入りG22が抜けて同数）／📝8→7問（G19が抜けた）／🔥6→7問（G22が加わる）＝**回答ゼロが9%→10.4%**
  - **G22の対応＝何もしない（放置して🔥へ）。** ⚠️⚠️**2026-08-29 訂正：「⛔奥様は答えられない（本人の領域）」は誤りだった。** ⭐**MeloSt（奥様）アカウントも回答できる**――質問も回答も**mtさんと奥様が二人で一緒に考えたもの**で、2つのアカウントは実在する2人。782行に同じ訂正が既にあったのに、この行を消し忘れたため**プランナーが8/29に同じ間違いを繰り返した**。⛔**本人が投稿した問が奥様にマッチしても詰まない。** 残るのは「⛔本人が自分の質問に答えるのは自作自演」だけ（これは仕様上もできない）。/⭐「AIが答えられなかった質問が高難度に上がる」のは仕様が正しく動いている姿。回答ゼロが6問(9%)→7問(10.4%)に増えるが、AdSenseの危険水域(2割)には遠く許容範囲
- **バンド安定性を実測（閾値91の妥当性検証・プランナー指摘🟡3）**: スコアは5点刻みでブレるため「誤答が95に上がって公開されないか」を検証した。既知の誤答2問を独立に複数回実行した結果、**G02=[90,90,85,90,85,90,90]（7回）／G23=[90,90,70,85,65,90]（6回）＝計13サンプルで一度も91以上に達しなかった**。逆に正答は95→90に落ちることがある（G06）。つまり**ブレは「AI公開率が下がる」方向にしか効かず、誤答が公開される方向には出ていない＝安全側**。閾値91は妥当と判断する。※将来モデルを変えたら必ず再測定すること。
  - ⛔⛔**2026-08-29 この「安全側」という結論は反証された。** 実測で**上方向のブレが4件**出ている：G19(90→95)／M03(90→95・⚠️**その95の回答が誤答**)／G15(90→95)。さらに下方向も G22(95→90)／M25(95→90)。⭐**13サンプルで出なかっただけで、母数が増えたら普通に出た**（39問中5件＝13%）。**閾値91が「誤答を除外できる」という前提はもう成り立たない。** → 対策は「🧠 2026-08-27 AI判断ロジックの信ぴょう性問題」に集約（承認後の最優先）
- **正誤ラベルは必ずconfigに書き戻す**: `scripts/calibration.{music,guitar}.json`の各質問に`correct: true/false`を記入済み（95点帯13問=正、G02/G23=誤）。これによりツールが推奨thresholdを自動算出でき、第三者が再現・検証できる。
- **モデル寿命対策**: 固定ピン＋**404時のみ`gemini-flash-lite-latest`へ自動退避＋ログ出力**。`-latest`常用はしない（実測で`3.5-flash-lite`=RC3403DB／`-latest`=RC4558Pと**別の答えを返す**＝中身が違い閾値較正が無効化されるため）。
- ~~**ハイブリッド構成**: 回答生成=Gemini／翻訳=Groq据え置き~~ → **2026-07-22に翻訳もGeminiへ移行（B案）**。Groq 8bには実害のある誤訳があった（韓国語で「op-ampの"音"」→「소음(騒音)」＝意味が変わる／中国語に日本語カタカナ混入）。移行前に**型番(RC3403ADB/uPC4741C)・製品名(Quad Cortex Mini等)・Markdownが全7言語で保持されることを検証**し、本番同等フロー3回連続で7/7言語成功を確認。**GroqはGemini障害時のフォールバックとして経路を残す**（単一プロバイダだと障害時に翻訳が全滅するため）＝**GROQ_API_KEYは削除しないこと**。1問あたり翻訳コスト$0.0029。
  - **実装の要点（第三者レビュー済み）**: Gemini優先→失敗時Groqフォールバック（`order=['gemini','groq']`）。**翻訳の再試行に18秒の時間予算**を設けている（`TRANSLATE_BUDGET_MS`）。翻訳は質問投稿APIのレスポンス前にawaitされるため、予算が無いとプロバイダ2つ×再試行で最悪50秒超ユーザーを待たせる（自己レビューで発見・修正）。**予算は「1回の翻訳呼び出しあたり」**で、質問翻訳とAI回答翻訳は別々に持つが並行して走るため**実効の最悪値は約20秒**。予算切れ時は翻訳を諦めるだけで、**質問の投稿・AI回答・人間ルーティングには一切影響しない**（DB保存もルーティング判定も翻訳待ちより前に完了しており、翻訳は両方`.catch()`で握っている）。`deadline`はモジュール変数でなく引数のデフォルト値なので**同時リクエストでの競合なし**。
  - **`GROQ_API_KEY`は絶対に消さないこと**: Gemini障害時のフォールバックに必要。以前は`process.env.GROQ_API_KEY!`(non-null断言)だったため、削除すると`Bearer undefined`で401を撃ち続け**保険が静かに死ぬ**状態だった→キーの有無で経路自体を外すよう修正済み。
  - 選定根拠（実測）: 1日の問数は A(Groq8b翻訳)300〜1000問／C(Groq70b翻訳)300〜833問／**B(フルGemini)136〜455問**。Bが最少だが**実運用は1日6問**（レート制限3件/日/テナント×2）なので20倍以上の余裕があり、問数・コストはBの弱点として実質成立しない。**実在する差は品質だけ**なのでBを採用。あわせて請求先・監視・障害点が1つに集約され運用が単純になる。
- **プラポリ8言語を実態に修正**: AI処理の主体を「Google Gemini・Groq」に。※**無料枠はプロンプトがGoogleの学習に使われる可能性**があるため、実ユーザー公開前に「有料枠/Vertexへ切替」か「学習利用をプラポリに明記」のいずれかを判断すること。
- **Pro系は無料枠なし**（`limit: 0`が明示される）。過去にGeminiを諦めた原因はこれ。**Flash系は正常に使える**ことを実測で確認。
- ツール: `scripts/model-compare.mjs`（モデル横断比較）。閾値較正は`scripts/calibrate-threshold.mts`（本番コードをimportする単一ソース版）を使う。
- **無料枠の実測値（2026-07-22・ボトルネックの整理）**: Gemini(回答生成)=**15 RPM**（AI Studioのレート制限ページと実測が一致・RPDは未確定だが145問超えても停止せず）／Groq 8b(翻訳)=**14,400リクエスト/日・6,000 TPM**（レスポンスヘッダーから取得）。実際の質問1問の翻訳は**816トークン・1.4秒で7言語**（G02で計測）＝**1分あたり約7問**ぶん翻訳できる。**ボトルネックは「アプリのレート制限(1人1日3件/テナント・10件/全体)」が最も厳しく**、翻訳(約7問/分)→Gemini(15問/分)の順。1分に7問も投稿される構造ではないので**翻訳が詰まる心配はない**（429時は最大4回の自動リトライも実装済み）。※翻訳の「訳質」は今回未検証（従来どおり8bの実績ベース）。
- **管理ダッシュボードのGroq表記も是正**: `AdminSummary.tsx`に加え`AiBudgetEditor.tsx`（「Groqの無料枠で自然に頭打ち」「目安：無料枠は約70件/日」）を見落としていたため修正。**翻訳はGroq継続なのでAdminSummaryのGroqコンソールリンクは意図的に残す**（実態と一致）。
- **テナントビルダー(Artifact)の閾値を87→91に更新済み**（URL不変: https://claude.ai/code/artifact/cad8ed82-9f1f-4131-b389-5be73c9ada22 ）。入力欄の既定値・JSフォールバック・プリセットリセットの3箇所すべて。根拠のヒント文も追加。**Gemini移行前に作ったツールは閾値87を出力していたので、同種の見落としに注意**。
- **使い方ページの注記を再配置（2026-07-22）**: AIの精度・上限の注記(`aiAccuracyNote`/`aiLimitNote`)を冒頭からステップ2「AIが回答を試みる」の中へ、翻訳の注記(`translationNote`)はステップ6の下へ移動（冒頭はログイン要件のみ）。あわせて`step2Note`と`aiAccuracyNote`の「AIは間違うことがある」重複を解消（8言語）。**共通コピーなので全テナントに自動反映される**。

### 📅 投稿フェーズの運用（2026-08-16 プランナー確定）

**現物**: [Notion「投稿タイムスケジュール（3週間・平日夜＋土日）」](https://app.notion.com/p/3-3bdf5fa8bcb981588527c72a06cc78b2)。週ごとの表で、1行が1日、列は「奥様が投稿／夫が🤖投稿／夫が回答／BAを選ぶ」。
- **⏰時間帯（mtさんの生活実態に合わせて確定）**: 平日は**奥様が18〜20時に投稿 → 22時以降に夫が回答・🤖投稿・BA選択をまとめて**。**平日昼は何もしない**（仕事中／そもそも趣味の質問は夜と休日に出るのが自然）。土日は昼から夜まで分散。
- **⚠️奥様の投稿を18〜20時に固定する理由**: 質問は夫にマッチし、**8時間以内に回答しないと`auto_escalate_expired()`が自動でhard化する**。夜21時以降に投稿すると寝ている間に期限切れになる。
- **ペース**: 平日2〜3件／土日4〜6件＝**3週間で67問**。当初17日で組んだが、①平日昼の投稿は不自然 ②一気の量産はscaled-content判定リスク、の2点で延ばした。「毎日同数NG」も自然に満たせる。
- **ずれた時の運用**: 奥様が動けない日は**その行の「夫が🤖投稿」だけやって、奥様の分を翌日にずらす**（投稿が途切れず自然に見える）。Day番号は日付ではなく「投稿した回数」。
- **⚠️1日1テナント3件が上限**（レート制限は1ユーザーあたり・テナント別3件/日＋全体10件/日）。本人と奥様で別枠、2テナントも別枠。表は全日この範囲に収めてある。

**🎬 宣伝の実行タイミング（2026-08-16 確定）**
| やること | いつ | 理由 |
|---|---|---|
| **SNSアカウント7系統の作成** | **今すぐ〜投稿期間中** | 作りたてよりアカウント年齢がある方が有利。1日1個ずつでよい |
| 動画1本の制作（撮影・編集・字幕） | 投稿期間中でも可 | ただし負担が重いので無理に前倒ししない |
| **動画を7媒体へ投稿・note記事・GSCインデックス登録** | **投稿完了後** | 中身が無い状態で宣伝しても離脱するだけ |

**💰 アフィリエイトの申請タイミング（抜けていたので明記）**
- **今すぐ登録できる**: A8.net（審査なし）・サウンドハウス。登録だけしておけば承認後すぐ貼れる
- 投稿完了後: もしも／afb（独自記事5本が要件）
- **⚠️Amazonは「トラフィックが付いてから」**。180日以内に3件成約という要件があり、**早すぎる申請はアカウントを閉じられる**（唯一の「早期申請デメリット」例）
- **リンクを貼るのはAdSense承認後**。貼るときはステマ規制のPR表記が必須

**🔀 AdSense不承認時の分岐（1回目で通らない前提で持っておく）**
```
不承認 → まずGSCの「ページ」レポートで原因を切り分ける
 ├─【A】インデックスが浅い（20ページ未満等）
 │    → コンテンツの問題ではない。何も直さず2〜4週間待って再申請
 ├─【B】インデックス済みなのに Low value content
 │    → ①🔥6問に回答を入れて回答ゼロを0にする（一番軽い）
 │      ②各テナント+10問 ③3本目のテナント（30問・一番重い）
 │    → 直してから2〜4週間空けて再申請
 └─【C】ポリシー違反が明示された → 指摘項目だけ直す（推測で他をいじらない）
```
- **通知に具体的な理由は書かれない**ので、GSCを見て自分で切り分けることになる。
- **やってはいけないこと**: 焦って大量に質問を追加（scaled-content判定）／サイトを大きく作り変える（次に落ちた時に原因が分からなくなる）／間を空けずに再申請（再クロールに2〜4週間かかる）。
- **再申請は回数無制限・ペナルティなし**。落ちても状況は悪化せず、待つ間にインデックスは進む。

**⏭️ 承認後にやること（投稿期間中はpushしないので全部この後）**
1. **🔥6問（M05 M29 M32／G14 G16 G17）に回答を投稿する**。申請時は回答ゼロを9%に抑えるため意図的に伏せているだけで、回答自体は既にNotionにある。
2. **⭐️質問者への通知メールを実装する（2026-08-17 判明・未実装）**。`notifyMatchedUser`は**マッチング時にしか送らない**ので、**回答が投稿されても質問者には何も届かない**（実際に奥様へ通知が飛ばないことを確認）。質問者は自分でサイトを見に来ないと回答に気づけないため、**実ユーザーが来ると「質問しっぱなしで放置される」原因になる**。必要なのは①回答が届いたとき ②ベストアンサーに選ばれたとき、の2種類。
   - **いま実装してもテストできない**（質問者＝奥様・回答者＝本人の1組しかなく、B4で確認済みのBrevo到達性を再確認するだけになる）。**次のテナントを作るときに実データで検証する**のが有効＝別テナントへ正しく飛ぶか・**差出人名がテナント名になっているか**（8/8に「差出人名が全テナント共通」だったバグを修正済み）まで確認できる。
   - 順序：**AdSense承認 → 実装 → 次のテナント作成時に動作確認 → 実ユーザーを迎える（OAuthを「公開」に切替）**。実ユーザーが来る前に検証が済む形になる。
3. **スレッド機能**（解決済み質問へのコメント）— 実ユーザーが増えてから。詳細は上の検討記録を参照。
4. **`/api/answers` の解決済みチェック** — UIでは隠れているがAPIを直接叩けば解決済みの質問にも回答できる。実害は小さいが、スレッド機能を作るなら先に締める。
5. **B①（翻訳メッセージの絞り込み）** — 表示速度とSEOに効く。8言語×全ページの確認が要るので急がない時期に。

**🧭 テナント作成におけるプランナーの担当**（[Notion「テナント作成マニュアル」](https://app.notion.com/p/Wisdom-Assemble-3bdf5fa8bcb981a28bffc084f459fae3)のSTEP 1-2＋初期コンテンツの①）
- **STEP 1-2**: ジャンル名を受けて、サジェスト調査 → **根拠つきの候補JSON**（説明文・タグライン・inScope/outScope・スキルタグ・検索キーワード）を返す。mtさんがビルダーの「⬆ JSONを読込」に貼る。
- **初期コンテンツの①候補集め**: そのジャンルで実際に検索・質問されている内容を調べて20〜30問。**文章はコピーせず傾向を拾って書き起こす**。
- ⚠️**ビルダー本体（STEP 3-9）の操作はmtさん**。Artifactはブラウザで動くツールなので、プランナーが操作することはできない（JSONを作るところまで）。**STEP 10のコード反映はエンジニア**。
- ⚠️**③選定と清書は必ず本人**。ここを代筆すると、ポリシー違反にならない根拠（人間のレビューと価値付加）が崩れる。

### 📮 Day 6 の記録（2026-08-22土・完了）

**投稿5問＋BA2件。7件すべて7言語 ✅。15分ちょっとで完了（待機は挟まない運用）。**
| 時刻 | 問 | 結果 |
|---|---|---|
| 15:16 | 🎵**M11**⭐ | マッチ→回答／タグ: オーディオインターフェイス, MOTU, Universal Audio |
| 15:31 | 🎸**G04** | マッチ→回答／タグ: BigMuff, ファズ, 歪みエフェクター |
| 15:32 | 🎵**M12**⭐ | マッチ→回答／タグ: オーディオインターフェース, マイク, モニタースピーカー |
| 15:33 | 🤖**M17** | `ai_answered`／タグ: Ableton Live, ルーパー, セッションビュー |
| 15:33 | 🤖**G08** | `ai_answered`／タグ: Quad Cortex, キャプチャー, エフェクター |
| — | ✅**M09**・**G29** | BA選択→どちらも`solved` |

- **🤖2問とも一発で通った**（8/21のG06のようなスコア取得失敗は起きず）
- **進捗：67問中19問／BA計8件／回答ゼロの質問 0問**。残り48問

**この日やったこと（投稿以外）**
- **SNS 1媒体目：YouTube開設**（`@WisdomAssemble`）。⚠️新規Googleアカウントは作っていない
- **コード修正5件**（この下の「🛠 2026-08-22」節）。ロゴの「S」欠け／stickyのテナント依存バグ／キャッチコピー3箇所／文言変更
- **キャッチコピー確定**（この下の「🗣」節）

### 🗓 2026-08-18 投稿スケジュールを組み直した（プランナー・Notion反映済み）

Notionの「📆 実日付への置き換え」表に4件の不整合が見つかったため作り直した。**日付・曜日はNotionの表が正**。
| 見つかった問題 | 直し方 |
|---|---|
| **曜日が実カレンダーと1日ずれていた**（8/17は日曜ではなく**月曜**）。結果、休みが土曜に、4〜5件の重い日が月曜に乗っていた | 8/19以降を実曜日で組み直し。**休みは金曜（8/28・9/4）**、4〜5件は本物の土日へ |
| **🤖M08が実日付表から抜けていて66問しかなかった**（Day表にはあった） | 9/6の🤖として復帰。合計67問に |
| **📝のG05・G11・G19がBA欄に入っていた**（📝はBAを選ばない問） | BA欄から削除。BAは**31件**が正しい数 |
| **📝8問が末尾2日に固まっていた** → 投稿完了直後、一覧の上位が全部「未解決」に見える | 8/21〜9/6へ均等に分散 |
- **投稿完了 9/6（日）／BA完了 9/9（水）**（従来より1日早い）。1日あたり平日3件・土日5件、1テナント3件以内は維持。
- ✅済んだ日はNotionの表で**チェック＋取り消し線**を付けていく（プランナーが毎日更新する）。
- **⏳1日の区切りは「夜〜翌未明」（2026-08-19 mtさん確定）**。23時〜翌1〜2時台に投稿した分は**その前日の行**として扱う（例：8/19の行を8/20の00:40に投稿＝8/19扱い）。**日付がずれたと勘違いして表を組み直さないこと。**
  - ⚠️ただし**レート制限（1テナント1人3件/日）はカレンダーの日付で切られる**ので、日を跨ぐと1つの暦日に2晩分が乗る。平日3件の行どうしなら各2件以内で収まるが、土日の5件の行は表どおり昼から分散させること。

### 📮 投稿フェーズの進捗（2026-08-18 Day 2 完了・プランナー記録）

**Day 2（8/18火）完了。ギターテナントでも👤ルートが初めて通った。**
| 問 | テナント | 投稿 | 結果 |
|---|---|---|---|
| **M02**★ | 🎵music-prod | 17:27 | マッチ→回答済み。**タイトル/本文/回答 すべて7/7** ✅ |
| **G20**★ | 🎸guitar | 20:58 | **ギター初投稿**。マッチ→通知メール→回答済み。**すべて7/7** ✅ タグ自動付与（マルチエフェクター/Line6/Helix） |
- **これで両テナントとも👤ルートが本番で動くことを確認**。guitarの`tenant_profiles`（is_available=true・タグ18個）が正しく機能している。残りは同じ流れの繰り返し。
- **⭕️同日22時前に未消化分も完了**: 🤖**M14**（21:33:52投稿）＝`ai_answered`・**タイトル/本文/AI回答すべて7/7** ✅（タグ自動付与：Max for Live／Ableton Live／プラグイン）。**M01のベストアンサーも選択（21:35:06）**。
- **未消化**: **M13のBAのみ未選択**（同じ夜に選ぶと本人側のカウンタが2重に動いて下のBA検証が読みにくくなるため、意図的に翌日以降へ回した）。M02・G20のBAは予定どおり8/20。

**🎯 BA選択→solved の実運用検証が完了（2026-08-18 21:35・これで未検証の経路はゼロ）**
M01のBAを選ぶ前後の実測値。**8/8に`accept/route.ts`から`increment_answer_count`を削除してトリガー(`handle_new_answer`)へ一本化した修正が、実データで正しいと確定した。**
| 項目 | 選択前 | 選択後（実測） | 判定 |
|---|---|---|---|
| 本人 `answer_count`（dtm） | 2 | **2（不変）** | ✅ 二重カウントなし（3ならバグだった） |
| 本人 `answered_tags`（dtm） | `[]` | `["オーディオインターフェース","ハイエンド","機材"]` | ✅ No.27の実績蓄積が動作 |
| 本人 `answer_count`（guitar） | 1 | 1 | ✅ テナント間の汚染なし |
| 奥様 `solved_question_count`（dtm） | 0 | **1** | ✅ |
| M01 status / `solved_at` | `open` / なし | `solved` / 21:35:06 | ✅ |
| 回答の `is_accepted` | false | **true** | ✅ |
- ⚠️CLAUDE.md旧記載の「選択前 answer_count = 1」は**8/17時点の値**。M02への回答で2になっていたため、比較基準は**2**が正しい。以後のBA検証も「選択直前に取った値」と比べること。
- **称号（`user_titles`）もSQL Editorで確認済み（9行すべて実操作と対応）**。⚠️**列名は `title_id` / `earned_at`**（`title_key`・`awarded_at`は存在しない。8/18に一度間違えた）。確認クエリ：
```sql
select ut.tenant_id, ut.user_id, ut.title_id, t.name, ut.earned_at
from user_titles ut join titles t on t.id = ut.title_id order by ut.earned_at desc;
```
  - ⚠️`earned_at`は**UTC表示**（+9時間がJST）。
  - **①質問者側の称号ルートが初通過**：奥様に`solved_1`（見習い依頼者）が**21:35:07＝BA選択と同秒**に付与。「解決してもらった人」への称号はこれまで一度も発火していなかった経路。
  - **②BA選択では回答側の称号が動かない＝二重カウント対策の裏付け（称号側からも確認）**：本人の`answer_1`は8/17の回答時、`answer_2`は8/18 17:28の回答時に付与。21:35のBA時点で`answer_3`は増えていない。
  - テナント別の独立も設計どおり（guitar・dtmでそれぞれ`answer_1`/`question_1`が別々に付与）。

**⭐️運用が変わった点：verify はプランナー（Claude Code）から実行できる**
- `cd /Users/apple/wisdom-assemble && node scripts/verify-latest-post.mjs <dtm|guitar> 1` を**プランナーセッションのBashで直接実行できることを確認**（8/18）。**mtさんがターミナルを開く必要はない**。「投稿した」と言えばプランナーが回して結果を返す運用に変更。
- ❌が出たときだけエンジニアに連絡する、という点は変わらない。

**⏱️質問→回答の間隔（2026-08-18 確定）**
- **JSON-LDに秒単位のタイムスタンプが出る**（画面には日付しか出ないが、`dateCreated`が構造化データに埋まりGoogleが読む）。実測：M01は質問→回答が**11分**、M02は**3分**。
- ~~最短30分は空ける~~ **⛔このルールは2026-08-20に撤回した（mtさん判断）**。質問→回答の間隔はAdSenseの審査基準ではなく、`dateCreated`は検索（QAPage）向けのデータ。**固い制約は「8時間以内に回答」だけ**（超えると`auto_escalate_expired()`でhard化）。プランナーが推測でルール化したものだったので、**蒸し返さないこと**。実測の間隔は11分/1分/2分/3分/3分/30分/32分とばらけており、これで十分自然。
- **⭐運用の確定形（2026-08-20）**：**22時台に、奥様の投稿→BA選択→夫の🤖投稿→夫の回答までを一気に済ませる**。夜中に間隔を空けて分割すると貼り間違いが起きる（8/19にM04へ別の問の回答を貼るミスが発生）。
- 8/18は M02が17:27・G20が20:58 と**3時間半空いており**、時間帯としては自然な形になった。

### 🔎 2026-08-23 ルートのジャンル検索を作り直した（commit `4b53036`→`4a1d0e7`）

**発端**：mtさん報告「日本語で『ギター』『ミックス』と検索してもテナントが出ない。英語では出る」。

**原因**：検索対象が①英語の表示名 ②テナントID ③手動タグ の3つだけで、**guitarは手動タグが1件も登録されていなかった**。英語で出ていたのはテナントIDの`guitar`がたまたま一致していただけ＝**日本語の入口がゼロ**。dtmも「ミキシング」はあるが「ミックス」が無かった。**手動登録に依存する設計そのものが原因**。

**作り直した内容（検索材料は7種）**

| 材料 | 追加日 | 更新のされ方 |
|---|---|---|
| 英語の表示名／テナントID | 既存 | 固定 |
| **DBのテナント名** | 8/23 | テナント作成時 |
| **`{tenantId}CardTagline`（表示中の言語）** | 8/23 | **8言語ぶん必ず書くので全言語に効く** |
| **`tenants.description_i18n[locale]`** | 8/23 | **同上。en/zh/id/vi/ko/es/pt が入っている** |
| 手動タグ `TENANT_SEARCH_TAGS` | 既存＋増強 | 任意（略称・別名・メーカー名の精度用） |
| **`TENANT_SKILL_OPTIONS`（得意なこと）** | 8/23 | マッチングに必須なので書き忘れない |
| **質問のタグ（DB集計）** | 8/23 | **投稿するたび自動で増える** |

- **`normalizeForSearch()`（小文字化＋アクセント記号除去）を新設**。スペイン語の`música`が0件だった（説明文にあるのは形容詞形の`musical`）のを解決し、ベトナム語を記号なしで打っても引ける（`âm nhạc`→`am nhac`）。⚠️**tags側(PortalHome)と入力側(PortalTenantSearch)は必ず同じ関数を通すこと**
- **検索欄をsticky化**。⚠️既定値は`var(--header-h,0px)`＝**0px**。ルートポータルには`Header`が無く`--header-h`がセットされないため、テナント一覧と同じ73pxにすると「ヘッダーが無いのに73px下に貼り付く」＝上に死角ができる（実際そうなっていた）

**実機検証（8言語すべて実際に入力して確認）**
- ja ギター/エフェクター/アンプ/ミックス/マスタリング/録音 ／ en guitar/pedal/fuzz/vintage/mixing/vocal
- ko 기타/페달/음악/믹싱/마스터링 ／ zh 吉他/效果器/音乐/混音/录音/母带
- es guitarra/**música**/**musica**/mezcla/**grabación**/**grabacion**/voz ／ pt guitarra/pedais/**música**/**musica**/mixagem/gravação/voz
- id gitar/efek/musik/rekaman/vokal ／ vi guitar/pedal/**âm nhạc**/**am nhac**/**thu âm**/**thu am**
- 無関係な語（ラーメン）は0件。stickyは scrollY 300/450 で `top:0` に貼り付くことを実測
- ⚠️**2テナントしかない今は通常の画面高だとページがほとんどスクロールしないため、stickyの効果は体感しにくい**。テナントが増えれば効く

**残っている制約**：固有名詞レベル（fuzz/ピックアップ/Klon Centaur）の全言語対応は、**質問タグが日本語でしか生成されない**ため未解決。AdSense承認後タスクB「tags_i18n を追加」で解消する。それまで ja/en 以外は tagline＋説明文＋手動タグで拾う。

### 🧩 新テナント追加チェックリスト（2026-08-25 統合版・**これ1枚で足りる**）

⚠️**2026-08-25にmtさんの依頼で作り直した。** それまでは「A/Bチェックリスト」と「触るファイル一覧（Notion §3）」と「ビルダーの出力」が**3箇所に分かれていて、A/Bだけ見ると4項目が漏れる**状態だった（GENRE_CONFIG / TENANT_SUGGESTED_KEYWORDS / messages の skillTags・searchKeywords / OG_COLORS）。**このリストが唯一の正**。ここに全部入っている。

⚠️**識別子と行番号は2026-08-25に実ファイルで全件確認済み。** リファクタで動いたら更新すること。

#### ⓪ 着手前

- [ ] **内部IDと公開サブドメインを揃える。** 違えると別名登録が `middleware.ts` / `tenantNames.ts` / `AdminVisitors.tsx` の**3箇所**に必要になり、訪問者ダッシュボードで同じテナントが2行に割れる。揃えれば全部不要（既存の例外は debug→bug、dtm→music-prod）
- [ ] **色を確定してから画像を書き出す。** PNGに焼き込まれるので、先に書き出すと撮り直しになる

#### ① コード（8ファイル）★ここが本体

| # | ファイル | 識別子 | 抜けるとどうなるか |
|---|---|---|---|
| 1 | `middleware.ts:12` | `VALID_SUBDOMAINS` | テナント判定に失敗し**debugにフォールバック**（全ページが別テナントの中身になる） |
| 2 | `middleware.ts:20` | `SUBDOMAIN_ALIASES` ※IDとサブドメインが違う場合のみ | 公開URLで開けない |
| 3 | `src/lib/tenantNames.ts:4` | `TENANT_NAME_MAP` | 表示名がテナントIDのまま出る |
| 4 | `src/lib/tenantNames.ts:26` | `PUBLIC_SUBDOMAIN_MAP` | ルートのカードのリンク先が壊れる |
| 5 | `src/lib/tenantNames.ts:92` | `LOGO_STYLE_OVERRIDES` ※カスタムロゴのみ | 既定の3D押し出しロゴになる |
| 6 | `src/lib/tenantNames.ts:115` | `TENANT_SEARCH_TAGS` ※任意・精度用 | 略称・別名・メーカー名で引けない（**guitarで実際に抜けた**） |
| 7 | `src/lib/tenantNames.ts:61` | ⭐`DORMANT_TENANT_IDS` **に入れる** | ⚠️**10問未満でもインデックスされる**（下の④参照） |
| 8 | `src/lib/gemini.ts:37` | ⭐`GENRE_CONFIG`（label / threshold=91 / inScope / outScope / dangerKeywords） | ⚠️**AIの範囲判定が効かない。** 旧A/Bリストで漏れていた項目 |
| 9 | `src/lib/skillTags.ts:3` | `TENANT_SKILL_OPTIONS` | **マッチングが動かない**（＋ルート検索の材料も減る） |
| 10 | `src/lib/skillTags.ts:33` | ⭐`TENANT_SUGGESTED_KEYWORDS` | 検索チップが出ない。⚠️旧A/Bリストで漏れていた項目 |
| 11 | `src/app/[locale]/layout.tsx:27` | `FALLBACK_DESCRIPTION_MAP` | DB取得失敗時に説明文が出ない |
| 12 | `src/components/PortalHome.tsx:15` | `REVIEW_TENANT_IDS` | ★**カードが1枚も出ない**（存在しないのと同じ） |
| 13 | `src/components/PortalHome.tsx:18` | `FALLBACK_COLOR_THEME` | DB取得失敗時にカードの色が消える |
| 14 | `src/app/[locale]/admin/AdminVisitors.tsx:14` | `alias` | 管理ダッシュボードでテナント名が出ない／2行に割れる |
| 15 | `scripts/image-templates/opengraph-image.tsx:16` | ⭐`OG_COLORS` | ⚠️OGP画像が既定色になる。旧A/Bリストで漏れていた項目 |

#### ② 翻訳（`messages/*.json` ×8）⚠️**自動翻訳の仕組みは無い。3種類ある**

- [ ] **`{tenantId}CardTagline` を8言語ぶん** ―― カードの説明。⭐**これは検索対象も兼ねる**ので、書かないとその言語で検索に出ない
- [ ] ⭐**`skillTags` を7言語ぶん** ―― 旧A/Bリストで漏れていた項目
- [ ] ⭐**`searchKeywords` を7言語ぶん** ―― 同上
- ⚠️`skillTags` と `searchKeywords` は**別物**。skillTagsは「得意なこと」の名前（Effects pedals）、searchKeywordsは部分一致で当たりやすい**短い語**（Pedal）。⛔**チップは表示ラベル＝検索値**なので、長い語にすると押しても0件になる
- ⛔**英語ラベルに一般語（action, note など）を使わない。** 翻訳文への部分一致で無関係な質問に誤ヒットする

#### ③ 画像・外部サービス

- [ ] `public/icons/{id}.png`（32×32）と `public/og/{id}.png`（1200×630）を置く。⚠️**無いと404だが、軽い404ではなく7.4KBのHTMLをWorkerが毎回描画する**（ファビコンはほぼ全PVで取りに来る）
- [ ] ⚠️**ファビコン色＝ロゴの色／OGP色＝`OG_COLORS` と出どころが違う。** 食い違うと別々の色の画像が黙って書き出される（2026-08-15に実際に踏んだ：ファビコン金・OGPグレー）
- [ ] Supabase `tenants` に INSERT。⭐**`description_i18n`（en/zh/id/vi/ko/es/pt）を必ず含める** ―― 無いとルート検索が日本語しか効かない
- [ ] Cloudflare の Custom Domain を追加
- [ ] ⭐⭐**Google Search Console に そのテナントの sitemap を送信する** ―― `https://<sub>.wisdomassemble.com/sitemap.xml`。⚠️⚠️**2026-08-27に発覚した最大の見落とし。** GSCはドメインプロパティ（`wisdomassemble.com`）だが、**sitemapはホストごとに個別送信が必要**。ルートの1本しか登録されておらず、**新67問がGSC経由では一度も申告されていなかった**（⚠️**2026-08-27に訂正**：各サブドメインの `robots.txt` には最初から `Sitemap: https://<host>/sitemap.xml` 行が出ているので、Googleが自力で辿る経路は最初からあった。「一度も伝わっていなかった」は言い過ぎ。GSC送信の効果は①確実に読ませる ②検出数がGSCで見えるようになる の2つで、**インデックスを速める保証はない**）（「検出されたページ数 10」＝ルートぶんだけ、最終読み込みが8/18で停止）。送信したその日に読み込まれ、46/44ページが検出された

#### ④ ⭐公開の判断（2026-08-25 追加）

- [ ] ⚠️**作成直後は必ず `DORMANT_TENANT_IDS` に入れる。10問揃ってから外す。**
- ⛔**「10問未満は自動でnoindex」という閾値方式は未実装**（2026-08-25判明）。noindexの判定は `DORMANT_TENANT_IDS` の手動リストだけで、質問数のカウントは存在しない。**忘れると1〜3問の薄いページが公開され、ドメイン全体の評価を下げる**
- `DORMANT_TENANT_IDS` に入れると **noindex ＋ sitemap除外 ＋ ポータル非掲載**が同時に効く
- ⛔**robots.txt でブロックしないこと。** クロールできないとHTML内のnoindexを読めず、既にインデックスされたURLが消えない

#### ⑤ 追加後に必ず実機で確認する

1. **ルートのカードが出るか**（`wisdomassemble.com`）
2. ⚠️**ルート検索がそのジャンルの語で引けるか。日本語と英語だけで満足しないこと** ―― 8言語ぶん、中核語で試す（例: ko「기타」es「guitarra」）
3. **検索欄がスクロールしても残るか**（sticky。`top` は `var(--header-h,73px)`）
4. テナント側で**質問を1本投げてマッチングが動くか**
5. `node scripts/verify-latest-post.mjs {tenant} 1` が ✅
6. ⚠️**デプロイ後は単発で5〜10回叩いてError Rateを見る**（並列ではなく単発。アクセスが少ないほど失敗率が上がる不具合のため）。0%台が正常・20%超は異常。異常ならまず空コミットで再ビルド、直らなければRollback

```bash
for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code}\n" https://<sub>.wisdomassemble.com/ja; sleep 1; done
```

⚠️**`sticky top-[数値px]` をベタ書きしないこと。** ヘッダー高はロゴの大きさでテナントごとに変わる（実測 bug 73 / music-prod 75 / guitar 105px）。必ず `var(--header-h,73px)` を使う。8/22にこれで「+質問する」が隠れる不具合が起きている。

⚠️**ローカル確認に `?tenant=` は使えない**（dev環境ではmiddlewareが実行されない）。`curl -H "x-tenant-id: <id>" http://localhost:3000/ja` を使う。

#### ⑥ 何もしなくても自動で効くもの

- **ルート検索は全8言語で成立する。** 材料は①`{tenantId}CardTagline`（表示中の言語）②`tenants.description_i18n[locale]`。どちらもテナント作成時に必ず作るデータなので、**手動タグを1件も書かなくても最低限の検索は通る**
- **`TENANT_SKILL_OPTIONS`** も検索材料。マッチングに必須なので書き忘れようがない
- **質問のタグ**は投稿するたび自動で増える（Fender / ファズ / Genelec / MOTU などの固有名詞はここから入る）
- 検索は **`normalizeForSearch()`（小文字化＋アクセント記号除去）** を通す。`música`→`musica` が `musical` に一致し、ベトナム語を記号なしで打っても引ける。⚠️**tags側(PortalHome)と入力側(PortalTenantSearch)は必ず同じ関数を通すこと**

#### ⑦ スキルタグの作法（外しやすい）

- ⛔**複合語にしない。**「配線・改造」→「配線」「改造」に分ける。照合は**質問本文への部分一致**なので、複合語は一度も一致しない
- **同義語・表記ゆれは独立タグで両方入れる**（エフェクター／ペダル、ビンテージ／ヴィンテージ）。分かっている人は両方選ぶので実害がなく、取りこぼしが減る
- 8〜18個。「得意なこと」として読んで意味が通る専門領域にする
- ⚠️**テキストを扱うコードを足すときは `title_i18n` / `body_i18n` も見る。** title/body は投稿された元言語だけで、翻訳は別カラム。ここを見ないと日本語しか当たらないコードになる（検索・マッチング・類似質問で**実際に4箇所踏んだ**）

### 👤 運用体制の変更：WAはプランナー席のみで回す（2026-08-22 mtさん決定）

**これまで**：プランナー席（`-Users-apple-Music-Ableton`）が企画・投稿・記録、エンジニア席（`-Users-apple-wisdom-assemble`）がコード実装、という分担だった。

**これから**：**WAはプランナー席だけで運用する。コード修正もプランナー席が行う。** エンジニア席は他プロジェクトへ回す（トークン配分のため）。mtさんは別に2件のプロジェクトを立ち上げており、1件はプロト、もう1件は未着手。

- 8/22の5コミットは「イレギュラーだが微調整なので許容」として始まったが、**この日以降は通常運用**になった。
- ⚠️**エンジニア席が戻ってきたときのために、コード変更は必ずこのCLAUDE.mdに理由つきで残すこと。** 席をまたぐとメモリは共有されない（`~/.claude/projects/` 配下が別物）ので、**引き継ぎ先はCLAUDE.mdとNotionだけ**。
- プランナー席がコードを触るときの決まりは従来どおり：①`tsc --noEmit` を通す ②`git push origin main` ③**単発で5〜10回アクセス＋CloudflareのError Rate確認**（7/28の1102の前例）④UI変更はブラウザで実測して確認する。
- セキュリティ・有料サービス・DBスキーマ変更は従来どおり**事前確認**。UI微修正は標準許可の範囲（47行）。

**⑥ チュートリアル日本語のボタン名ずれ**（`66935dc`）
- 「+質問をする」→「+質問する」。実際のボタンは「+ 質問する」で**日本語だけ1文字ずれていた**
- **原因が構造的なので記録する**：日本語が原文で、7言語は日本語から訳している。訳すと「質問をする」も「質問する」も同じ動詞句（`Ask a question`／`질문하기`／`提问`）になるため、**訳文側では差が消えてボタン名と自動的に一致する**。ズレが文字として残るのは原文の日本語だけ。⇒**この種の表記ゆれは日本語だけ確認すれば足りる**
- 8言語すべて突き合わせ済み。en/zh/ko/es/pt/id/vi は変更不要だった

### 🛠 2026-08-22 プランナーが直接実装した6件（commit `3c64084` / `332f070` / `afa58ea` / `06ce970` / `66935dc`・すべて本番反映済み）

⚠️この日は「イレギュラーだが微調整なので許容」として始まったが、**同日中にプランナー席のみで運用する方針に変わった**（上の「👤 運用体制の変更」参照）。**エンジニア席が戻る場合はこの節を読んでから既存コードを触ること**。

**① キャッチコピーの設置**（新規 `brand.catchcopy` ／ 8言語すべてに追加済み）
- 置き場所：ルートは `PortalHome.tsx` のワードマーク下・`portalPage.subtitle` の上／テナントは `app/[locale]/page.tsx` の `tagline`（テナント説明文）の上。**サイズは両者共通** `text-lg sm:text-xl font-medium text-gray-800`
- **文中の `\n` で2行に固定**し `whitespace-pre-line` で描画している。**1行にしてはいけない**：全角23文字ぶんあるので、スマホ375px（本文領域343px）で1行に収めると約15px＝本文より小さくなる。2行なら2行目18文字ぶんで18pxが確保でき「説明より少し大きい」という意図どおりになる
- **8言語すべて375px幅で折り返さないことをcanvasで実測済み**（最大はes 327px／343px以内）。id・ptは初訳が超えたので文言を詰めた。**翻訳を差し替えるときは343pxを超えないか必ず測り直すこと**

**② ロゴ末尾の文字が欠ける（guitarの「S」）** — `SiteLogo.tsx`
- 原因：`background-clip:text` は**要素の箱の中にしか色を塗らない**。`letterSpacingEm` が負だと最後の文字のうしろからも箱が縮み、字面（インク）が箱の右へはみ出す。はみ出した部分は塗られず `color:transparent` のまま＝**文字が切れて見える**
- 対策：`inkPadRight = Math.max(0, -lsPx) + fontSize * 0.08` を文字要素の `paddingRight` に入れ、**`fw`（viewBox幅）にも加算**。テキストはflex-startなので位置は動かず、TMはSVG層で別座標なので影響なし
- **対象は6書式**（`gradient` `split` `diagsplit` `stripe` `fade` `vertgradient`）。今後ロゴビルダーで作るテナントにも自動で効く。※`treatment`なしのdtmはSVGの`<text>`＋`fill=url(#grad)`で描いており別経路・元から無関係

**③ 「+質問する」と検索欄がヘッダーに隠れる** — `Header.tsx` ＋ `app/[locale]/page.tsx` ＋ `admin/AdminActions.tsx`
- 原因：sticky の `top-[73px]` が**ベタ書き**。73pxは**開発デフォルトのBUG DEBUGテナントの高さ**で、ヘッダー高はロゴの文字サイズで変わる（実測 **bug 73 / music-prod 75 / guitar 105px**）。guitarでは32px潜って隠れていた
- 対策：`Header.tsx` が **ResizeObserver** でヘッダー実高を CSS変数 `--header-h` に流し込み、各所は `top-[var(--header-h,73px)]` を参照。SSR時とJS実行前のために73pxを既定値で残している
- **今後 `sticky top-[数値px]` をベタ書きしないこと。** ロゴが大きい新テナントで必ず再発する

**④ キャッチコピーのサイズ・余白調整**（`332f070`）
- **PCは1行・スマホは2行**。文中の改行は残したまま `sm:whitespace-normal` でPCだけ改行を空白に畳む。⚠️PCで「AIに聞く。」の後に半角スペースが1つ入るが、英語は空白が必須（`Ask AI.`と`If AI…`がくっつく）なので許容している。日本語だけ詰めるには言語別の出し分けが要る
- 説明文（テナントの`tagline`／ルートの`subtitle`）を 14px → 12px(スマホ)/13px(PC)
- コピーは**ルートが `text-lg/xl` 据え置き、テナントのみ1段小さい `text-base/lg`**（テナントはロゴが主役なので落とす）
- 余白圧縮。テナントはヘッダー線との間が空きすぎだったので `py-8` → `pt-4`（32→16px）

**⑤ Aboutへのコピー追加と文言変更**（`afa58ea` / `06ce970`）
- `/about` のタイトル直下にコピーを追加（ルートと同サイズ）。**コピーはルート・各テナント・About の3箇所**に載った
- 余白の考え方：**見出しは独立させるので下を広く(24px)、コピーと説明文はひとまとまりの本文として近づける(8px)**。逆にすると説明が見出しにぶら下がって見える
- `portalPage.chooseGenre` を8言語とも変更。「ジャンルを選んで始めましょう」→**「何について知りたいですか？」**。⚠️英語は `Choose a community to get started` だった＝**community と言っており**「コミュニティに参加せず気軽に聞く」というポジションと矛盾していたので語ごと落とし `What do you want to know about?` に。`uppercase` も外した（問いかけを全部大文字にすると英語で叫んで見える）

### 📌 AdSense承認後タスクに追加した3件（2026-08-22 mtさん指定・[Notion L節](https://app.notion.com/p/AdSense-3c3f5fa8bcb98176a8fec1b0ee15efda)）

| 項目 | 状態 |
|---|---|
| **テナントビルダーでSEO対象言語をテナント単位で選ぶ** | 🆕追加。現状は `i18n/routing.ts` の `INDEXABLE_LOCALES` でサイト全体一律。**F節の「6言語のnoindex解禁」と同じ話**なので、先にGSCで需要を見てから実装する |
| **回答者クリックでオーバーレイ表示** | 🆕追加。①名前 ②得意分野 ③回答回数 ④Thanks数（投げ銭実装後）の4つだけ。**金額は出さない**。意図は「人ではなく回答に価値を置く」＝Expertをスター化しない。マッチングは得意分野ポイント＋ランダムなので「指名するためのプロフィール」にしない |
| **質問者への回答・ステータス変更メール** | ⚠️**既にC①にあるので追加していない**（①回答が届いたとき ②BAに選ばれたとき の2種類）。**重複実装しないこと** |

**検証済み**：`tsc --noEmit` 0エラー／本番で3ホスト×8回の単発アクセス24件すべて200／guitarで「ヘッダー下端98px・ボタン上端106px＝隠れ0px」を実測／Sの塗り範囲が字面より5.18px外まで広がったことを実測。

### 🗣 キャッチコピー確定（2026-08-22・別GPTのサイトレビューから）

**メインコピー（サービスのルールそのもの。説明文ではない）**

| 言語 | コピー |
|---|---|
| 日本語 | **AIに聞く。AIがわからなければ、人間が答える。** |
| 英語 | **Ask AI. If AI doesn't know, a human answers.** |

- **英語は原文の構造に揃えた**（2026-08-22 mtさん決定）。命令形で始め、AIを2回繰り返し、人間を「答える人」として置く。日英で同じ"ルール"に聞こえることを優先した。
- ⚠️**OG画像の英文は古い**。`public/og/root.png` に `AI answers first — humans fill the gaps` が焼き込まれている。意味は近いが別コピー（①ユーザーへの呼びかけではなくシステム説明になっている ②`fill the gaps`＝人間が「取りこぼしを補修する係」に読め、人間の回答を中心価値に置く設計と合わない）。**承認後にOG画像を作り直して差し替える**。
- **使い方**：説明文より先に、大きめの文字で見せる。SNSプロフィールは全媒体でこのコピーを先頭に置き、その下に `portalPage.aboutBody` を続ける。文字数が厳しいTikTok（80字）はコピーのみ。
- **裏テーマ（トップには出さない）**：**とどけ！ゆるい人の温もり。** ＝「AI時代だからこそ、最後にちょっと人間がいる」。ブランドの感情面の指針として保存するもので、メインコピーとして使うものではない。
- **関連する言い回し**（同レビューで出たもの・採用可）：「人ではなく、回答に価値を置く。」／「Expert → Knowledge → AI」／「質問そのものがコンテンツになる。」
- **ポジション**：Googleより専門的、Discord/Redditより気軽。「専門的なことを、コミュニティに参加せず、気軽に聞く」中間地点。
- ⏳**サイト本体への反映は未実施**（2026-08-22 時点）。⚠️**「投稿フェーズ中はpushしない」という方針は存在しない**（プランナーの思い込み・訂正済み）。47行の標準許可のとおりUI微修正はいつpushしてもよく、**申請前に入れる方が有利**（審査で見られるのは申請時点のサイト）。申請は9月下旬〜10月上旬予定なので余裕がある。

### 🪪 ブランド表記の統一ルール（2026-08-24 確定・**全媒体でこれを守る**）

⚠️**媒体ごとに要約を書かないこと。** 8/24にFacebookで、プランナーがサイト本文を勝手に縮めた文を用意してしまい、mtさんから「サイトやYouTubeと共通になっている？ネットワークのアイデンティティを揃えたい、弱くなるから」と指摘を受けた。少しずつ違う文が7媒体ぶんできると、同じ運営者の集合に見えなくなる。

**正典は2つだけ**

1. **キャッチコピー**：`Ask AI. If AI doesn't know, a human answers.` ／ 「AIに聞く。AIがわからなければ、人間が答える。」
2. **説明文**：サイトの `portalPage.aboutBody`（messages/*.json・8言語ぶん存在）

**書き方**

- 全媒体で「**コピー → 説明文**」の順
- 説明文は**サイトの本文をそのまま使う。文字数が足りなければ後ろから削る。言い換えない**
- **言語別の欄がある媒体**（YouTube）→ 英語を既定、日本語を「言語を追加」で登録
- **欄が1つの媒体**（Facebook / Instagram / X / TikTok / Pinterest）→ **英語のみ**。1欄に日英を詰めると改行が潰れて塊になり、どちらの読者にも読みにくい
- リンクは全媒体 `https://wisdomassemble.com`
- ⛔**ジャンル名を書かない**。「Music production & guitar Q&A」のような書き方は、10テナント→100テナントへ増やす構成と矛盾する。`genre-specific` という言い方なら2ジャンルでも100ジャンルでも成立する

**プロフィールに入れないもの（全媒体共通）**

| 項目 | 理由 |
|---|---|
| メールアドレス | 公開されるとスパムの的。サイトに `/contact` がある |
| 住所 | 個人運営なので自宅が公開される。ウェブサービスに不要 |
| 電話番号 / WhatsApp | 同上 |
| 営業時間 | 24時間動くサイトに概念がない。⚠️「24時間営業」も選ばない（人間が常時対応すると誤解される。実際はAIが即答・人間は数時間かかる） |

### 📊 2026-08-27 GSCのインデックス数字の読み方（sitemap送信の翌日）

sitemapを3本送った翌日の数字。**送っても増えていない**＝sitemapとインデックスは別物、の実例。

```
インデックス登録済み        90   ← 8/2からずっと横ばい
インデックス未登録         959（理由9つ）
sitemap合計               100 URL（root 10 / music-prod 44 / guitar 46）
```

**未登録959の内訳と評価**

| 理由 | 件数 | 評価 |
|---|---|---|
| noindex タグ | 659 | ✅ **中身を確認済み・対応不要**（下記） |
| クロール済み - インデックス未登録 | 150 | ✅ **中身を確認済み・対応不要**（下記） |
| 重複（ユーザー未canonical） | 50 | en/ja のcanonical動作とみられる |
| 代替ページ（canonicalあり） | 50 | 同上 |
| リダイレクト | 24 | 無視でよい |
| 404 | 14 | 旧シード削除ぶん。無視でよい |
| robots.txt ブロック | 6 | `/api/` 等。設計どおり |
| 重複（Google判断） | 3 | 無視でよい |

**⛔ ここを取り違えないこと**
- sitemap ＝「このURLがあります」の**申告**
- index ＝ Googleが読んだうえで**載せるかどうかの採否判断**
- 申告を増やしても採否は動かない。**sitemapで「短縮」はできない**

**✅ noindex 659 の正体（2026-08-27 サンプルURLで確定）**

サンプルは全部この形だった:
```
music-prod.../ko/questions/seed-solved-5-bf910ebe
music-prod.../ko/questions/テスト投稿07171-キックとベースの位相を...
bug.../ko/questions/typescriptのanyとunknownの違いについて...-2
        ↑                    ↑
     機械翻訳6言語        削除済みの旧シード／テスト投稿／BUG
```
実機で叩くと **どちらも404**。前回クロールは 8/07（まだ生きていた時点）。

```
設計どおりのnoindex（6言語 × 現行33問）  約350
削除済み旧シードの残骸                   約300  ← 再クロールで404を受け取れば自然に落ちる
```
⛔ **触らないこと。** 修正も削除リクエストも不要。

**⚠️ この画面の「最終更新日」を必ず見ること**
2026-08-27時点の表示は `最終更新日: 2026/08/21` ＝ **6日古い**。8/26のsitemap送信より前の数字なので、
「送ったのに増えていない」は当たり前。⭐**GSCの数字を評価する前に必ず最終更新日を確認する。**

**✅ クロール済み-インデックス未登録 150 の正体（2026-08-27 サンプル30件で確定）**

```
bug テナント（t6-q*・テスト投稿・typescript）    約18件
削除済み旧シード（seed-solved-*・seed-hard-*）    約8件
ロケール無しURL（/hard・/questions/xxx）          3件
クエリ付きURL（?tag=DTM初心者・?page=2）          2件
────────────────────────────────────
新67問（HX Stomp・Klon Centaur 等）              0件  ⭐
```
⭐**新問は1本も含まれていない＝Googleが新問を却下しているわけではない。**

実機確認:
```
/hard                      → 307 リダイレクト（/en/hard へ）  ✅正常
/questions/ablton-live...  → 307 リダイレクト                ✅正常
/ja/questions/ozone...     → 404（削除済み）                 ✅想定どおり
/en?page=2                 → 200・canonical は /en を指す     ✅正常
```
⚠️ `?page=2` `?tag=` が未登録なのは**正しい動作**（ページ送り・絞り込みの個別掲載を避ける＝canonicalが効いている証拠）。⛔直さない。

前回クロール日は 7/29〜8/21 に収まり、noindex画面と完全に一致。**このレポートは投稿ラッシュ以前の世界を見ている。**

⭐ bug.wisdomassemble.com が150件の主役なので、**8/27のGSC非表示リクエストがそのまま効く**。処理が通れば150は自然に減る。

### 🧾 結論（2026-08-27）
```
インデックス未登録 959
  → noindex 659    = 削除済み旧シード × 機械翻訳6言語   触らない
  → クロール済み 150 = bugテナント＋削除済み旧シード     触らない
  → その他 150      = リダイレクト・404・canonical      触らない
```
**959件すべて対応不要。SEO側で今やる作業はゼロ。** 次は9/1に「ページ」を開き、
⭐**まず最終更新日が9月に入っているかを見てから**新問の状況を判断する。

**GSCメッセージ（8件）の扱い**
- 「過去28日でクリック数が5クリックに到達」(8/24) ＝ **初の検索流入**。良い知らせ
- 「Q&Aの構造化データの問題」(7/25) ＝ 旧シード時代のもの。現行ページのJSON-LDは`QAPage`/`Question`/`suggestedAnswer`が正しく出ているのを実機確認済み
- 「インデックスに登録されない新しい要因」×3 ＝ 上の表と同じ内容の通知。個別対応は不要

**AdSenseとの関係**：AdSenseの審査基準にインデックス数は入っていない。90でも申請自体に支障はない。インデックスが効いてくるのは**承認後の収益**の側。

---

### 🌐 2026-08-26 翻訳が3度目の無音失敗（Day 10）＋**フォールバックが機能していない疑い**

**Day 10 で人間の回答2件（M16・G02）の `body_i18n` が 0/7 で保存された。** 質問のタイトル・本文・AI回答は 7/7 で正常なので、**壊れるのは回答の翻訳だけ**という過去の傾向（7/26・8/17）どおり。

#### 原因（ログに出ていた）

```
translate: Gemini failed, falling back to Groq: gemini TimeoutError: The operation was aborted due to timeout
translateToLocales: batch translation failed Error: translate API error: gemini TimeoutError
   ❌ 翻訳できず（18008ms）
```

⚠️⚠️**注目すべきは、最後に投げられた `lastErr` が `gemini TimeoutError` のままだったこと。** Groqで失敗したなら `groq ...` になるはず。⛔**つまりGroqへのフォールバックが実際には走っていない可能性が高い。**

**構造上の理由**：`TRANSLATE_BUDGET_MS = 18_000`（`translate.ts:71`）を**プロバイダ間で共有**しており、`AbortSignal.timeout(deadline - Date.now())`（111行）で切っている。**Geminiが18秒フルに使ってタイムアウトすると、Groqを試す残り時間がゼロ**になる。⚠️実測でも失敗が毎回きっかり18秒で、Geminiだけで使い切っている。

⛔**未検証**：コードの構造からの推定で、Groqが本当に一度も呼ばれていないかは確認していない。**断定しない。** 直すならエンジニア判断で、案は「①Geminiのタイムアウトを予算の半分（9秒）で切ってGroqに残す ②プロバイダごとに独立した予算を持たせる」。

#### 復旧（記録どおりの手順で成功）

`npx tsx scripts/backfill-answer-translations.mts --apply` を**繰り返す**。⚠️**1回では通らない。** 実測で1回目=両方失敗、2回目=1件成功（9.0秒）、3回目=残り1件成功（8.1秒）。**成功するときは8〜9秒で終わる**ので、18秒かかったら失敗と判断してよい。⭐**Geminiの一時的な不調**なので、時間をおいて叩き直せば通る。

⚠️**dry run（`--apply`なし）で対象だけ先に見る**こと。過去31件のうち欠落は当日の2件だけだった＝**過去分は壊れていない**ことも同時に確認できる。

### 📅 投稿スケジュールを再編成（2026-08-27・**投稿完了が9/6→9/4に2日短縮**）

⚠️**mtさん判断で、休みの2日（8/28金・9/4金）を埋めて残り34問を再配分した。**「2日もったいない。最後の方が雑」という指摘から。

```
8/27木 3問  M03 M07📝 / 🤖G24
8/28金 3問  G16🔥 G15 / 🤖M25          ← 休みを埋めた
8/29土 6問  M03-2 M20📝 G21 M06 / 🤖G25 🤖M27
8/30日 6問  M29🔥 M19 G31 G23📝 / 🤖G26 🤖M31
8/31月 3問  G07 M21 / 🤖G28
9/1火  3問  M22 G17🔥 / 🤖M34
9/2水  4問  M26📝 G09 M32🔥 / 🤖G30
9/3木  3問  G13 M28 / 🤖M08
9/4金  3問  M28-2📝 M30⭐ M33⭐        ← 投稿完了・最終日は奥様のみ
9/5土  BA: G13 M28
9/6日  BA: M30 M33（全BA完了）
```

- ⭐**土日を6問に増やして週末に寄せた。** 実際のQ&Aサイトも週末に活動が増えるので、**平日を増やすより自然**
- ✅**全日でレート制限（1人1日3件/テナント）をクリア済み**。最大の6問の日でも奥様4（dtm3＋guitar1）／本人2 で上限内
- ⭐**⭐アフィリ枠のM30・M33を最終日に置いた**（締めが強い）
- **全BA完了も 9/9 → 9/6 に3日短縮**
- ⚠️**Notionの旧表はmtさんが削除済み。** 表の下に残っている古い説明3行（①土日4〜5件 ②金曜は何もしない ③📝8問にG19）には🚩の訂正カードを置いてある

⚠️**休みの日は「必要」ではなかった。** 元の設計意図は「規則性を作らない＝自動投稿に見せない」であって、**金曜が休みである必然性は記録のどこにも無かった**。件数の増減で自然さは保てる。

### 🧭 2026-08-29 バグ取りの優先順位（mtさん決定）

> 「バグとりはアドセンスに影響しない程度で。**アドセンスに必要なバグとりなら優先順位は高い**です。」

この基準で今ある未修正を仕分けるとこうなる。

| 優先 | 項目 | AdSenseへの影響 |
|---|---|---|
| ⭐高 | **E0 翻訳フォールバック** | ⚠️**効く。** 失敗すると `body_i18n` が **0/7**＝**enページも壊れる**。en/jaはインデックス対象なので、英語ページが原文のまま出る＝Low value content の材料 |
| ⭐高 | **AI判定ロジック**（固有名詞の捏造） | ⚠️**効く。** 誤情報が公開される＝信頼性に直撃。⛔ただしmtさん指示で**着手は承認後** |
| 低 | E0b hreflang | 実害ほぼゼロ（Googleはnoindexを指すhreflangを無視するだけ）。E0のついで |
| 低 | 管理ダッシュボードの検索 | 審査と無関係。実ユーザーを迎える前でよい |
| 低 | バグ④（is_available上書き） | 審査と無関係。実ユーザー段階の問題 |

⭐**結論：申請前に触るのは E0 だけでよい**（＋ついでの E0b）。他は承認後。

---

### 📝 2026-08-30 質問フォームの下書きがアカウント間で混ざる（⭐承認後・実ユーザー前に必須）

**mtさん報告**：「質問終わっているのに、この質問が残り続ける。質問するボタンを押すと出続けます」

#### まず、報告された症状自体は正常動作だった

```
QuestionForm.tsx:190  投稿が成功したときだけ localStorage.removeItem(draftKey)
```
M06「Genelec G Threeをスピーカースタンドで使う場合、デスクトップモードは必要ですか？」の投稿は
**レート制限(429)で失敗**していた → `!res.ok` で throw → **190行に到達しない** → 下書きが残る。
⭐**「入力を失わせない」機能が意図どおり働いた**だけ。DBにもM06は入っていない（実測で確認）。

#### ⛔ ただし本当の欠陥が2つある

```
QuestionForm.tsx:134
const draftKey = `wa_draft_${tenantId}`
                              ↑ ⛔ user_id が入っていない
```

1. ⛔**下書きがテナント単位で、アカウント単位ではない。** 同じブラウザで奥様と本人を切り替えると
   **下書きが混ざる**。⚠️投稿フェーズは1台のMacで2アカウントを切り替える運用なので、**今まさに踏んでいる**。
   実ユーザー段階でも「家族で1台」なら同じことが起きる
   - 修正案：`wa_draft_${tenantId}_${userId}`。⚠️未ログイン時のキーをどうするかは要検討
2. ⛔**「下書きを消す」導線が無い。** 消すには**タイトルと本文を両方とも空にする**しかない
   （152-153行の `removeItem` が走る条件）。⚠️片方だけ空にしても消えない
   - 修正案：フォームに「下書きを破棄」ボタン。⭐復元したときに「下書きを復元しました／破棄する」と
     出すのが親切（今は黙って復元されるので、前回の内容が残っているのか新規なのか区別が付かない）

- ⛔**承認前には触らない**（E2＋投稿フェーズ中はビルドを引かない）。⭐ただし**実ユーザーを迎える前には直す**
- ⚠️**当面の運用**：アカウントを切り替える前に、フォームのタイトルと本文を両方空にしておく

---

### 🛠 2026-08-29 管理ダッシュボードに検索・テナント絞り込みが無い（⭐AdSense承認後・mtさん要望）

**mtさんの指摘（2026-08-29）**：「どのテナントから入っても全部の質問が出てくる。それはいいが、量が増えていきそうなので、**質問とユーザーの検索機能とテナントごとの表示機能**が欲しい」。

#### 現状（`src/app/[locale]/admin/page.tsx:43-52` で確認）

```ts
admin.from('questions')
  .select('id, slug, title, status, tenant_id, created_at, user_id, matched_b_id')
  .order('created_at', { ascending: false })
  .limit(200),          // ← テナント絞り込みなし・200件で打ち切り
admin.from('profiles')
  .select('id, username, is_banned, created_at')
  .order('created_at', { ascending: false })
  .limit(200),          // ← 同じく200件で打ち切り
```

- ⭐**全テナント横断で見えるのは仕様どおり**（mtさんも「それはいい」と明言）。管理は1人なので横断ビューは正しい
- ⛔**問題は `.limit(200)` が黙って切ること。** 「200件を超えています」の表示が無いので、**古い質問・古いユーザーが静かに見えなくなる**
- ⚠️**現状39問なのでまだ効いていない**が、67問到達＋テナント追加で確実に超える。100テナント時代（週1〜2で追加）には破綻する

#### 実装したいもの（優先順）

| | 内容 | 効果 |
|---|---|---|
| ⭐1 | **テナントごとの絞り込み**（タブ or セレクト）＋「全テナント」も残す | 一覧が実用的な件数に落ちる。既に `tenant_id` は取得済みなのでUI側だけで足りる可能性がある |
| ⭐2 | **質問の検索**（タイトル・slug・ステータス） | 200件の壁を回避しつつ目的の1問に辿り着ける |
| 3 | **ユーザーの検索**（display_name / username） | BAN対応や実績確認で使う |
| 4 | **件数上限の可視化**（「1,000件中1,000件を表示」＋ページ送り or 「もっと読む」） | ⛔黙って切らない。⭐これが無いと1〜3を入れても「無いのか、切れたのか」が分からない |

⭐**【2026-08-29 mtさん決定】上限は 200 → 1,000 に引き上げる。** 根拠＝**開設ライン10問 × 100テナント = 1,000問**。100テナント構想がそのまま上限の設計値になる。⚠️実ユーザーが埋め始めたら1,000も超えるので、**4（上限の可視化＋ページ送り）は結局必要**。

- ⚠️**4は1〜3より先に入れてもよい**（1行の表示追加で「静かに消える」問題だけは今すぐ潰せる）
- ⛔**承認前には触らない**：E2（申請後はpush禁止）＋ 投稿フェーズ中はビルドを引く回数を増やさない方針
- ⭐**実ユーザーが来る前に必要**。BAN・不適切投稿の対応（B7）は「探せること」が前提になる

---

### 🧠 2026-08-27 AI判断ロジックの信ぴょう性問題（⭐AdSense承認後の最重要タスク）

**Day 11 で M03 が予定外に🤖になり、そのAI回答が誤っていた。** 削除→再投稿で解消したが、
**そこで判明したことのほうが大きい。**

#### ① 何が起きたか（実測）

```
M03「Antelope Zen Quadro＋Edge Soloのマイクエミュレーター方法は？」
  較正 90  →  1回目 95（🤖公開）  →  削除して2回目 90（👤人間ルート）
```

1回目のAI回答に3つの誤り:
```
・「Neumane」  → Neumann の誤り（⭐製品名＝検索キーワードそのもの）
・「AuraVerb」をマイクエミュレーターの例に挙げた → AuraVerbはリバーブ
・手順が実機と食い違う（AI＝DAWにプラグインをインサート／実際＝ランチャーのミキサーで選ぶ）
```

#### ② ⭐較正の前提が崩れた

較正時のコメントにはこう書いてある:「95点帯の13問は全て正確だった。よって91以上でAI公開＝誤答を除外できる」

**M03の1回目がその反例。** 同じ目で公開中の🤖12問を読み直したところ、さらに:
```
⚠️ G03 Klon Centaur(95)   「キース・リチャーズが愛用」「基板の通称ドミノ/ガーゴイル」
                           ← 較正時は「ジョン・メイヤーやエッジ」で正確だった
⚠️ M17 Ableton Looper(95)  Quantiloop を Live のプラグインとして列挙（あれはiPadアプリ）
⚠️ M14 Max for Live(95)    「Livid、Sequencers、MIDI Effect」の列挙が成立していない
⚠️ G01 OD-1 電源(95)       「PSA電源で動かすためデイジーチェーン」＝別途「要確認」で既出
✅ 残り8問（G24/G06/G08/G18/G19/M18/M23/M24）は問題なし
```
⭐**共通しているのは「固有名詞の捏造」**（人名・製品名・型番）。文章の骨格は正しいのに固有名詞だけが
差し替わる。⛔**読んで気持ち悪くないので、目視レビューで一番すり抜ける種類。**
⚠️mtさん判断：**G03は終わった判断として放置**（削除・再投稿はしない）。

#### ③ 原因は3段構え（すべてコードで確定）

```
① src/lib/gemini.ts:206  リクエストに temperature の指定が無い
   → 既定値のままサンプリングされる＝同じ質問でも数字も文面も毎回変わる
② src/lib/gemini.ts:125  DEFAULT_THRESHOLD = 91
   → Geminiのスコアは90点帯と95点帯に分離する。91はその谷間
   → ⭐90↔95 の揺れが、そのまま「人間ルート↔AI公開」の反転になる
   → M03は較正90＝ちょうど境界の問題だったので揺れが結果を変えた
③ src/lib/gemini.ts:423  ヘッジ語（かもしれません等）があれば -20
   → ⛔向きが逆。自信なさげに書くと落とされ、堂々と間違えると通る
   → M03の1回目は断定調でヘッジ語ゼロ＝減点なしで通過
```

⭐**根本は「モデル自身に自信度を自己申告させている」こと。** LLMの自己申告confidenceは実際の
正確さと相関が弱い。**内容が合っているかは誰も見ていない。**

#### ④ 改良案（⛔AdSense承認後・E2のpush禁止が解けてから）

| | 案 | 効果 | コスト | 備考 |
|---|---|---|---|---|
| ⭐1 | **2回投げて食い違ったら人間へ**（self-consistency） | 大 | API2倍・+3秒 | ⭐今回の実例で有効性が実証済み（1回目と2回目で答えが別物だった）。プロンプト不要で実装が最も軽い |
| 2 | **検証パス**（別呼び出しで誤り・実在しない固有名詞を検査） | 大 | API2倍・+3秒 | 固有名詞の捏造を狙い撃ちできる |
| 3 | `temperature` を明示 | 中 | ほぼゼロ | 前提整備。単体では「安定して間違える」だけ |
| 4 | Google検索グラウンディング | 大 | 要調査 | ⚠️OpenAI互換エンドポイントでは使えない可能性。ネイティブAPIへの移行が要るか要検証。課金の可能性も |

#### ⭐【2026-08-29 mtさん決定】採用するのは「2回回す・2回目は固有名詞チェック」

```
1回目  今までどおり回答を生成（変更なし）
2回目  ⭐固有名詞に絞って検査する（人名・製品名・型番・年号が実在するか／取り違えていないか）
```

- ⭐**この絞り込みは実測に合っている。** 2026-08-27〜29に見つかった誤りは**全部が固有名詞**だった（M03「Neumane」／M03「AuraVerb」／G03「キース・リチャーズ」「ドミノ・ガーゴイル」／M17「Quantiloop」／M14「Livid」）。文章の骨格は毎回正しく、**固有名詞だけが差し替わる**
- ⛔**2回目に書き直させない。** スコアを下げて**人間ルートへ落とすだけ**にする。書き直させるとAIが自分の採点をやり直すだけになり、①の自己申告問題がそのまま残る
- ⭐落とし先は既存の仕組みでよい（`score < threshold` → 人間ルート）。新しい状態を増やさない

**⚠️スループットの見立て（2026-08-29・出典を確認済み）**
- mtさん試算＝**1日225件程度**。出典は **CLAUDE.md 804行「B(フルGemini)136〜455問」**（2026-07-22の実測）。⭐記憶は正確だったが、**455は範囲の上端**で、元の数字は幅がある
- ⭐**2パス化後の見立て＝68〜227問/日**（225は「一番良かった場合の半分」）
- ⚠️**制約はRPDではなく TPM 250K（分あたりトークン）**（764行）。だから固定件数でなく幅が出る。RPDは「145問超えても停止せず」までしか分かっていない（808行）
- ✅**今の実運用は1日6問**（レート制限3件/テナント×2テナント）＝最悪の68問でも**10倍以上の余裕**
- ⚠️⚠️**ただし有料化ラインが半分の早さで来る。** 記録上のトリガーは「Geminiの有料化は1日130問に近づいたら」だが、⭐**2パス化すると実質65問で到達**する。100テナント＋実ユーザーの段階では、この前倒しを見込んでおくこと
- ⭐**実際に効くのは日次より `RPM 15`（分あたり）のほう。** 1投稿で「AI回答1＋翻訳バッチ＋欠損の補完」で**4〜5コール**飛ぶので、検証パスを足すと **5〜6コール／投稿**。RPM15なら**1分あたり2〜3投稿**が上限
- ⭐人間が投稿するペースなら100テナントでも問題にならない。⚠️**詰まるのは投稿が同時に重なったとき**。実ユーザーが増えたら測り直す
- ✅測り方：429のログ（`parseRetryAfterSec` が拾う `retryDelay`）と管理ダッシュボードのAIコスト画面。⛔**先に数字を決めずに、実測してから上限を語ること**

- ⚠️**どの案でも閾値91の再較正が必須。** 較正データは `scripts/calibration.*.json`（67問）に残っている
- ⚠️**制約**：Gemini無料枠は RPM 15。AI回答は投稿APIのレスポンスに直列でawaitされる（翻訳と合わせて）ので、追加呼び出しはユーザーの待ち時間に直接乗る
- ⚠️**ゼロにはできない。** LLMである以上、捏造は残る。狙えるのは「95点帯に誤答が混ざる率を下げる」ところまで
- ⛔**なぜ承認後なのか**：E2（申請後はpush禁止）＋ gemini.ts は投稿APIの中核でビルドを壊すと投稿が止まる（7/28の1102の前例）

#### ⑤ 100テナント時代を考えると、ここが一番の弱点

現状は**AIが答えたら即公開で、誰も中身を見ていない**。今は67問なので人力で目を通せるが、テナントが
増えたら物理的に無理になる。⭐**mtさんの優先順位「①価値あるコンテンツ ②人間が作った」に直接刺さる
問題なので、承認後の最優先で扱う。**（2026-08-27 mtさん指示：「アドセンス審査通過後のタスクに加えておいて」）

⭐**「放置フェーズ」の前提条件がここ**（2026-08-29 mtさんの目標＝「来年の今頃に100テナントにして放置フェーズに入りたい」）。数で見るとこうなる:

```
100テナント × 開設ライン10問 = 1,000問
未経験ジャンルは「AIシード方式」で開設ラインを満たす方針（671行）
        ↓
AI回答が約1,000本、誰も中身を読まないまま公開される
```

⛔**今日の実測では、95点帯にも固有名詞の捏造が混ざる**（M03のNeumane／G03のキース・リチャーズ）。
公開中の🤖12問のうち4問に疑わしい箇所があった＝**ざっくり3分の1**。この率のまま1,000本に伸ばすと、
**300本規模の誤情報を抱えたサイト**になる。⚠️これは手動レビューでは追えない量。

⭐**つまり「放置フェーズに入る」ためには、放置しても壊れない判定ロジックが先に要る。**
テナントを増やす前に、②検証パス or ①self-consistency を入れて誤答率を測り直すこと。
⛔順番を逆にすると、増やした後で全テナントを見直す羽目になる。

---

### 📮 投稿日の締め手順（2026-08-25 制定・**言われる前にやる**）

⚠️**mtさんの動き方は「投稿→回答→BAを待機なしで一気に終わらせる」**（memory: feedback_posting_cadence）。つまり**「投稿しました」と言われた時点で、その日のBAも既に終わっている前提で確認する**こと。

⛔**2026-08-25の失敗**：BAの状態を**投稿前に1回だけ**確認し、その「未選択」という結果をその後の全てのまとめで使い回した。実際はmtさんが**投稿の1分後（00:59）にBAを済ませていた**のに、「□ BA 2件 未消化」と何度も書いた。⚠️**しかもデータは手元にあった**――途中で数えた `solved` が 11→13 に増えており、その2問がまさにM12とG12だった。**自分で出した数字を読んでいなかった。**

#### ⛔ 質問番号だけで話さない（2026-08-30 mtさん指摘）

> 「M25って言われてもわかりません。**なんの質問かを少し概要**が欲しいです。」

⭐**必ず「番号＋タイトル」で書く。** mtさんは67問の番号を覚えていない（覚える必要もない）。
```
⛔ M25のBAがまだです
✅ M25「ガレージバンドで曲作り、何から作るのが正解？」のBAがまだです
```

#### ⚠️ レート制限は「カレンダー日」ではなく「最初の投稿から24時間」（2026-08-30 実コードで確認）

`supabase/migrations/20260709000001_rate_limits_v2.sql`：テナント別3件／全体10件。⭐**`window_start` から24時間で1つの窓**で、`window_start` は窓が切れたときにだけ更新される。**0時リセットではない。**

⛔**深夜0時台に投稿し続けると窓がじりじり後ろへずれる。** 実例：
```
8/29 01:37  奥様 dtm M25「ガレージバンドで曲作り」   ← ここで窓が開いた
8/30 00:54  奥様 dtm M03-2 / M20                    ← 同じ窓の中
            → 3件で上限。M06 が投稿できずリセット待ち（8/30 01:37ごろ）
```
- ⭐**回避策：もう一方のアカウントで投稿する。** 本人が投稿→奥様にマッチ→奥様が回答、で詰まない（⛔「奥様は答えられない」は誤り）
- ⚠️**`rate_limits` は service_role でも読めない**（`permission denied`）。窓の残りはコードと投稿時刻から推定するしかない。⛔断定しないこと
- ⭐**土日の6問の日は特に当たりやすい。** 前夜の投稿時刻を見てから割り振ること

#### 「投稿しました」と言われたら、毎回この順で全部やる

1. **`node scripts/verify-latest-post.mjs <tenant> <n>`** で翻訳を確認（回答した日は必ず）
   - ❌が出たら **`npx tsx scripts/backfill-answer-translations.mts`**（まずdry runで対象を確認）→ **`--apply`**
   - ⚠️⚠️**1回では通らない。** 実測で1回目=両方失敗、2回目=1件成功、3回目=残り1件成功。⭐**成功時は8〜9秒、失敗時はきっかり18秒**なので、**18秒かかったら失敗と判断して叩き直す**
   - ⭐dry runは「過去分が壊れていないこと」の確認も兼ねる（欠落件数が当日分だけなら正常）
2. ⭐**DBで status を数え直す**（`ai_answered` / `solved` / `open`+人間回答 / `hard`）。⛔前回の結果を使い回さない
3. ⭐**その日のBA対象が `solved` になっているか個別に確認**する。⛔「まだのはず」と決めつけない
4. **較正スコアとのズレを確認**（🤖のはずが👤に落ちていないか、その逆も）。ズレていたら配分の入れ替えを提案する
   - ⚠️**引き直しは2回まで。** 同じスコアが2回続いたらそれは揺れではなく**その質問の実力値**（M25が実例：較正95だが本番は2回とも90）。それ以上引くと「一番自信満々な回答」を選ぶ操作になり、⛔誤答が通りやすくなる
   - ⭐**🤖になった問は必ずAI回答を読む。** 固有名詞（人名・製品名・型番）の捏造が一番すり抜ける（M03のNeumane／G03のキース・リチャーズ）
5. ⭐**Notionの投稿スケジュール表のその日の行を消し込む**（✅＋取り消し線）。⛔**これは言われる前にやる作業**
   - ⛔**`API-update-a-block` は table_row を弾く**（`body.table_row should be defined` で400）。ここで諦めない
   - ✅**通る方法**：`API-update-page-markdown` の find-and-replace。表はHTML風マークダウンで表現されているので、行まるごとを `old_str` にする
   ```
   type: "update_content"
   update_content: { "content_updates": [ { "old_str": "<td>8/28（金）</td>\n<td>12</td>\n<td>…</td>…", "new_str": "<td>✅ 8/28（金）完了</td>\n<td>12</td>\n<td>~~…~~ ⚠️注記</td>…" } ] }
   ```
   - ⚠️`<td>12</td>` のような短い文字列は他の行にも当たるので、**行を丸ごと（5セル分）** `old_str` に入れること
   - ⚠️取り消し線は `~~…~~`。⭐**2026-08-29 に実証済み**（Day 11・12 の2行を1コールで消し込み）
6. ズレや発見があれば CLAUDE.md とNotionに記録する

⚠️**2〜5は毎回やる。** 特に**3と5は言われてから動かない**。

### 🔍 2026-08-25 全体監査（mtさん「他に抜けているのありますか？」を受けて実施）

**チェックリストと本番DBを突き合わせた結果。新規に見つかった「抜け」はTikTokだけだが、別種の遅れが2つあった。**

| | 内容 |
|---|---|
| ① **TikTok未作成** | ⚠️唯一の抜け。8/24予定を飛ばしていた。プランナーが「残り3媒体」と誤って数え続けたのが原因 |
| ② **投稿ペース** | **27/67問**。⚠️**遅れではない**――8/24ぶん（Day 8）は**8/25の数時間前に投稿したばかり**。よって**8/25は投稿なし**（mtさん判断）。※プランナーは当初これを「今日の投稿が未着手＝遅れ」と誤って書いたが、DBのUTC時刻だけを見て日本時間の実作業を確認しなかったのが原因 |
| ③ **回答待ち6問** | ✅**計画どおり**（2026-08-25 mtさん）。Notionの「📋 投稿ステータス一覧」の割り当てに沿って進行中。⛔プランナーが「放置すると回答ゼロが確定する」と警告したのは筋違いだった |
| ④ FBページのユーザーネーム未設定 | URLが `profile.php?id=61593848066922` のまま |
| ⑤ アイコン・バナー・YouTube透かし | マーク方針が未定のため保留 |
| ⑥ A4の誤字4件 | ✅mtさんが修正済み（該当4問は未投稿だったため本番への影響はゼロ） |

#### ⚠️⚠️「期限切れなのに `open` のまま」について（2026-08-25 プランナーが誤った断定 → 同日訂正）

⛔**プランナーは「期限切れで勝手に🔥へ飛ぶcronは存在しない」と断言したが、誤りだった。**

`escalate/route.ts`（Next.js側）しか読まず、**DB側を見ていなかった**。実際にサービスロールで叩いたところ：

```
rpc auto_escalate_expired → permission denied for function auto_escalate_expired
```

⚠️**`permission denied` は「関数は存在するが権限がない」という意味**（存在しなければ `could not find function` になる）。**つまり `auto_escalate_expired()` は実在する。** 本ファイル1523行にも最初から「**15分ごとに走り『担当者が期限切れまで未回答』の質問を自動でhard化する**」と書いてあった。

**いま分かっていること**

- ✅ `auto_escalate_expired()` はDBに存在する
- ✅ アプリ側でhardになる経路も別にある（①投稿時にAIスコアが閾値91未満 ②`escalate` APIを明示的に叩く）
- ⚠️**それが実際にスケジュールされているか、上記4問がなぜ未エスカレートかは、service_roleでも権限が無く確認できていない。推測しない。**

⛔**なお、投稿済みで `open` のまま残っている質問は「計画どおり」**（2026-08-25 mtさん）。Notionの「📋 投稿ステータス一覧」に1問1行で割り当てが書いてあり、mtさんはそれに沿って進めている。⚠️**プランナーが勝手に「放置すると回答ゼロが確定する」と警告するのは筋違い。現物（Notion）を見てから言うこと。**

⚠️実際、🔥高難度に指定されているのは **M05・M29・M32／G14・G16・G17** の6問で、8/23に `hard` になった「USBケーブルの質で音質は変わる？」は**M05＝指定どおり**だった。残りの `open` 4問は🔥指定ではなく、mtさんが回答する予定の問。

⚠️⚠️**教訓（今日3回目）：アプリのコードだけ見て「仕組みが無い」と断定しない。** DBの関数・トリガー・cronまで見る。そして**まずCLAUDE.mdを検索する**（今回も1523行に答えが書いてあった）。

### 🏭 100テナント時代の宣伝素材をどう作るか（2026-08-25 mtさん提起）

**mtさんの問い：「バナーと動画で100テナントぶんの宣伝素材を作っていく感じの記載はあるか？」→ 動画は記載あり、バナーは無かった。** 以下が補完。

#### 記載の有無

| | 状態 |
|---|---|
| **動画** | ✅記載あり。`1テナント＝あるある動画1本を7媒体へ横展開`／ペースは承認直後まで月1〜2本、その後**月3〜4本（週1・年50本）まで**。⚠️一気の量産は**scaled-content判定リスク** |
| **バナー** | ❌記載なし。2026-08-25に「2種類ある」と決めたばかりで、100テナント運用と紐づいていなかった |
| **総量の計算** | ❌記載なし |

#### ⚠️バナーの「自動生成」について（2026-08-25 プランナーが誇張 → mtさん指摘で2回訂正）

⛔⛔**プランナーは画像を作れない。デザインできないし、描けない。** できるのは「文字・色・図形をコードで組んでPNGに書き出す」ことだけ。

**プランナーは「既存のOG画像ジェネレータを流用すればSNSバナーが自動で出る」と言ったが、二重に誤りだった。**

**誤り①：その仕組みは動いていない。** `src/app/opengraph-image.tsx` は存在せず、`public/og/*.png` という静止画を `layout.tsx:101` が直接参照しているだけ。`scripts/image-templates/` のテンプレはアプリから外して退避してあるもの。⚠️**しかもこの事実は本ファイルの2311行に最初から書いてあった**（「favicon/OGPは『自動生成』ではない」）。**読まずに `scripts/` のファイルだけ見て推測したのが原因。**

**誤り②：そもそも作る対象が違う（mtさん指摘）。** 2311行が扱っているのは**サイトの資産**であって、SNSの資産ではない。

| | 何のためのもの |
|---|---|
| `public/icons/<id>.png` | **ブラウザのファビコン**（タブに出る） |
| `public/og/<id>.png` | **サイトURLをシェアしたときのカード**（OGP） |
| **SNSアイコン**（1000×1000） | YouTube・X・IG等の**プロフィール画像**。⛔上記とは無関係 |
| **SNSバナー** | チャンネルアート・ヘッダー。⛔上記とは無関係 |

⛔**「テナントのファビコン/OGPが作れること」と「SNSのアイコン/バナーが作れること」を混同しないこと。**

⚠️⚠️**教訓（今日2回やっている）：推測で語る前に、まずCLAUDE.mdを検索する。** それでも無ければ実コードを読む。それでも分からなければ調べる。Facebookのユーザーネームでも同じで、調べれば5分だったものを「仕様で出ないのでは」と推測で片付けた。

#### 4種類の素材と、誰がやるのか

| 素材 | プランナー |
|---|---|
| **SNSプロフィールバナー**（5媒体） | ⚠️**デザインが決まっていれば**コードで組んで5サイズに書き出せる |
| **SNSアイコン**（7媒体） | ⛔**マークが存在しないので無理**。「W」1文字にするか等はデザイン判断＝mtさん |
| **100テナント宣伝バナー** | ⚠️同上。**型が1つ決まれば**、色と名前の差し替えは機械的にできる |
| **100テナント宣伝映像** | ⛔**完全に不可能** |

⛔**「100テナントでもデザイン作業はゼロ」は誤り。** 正しくは「**型を1つ作る作業はmtさんに残り、その複製だけが機械化できる**」。しかもその型がいま存在しない（正方形マークが無い問題と同根）。

⚠️⚠️**教訓：答えはこのCLAUDE.mdの2311行に最初から書いてあった。**

> ⚠️**favicon/OGPは「自動生成」ではない（2026-07-30〜）**。`src/app/icon.tsx`・`opengraph-image.tsx` は `scripts/image-templates/` へ退避済みで、配信されるのは静的ファイル

**プランナーはこれを読まずに `scripts/` のファイルだけ見て「仕組みが動いている」と推測した。** 今日はFacebookのユーザーネームでも同じことをしている（調べれば5分だったものを推測で「仕様で出ないのでは」と片付けた）。⛔**推測で語る前に、まずCLAUDE.mdを検索する。** それでも無ければ実コードを読む。それでも分からなければ調べる。

⚠️**なお2311行には「新テナントの画像を書き出す5手順」も書いてある（順番厳守）**。バナーを作るときはこれに従うこと――**ワンコマンドで出るわけではない**。①テンプレ2枚を `src/app/` へ一時的に戻す →②デプロイ →③新テナントのホストで `/icon`・`/opengraph-image` を保存して `public/` へ置く →④テンプレを `scripts/image-templates/` へ**戻す（退避）** →⑤再デプロイ。⛔**④を忘れると Worker が毎回画像を生成する状態に逆戻りする**（1102エラーの原因だったもの）。

#### 総量の目安

- **動画**：月3〜4本が上限なので、100テナントに1本ずつ行き渡るのに**約2年**。⚠️つまり**全テナントに動画がある状態は最初から目指さない**。動画が強いのは音楽・ギターのように「機材が映る／音が出る」ジャンルで、抽象的なジャンルは**静止画＋テキストで割り切る**（既存方針どおり）
- **バナー**：型が1つ決まれば、色と名前の差し替えは機械的なので**テナント数に比例しにくい**。⚠️ただし**その型がまだ存在しない**（正方形マークが無い問題と同根）。⚠️**投稿の頻度は別問題**で、リリース告知を立て続けに撒くと広告アカウントに見える。**素材が作れることと、出していいことは別**

### 📋 SNSの残タスク一覧（2026-08-25 時点・**ここを見れば全部わかる**）

#### A. アカウント登録（残り**4**媒体）

| 媒体 | 用途 | 備考 |
|---|---|---|
| **TikTok** | 動画 | ⚠️**8/24を飛ばした抜け**。動画7媒体の筆頭。⛔スマホアプリからの作成が基本 |
| **note** | 記事（日本語） | ブラウザで完結。「非エンジニアがAIとQ&Aサイトを作った話」を1本 |
| **dev.to** | 記事（英語） | 同上。build-in-public。⚠️**noteの直訳は使わない**（読者が違う＋重複コンテンツ回避） |
| **Pinterest** | 動画7媒体の1つ | 唯一のストック型。期待値は最下位だが、1本目の反応を見て切るか判断 |

⚠️**どれもブラウザで完結する**。Xのようなアプリ限定も、Metaのような連携もない。個人アカウントとの分離も気にしなくてよい（紐付く仕組みがない）。

#### B. プロフィールの漏れ（1件）

⚠️**Facebookの「設定」がグレーアウト（⊘）して押せないときは、個人アカウントの視点でページを見ている。** 左サイドバー下部の「**Wisdom Assembleのページに切り替えて**」を押してページ視点にすると押せるようになる。2026-08-25にここで詰まった。

✅**【2026-08-25 解決】Facebookページのユーザーネームは `設定 → ページ設定 → 名前の行 → 一般ページ設定 → ユーザーネーム → 編集`。** `facebook.com/wisdomassemble` を取得済み（アンダースコアなし＝YouTube・Xと同じ綴り）。

⚠️**プランナーが4ルート案内して全部外したので、間違いのほうも残しておく（同じ道をたどらないため）。**

| 試した場所 | 結果 |
|---|---|
| `ページの基本データ`タブ | ❌ カテゴリと連絡先だけ |
| `設定とプライバシー → ページの詳細` | ❌ **1つ違い。正解はすぐ下の「ページ設定」** |
| `プロフィール右上の ✏️編集 → 基本データを編集` | ❌ 基本データタブに戻るループ |
| `Meta Business Suite → 設定 → アカウント → ページ` | ❌ 権限管理の画面。ページ情報は編集できない |

⛔**「新規ページには開放されていない」というプランナーの推測は誤りだった。** 調べたところ**フォロワー数や作成日の条件は存在せず**、必要なのは**フルコントロール権限だけ**（Business Suiteで「フルアクセス」と出ていたので最初から満たしていた）。⚠️**画面が見つからないときに「仕様で出ないのでは」と推測で片付けない。まず調べる。**

⚠️ページ名（Wisdom Assemble）の変更には7日の待機期間があるが、**ユーザーネームにはその制限はない**。



- ⚠️**Facebookページのユーザーネームが未設定**。URLが `facebook.com/profile.php?id=61XXXX…` の数字の羅列のまま。`ページ → 設定 → ページのユーザーネーム` で `wisdomassemble` を取れば `facebook.com/wisdomassemble` になり他媒体と揃う
- **既存5媒体のプロフィール（コピー＋説明文＋リンク）は入力済み**。⚠️ただし**外部から検証できたのはYouTubeだけ**（X/Threads/Instagramはログインなしだと中身を返さない）。他はセットアップ中のスクリーンショットで目視確認したもの

#### C. アイコン・バナー（未着手・**判断待ちあり**）

- **アイコン**：7アカウント全部に必要。1000×1000のマスター1枚から切り出す（YouTube 800 / dev.to 640 / X 400 / IG・Threads・note 320 / Pinterest 280 / TikTok 200）。⚠️**全部まるく切られ、最小はコメント欄の32px前後**
- ⚠️⚠️**未解決：正方形のロゴマークが存在しない。** あるのは `icons/root.png`（32×32・小さすぎ）と `og/root.png`（1200×630の横長ワードマーク・正方形に切ると「M ASSE」になる）だけ。**32pxでワードマークを2行に組むと完全に潰れる**ので、①「W」1文字 ②「WA」2文字 ③新しいマークを作る のいずれかを**mtさんが決める必要がある**
- ⚠️⚠️**バナーは2種類ある（2026-08-25 mtさん指摘）。マスターが別物なので使い回せない。**
  - **①プロフィール用**（貼るだけ・投稿しない）：横長・約3.6:1。YouTubeのセーフエリアに縛られる。5媒体
  - **②テナントリリース用**（投稿する）：**正方形1080×1080がマスター**。そこから 4:5（IG）/ 16:9（X・FB）/ 2:3（Pinterest 1000×1500）へ展開。note・dev.toの記事ヘッダーも兼ねる
  - ⛔**①を②に流用しない。** 横長をフィードに流すとスマホで細い帯になって読めない
  - **②を作る意味**：動画が月1〜2本だと7アカウントが数週間無言になり初速が出ない。バナーは動画より桁違いに安いので、テナントが増えるたびに1枚出せば動画の制作待ちで止まらない。⚠️ただし**リリース告知だけを繰り返すと広告アカウントに見えて伸びない**ので、中身のある投稿と混ぜること
- **バナー（①プロフィール用）**：5媒体（YouTube 2048×1152 / dev.to 1600×640 / X 1500×500 / note 1280×670 / Facebook 820×312）。⚠️**IG・Threads・TikTokにバナーは無い**
- ⚠️**いちばん厳しい制約はYouTubeのセーフエリア**。入稿は2048×1152だが、TV・デスクトップ・モバイルで表示範囲が違い、**どの環境でも確実に見えるのは中央の1235×338だけ**。裏を返すと、**中央1235×338（約3.6:1）に要素を収めておけば他の4サイズにも切り出せる**
- **プランナーができるのは機械的なサイズ展開だけ**。マスター1枚があれば5サイズに切れる。⛔**デザインそのものはmtさんの領分**なので、プランナーが勝手に作らない

#### D. 動画投稿の一括化 — ⛔**自動化しない（2026-08-25 判断）**

**技術的には各社APIで可能だが、CLAUDE.md 683行の既存方針と正面から衝突するため採らない。**

> 公開＝本人が押す（❌自動公開はNG：Reddit/TikTok/Instagramは自動投稿・宣伝botを規約で禁止＝BANリスク）

- **アカウントを7つ育てている最中にBANされたら全部失う**。ここが最大の理由
- コスト面でも見合わない：**X APIは有料化済み**（無料枠は投稿数が極小・Basic $100/月）、**TikTok Content Posting APIは審査が必要**、OAuthを6媒体ぶん構築する手間が月1〜2本の投稿に釣り合わない
- **実際の手数は6回アップロード**（FB+IGがMeta Business Suiteで1回にまとまるため7回が6回になる）。1本あたり15〜20分程度で、月1〜2本ならこれで足りる

**プランナーが手伝えるのはこの3つ**（動画そのものは作れない。映像・音声処理は別ツール）

1. **字幕の英語版・日本語版のテキスト作成**
2. **各媒体向けのキャプションとハッシュタグ**（文字数制限・作法が媒体ごとに違う）
3. **投稿チェックリスト**（どの順で上げるか・何を確認するか）

### 📱 SNSアカウント作成の進捗

| # | 媒体 | 状態 |
|---|---|---|
| 1 | **YouTube** | ✅ 2026-08-22 完了。`@WisdomAssemble` / チャンネルID `UCkSH1iRQyNtmA8m6dP7d6-w`。説明は英語を既定＋日本語を翻訳登録 |
| 2 | **Facebookページ** | ✅ 2026-08-24 完了。カテゴリ「ウェブサイト」・リンクのみ設定・連絡先は全部空欄。**2026-08-25にユーザーネーム取得 → `facebook.com/wisdomassemble`** |
| 3 | **Instagram** | ✅ 2026-08-25 完了。`@wisdom_assemble`（ビジネスアカウント・カテゴリは商品/サービス） |
| 4 | **Threads** | ✅ 2026-08-25 完了。`@wisdom_assemble`・公開プロフィール |
| — | **FB ⇔ IG 連携** | ✅ 2026-08-25 完了。ビジネスポートフォリオに両方が入り、Reels同時投稿が有効 |
| 5 | **X** | ✅ 2026-08-25 完了。`@wisdomassemble`（アンダースコアなし＝YouTubeと同じ綴りが取れた） |
| 6 | **TikTok** | ✅ 2026-08-26 完了。`@wisdomassemble`（アンダースコアなし）。⭐**Macのブラウザで完結**――Xのようなアプリ限定は無く、強制フォローもトピック選択も無し。所要10分 |
| 7 | note / dev.to / Pinterest | 未着手。⚠️どれもブラウザで完結し、Xのようなアプリ限定もMetaのような連携もない |

- ⚠️**ハンドルは `wisdomassemble` が取れず `wisdom_assemble` になった**（Instagram・Threads）。Business Suite経由の作成が一度失敗した際に、幽霊アカウントが元の綴りを確保した可能性が高い。**Instagramのユーザーネームは後から変更できる**ので、解放されたら移す。⚠️残り4媒体は**アンダースコアなしの `wisdomassemble` を優先**で取り、Metaの2つだけ例外という形にする
- ⚠️⚠️**Metaで「押しても何も起きない／同じ画面をループする」ときは、まずSafariのポップアップブロックを疑う。** 2026-08-25にIG作成とFB⇔IG連携の両方がこれで止まった。連携はポップアップでInstagramのログイン画面を開く仕組みなので、ブロックされると**エラーも出ずに無反応**になる。`Safari → 設定 → Webサイト → ポップアップウインドウ` で `business.facebook.com` と `instagram.com` を「許可」にすると通った（許可＋再試行で抜けた）
- ⚠️**Reels同時投稿の対象は Facebook と Instagram の2つだけ。Threadsは含まれない**（同じMeta傘下でアカウントも共通だが、投稿は別扱い）。実際の手数は「**動画1本 → 6回アップロード**」（FB+IGが1回にまとまるぶん7回が6回になる）
- **個人アカウントとの分離状況（2026-08-25 実機確認）**：ページの基本データに個人名は出ない／ページのフォロワー0／`wisdom_assemble` のアカウントセンターは「プロフィール1件」のみ／個人側のアカウントセンターに出るIGは個人用のものだけで `wisdom_assemble` は入っていない。⛔**個人アカウントでこのページやReelsに「いいね」をしないこと。** いいねはページのフォロワー一覧に載って誰でも見られるうえ、Metaが両者の関連を学習して友達の「おすすめ」に出やすくなる
- **X（5媒体目）の注意**：⚠️**ブラウザからメールアドレスで新規登録できない**（`Email signups are only allowed on the apps` と明示される）。**スマホアプリの「アカウントを追加」から作る**のが唯一まともな経路。⛔「Googleで続ける」は個人アカウントと紐付くので使わない。Xは複数アカウントを公式に認めているので、アプリで追加すれば既存アカウントとは別物になる（Instagramと同じ、Facebookだけが1人1アカウント）
- **Xは登録フローで「トピック3つ選択」と「トップ投稿者のフォロー」がスキップできない**。トピックは**美術・音楽・経済ビジネス**を選んだ（⛔ニュース/政治/芸能はタイムラインが荒れるので避ける）。フォローは音楽メディア9件で、サービスと近いので**そのまま残した**
- ⚠️**Xの表示言語は1つしか選べない**。`設定 → Accessibility, display, and languages → Languages → App and post languages`。プライベートウィンドウだと設定が保存されず英語に戻ることがあり、往復しても得るものがないので**英語のまま確定した**。管理画面の言語だけの話で、**外から見えるものと投稿の配信先には影響しない**（配信先は投稿ごとのキャプション言語で決まる）
- ⛔**Xの課金導線は「Get verified」「Premium」「Switch to professional」**。FacebookでLの「青いボタンはだいたい広告」と同じ構図。Xのプロアカウントは広告・収益化向けで、**Instagramのビジネスアカウントとは別物**（Reels連携のような必然性がないので切り替え不要）
- **TikTok（6媒体目）の注意**：⭐**Macのブラウザで完結する**。⛔プランナーは当初「スマホアプリが確実」と言ったが**根拠のない推測**で、`tiktok.com/signup` を実際に開いたら「電話番号またはメールを使う」が最初に出ていた。⚠️**画面を見れば済むことを推測で答えない**
  - ⛔**サイトを開くとGoogleのワンタップログインが勝手に出る**（個人のGmailも並ぶ）。これは「Googleで続ける」と同じなので**✕で閉じる**。⭐`wisdomassemble@gmail.com` を**手入力＋パスワード**で登録すれば、同じメールでもGoogleアカウントとは連携されない独立アカウントになる
  - ⛔登録フォームの「人気上昇中のコンテンツ、ニュースレター、プロモーション…をメールで受け取る」のチェックは**空欄のまま**（販促メール）
  - ⭐**ユーザー名は登録の最後に自分で決められる**。⛔「スキップ」を押すと `user7412...` のような自動生成名になるので押さない
  - ⚠️**「名前」は7日に1回しか変更できない。** 保存前に必ず読み返すこと（2026-08-26に「名前： Wisdom Assemble」とラベルごと入力しかけた。⛔**プランナーが手順書に `名前： Wisdom Assemble` と書いたのが原因**――**コピペされる前提なら、ラベルと値を同じ行に書かない**）
  - **自己紹介は80文字**。キャッチコピー（44文字）だけで、他媒体の2行目は入らない。**Website欄はプロアカウントに切り替えないと出ない**が、⭐**リンクはキャプションに直接書ける**ので動画を出すまで急がない
- **Instagramのプロフィールは保存されないことがある**（2026-08-25に自己紹介が一度消えた）。入力したら**必ず「送信する」を押し、再読み込みして残っているか目視**すること。ブラウザ版はリンク欄が編集できず「モバイルアプリから」と表示されるが、**Threadsのリンクはブラウザからでも追加できた**
- **Facebookページ作成時の注意（次に誰かが作るとき用）**：⛔作成直後の「**友達を招待していいね！してもらいましょう**」を押すと**友達全員に通知が飛ぶ**。ここが唯一の地雷。WhatsApp連携・広告作成・Meta認証（月額課金）も全部スキップ。管理画面の**青いボタンはだいたい広告**なので押さない
- **Facebookページは個人アカウントにぶら下がる**。個人名はページに出ない（透明性に出るのは管理者の人数と所在国だけ）が、⚠️**個人アカウントが凍結されるとページも道連れ**。2段階認証をオンにし、将来は管理者をもう1人足すこと。1つの個人アカウントで**複数ページを持てる**ので、他プロジェクトのページもここから生やせる
- **Instagramは1人5アカウントまで規約OK**（Facebook個人は1つだけ）。⚠️Facebook個人アカウントを2つ作るのは規約違反で、凍結されるとページごと消える
- ⏳ 日程は当初8/23→8/29の予定だったが、Facebookのログイン待ちで後ろにずれている。**アカウント年齢が目的なので早いほど得だが、投稿完了（9/6）に間に合えば問題ない**

### 📱 SNSアカウント作成（2026-08-22 開始決定・投稿と並行）

**1日1個ずつ作る。作りたてよりアカウント年齢がある方が有利なので、投稿期間中に済ませておく。**

| 日付 | 作るアカウント | カバーする媒体 |
|---|---|---|
| ~~8/23~~ **8/22 ✅完了** | **YouTube**（`@WisdomAssemble` / チャンネルID `UCkSH1iRQyNtmA8m6dP7d6-w`） | YouTube Shorts ← **7媒体で唯一Google検索に出る＝最優先**。⚠️**新規Googleアカウントは作っていない**。既存の専用Gmail `wisdomassemble@gmail.com` にチャンネルが無かったので、そのまま個人チャンネルを作成し名前とハンドルを書き換えた（ブランドアカウントの回り道は不要だった）。説明は**英語を既定＋日本語を「言語を追加」で登録**＝閲覧者の言語で出し分かる。リンクはルートポータル1本。**連絡先メールは意図的に空欄**（概要に公開されスパムの的になる／サイトに`/contact`がある）。アイコン・バナー・透かしは7媒体ぶんまとめて作るので未設定 |
| 8/23 | **Meta（Instagram）** | IG Reels ＋ Facebook Reels ＋ Threads（**3媒体が1アカウントで済む**） |
| ~~8/24~~ **8/26 ✅完了** | **TikTok**（`@wisdomassemble`） | TikTok ← ⚠️**一度飛ばした**。8/25にmtさんの指摘で発覚（プランナーが「残り3媒体」と誤って数え続けていた／正しくは4媒体）。8/26にブラウザだけで開設完了。⚠️**TikTokの名前は7日に1回しか変更できない** |
| 8/25 | X（`@wisdomassemble`） ✅完了 | X |
| **8/27** | **note** | 記事（日本語） ← ⚠️TikTokを8/26に入れたぶん1日ずつ後ろにずれた |
| **8/28** | **dev.to** | 記事（英語） |
| **8/29** | **Pinterest** | Pinterest（効果を見て切ってよい枠） |

**✅ 完了 6/7：YouTube・Meta(IG/FB/Threads)・X・TikTok　　⏳ 残り3：note・dev.to・Pinterest**

- **⚠️「7」が2種類あるので混同しないこと**。**動画7媒体**＝TikTok / IG Reels / FB Reels / YouTube Shorts / X / Threads / **Pinterest**（noteとdev.toは入らない）。**作るアカウント7つ**＝Google / Meta / TikTok / X / Pinterest / note / dev.to（Metaが3媒体ぶん）。動画7媒体はアカウント5つでカバーでき、残り2つが記事用。
- **⚠️アカウント作成は必ずmtさん自身**（Claudeは作成不可）。
- ⚠️⚠️**リンクの置き方（2026-08-25 mtさん明確化）――「プロフィール欄」と「投稿物」で別。** 以前ここには「プロフィールのリンクはルートに集約する」とだけ書いてあり、プランナーがこれを全体方針として読み違えていた。
  - **プロフィール欄 → ルート（wisdomassemble.com）**。1アカウントで10テナントを指せないので、構造上ここはルートしかない
  - **バナー・動画 → テナントの直リンクのみ。⛔ルートは置かない。** 理由：**ルートはオンボーディングの動線にならない**（ジャンルを選び直す一手間が挟まって落ちる）。ルートは**ステルス動線**という位置づけで、実際の入口は常にテナント
  - ⚠️**リンク先の言語も動画・バナーの言語に揃える**（英語版→`/en`、日本語版→`/ja`）。テナント直リンクなので**投稿1本ごとにURLが変わる**
- **いまは投稿しない**。動画・note記事・GSCインデックス登録は**67問の投稿完了後**（中身が無い状態で宣伝しても離脱するだけ）。
- **⛔Redditは作らない**。9:1の不文律＋低カルマだと即消される。本命の弾なので「ここぞ」の時まで温存。
- **Pinterestの位置づけ**：7媒体で唯一の**ストック型**（他はフロー型）で数ヶ月後も検索から入る。ただし利用者層がDTM/ギターの主戦場ではないので期待値は最下位。**1本目の動画で反応がなければ切ってよい**。

### 📮 Day 3・Day 4 の記録（2026-08-19 / 08-20 完了）

| 日 | 問 | 結果 |
|---|---|---|
| 8/19（実作業は8/20の01時台） | 🎵M04★ 01:04 / 🎸G27★ 01:05 | マッチ→回答。両方7/7 ✅ |
| | 🤖G01 01:08 | **ギター初の🤖ルート** → `ai_answered`・7/7 ✅ |
| | ✅M13 01:49 | **AI回答をBAに（初）** → `solved`。`answer_count`は不変＝AI回答は加算処理をスキップ ✅ |
| 8/20 | 🎵M09★ 22:56 / 🎸G29★ 22:56 | マッチ→回答（3分後）。両方7/7 ✅ |
| | 🤖G03 22:58 | `ai_answered`・7/7 ✅ |
| | ✅M02・G20 | BA選択。`answer_count`はBAで増えず、`answered_tags`にタグが蓄積（guitar側も初めて入った）✅ |

**進捗：67問中11問／BAは4件（M01 M13 M02 G20）。残り56問。**

**🔧 8/19に発生：M04へ別の問の回答を貼るミス → 質問を消さずに回答本文だけ差し替えて復旧（手順を残す）**
- ⚠️**回答の編集/削除APIは存在しない**。管理画面の削除（`/api/admin/questions/[id]`）は**質問ごと消える**（answersを全削除→questionsも削除）ので使えない。
- ⚠️**`answers`に削除時のトリガーが無い**ので、回答を消しても`tenant_profiles.answer_count`は戻らない（貼り直すと二重に増える）。
- ✅**採った手順**：①`answers.body`をservice_roleで直接更新 ②`body_i18n`を**`{}`**にする（`null`はNOT NULL違反で弾かれる）③`npx tsx scripts/backfill-answer-translations.mts --apply`で7言語を再生成 ④verifyで7/7確認。**`created_at`・マッチング・タグは一切動かない**（`updated_at`だけ動くが、JSON-LDに出るのは`dateCreated`のみなので外部影響なし）。
- カウンタのズレ（`answer_count`が+1多い）は放置で問題なし。**AdSenseは見ないし、サイトにも出ない**。影響はマッチング加点（候補が本人1人なので無関係）と称号が少し早く付くことだけ。

**⚠️🤖問のAI回答は「較正時にレビューした文章」とは別物**（2026-08-20 判明）
- 本番は毎回生成し直すので、Notionに保存されている較正時のAI回答とは中身が変わる。G01では較正時に無かった「PSA電源で動作させるためにデイジーチェーン接続」という記述が入った（技術的に成立するか要確認）。
- **🤖問は公開後に一度目を通す**こと。誤りがあれば人間回答/未解決へ振り替える（CLAUDE.md 736行の運用どおり）。

**▶ 次はDay 5（8/21金）**: 🎸**G05**📝／🎵**M10**★（奥様）／🤖**G06**／**BA: M04 G27**。22時台に一気に。

### 📮 Day 1 の記録（2026-08-17）

**Day 1（テスト日）を完了。両ルートとも本番で初めて通った。**
| 問 | 投稿者 | ルート | 結果 |
|---|---|---|---|
| **M01** | 奥様(MeloSt) | 👤 | マッチング→通知メール到達→本人が回答（366字）→称号「見習い解答者」自動付与。**質問7/7・回答7/7**（翻訳全滅→バックフィルで復旧済み） |
| **M13** | 本人(YOYOYO) | 🤖 | AIが回答して完結（`ai_answered`）。**タイトル7/7・本文7/7・AI回答7/7** |

- **これで未検証の経路がゼロになった**: 投稿→AI判定→マッチング→通知メール→人間回答→称号付与／AI回答→翻訳。8/8のトリガー修正・8/15のマッチング変更・8/17の翻訳修正が、すべて実運用で効いていることを確認。
- **⏳ベストアンサーは両方とも保留中**。1〜3日後に選ぶ（即日だと不自然）。**選ぶときに`answer_count`が+1か（+2でないか）を確認**すると、8/8に入れた二重カウント対策の検証になる。
- **⚠️称号の確認はSQL Editorで**。`service_role`は`user_titles`を読めず**エラーではなく`null`が返る**ので「0件」と誤読する（8/8に実際に誤読）。

**🔁 verify の運用（mtさん自身が回す。エンジニアに投げるのは❌が出たときだけ）**
```bash
cd /Users/apple/wisdom-assemble && node scripts/verify-latest-post.mjs dtm 1
```
- **`cd`を忘れるとMODULE_NOT_FOUNDになる**（ホームで実行すると起きる。上のワンライナーをそのまま貼るのが確実）。ギターは末尾を`guitar 1`に。
- 頻度の目安：**最初の3〜4日は投稿ごと**、以降は**回答を投稿した日は必ず**（壊れるのは回答の翻訳。原因が確率的なため）。質問だけの日は省略可。
- ❌が出たら投稿を止めて`backfill-answer-translations.mts`で埋め直す。

**▶ 次はDay 2**（第1週の火曜）: **M02・G20（奥様が18〜20時）／M14（本人・M13は前倒しで投稿済み）**。
- ⚠️**G20はギターテナントでの初投稿**。本人にマッチするか必ず確認する（エンジニアが「guitarの回答候補は本人1人・タグ18個」を実データで確認済みなので、まず問題ないはず）。

### 🚩 次セッションの入口（2026-08-17 更新・ここから読む）

> **⚡エンジニアの残タスクはゼロ。投稿フェーズが進行中（mtさん・プランナー）。**
>
> **⚠️投稿の検証は mtさん自身がターミナルで回す**（2026-08-17にプランナーと合意）。
> エンジニアのセッションを毎回起こす必要はない。**エンジニアに連絡が来るのは ❌ が出たときだけ**。
> 連絡が来るまでは待機でよい（勝手にコードを触らない）。
>
> ```bash
> node scripts/verify-latest-post.mjs dtm 3   # 音楽の直近3件をまとめて確認
> node scripts/verify-latest-post.mjs guitar 1
> ```
> テナント引数は**内部ID**（音楽=`dtm` / ギター=`guitar`）。2つ目は件数で、
> **その日の投稿分をまとめて確認できる**。引数なしなら全テナント横断で直近1件。
> 運用の温度感は「最初の3〜4日は投稿ごと → 以降は1日1回まとめて」。
> ❌ が出たら投稿を止めて、`npx tsx scripts/backfill-answer-translations.mts --apply` で埋め直す。
>
> **2026-08-17に完了**：新規ユーザーがログインできない重大バグ（`handle_new_user` の
> `search_path`）／回答の翻訳が無音で全滅するバグ（JSON構造・要約・打ち切りの3つ）／
> **検証スクリプトが人間回答の翻訳を見ていなかった穴**を修正。M01は質問7/7・回答7/7で健全。
> 詳細は下の「🔧 2026-08-17」の節。
>
> **⚠️1問ごとに必ず検証を回すこと。** 翻訳は確率的な処理なので「二度と壊れない」とは
> 言えない。ただし8/17の修正で**壊れたら必ず検出できる**状態にはなった。
> 検出されたら `npx tsx scripts/backfill-answer-translations.mts --apply` で埋め直せる。
>
> **⚠️ギターの1問目（G20）は特に注意。** guitar テナントでの投稿は初めてなので、
> 本人にマッチするかを必ず確認する。※2026-08-17時点で guitar の回答候補は
> YOYOYO（columbusslx1981・タグ18個）1人だけで、設定は正しいことを確認済み。
>
> **📋 BA選択前の実測値（比較用・選択すると分からなくなるので残す）**
> 下の「📮 投稿フェーズの進捗」にある「BA選択時に `answer_count` が+1か確認する」用。
> 2026-08-17 01:38 JST・本人（columbusslx1981 = YOYOYO）の値。
>
> | 項目 | BA選択前 | 選択後の期待値 |
> |---|---|---|
> | `tenant_profiles.answer_count`（dtm） | **1** | **1のまま**（2なら二重カウント＝バグ） |
> | `answered_tags`（dtm） | `[]` | 質問のタグが入る（No.27の実績蓄積） |
> | `answer_count`（guitar） | 0 | — |
> | M01 の status | `open` | `solved` |
> | M13 の status | `ai_answered` | （BAを選ぶなら `solved`） |
>
> 以下は2026-08-08時点の記述で、テナント作成の経緯として残してあります。
> 必要な情報は全部 **「🎸 2026-08-08 GUITAR & PEDALS テナント作成の準備」の節**にあります（案・分担・手順7段階・触るファイル一覧）。**まずそこを読んでください。**
> 最初にやること＝**mtさんにスキルタグ15件を確定してもらう**。そこから始まります。
>
> **2026-08-08に完了済み（もうやらなくてよい）**: 旧seed全削除（質問176・回答128）／テストアカウント13個をマッチング対象から除外／テナント独立性の是正（ログアウト範囲・ログイン時の住人登録・通知メールの差出人名）／Googleログインのアカウント選択／BUG DEBUG休眠化／ソフト404解消／**人間回答がINSERTできない重大バグの修正（SQL適用済み）**／テナントビルダーv6。
> **未pushの変更なし・本番と一致。DBは質問0件/回答0件/候補0件のクリーンな状態。**

---

### 🔧 2026-08-17 投稿フェーズ初日に出た重大バグ2件＋検知の穴を修正（エンジニア）

投稿を始めようとした日に、**ログインできない**・**回答の翻訳が全滅する**という2件が連続して出た。どちらも本番デプロイ済み・実データで検証済み。

#### ① 新規ユーザーが一切ログインできない（migration `20260816000001`・適用済み）

**症状**：奥様のアカウントでGoogleログインしてもマイページに入れず、ヘッダーが「ログイン」のまま。iPhone Safari / Mac Safari / Mac Chrome すべて同じ。既存の `wisdomassemble@gmail.com` だけ入れる。

**原因**：`handle_new_user()` は `security definer` なのに **`search_path` を指定していなかった**。この場合、関数内の名前解決は**呼び出し元セッションの search_path** に従う。

```
postgres（SQL Editor）      : "$user", public, extensions  → 解決できる
supabase_auth_admin（本番） : auth                          → public.profiles を解決できない
```

`auth.users` への INSERT を実行するのは GoTrue の `supabase_auth_admin` で、このロールの search_path は `auth` のみ。そのため `public.profiles` と `public.normalize_language` が見つからずトリガーが失敗し、**`auth.users` への INSERT ごとロールバック**されていた。＝Google認証は通るのにアプリにユーザーが作られない。

**2026-07-09 に `normalize_language()` の呼び出しを足した時点から壊れており、それ以降 新規ユーザーが1人も作られていなかったため今日まで発覚しなかった。**

**⚠️切り分けが極めて難しい種類のバグ**：SQL Editor から `auth.users` に直接 INSERT すると `postgres` で動くので**成功してしまう**。実際この検証で「トリガーは無罪」と判断しかけた。決め手は `pg_roles.rolconfig`（ロールごとの search_path）だった。

**対処**：`set search_path = ''` を明示し、参照を完全修飾（`public.profiles` / `public.normalize_language`）。どのロールから呼ばれても同じ結果になる。Supabase公式の User Management ドキュメントも同じ形を推奨している。

> **🔑 恒久ルール**：`security definer` 関数には**必ず `search_path` を明示し、参照を完全修飾する**。特に `auth.users` のトリガーは `supabase_auth_admin`（search_path=auth）から呼ばれるため、`public` のオブジェクトは修飾しないと必ず見つからない。

#### ② 回答の翻訳が7言語すべて空になる（コミット `53386de`）

**症状**：M01の回答（366字）の `body_i18n` が7言語すべて空。**画面上は成功して見える**（回答は正常に保存・表示される）。

**原因は3つ重なっていた**（実測で1つずつ特定）:

1. **プロンプトの言語リストが `"id": Indonesian` というJSONのキー:値に見える書式**だった。モデルがこれを出力テンプレートと誤解し、`"id": "indonesian": "翻訳文"` という不正JSONを返す。**パース全体が失敗し7言語すべてが失われる**
2. **`response_format` が `json_object` のみ**。壊れないときも**翻訳が要約され**、原文の半分の分量になっていた（7言語合計1943字。正常は3781字）
3. **7言語をまとめて要求すると、モデルが最初の1〜2言語だけ出してJSONを閉じる**ことがある。トークン切れではない（`completion=431` でも発生）

**質問側が無事だったのは本文が短かったからで、たまたま。** 67問の回答はすべて300〜450字なので、気づかず進めていたら**全部壊れていた**。

**対処**（すべて `src/lib/translate.ts`）:
- 言語リストを `id (Indonesian)` 形式に変更（JSONに見えなくする）
- Gemini に **`json_schema`** を渡して出力構造を強制（Groqフォールバック側は8bが非対応なので `json_object` のまま）
- **欠けた言語だけ再要求する補完**を追加（`translateQuestionToLocales` に元からあった仕組みを移植）
- **原文の1/4未満の訳は欠損とみなして不採用**（トークン切れで2文字だけ入る症状を弾く）
- 全滅時も**取れた言語だけは保存**（従来は1つ壊れると全捨て）
- API呼び出しに**タイムアウト**を追加（実測35秒かかり予算18秒を超えていた）
- **Groqへ渡す `max_tokens` を4096で頭打ち**（TPM枠を食い潰して次の質問が429になるのを防ぐ。7/26の教訓を壊さないため）

検証：実際に投稿された回答本文で**4回連続 7/7 成功・8〜10秒**（予算内）。

#### ③ 検証スクリプトが人間回答の翻訳を見ていなかった（コミット `e155474`・**今回の本題**）

`verify-latest-post.mjs` は **AI回答（`is_ai=true`）の翻訳しか見ておらず**、人間の回答は件数を数えるだけだった。だから②が起きているのに **「✅ すべてOK」と表示**していた。

- 人間回答ごとに翻訳の言語数を確認
- **原文の1/4未満を「短すぎ」として欠損扱い**
- どちらも判定に反映

**チェックが本当に効くか、わざと壊して確認した**（`en` を削除・`ko` を2文字にして実行 → 両方検出し判定が❌ → データは復元）。今回の失敗が「チェックしているつもりで見ていなかった」ことだったため、信じずに確かめた。

> **🔑 今回いちばん重要な総括（プランナーも同意）**
> 翻訳の無音失敗は **7/26 と 8/17 の2回起きたが、原因は別**（7/26=GroqのTPM超過で429、8/17=Geminiが壊れたJSONを返す）。
> **共通していたのは「同じ場所（`translateToLocales` の catch）で、違う理由で、無音で失敗した」という構造**。
> 7/26の修正は「429という原因」を潰したが、**その場所が無音であること自体は直していなかった**。だから別の原因で再発したときも気づけなかった。
> **原因を1つずつ潰すのではなく、検出を直すのが正しい打ち手**。3回目が別の原因で来ても、今度は検出できる。

#### ④ 投稿フェーズのマッチング設定（実データで是正）

⛔⛔**【2026-08-29 撤回】この節に書いてあった「奥様を `is_available=false` に戻すSQL」はもう流さない。**

⭐**奥様(MeloSt)が回答候補であるのが正常な動き**（mtさん明言・**2026-08-25／08-29 の2回**）。質問も回答も二人で一緒に考えたもので、2つのアカウントは実在する2人。**どちらが答えても自作自演にならない。**

⚠️**この節の記述こそが、プランナーが同じ誤指摘を3回繰り返した発生源だった。** 「奥様が候補に戻っている＝異常、SQLで戻す」と読めてしまうため、**SQL本体ごと削除した**。
- ⛔`tenant_profiles` の `is_available` を「監視して戻す」運用はしない。締め手順にも入れない
- ⭐本人が投稿した問がブレて人間ルートに落ち、奥様にマッチしても**詰まない**。奥様が答えればいい
- ⚠️管理アカウント(`wisdomassemble@gmail.com`)を候補から外すのは別の話（管理用なので妥当）。**奥様と一緒くたにしないこと**

#### 🚧 実ユーザーを迎える前に片付ける項目（この2件はセットで扱う）

**(a) 新アカウントは既定で回答候補になる**
`tenant_profiles.is_available` の既定は `true` で、8/8に追加した `ensureTenantMembership`（ログインするとその テナントの住人として行を作る）で新規作成される。**一般ユーザーは回答者候補であってほしい**ので仕組みとして正しい。⭐**奥様も候補のままでよい**（2026-08-29 撤回のとおり）。実ユーザーが来る段階で、稼働トグルの復活か既定を false にするかの判断が要るのは別の論点。

**(b) 質問者への通知メールが存在しない**（プランナー指摘・`35bce40` に記録済み）
`notifyMatchedUser` は**マッチング時にしか送らない**ため、回答が投稿されても質問者には何も届かない（8/17に実データで確認。奥様に通知が飛ばなかった）。質問者は自分でサイトを見に来ないと回答に気づけず、実ユーザーが来ると「質問しっぱなしで放置される」原因になる。必要なのは **①回答が届いたとき ②ベストアンサーに選ばれたとき** の2種類。
- **今実装してもテストできない**（質問者=奥様・回答者=本人の1組しかなく、B4で確認済みのBrevo到達性を再確認するだけになる）
- **次のテナント作成時に実データで検証するのが有効**。別テナントへ正しく飛ぶか、差出人名がテナント名になっているか（8/8に修正した箇所）まで確認できる
- **順序：AdSense承認 → 実装 → 次のテナント作成時に動作確認 → 実ユーザーを迎える**

#### 📌 投稿完了後に対応する項目

**質問タグが翻訳されない**（8/17にmtさんが発見・バグではない）。質問のタグはAIが投稿の元言語で生成し、`title_i18n`/`body_i18n` に相当する **`tags_i18n` が存在しない**。「得意なこと」の `skillTags` は固定リストなので `messages/*.json` で翻訳できているが、質問タグはAIの自由生成なので同じ手が使えない。影響は「英語ページに日本語タグが3つ出る／タグ検索のリンクも日本語」でコンテンツ自体は無傷。**67問の投稿完了後に対応**（投稿中にデプロイを重ねるとビルドのクジを引く回数が増えるため）。対応順は `tags_i18n` 追加 → 翻訳処理に相乗り → 表示側修正 → 既存分をバックフィル。

#### 🧰 このセッションで追加したスクリプト

| スクリプト | 用途 |
|---|---|
| `scripts/backfill-answer-translations.mts` | 翻訳が欠けた回答を埋め直す。既定はdry run、`--apply` で書き込み |
| `scripts/repro-answer-translate.mts` | 実際の回答本文で翻訳を試し、言語数・文字数・所要時間を見る（再発時の切り分け用） |
>
> 以下は2026-07-30時点の記述で、投稿フェーズ用の情報として残してあります。

### 🚩（参考）2026-07-30 時点の入口

**いまどこ（2026-08-04）**: **👤45問の回答執筆が全問完了**（未記入ゼロ）。67問すべてNotion「投稿用 質問リスト」に揃い、各見出しに最終ステータスも記載済み。1102は調査終了（0/160）。**次は投稿フェーズの前工程＝旧seed削除・BUG休眠化・ギターテナント作成**。

**⭐️全67問の採点＆FB（2026-08-04・プランナー／Notion末尾「📊 全67問 採点＆FB」に全問分を記載）**: 👤本人回答45問=平均84点／🤖AI22問=平均77点／全体=82点。**AdSense審査向けの総合88点・SEO向け78点**。高得点はM12(95・合計ぴったり10万円の構成)／G23(95・QCのプリセットをminiに移植するとボリュームが変わるバグ)／G27(93・本物とベリンガーの音量比較)／G04・G12・G31(92)。**共通点は「具体的な数字・型番・価格・年代」が入っていること＝コピーできない情報**。最低点はG13(68・内容は正しいが自分の足がかりがない)。SEOが78点なのは**タイトルが口語のままで検索クエリと完全一致しない**ため（ただしAI感を避けるための意図的な選択。微調整は承認後にGSCの実データを見てから）。**字数は十分**（1ページ250〜450字）＝水増し不要。
- **⚠️投稿前に直す誤字4件**: M33「エッセンシャル」→**Elements**（iZotope Ozoneの下位版の正式名／★アフィリ枠なので検索と購買導線の両方で損）、G02「クアッドコア/デュアルコア」→**クアッド/デュアル**（コアはCPUの用語。オペアンプは回路数。初期RC3403ADB→後期RC4558という年代差の記述自体は正しい）、G31「コンダンサー」→**コンデンサー**、M22「他ダム」→**他タム**。**型番・製品名は検索キーワードそのものなので、口調の揺れとは別物として直す**。

**⭐️テナント名 確定（2026-08-04）**: 3本目のテナントは **表示名`GUITAR & PEDALS` / サブドメイン`guitar.`**。理由＝①MUSIC PRODUCTIONが英語なので揃う ②**「エフェクター」は和製英語で英語圏の検索語は`pedals`**（ショート動画は海外市場の方が桁違いに大きいので効く）③`&`はサブドメインに使えないので短縮が必要（music-prod.と同じルール）。

**▶ 確定した実行順序（2026-08-04）**
1. **旧seed削除**（偽ペルソナ50問＋重複32件・SQLのみ）— エンジニア
2. **BUG休眠化** — エンジニア
3. **GUITAR & PEDALSテナント作成** — エンジニア＋mtさん（テナントビルダーを実際に使いながら）
4. **投稿タイムスケジュール＋貼るだけパケット作成** — プランナー
5. **投稿（約3週間）** — mtさん・妻。※**「2週間」は楽観的**: 音楽36問÷2件/日=18日、ギター31問=16日（並行）、最後の質問の回答＋BA選択で+3〜5日＝**約3週間**。1日3件まで可だが「毎日同数NG・時間帯をばらす」ため平均2件で見る。**並行してSNSアカウント7系統だけ先に作る**（作りたてよりアカウント年齢がある方が有利）
6. **宣伝4つ** — プランナーが手順、mtさんが実行
7. **AdSense申請** — mtさん（プランナーが事前チェック）
- **⚠️削除から申請まで1.5〜2ヶ月を見込む**。削除直後の申請は「旧URL約80件が404で残り、新問は未インデックス」＝サイトが壊れて見える最悪の状態。

**📣 宣伝パートの確認（2026-08-04・ユーザーの認識との差分を訂正）**
- **動画は7媒体に全部出す**（確定どおり）: TikTok / Instagram Reels / Facebook Reels / **YouTube Shorts（Google検索に出る＝SEO直結・必須）** / X / Threads / **Pinterest（ストック型で半永久的に検索される）**。作るのは**映像1本**、字幕だけ差し替えて日英2本書き出し、1日ずらして同じアカウントに上げる。**アカウントは分けない（7系統のまま）**。
- **アカウント7系統**: Google(YouTube) / Meta(IG+FB+Threads) / TikTok / X / Pinterest / note / dev.to
- **⚠️訂正①「noteの英語版」ではなく`dev.to`**。記事は**note（日本語・実体験寄り）＋dev.to（英語・build-in-public）の2本だけ**で、**直訳の使い回しはしない**（読者が違う＋重複コンテンツ回避）。**記事は動画と違って横展開が効かない**（Googleが1つしか評価しない）＝だから動画7媒体・記事2本。
- **⚠️訂正②宣伝は投稿と並行ではなく「投稿完了後」**（中身が無い状態で宣伝しても離脱するだけ）。**ただしアカウント作成だけは先行してよい**。
- **⚠️訂正③4つのうち「GSCで新しい質問ページのインデックス登録をリクエスト」が一番効く**（審査時に中身が検索に載っている状態にする）。ユーザーの認識から抜けていたので次セッションで必ず手順を出す。

**🎭 ステルスブランディング（各テナントを独立したブランドに見せる方針）との関係＝問題なし（2026-08-04）**
- SNSアカウントは7系統を1セットで運用し、プロフィールのリンクはルートポータルに置く＝「同じ運営者」が分かる形になるが、**これで問題ない**。各テナントのフッターに元々運営者情報が出ているので隠していないし、1社が複数媒体を持つのと同じ構造。**むしろ隠す方向に倒すとリスクが出る**ので、独立して見せるのは"ブランドの独立"までにとどめ、運営者は隠さない。
- **SNS→サイトの動線**: プロフィールのリンクは**ルートポータル(wisdomassemble.com)に置いて各テナントへ分岐**。個別テナントへ送りたい動画は**キャプション/説明欄に直URL**（YouTubeは説明欄自由・TikTokはプロフィール以外の外部リンクに制約あり）。**リンク先の言語は動画の言語と揃える**（英語版→/en、日本語版→/ja）。※フォロワー獲得が目的ではなく「**動画がアルゴリズムに配られてサイトに数人流れればいい**」＝映像を流すだけのアカウントで十分（2026-08-04 ユーザー判断）。

**🎬 動画の作り方（2026-08-04 確定）**
- **⚠️申請前に作るのは1本だけ**（音楽 or ギターのどちらか）。目的は**型が機能するかのテスト**で、反応を見てから量産する。1本＝素材1本→字幕差し替えで日英2本→7媒体＝**14投稿**。**いきなり2テナント分（4本・28投稿）作らない**。あるある系はネタの当たり外れが大きいので、1本で型を確かめてから。
- **長さは15〜25秒**。完全視聴率がアルゴリズムの最重要指標なので短い方が有利。あるある系なら**3〜5個を各3〜5秒**で並べる構成が作りやすい。30秒を超えると離脱が増える。**上限（Shorts 60秒）いっぱいを使う必要はない**。
- 音楽・ギターは「音」と「機材の絵」が主役＝**セリフなし＋字幕**で成立する。だから字幕差し替えだけで日英2本が作れる。
- **note/dev.toの記事の雛形は「投稿完了後」に作る**。骨になるのが実際の数字（67問投稿した／AIが33%答えて67%は本人が書いた／AIが自信ありでも間違えた実例＝G06のジャガー配線／1102に1週間ハマった等）で、**投稿を終えないと確定しない**ため。**この手の記事は具体的な数字と失敗談で読まれる**（「作りました！」だけの記事は読まれない）。noteは「非エンジニアが作った」という人の話、dev.toは「AIとどう作ったか」という技術プロセスの話＝**切り口が違うので直訳の使い回しはしない**。

**⭐️ 投稿ステータスの配分を決定（2026-07-30・プランナー）**: 申請時点の目標は **🤖AI公開22問(33%) ／ ✅BA選択31問(46%) ／ 📝回答のみ8問(12%) ／ 🔥高難度6問(9%)** ＝67問。**回答が読めるページ90%・回答ゼロ10%**。**ユーザーが書くのは39問**（✅31＋📝8）で、🤖22問と🔥6問は執筆不要。全問の割り当ては**Notion「投稿用 質問リスト」末尾の「📋 投稿ステータス一覧」に1問1行で記載済み**（このMDより現物が正）。
- **🔥高難度は6問に絞った**（当初は45問中10〜14問の予定）。理由＝AdSenseの最頻出不承認理由が *Low value content* で、**回答ゼロのページが2割あると直撃する**。6問はユーザー既決の候補（M05・M29・M32／G14・G16・G17）そのまま。0にしないのは`/hard`タブが空だとサイトの機能が見えないため＝「機能として見せる最小限」。
- **📝回答のみ（ベストアンサーを選ばない）を8問入れた**（M07・M20・M26・M28-2／G05・G11・G19・G23）。実際のQ&Aサイトでは質問者が回答をもらっても選ばず放置するのが普通で、全問solvedだと整いすぎて不自然。**回答は読めるのでコンテンツ価値は落ちない**＝自然さを取れる場所。
- **⬜完全な未解決(open)は0問**。**仕様上そもそも維持できない**＝`auto_escalate_expired()`が15分ごとに走り「担当者が期限切れまで未回答」の質問を自動でhard化する。**「答えずに放置」＝自動的に🔥高難度になる**（回答が付いていれば対象外なので📝はopenのまま残る）。
- **未解決2〜3割を残す方針は「承認後」に回す**。あれは「本物のQ&Aサイトに見せる」ための設計で、**必要になるのは実ユーザーが来てから**。審査の時点では逆に不利に働く。承認後は答えられない質問が自然に来るので意図的に作る必要もなくなる。**時期で目的が違うだけで、両方立つ**。
- **★アフィリ枠は全部✅BA選択**（収益の入口なので高難度・未解決に流さない）。⚠️**Notionの「👤 人間ルートになる45問」の★リストは12問と書かれているが実際は14問** — **M04とM33が漏れている**（見出しには★が付いている）。この2問も自分で回答する。

**🎯 AdSense審査の見立てと懸念の順位（2026-07-30・プランナー）**: 「通る条件はかなり良い」と言える（①テナント単位で30問超え＝目安の承認率6〜7割を上回る量 ②実機を持つ人しか書けない一次情報 ③人間回答67%でAI主体判定を受けにくい ④YMYL回避 ⑤形式要件が揃っている）。ただし**1回目で通る保証はない**＝再申請は回数無制限・ペナルティなしなので「通るまで出す」方針で問題ない。**懸念の順位は次のとおりで、上位3つは再申請を重ねても直らない（コンテンツ構造の問題）ので申請前に潰す**:
1. **旧seedのニセ物・重複が残っていること（最大）** — 偽ペルソナでAIが書いた50問＋重複32件。**レビュアーが見るのはそれ**。しかもMUSIC PRODUCTIONの旧seed25問は**新36問と同じテナントに混在する**＝本物の価値が薄まりE-E-A-T的にマイナス。GSCも重複11件を既に検出済み。
2. **BUGの空テナントがindexされていること（大）** — 空/薄いテナントがindexされていること自体が *Low value* の材料。
3. **未解決の比率（大）** — 上記の配分で10%に抑える。
4. **削除直後に申請すること（中〜大・タイミングで完全に回避できる）** — その瞬間のGoogleのindexは「旧URLが404で大量に残り、新問は未index」＝サイトが壊れて見える。**削除から申請まで1.5〜2ヶ月を見込む**（旧URL約80件の404自体は許容範囲）。
5. **3%の5xx（小〜中）** — レビュアーが踏む確率とクロール頻度。**審査より「Googlebotが5xxを踏むとクロール頻度が落ちる＝SEOに効く」方が長期的に痛い**（SEOが本命で宣伝は着火剤という戦略なので）。B①をやる動機は審査よりこちら側にある。

**🧪 プランナー側の技術レビューの記録（2026-07-30・当たったものと外したもの）**
- **当たり: アイコン/OGPの静的ファイル化を提案** → エンジニアが実測で検証し「私の評価は間違っていた（キャッシュヘッダーはブラウザにしか効かず、新規訪問者は毎回Worker起動）」と訂正。Median CPU 141→44msの主因になった。
- **当たり: HTMLキャッシュのデータ混在リスクを警告** → コードを読んだ結果`computeCacheKey`が**ハッシュするのはパスだけでホスト名が入らない**＝ISR方式だと3テナントが`/ja`でキャッシュを共有し**BUGのHTMLがMUSICに出る**ことが確定し、ISRは却下。匿名限定キャッシュへ設計変更。
- **当たり: C（Cache APIでWorkerをラップするHTMLエッジキャッシュ）を却下する判断** — 事故れば他人のログイン状態のHTMLが漏れる。**失うもの（信頼）と月$5が釣り合わない**。`computeCacheKey`の罠を見つけた直後に、同じ種類の罠を自作コードで踏まない賭けはしない。
- **当たり: POST(投稿)が未検証であることの指摘** → `scripts/verify-latest-post.mjs`が作られた。
- **外した: コールドスタート仮説** — 「暖まった状態の測定に偏っている」と指摘したが、既存ログの失敗位置が1,3,5,8,19,23,29,30回目とバラバラで**5分連続後の30回目でも落ちていた**＝暖機と無関係。**新しく測る前に既存ログを見れば分かった**。
- **決着: Gemini移行が1102の原因という仮説（ユーザー提案）は機序が合わない** — Geminiを呼ぶのは投稿時だけで閲覧では呼ばれず、Workers の CPU time は外部API待ちを含まない。**Groqに戻す方向には進めないこと**（7/22の移行は品質理由で、Groq 8bには韓国語で「op-ampの音」→「騒音」等の実害ある誤訳の実例がある＝8言語コンテンツの品質が落ちる）。

**セッション開始時に必ず開くもの**: [Notion「投稿用 質問リスト」](https://app.notion.com/p/Wisdom-Assemble-2026-07-22-3a6f5fa8bcb981439bb5cb2a7050c137) ＝67問の質問文・診断結果・AI回答・本人回答がすべてここに集約されている（このMDより現物が正）。

**質問リストの読み方**: 各見出しが `### G29 ｜👤90 ★｜ タイトル` の形式。🤖95=AIが公開で回答する（22問・**AI回答も貼付済み＝執筆不要**）／👤90・85・70=人間ルート（45問・**ここをユーザーが書く**）。数字はAIの自信度スコア。★=アフィリ導線。

**診断の確定値（2026-07-27・本番同一コードで実測）**: 67問中 🤖22問(33%)／👤45問(67%)。スコア分布 95=22 / 90=29 / 85=15 / 70=1。**AI公開22問はClaudeが全問レビューし明確な誤りゼロ**（Groqが誤答していたG06ジャガー配線も正しく解説できていた）。軽微な誤字のみ: G03「入試困難→入手困難」、G26「XIR→XLR」。

**ユーザーが決めた高難度の基準**: 「AIも自信なし(85点以下)＋本人も即答できない」の重なりを🔥高難度に回す。候補=M05(70点/USBケーブル論争)・G14(Starmaster最新)・G16(Organic Sounds超ニッチ)・G17(79年ストラト個体判定)・M29/M32(最新機能)。適正量は45問中10〜14問（手順書の「2〜3割は未解決で残す」）。**★アフィリ枠は極力自分で答える**（サイトの価値と収益の入口なので高難度に流さない）。

**回答執筆が終わったら、Claudeがやること（この順・担当つき）**:
1. 【エンジニア】**人間回答を入れた質問の再診断**（`npx tsx scripts/calibrate-threshold.mts scripts/calibration.{music,guitar}.json`。環境変数は不要）
2. 【エンジニア】**ギターテナント作成**（テナントビルダーで設定→コード反映→GENRE_CONFIG追加。閾値はDEFAULT_THRESHOLD=91が自動適用）
3. 【エンジニア】**BUGをルートから外して休眠化**（`PortalHome.tsx`の`REVIEW_TENANT_IDS`から`bug`を削除）
4. 【プランナー】**投稿スケジュール＋貼るだけパケット作成**（何日にどの質問をどのアカウントで投稿/回答/ベストアンサー選択するか）
5. 【プランナー】その後 AdSense申請前のトラフィック作り4つ（上記「⭐AdSense申請「前」のトラフィック作り」参照）

**⚠️ この2つは絶対に忘れないこと（何度も指摘された）**:
- **質問文・回答本文をClaudeが書き上げない**。ユーザーが本物で書く。Claudeはネタ出し・SEOタイトル・翻訳・骨子の手伝いだけ。
- **タイトルは短い見出しにする**。本文を丸ごと要約したタイトル／勝手な略語(IF等)／本文と違う表記(小文字を大文字に直す等)は**すべてAIっぽさの元凶**で、ユーザーが手作業で直す羽目になった。**表記はユーザーの本文に合わせる**（打ちやすさで大文字小文字が決まる。Logic=大文字、Ableton Live/Antelope Zen Quadro/Genelec G Threeはぶらしてよい、長い型番は小文字、カタカナはカタカナのまま）。

### ✅ AdSense申請前にやること全部（2026-08-05 確定・これが唯一のチェックリスト）

**前提の整理**: **AdSense審査にトラフィック（訪問者数）の要件はない**＝アクセスゼロでも承認される。**ただし「インデックス」は別物で、こちらは必要**。67問投稿してもGoogleが1問もクロールしていなければ、Googleから見た中身は空に近い。最頻出の不承認理由が *Low value content* なので、**訪問者を呼ぶのではなく「Googleに読ませる」ことが目的**。

**【A. コンテンツ】**
- [x] **A1. 旧シード削除** — **2026-08-08 完了**。実測は質問176件・回答128件で、記載の「50問＋32件」より多かった（本物67問が未投稿のため事実上すべてが旧seed）。あわせてテストアカウント12個＋管理アカウントを全テナントで `is_available=false` にしてマッチング対象から除外
- [x] **A2. BUG休眠化** — **2026-08-08 完了**。`DORMANT_TENANT_IDS` を新設し noindex,follow ＋ sitemap除外 ＋ ポータル非掲載。サブドメイン・DBは残存（復活可能）。⚠️**robots.txt でのブロックはしない**（noindexを無効化するため。一度入れて撤回した経緯は下記2026-08-08の節）
- [x] **A3. GUITAR & PEDALSテナント作成** — **2026-08-15 完了**（guitar.wisdomassemble.com・8言語表示確認済み）。旧記載:（表示名`GUITAR & PEDALS`／サブドメイン`guitar.`）— エンジニア＋mtさん
  - ⭐**使うのは新版のテナントビルダー**: https://claude.ai/code/artifact/cad8ed82-9f1f-4131-b389-5be73c9ada22 （**ファビコン32x32とOGP1200x630のPNG自動生成つき**＝下のB2がこれで解決する）
  - ⚠️**旧版を開かないこと**: https://claude.ai/code/artifact/fa1da2f5-d0dc-42fb-b225-55b64d031206 （2026-07-17版・**画像生成がないのでB2が漏れる**）
- [x] ~~**A4. 誤字4件の修正**（投稿前）: M33「エッセンシャル」→**Elements**／G02「クアッドコア・デュアルコア」→**クアッド・デュアル**／G31「コンダンサー」→**コンデンサー**／M22「他ダム」→**他タム**~~ ✅**2026-08-25 mtさんが修正済み**。⚠️プランナー側の検証は「本番DBの投稿済み27問に該当4語が1つも無い」ところまで（該当4問はまだ未投稿なので当然）。元テキストのNotionページは特定できていないため未確認。**投稿テキストは毎回プランナーが書くので、該当日に正しい表記で出せば二重に担保される**
- [ ] **A5. 67問の投稿完了**（音楽36＋ギター31・約3週間）— mtさん・妻。配分は🤖22／✅BA選択31／📝回答のみ8／🔥高難度6＝**回答ゼロは6問(9%)に抑える**
- [x] ~~**A6. 投稿1問目で通しの確認**~~ ✅**2026-08-17 Day 1（M01）で通過済み**。アプリ経由で「投稿→マッチング→通知メール到達→本人が回答→称号の自動付与」まで一気通貫で動いた。⚠️チェックが付いていなかっただけで、実態はとっくに完了していた（2026-08-25の監査で発見）
  - ① `node scripts/verify-latest-post.mjs <tenant> 1` — AI回答と8言語の`title_i18n`/`body_i18n`が入ったか。**欠落があれば投稿を止めて原因を追う**
  - ② **質問詳細ページをブラウザで目視** — 200で表示されるか／本文・改行・パンくず・回答が崩れていないか。**`loading.tsx` を削除した影響が出るのはこのページ**なので1問目は必ず見る
  - ③ **アプリ経由で1問通す**（妻が質問→本人にマッチ→本人が回答→ベストアンサー選択→solved）。⚠️**2026-08-08の検証は`service_role`で直接INSERTしたもの**で、**アプリのAPIを通した投稿はまだ一度も成功していない**。トリガー修正が実運用でも効くかはここで初めて分かる
  - ④ ③の過程で **B4（Brevoメール通知の本番到達）も自動的に検証できる**（マッチ時に本人へ届くか・迷惑メール判定されないか）
  - ⑤ **称号が付いたかの確認は SQL Editor で行う**。`service_role`は`user_titles`を読めず**エラーではなく`null`が返る**ので、アプリやスクリプトから見ると「0件」に誤読する（2026-08-08に実際に誤読した）

**【B. 技術・コード】※すべてpushを伴うので申請より前に済ませる（審査中はpush保留の方針）**
- [x] **B1. Googleログインのみ化** — **2026-08-15 完了**。Supabase側でEmailプロバイダを無効化し、ログイン画面からメール/パスワードのUIを削除。`/auth/signup`はログインへリダイレクト。全テナント＋ルートで`type="password"`が0箇所になったことを本番で確認。認証テーブル・アカウントのデータは消していない。⚠️**UIを消すだけでは塞がらない**（Supabaseの認証エンドポイントは外部から直接叩ける）ので、プロバイダの無効化が本体だった
- [x] **B6. 質問詳細のソフト404を直す** — **2026-08-08 完了**。`loading.tsx` を削除。折衷案（回答一覧だけSuspense）と generateMetadata案は実測で不採用
- [x] **B2. 新テナントの画像** — **2026-08-15 完了**。`public/icons/guitar.png`(32x32)・`public/og/guitar.png`(1200x630)を配置し本番で200を確認。テナントビルダーが2枚とも書き出せるので、往復デプロイは不要になった
- [ ] **B3. Google OAuthアプリの本番公開**（現在「テスト中」＝テストユーザーのみ・上限100）。**seed段階（本人＋妻）は不要、実ユーザー公開の直前に必須**。ログイン用の基本スコープのみなら審査不要で即公開可
- [x] ~~**B4. Brevoメール通知の本番到達確認**~~ ✅**2026-08-17 Day 1（M01）で検証済み**。設計どおり「👤ルート1問目で自動的に検証できる」が実際に効いて、**奥様→本人のマッチで通知メールが受信箱に到達**した（迷惑メール判定もなし）。⚠️こちらもチェック漏れ（2026-08-25の監査で発見）。⛔**ただし『質問者への回答通知』は別件で未実装**（C①）――マッチング時にしか送らないので、回答が付いても質問者には何も届かない
- [x] **B5. About/運営者情報** — **2026-08-15 完了**。Aboutページはサービス説明のみで運営者の記載が無く（記載はプライバシーポリシーの奥だけ）、レビュアーが最初に見る場所に無い状態だった。末尾に「本サービスは個人が運営しています。」を追加し8言語すべてに反映
- [ ] **B7. 不適切コンテンツ対策**（2026-08-15追加・**AdSense申請前ではなく実ユーザー公開の直前**）— `contentFilter.ts` が見ているのは**連絡先とスパム勧誘の2種類だけ**で、**性的・暴力的・差別的・政治的な内容を判定するコードは1行も無い**（実コードで確認済み）。seed期は投稿者が本人＋妻の2人だけなのでリスクはゼロだが、実ユーザーが来ると効いてくる（AdSenseはアダルト・ヘイト系のページへの広告配信を禁止）。
  - **現状の部分的な防御**：質問はAIのジャンル判定で無関係なら422で弾かれる（[route.ts:130](src/app/api/questions/route.ts:130)）。ただし**3つ穴がある** ①AIが使えないとき（レート制限・障害）は `routeToHuman(0)` へ直行しジャンル判定が走らない ②ジャンル内の質問に不適切な表現が混じっていても通る ③**回答は一切チェックされない**（`checkContent` は連絡先とスパムのみ）
  - **NGワードリストは主軸にしない**。8言語ぶんの書き分けが無限にあり、しかも「Linearカーブ」がLINE IDと誤検知された件と同型の誤ブロック事故が確実に起きる
  - **筋のいい案**：質問のAI応答は既にJSON（`inScope`/`score`/`answer`/`tags`）を返しているので、**そこに安全性フラグを1つ足すだけならAPI呼び出しは増えず追加コストゼロ**。回答側はAIを通していないので、**通報ボタン＋既存のBAN**で運用する方が現実的
  - **通報ボタンは必須ではない**（ユーザー判断・2026-08-15）。「基本は善意を信じて放置」という方針で来ており、実ユーザーが増えてから必要性を見て判断する

**【C. GSC】※申請の可否を判断する材料はここ**
- [x] ~~**C1'. サブドメインのsitemapをGSCに送信**~~ ✅**2026-08-27 完了。** ⚠️**それまでルートの1本しか登録されていなかった。** ただし**「知らせていなかったのが原因」は誤り**（2026-08-27訂正）。robots.txtが各ホストのsitemapを宣言済みなので発見経路はあった。⚠️さらに **「150件は本物の詰まり」も誤りだった**（同日サンプル30件で確認、新問は0件・全部bugテナントと削除済み旧シード）。**そもそも詰まってはいなかった**＝レポートの最終更新日が8/21で、投稿ラッシュ以前の世界を見ていただけ。送信当日に読み込まれ guitar 46 / music-prod 44 ページを検出。⛔**GSCはドメインプロパティでもsitemapはホストごとに送る必要がある**
- [ ] **C1. sitemap.xml の再送信**（新しい67問が入っているか）。**基本はこれ**＝自動的にクロールされる
- [x] ~~**C2'. BUGテナントをGSCの非表示ツールで隠す**~~ ✅**2026-08-27 完了。** `非表示 → 新しいリクエスト → URLを一時的に非表示 → 「このプレフィックスで始まるURLをすべて非表示」→ https://bug.wisdomassemble.com/`。⭐**約6ヶ月ブロック＋1日以内に反映**。⚠️確認ダイアログが「サイト全体を削除しますか？」と赤く出るが、対象はURL欄の `bug.` だけで本体は影響を受けない（「いつでも元に戻せます」とも書いてある）。⛔**プレフィックスを間違えて `wisdomassemble.com/` にすると本体が全部消えるので、押す前にURLを必ず読み直すこと**
  - **なぜ有効か**：BUGは休眠テナントで**そもそもindexされたくない**ので隠して失うものがない。⭐すでにnoindexが入っている（実機で `<meta name="robots" content="noindex, follow">` を確認）ので、**隠れている6ヶ月の間にGoogleがnoindexを読んで恒久的に消える**。⛔robots.txtでブロックしていないのも正解で、ブロックするとnoindexが読めない
  - **これで「上位3つの懸念」の②「BUGの空テナントがindexされている」が片付いた**
- [x] ~~**C2. sitemapに404のURLが残っていないか**確認~~ ✅**2026-08-27 完了。sitemapの100URL（root 10／music-prod 44／guitar 46）すべて200**。404は1本も混ざっていない。⭐sitemapはDBから動的生成しているので、削除した質問は自動で落ちる＝**旧シード削除の404がsitemapに残る心配は構造的に無い**（当初の懸念は杞憂だった）。再確認コマンド:
  ```bash
  for h in wisdomassemble.com music-prod.wisdomassemble.com guitar.wisdomassemble.com; do curl -s "https://$h/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' | while read u; do c=$(curl -s -o /dev/null -w '%{http_code}' "$u"); [ "$c" != "200" ] && echo "$c $u"; done; done
  ```
- [ ] **C3. ページレポート（旧カバレッジ）で新67問がインデックスされているか**を確認。**増えていくのを待ってから申請する**
- [ ] **C4. 5xxがゼロになっているか**確認（前回8件。1102対策後の実データ確認になる）
- [ ] **C5. 重要ページだけ個別にインデックス登録リクエスト**（★アフィリ枠や検索需要が高いもの）。⚠️**URL検査ツールから1本ずつで1日の上限がある**（非公開だが10〜20件程度）。67問×en/ja＝134URLなので**全部は物理的に無理**＝あくまでC1の補助

**【D. 宣伝（申請前のトラフィック作り4つ）】※目的は①動画の型のテスト ②Googleにサイトを認知させる、の2つだけ**
- [ ] **D1. SNSアカウント7系統を作る**（Google(YouTube)/Meta(IG+FB+Threads)/TikTok/X/Pinterest/note/dev.to）。**これだけ投稿と並行してよい**＝作りたてよりアカウント年齢がある方が有利
- [ ] **D2. あるあるショート1本→7媒体**（素材1本→字幕差し替えで日英2本→14投稿・15〜25秒）。**いきなり2テナント分は作らない**
- [ ] **D3. note記事1本**（例「非エンジニアがAIとQ&Aサイトを作った話」＝被リンク1本）
- [ ] **D4. GSCのインデックス登録**（＝上記C1〜C5）
- **やらないこと**: Reddit / Show HN / Product Hunt は**本命の弾として温存**。アフィリンクは承認後まで貼らない。大量投稿もしない

**【E. タイミング】**
- [ ] **E0b. 【E0と同じ窓・ついでに直す／低優先】hreflangが8言語のまま絞られていない**（2026-08-27 実機で発見）。`sitemap` と `robots meta` は `INDEXABLE_LOCALES`（en/ja）で絞ったのに、**hreflangだけ8言語ぶん出ている**（`src/app/[locale]/questions/[slug]/page.tsx` の `availableLocales`）。コード内コメント「（sitemapと同基準）」も**もう同基準ではない**ので併せて直す。⚠️**実害はほぼゼロ**（Googleはnoindexを指すhreflangを無視するだけでペナルティは無い）。⛔単独でpushする価値は無い＝E0のついでに。
- [ ] ⭐⭐**E0. 【必須・投稿完了〜申請の窓でやる】翻訳フォールバックの修正**（2026-08-26 発見）。⛔**この窓を逃すと承認までpushできなくなる**（E2で申請後のpushを禁止しているため）。窓は**9/6の投稿完了〜9/22の申請開始まで**の2週間強。
  - **症状**：人間の回答の `body_i18n` が 0/7 で保存される。3週間で3回（7/26・8/17・8/26）
  - **原因**：`TRANSLATE_BUDGET_MS = 18_000`（`src/lib/translate.ts:71`）を**Gemini/Groqで共有**し、`AbortSignal.timeout(deadline - Date.now())`（111行）で切っている。**Geminiが18秒フルに使ってタイムアウトすると、`callGroqJson` のループ先頭にある `if (Date.now() >= deadline) break` に当たり、Groqが1度も呼ばれない**。⚠️Groqは削除されていない（`order = USE_GEMINI ? (HAS_GROQ ? ['gemini','groq'] : ['gemini']) : ['groq']`）。主プロバイダをGroq→Geminiに変えただけで、Groqは「Gemini障害時の保険」として残っている
  - **修正案A（推奨）**：Geminiのタイムアウトを予算の半分（9秒）で切り、Groqに9秒残す。**投稿時のユーザー待ち時間は増えない**
  - **修正案B**：プロバイダごとに独立した予算（各18秒）。⛔**最悪36秒になり、翻訳は投稿APIのレスポンス前にawaitされるので、ユーザーの待ち時間が倍になる**
  - ⚠️**「Groqが1度も呼ばれていない」はコードからの推定**。ログに `groq` の文字が一度も出ないという状態証拠だけで直接は確認していない。**修正前に実際のログで裏を取ること**
  - ⛔**投稿フェーズ中は直さない**：①実害が小さい（backfillで復旧でき、過去31件のうち壊れているのは当日分だけ＝蓄積しない）②`translate.ts` は質問投稿APIの中核で、ビルドが壊れると**残りの投稿が止まる**（7/28に1102の前例）③発生頻度が3週間で3回
- [ ] **【承認後・実ユーザー前】質問フォームの下書きがアカウント間で混ざる** — `draftKey` に user_id が無い（`QuestionForm.tsx:134`）＋「下書きを破棄」導線が無い。詳細は上の「📝 2026-08-30 質問フォームの下書き…」
- [ ] **【承認後】管理ダッシュボードに検索・テナント絞り込みを実装** — 詳細は上の「🛠 2026-08-29 管理ダッシュボードに検索・テナント絞り込みが無い」。⛔`.limit(200)` が黙って切っている点が本体。⭐実ユーザー対応（B7のBAN等）の前提になる
- [ ] ⭐⭐**【承認後の最優先】AI判断ロジックの信ぴょう性改良** — 詳細は上の「🧠 2026-08-27 AI判断ロジックの信ぴょう性問題」。⭐推奨は案1（2回投げて食い違ったら人間へ）。⚠️閾値91の再較正とセット。⛔承認前には触らない（E2＋gemini.tsは投稿APIの中核）
- [ ] **E1. 削除から申請まで1.5〜2ヶ月を空ける**。**削除直後の申請が最悪**＝「旧URL約80件が404で残り、新問は未インデックス」＝サイトが壊れて見える
  - ⚠️⚠️**実日付（2026-08-25 算出）：旧シード削除が 8/8 なので、申請の窓は【9/22 〜 10/8】。** 投稿完了の目標が **9/6** なので、**投稿が終わってから申請までに2週間強の空きができる**。ここは待ち時間ではなく、**動画1本・note記事・バナー・GSCインデックスを片付けるための枠**。逆に言うと**投稿完了の直後に申請してはいけない**
- [ ] **E2. 申請後は`git push origin main`を保留**（審査中にサイトの動作が変わると不利。2026-07-14に決めたルール）。**B①（翻訳メッセージの絞り込み）は結果が出てから**

**⚠️ 上位3つの懸念は再申請を重ねても直らない（コンテンツ構造の問題）**: ①旧シードのニセ物・重複 ②BUGの空テナントがindexされている ③未解決の比率。**A1・A2・A5で全部片付く**。逆にこの3つを片付ければ、落ちる原因として残るのは「インデックスが浅い」程度＝時間が解決する。**1回目で落ちても再申請は回数無制限・ペナルティなし**なので「通るまで出す」で問題ない。

### 🔁 セッション引き継ぎ（2026-08-06・エンジニアより次のエンジニアへ）

> **🚦 次のセッションの最初にやること（ユーザー指示・2026-08-06）**
> **いきなり作業に着手しないこと。** まず次の2つをユーザーと確認する。
> 1. **AdSense審査までの全体の流れの確認**（下の「エンジニア視点の流れ」＋上の「AdSense申請前にやること全部（A〜E）」を使って説明する）
> 2. **このアカウント（エンジニア）の作業範囲の確認**（下の「このアカウントでやること／やらないこと」）
>
> そのうえで、ユーザーの合図で **①旧seed削除 →②GUITAR & PEDALSテナント作成（テナントビルダーを一緒に触りながら）→③投稿開始** の順に進む。

**🗺 エンジニア視点の流れ（AdSense申請まで）**

| # | やること | 担当 | 目安 | 前提 |
|---|---|---|---|---|
| 1 | **旧seed削除**（SQLのみ・Workerに影響なし） | エンジニアがSQL作成→**mtさんが実行** | 30分 | ⚠️**削除範囲の確認が先**（下記） |
| 2 | **GUITAR & PEDALSテナント作成** | **ビルダーを一緒に触りながら**エンジニアがコード反映 | 2〜3時間 | ユーザーの指示待ち |
| 3 | **BUG休眠化**（`REVIEW_TENANT_IDS`から`bug`削除） | エンジニア | 10分 | pushを伴う |
| 4 | **67問の投稿**（音楽36＋ギター31） | **mtさん・妻**が実サイトから投稿 | **約3週間** | 1問ごとに検証コマンド |
| 5 | **Googleログインのみ化**（メールログインUIを隠す） | エンジニア | 30分 | 投稿完了後〜申請前 |
| 6 | **宣伝4つ**（SNS7系統・動画1本・note1本・GSC登録） | プランナーが手順／mtさんが実行 | — | 投稿完了後 |
| 7 | **AdSense申請** | mtさん | — | 削除から**1.5〜2ヶ月**空ける |

**🧰 このアカウント（エンジニア）でやること／やらないこと**
- **やる**: コード実装・修正／DB・マイグレーション／テナントビルダーの出力をコードへ反映＋使い方のレクチャー／デプロイと本番検証／バグ調査／較正ツール実行（`scripts/calibrate-threshold.mts`）／投稿の技術支援（検証スクリプト・貼るだけパケット等）
- **やらない**: 質問文と人間回答の**代筆**（本人の検閲・清書がポリシー違反回避の本体）／企画・戦略・投稿スケジュール・宣伝・収益化の立案（プランナーの担当）／プランナー側が触るドキュメントの同時編集
- **相互チェックはする**: プランナーの方針に技術的な穴があれば遠慮なく具体的に指摘する（2026-07-30も指摘を受けて設計を2回修正した）

**技術側は全部クリア。未pushなし・本番と一致。**
- **1102（Worker exceeded CPU time limit）は解決・調査終了**。Median CPU Time **141→44ms**、Error Rate **0%**、空白ありの3セットを含む **0/160**。詳細は上の「2026-07-27」〜「2026-07-30」の節
- 完了済み: og:image出力の修正／アイコン・OGPの静的ファイル化（Workerを通らない）／旧`/icon`・`/opengraph-image`の301化／`tenants`二重取得の解消／Link先読みの停止／favicon・apple-touch-iconの204化
- **Workers Paid $5は不要**（見直す条件は上記の節に記録）
- 🚨**恒久ルール（毎回守る）**: pushしたら**単発で5〜10回**叩いて確認＋DeploymentsのError Rateを見る。異常なら**まず同じソースで再ビルド**（空コミット）、直らなければRollback

**次に着手する順（上の「AdSense申請前にやること全部」の技術項目）**

1. **A1 旧seed削除** — ⚠️**実測でチェックリストの数字と食い違っています**。2026-08-06時点のDBは**質問176件（debug 137 / dtm 39）・回答128件**、投稿者は`43069043…`が136件・本人`c6630e47`が25件、日付は2026-05-30〜07-26。チェックリストは「偽ペルソナ50問＋重複32件」だが**実際はそれより多く、本物の67問は未投稿なので事実上すべてが旧seed/テストデータ**。**削除範囲（全件か一部か）を必ず本人に確認してからSQLを作る**。SQLのみなのでWorkerには影響せず、測定や他の作業と並行できる
2. **A3 GUITAR & PEDALS テナント作成** — **ユーザーの指示待ち／テナントビルダーを実際に使いながらレクチャー付きで進める**（ユーザー希望）。決めること・注意点:
   - **内部テナントID**: 公開サブドメインが `guitar.` なので**内部IDも `guitar` に揃えれば `SUBDOMAIN_ALIASES` が不要**（debug↔bug / dtm↔music-prod のようなズレを新たに作らない）。要確認
   - **表示名に `&` が入る**（`GUITAR & PEDALS`）。SVGロゴは JSX の `{label}` 挿入なので**Reactが自動エスケープ＝壊れない**（2026-08-06に確認済み）。ただし ⚠️**`widthEmPerChar` はスペースと`&`を含む実際の文字列で `canvas.measureText` すること**。文字数×係数の概算なので、空白や記号があるとviewBox幅がズレて右切れ・中央ズレの原因になる
   - ⚠️**画像2枚が必須**: `public/icons/guitar.png`(32x32)・`public/og/guitar.png`(1200x630)。**無いとファビコン/OGPが404**（2026-07-30に静的ファイル化したため）
   - ⚠️**画像の生成手順**: `src/app/icon.tsx`・`opengraph-image.tsx` は `scripts/image-templates/` へ退避済み。新テナントの画像を作るには **①テンプレートを一時的に `src/app/` へ戻す →②デプロイ →③新テナントのホストで `/icon`・`/opengraph-image` を取得して `public/` へ保存 →④テンプレートを再退避 →⑤デプロイ**。**戻したまま放置すると、ファイル規約がmetadataの指定を上書きして静的ファイル化が無効になる**（Next公式ドキュメントで確認済み）
   - 触るファイルは上の「テナント追加時の必須チェックリスト」の表のとおり（`GENRE_CONFIG`のthresholdは**91**が既定／`{tenantId}CardTagline`を8言語／Cloudflare Custom Domain）
3. **A2 BUG休眠化** — `src/components/PortalHome.tsx` の `REVIEW_TENANT_IDS` から `bug` を削除（pushを伴う）
4. **B1 Googleログインのみ化** — メールログインのUIを隠す（認証テーブル・データは消さない）
5. **A6 投稿1問目の検証** — `node scripts/verify-latest-post.mjs <tenant> 1`。引数は**内部ID**（音楽は`dtm`、ギターは上記の決定次第）。`title_i18n`/`body_i18n`が7言語そろっているか・AI回答の有無と翻訳・AI回答が無い場合の人間ルーティング割当（宙ぶらりん検知）を見る。**1問目で欠落があれば投稿を止めて原因を追う**
6. **B①（翻訳メッセージの絞り込み）はAdSense申請の1回目の結果が出た後**。設計と確認の優先順位は上の「📐 B①の設計」に記録済み

### 🔍 プランナーのレビュー結果（2026-08-15・投稿フロー／文言／ビルダー）

**🟢 判断：空テナントのnoindex実装は「やらない」（投稿開始前の決定）**
- 現状 guitar/music-prod は sitemap 12URL（静的のみ・質問0）でindexable、bugのみ `noindex, follow` ＋ sitemap 0（**8/8の修正どおりrobots.txtは`Allow: /`＝正しい**）。
- **やらない理由**：①静的12URL（トップ・使い方・高難度・利用規約・プライバシー・お問い合わせ×en/ja）は実際に文章があり「薄いページ」ではない。Googleが罰するのは*薄いページの大量生産*であって*まだ質問がない新しいサイト*ではない ②投稿は数日〜3週間で終わり、効果を発揮する期間より実装と検証の手間が大きい ③**pushはビルドのクジを引く**（7/27の「ソース無変更でビルドだけ壊れる」事象）。投稿直前にリスクを取る理由がない ④AdSense申請は投稿完了後で、そのときには67問ある。
- **将来テナントを量産する段階で実装するとき用の答え**：閾値**10問**（開設ラインと一致）／判定単位は**テナント全体**（言語別は複雑すぎ、既に`INDEXABLE_LOCALES`でen/jaに絞り済み）／**自動**（手動は忘れる）。

**🔴 コードの指摘①：`routeToHuman` のC探索が機能していない（`src/app/api/questions/route.ts`）**
- `findMatch(tenantId, q.id, [posterId], tr)` を**B と C で同じ除外リスト**で呼んでいる。Cを探すのは「Bが見つからなかったとき」だけなので、**候補0人という同じ条件で同じクエリを投げている**＝Bがnullなら**Cも必ずnull**。「B候補なし→C探索→Cもなし→即hard」というフォールバックが空振りしている。
- 実害は「無駄なDB往復が1回」程度だが、1102でCPU時間を削った直後なので消す価値がある。
- なお**本人が投稿してAIが答えられなかった質問は必ずhardに落ちる**（候補が本人しかおらず、その本人が`posterId`で除外されるため）。これは想定どおりの挙動（🤖22問のうち投稿時にスコアが落ちたものは⬜放置に回す、という2026-07-30の合意）。

**🟡 コードの指摘②：回答の翻訳失敗が無音（`src/app/api/answers/route.ts`）**
- `translateToLocales` の失敗を catch してログのみ。**回答の投稿は成功扱いになり、`body_i18n` が空のまま残る**。7/26の翻訳欠落とまったく同じ状態が、気づかれずに再発しうる。
- **コードは変えなくてよい**（回答自体を失わせない設計として正しい）。ただしこれが**投稿1問目で`verify-latest-post.mjs`を必ず流す根拠そのもの**＝「画面上は成功しているのに翻訳だけ欠けている」は目視では絶対に気づけない。

**🟡 コードの指摘③：日本語ハードコードの残り2箇所（どちらも実害小）**
- `AdminVisitors.tsx:42` `ref === '(direct / なし)'`＝管理画面のみ、運営者しか見ない。
- `profile/page.tsx:392` `displayName.startsWith('ユーザー#')`＝**`ユーザー#`を生成しているコードがsrc/とマイグレーションのどちらにも無い**（判定側のこの1行しかgrepに出ない）。判定が効いているか不明だが、外れてもヒント文が出ないだけ。生成側の場所だけ確認するとよい。
- ※2026-08-15に直した2件（メッセージの成否を「失敗/Failed」の文字列で判定→**他6言語で失敗が緑色**／未ログインを`err.message === 'ログインが必要です'`で判定→**日本語以外でログイン画面に飛ばない**）は、どちらも実害のある良い修正。

**🟡 将来の性能：`title_i18n->>ja` に対する `ilike` はインデックスが効かない**
- JSONB取り出し＋部分一致なので**質問数に対して線形に遅くなる**。67問なら体感差ゼロ。**数百件を超えたらGINインデックス（pg_trgm）が必要**になる、とだけ覚えておく。今やる必要はない。

**🔴 文言①：ポータルのタグラインが日本語だけトーンからズレている**
```
debug : …足りなければ現役エンジニアが応える。      / en: real developers
dtm   : …足りなければ現役の制作者が応える。        / en: real producers
guitar: …足りなければ人間のギタリストが応える。 ←  / en: real guitarists
```
- 既存2つは「**現役**〇〇」で、英語は3つとも `real 〇〇` で揃っている。**日本語のguitarだけ「人間の」**になっている＝「**現役のギタリスト**」に直すと3テナントで揃う。
- 併せて guitar だけ「疑問に」（他2つは「質問に」）。こちらは優先度低。

**🔴 文言②：検索キーワード「弦高」は31問に0問。「アンプ」に差し替える**

| キーワード | 該当する質問数 |
|---|---|
| ビンテージ | 9問（G01/02/03/05/11/12/15/17/18） |
| マルチエフェクター | 8問（G05/07/08/09/20/22/23/31） |
| エフェクター | 5問（G03/04/16/24/27） |
| オーバードライブ | 3問（G01/02/27） |
| ファズ / ピックアップ | 各2問 |
| ノイズ / 配線 | **各1問** |
| **弦高** | **0問** |

- **「弦高」を「アンプ」に差し替える**。アンプはG25(UA OX)・G26(Deluxe Reverb Tone Master)・G28(Marshall DSL1)・G31(アンプのIR)で**4問あるのにキーワードに無い**。
- 英語側の `"弦高": "Action"` も外す。**`action` は英語で「動作・行動」の意味で頻出する一般語**なので、部分一致検索で無関係な本文に誤ヒットする（`skillTags`側の `String action` は正しい）。
- 「配線」も1問なので、余裕があれば「**アコギ**」（G13/19/30の3問）へ。「ノイズ」は1問だがG21が具体的な操作手順を持つ良い回答なので残してよい。

**🟢 ビルダーの11項目：内容は良い。1つだけ足すとよいもの**
- 「スキルタグに複合語を入れない（部分一致なので一度も一致しない）」「同義語・表記ゆれは独立タグで両方」「翻訳は3種類（CardTagline 8言語／skillTags 7言語／searchKeywords 7言語）」「チップは表示ラベルと検索値が同じ文字列」「dev環境では`?tenant=`が効かない＝`curl -H "x-tenant-id:"`」——どれも実際に踏んだ問題の記録で有用。
- **足すとよいのは「③選定と清書＝本人 が省略できない理由」**。Googleが規制するのは*人間のレビューを経ていない大量生成コンテンツ*で、**③の本人による選定・清書＝人間のレビューと価値付加が、ポリシー違反にならない根拠そのもの**。テナント量産時に一番省略したくなる工程なので、理由ごと書いておく。
- なお `GENRE_CONFIG.guitar` は **threshold 91** ✓、inScope も31問（アコギ・アンプ・アッテネーター・アンプシミュまで）を十分カバーしている ✓。`ja` の `skillTags`/`searchKeywords` が空なのは**正常**（日本語は原文なので生のキーにフォールバックする設計）。

### 🤝 役割分担（2026-07-27 改訂・"このセッション"という相対表現は禁止）

**Claudeのセッションは2つあり、役割が違う。どちらも同じTeamアカウントの別シートなので、アカウントでは判別できない。**このMDは両方が読むので、役割は必ず「プランナー」「エンジニア」という**名前で**書く。「このセッション」「こちら」「別セッション」といった相対表現で書かない（読んだ側がどちらとも解釈できてしまう。実際に2026-07-25版のこの節は逆の意味に読める状態になっていた）。

**⚠️ セッション開始時のルール（2026-07-27 追加）**
1. このMDを読んだら、**最初の応答で自分がどちらの役割かを名乗る**（例:「プランナーとして入ります」）。名乗りが外れていればユーザーがその場で正せる。
2. 判断材料はユーザーの最初の指示。コード修正・デプロイ・バグ・DB・較正ツール実行 → **エンジニア**／質問と回答・戦略・投稿スケジュール・宣伝・収益化 → **プランナー**。**判断がつかなければ推測で動かず聞く**。
3. 次のClaudeへの引き継ぎコメントを書くときは、**どちらの役割で書いたかを明記する**。
4. **cwdは役割のヒントであって最終根拠にしない**（2026-07-27 エンジニアの実測を受けて追記）。`/Users/apple/wisdom-assemble`＝通常エンジニア、`/Users/apple/Music/Ableton`＝通常プランナー。ただしどちらのシートもどのディレクトリでも起動できてしまうので、**最終判断はユーザーの最初の指示（上のルール2）が優先**。
5. ⚠️**このCLAUDE.mdはプランナー側では自動で読み込まれない**（同・実測）。プロジェクトCLAUDE.mdはcwd基準で読まれるため、cwdが`Music/Ableton`のセッションはこのファイルを起動時に読まない（`Music/Ableton`側にCLAUDE.md/AGENTS.mdは無く、`~/.claude/CLAUDE.md`も無い）。したがって**「読んだら名乗る」は正しいが、読むこと自体は保証されていない**。担保は①ユーザーの初回メッセージで役割を明示してもらう（最も確実）②プランナー側のメモリに「WAではプランナー役・着手前にリポジトリのCLAUDE.mdを読む」を記録（2026-07-27 記録済み）。

**担当範囲**
- **プランナー**：質問の企画・収集・67問の処理・投稿タイムスケジュールの作成・宣伝の企画・収益化（AdSense/アフィリ/Stripe）の戦略。質問と回答のやり取りはこちらで扱う。
- **エンジニア**：コード実装・DB/マイグレーション・テナントビルダーの出力をコードへ反映・デプロイ・バグ修正・（依頼された場合の）較正ツール実行。
- **本人（mt）**：質問と回答の作成/検閲/清書・実サイトへの投稿・各種アカウント作成・外部サービスの操作。

**境界のルール**
- ⚠️ **リポジトリのコードを編集するのはエンジニアだけ**。プランナーもClaude Codeなので技術的には編集できてしまうが、**やらない**（二重適用・コンフリクトを避けるため）。プランナーからバグ報告や修正方針が来たら、実装するのはエンジニア。
- ドキュメント（CLAUDE.md / Notion）の更新はどちらが行ってもよいが、**同時に触らない**。プランナーが触る場合はドキュメントのみに限定する。
- ✅ **企画・方針への相互チェックは必ず行う（2シートの価値はここ）**。相手の方針に技術的な穴・矛盾・見落としがあれば、**遠慮せず・必要なだけ具体的に指摘する**（間違いを見逃す方が損失。軽く済ませることを優先しない）。一方で**雑談的な引き延ばしはしない**＝指摘は要点を押さえて。**質問文の代筆はしない**（本人の検閲・清書がポリシー違反回避の本体なので、ここは絶対に代行しない）。

### ⏭️ エンジニアが着手するタスク（ユーザーの指示待ち・順不同）
質問と回答が揃ってからの作業なので、**ユーザーから声がかかるまで着手しない**。
1. ~~**Googleログインのみ化**~~ → まだ未実施（メールログインのUIを隠す。認証テーブル・データは削除しない）
2. ~~**テスト/seed質問の削除**~~ → **2026-08-08に完了**（下記セッション記録参照）
3. **GUITAR & PEDALS テナントの新規作成**：テナントビルダーの出力を各ファイルへ反映＋タグライン等を7言語へ翻訳＋閾値較正＋Cloudflareドメイン追加の案内（ビルダーの入力は一項目ずつ確認しながら進める）。**ユーザー希望＝ビルダーを実際に触りながら一緒に進める**
4. ~~**質問詳細のソフト404**~~ → **2026-08-08 対応済み**（`loading.tsx` を削除して404を返すよう修正）
5. その後の実環境への質問投入は、**プランナーが作るタイムスケジュールに従う**（エンジニアは貼るだけパケット等の技術支援のみ）

### 🎸 2026-08-08 GUITAR & PEDALS テナント作成の準備（次セッションはここから）

**確定事項**
- 表示名 `GUITAR & PEDALS` / 公開サブドメイン `guitar.` / **内部IDも `guitar`**（別名を作らない＝`SUBDOMAIN_ALIASES` と `AdminVisitors` の alias が不要になる）
- 説明文のジャンル表現は **A案「ギター・エフェクター」で確定**（mtさん・プランナー合意）。テナント名をそのまま日本語にしただけで、テナント名に無い要素（ビンテージ・マルチ等）を足していないため、canadaの「留学・ワーホリ」結合事故とは性質が違う。**範囲の定義は inScope の仕事**で、説明文は「何のサイトか」を伝えるだけに絞る
- 閾値は **91**（Gemini基準・`DEFAULT_THRESHOLD`）

**分担**
| 誰 | 何を |
|---|---|
| mtさん | **スキルタグの最終決定**（マッチングの入口。自分が実際に答えられる範囲で線を引く） |
| エンジニア | 案の作成・コード反映・画像・検証 |
| プランナー | 案の確認（説明文がテンプレートに沿っているか／ジャンルを結合していないか／inScope・outScopeの広さ）＋**タグラインの7言語翻訳** |

⚠️**「エフェクター」は和製英語**（英語では `pedals` / `effects pedals`。`effector` は生物学用語）。`description_i18n` の英語版が `pedals` になっているか**必ず目視すること**。テナント名が GUITAR & PEDALS なのに説明文が effector だと意味が通じない。

**エンジニアの案（プランナー確認待ち）**

```
説明文（日本語・共通テンプレート）
  AIが答えられない・不確かなギター・エフェクターの質問・問題を、人間のエキスパートに繋げるQ&Aサービス

タグライン（ポータルカード・日本語）※既存2件とトーンを揃えた
  ギターやエフェクターの疑問に、AIがまず答え、足りなければ弾き手が応える。
  （参考 debug: コードのバグや不具合に、AIがまず答え、足りなければ現役の開発者が応える。）
  （参考 dtm  : DAWや音作りの疑問に、AIがまず答え、足りなければ現役の作り手が応える。）

GENRE_CONFIG
  label     : ギター・エフェクター
  threshold : 91
  inScope   : エレキギター・アコースティックギター・エフェクター・ペダル・マルチエフェクター・
              アンプ・真空管アンプ・アンプシミュレーター・ピックアップ・配線・改造・
              ビンテージ機材・セットアップ・調整・弦・レコーディング・ペダルボード
  outScope  : 料理・スポーツ・恋愛・プログラミング・税金など、ギターや機材と無関係な話題
  danger    : 感電|高電圧|発火|やけど
              （真空管アンプの内部は電源を切っても致命的な電圧が残る。該当時はAIスコアを下げて人間へ回す）

TENANT_SKILL_OPTIONS（15件・全ユーザーがマイページで選ぶ選択肢）★mtさんが最終決定
  エレキギター / アコースティックギター / エフェクター / マルチエフェクター / アンプ /
  真空管アンプ / アンプシミュレーター / ピックアップ / 配線・改造 / ビンテージ機材 /
  セットアップ・調整 / ペダルボード / 弦・ピック / レコーディング / リペア

TENANT_SUGGESTED_KEYWORDS（トップの検索候補・8件）
  オーバードライブ / ファズ / 真空管 / ハムバッカー / ピックアップ / 配線 / ビンテージ / マルチエフェクター

TENANT_SEARCH_TAGS（ルートポータルの検索用・日英両方）
  guitar, pedals, effects, amp, vintage, ギター, エフェクター, ペダル, アンプ, ビンテージ
```

※ `TENANT_SKILL_OPTIONS` は「全ユーザーが選べる選択肢の一覧」。**mtさん個人がどれを持つかは、テナント公開後にマイページで選ぶ**（そこで `tenant_profiles` の行ができ、`is_available=true` で候補になる）。

**次セッションの手順（トークン節約のため順序を固定）**
1. mtさんがスキルタグを確定（上の15件から増減）
2. プランナーが説明文・タグライン・inScope/outScopeを確認
3. **テナントビルダーで画像2枚をダウンロード** → `public/icons/guitar.png`（32×32）・`public/og/guitar.png`（1200×630）に配置 ★ここだけmtさんの手作業
4. エンジニアがコード6ファイルへ反映（下記）＋7言語翻訳を `messages/*.json` へ
5. Supabase `tenants` へ INSERT（SQLはエンジニアが用意・mtさんが実行）
6. **Cloudflare で Custom Domain `guitar.wisdomassemble.com` を追加** ★mtさんの手作業
7. デプロイ → 単発5〜10回＋Error Rate 確認 → `?tenant=guitar` 相当（`curl -H "x-tenant-id: guitar"`）で目視

**触るファイル（内部ID＝サブドメインなので別名まわりは不要）**
`middleware.ts`（VALID_SUBDOMAINS）／`src/lib/tenantNames.ts`（TENANT_NAME_MAP・TENANT_SEARCH_TAGS・必要ならLOGO_STYLE_OVERRIDES）／`src/lib/gemini.ts`（GENRE_CONFIG）／`src/lib/skillTags.ts`（2つのマップ）／`src/components/PortalHome.tsx`（REVIEW_TENANT_IDS・FALLBACK_COLOR_THEME）／`messages/*.json`×8（`guitarCardTagline`）／`public/icons/guitar.png`・`public/og/guitar.png`

### ✅ 2026-08-15 GUITAR & PEDALS テナント作成・テナントビルダー改修（エンジニア）

**テナントは本番稼働済み。** https://guitar.wisdomassemble.com （コミット `746cde4`）

#### 確定した内容
- 内部ID・公開サブドメインとも **`guitar`** で統一 → **別名の登録3箇所（`SUBDOMAIN_ALIASES` / `PUBLIC_SUBDOMAIN_MAP` / `AdminVisitors`のalias）はすべて不要**になった。今後もこの方式を推奨
- 表示名 `GUITAR & PEDALS` ／ `color_theme` `#a96800`（金）／ ロゴ = American Typewriter・treatment `diagsplit`・`widthEmPerChar` 0.6599 ／ 閾値91
- スキルタグ18件・検索候補9件・ポータル検索タグ・タグライン8言語・`description_i18n` 7言語・画像2枚、すべて投入済み
- 本番検証: 全ページ200／画像2枚200／`/zh`等6言語はnoindex・en/jaはindex／sitemap 12件／単発10回すべて200／既存2テナントに影響なし

#### ⭐ スキルタグの設計方針（今後の全テナントに適用）
マッチングは **`questionText.includes(tag)` の部分一致**（[matching.ts:62](src/lib/matching.ts:62)）で、対象は**投稿された元言語の title+body**。ここから次が導かれる:
- **`A・B` のような複合語は入れない**。「配線・改造」は質問文に出ないので**一度も一致しない**。「配線」「改造」に分ける
- **同義語・表記ゆれは独立したタグとして両方入れる**（エフェクター/ペダル、アコースティックギター/アコギ、ビンテージ機材/ヴィンテージ）。分かっている人は両方チェックするので実害がなく、取りこぼしが減る。**ヴィンテージ/ビンテージ問題もこれで解決する**
- 表示ラベルだけ `messages/*.json` の `skillTags` で各言語に切り替わる（**値＝照合用の内部文字列、表示＝各言語**）。今回23語×7言語を追加済み。**新テナントでは必ずこの翻訳もセットで入れること**（無いと英語圏でも日本語のまま出る）

#### ⚠️ 未解決（実ユーザーが英語で投稿し始めたら効いてくる）
上記のとおり照合は**元言語のテキストだけ**を見ており、**翻訳結果（`title_i18n`）は使われない**。しかも [route.ts:285](src/app/api/questions/route.ts:285) の照合時点では翻訳がまだ保存されていない（保存は312行目）。→ **日本語タグは英語の質問に一切当たらない**。
- **解決策（ほぼコスト無し・要実装）**: レスポンスを返す前に**どのみち翻訳を待っている**ので、待つ位置を照合の前へ移すだけでよい。増えるのは照合処理と重ならなくなるぶん（DB書き込み＋通知メールで0.3〜0.8秒・人間ルート時のみ）。これで**日本語タグ1本で英語の質問にも当たる**ようになり、言語ごとにタグを揃える運用自体が不要になる
- seed期は全問日本語なので影響ゼロ。**AdSense申請後に着手**

#### 🔧 テナントビルダー(Artifact)を改修（URL不変）
https://claude.ai/code/artifact/cad8ed82-9f1f-4131-b389-5be73c9ada22
- **カード自体をSTEP順に並べ替え**（CSSの`order`のみ。DOM構造とIDは一切動かしていないので既存機能に影響なし）。STEP 1〜13で、Supabase・Cloudflare・チャットでの作業まで1本の並びに入った
- **進捗バーを上部固定**（1行・51px）。入力から判定できるSTEPは自動で✓、判断が要るSTEPだけ手動チェック
- **スキル/検索語をサジェスト調査つきで提案する流れ**に変更。依頼文が「先に `suggest-keywords.mts` を実行しろ」と指示し、返ってきた候補が**根拠つきでビルダー上に並び、チェックで採否を選べる**（保存JSONに`use:false`も残るのでレビュー状態ごと復元可）

**見つけて直した穴5件**: ①`offerFile`が文字列を`URL.createObjectURL`に渡して落ちる ②「ここへ」が無反応（`behavior:"smooth"`が動かない環境がある） ③Supabase/Cloudflareが手順として繋がっていない ④画面の並びが作業順と違う ⑤ジャンプ先が固定バーに潜る

**MEMO（次にビルダーを触るとき）**
1. ロゴビルダーの UNDO / REDO
2. スキル・キーワードの現在の個数表示
3. **ファビコン色とOGP色が食い違っても警告が出ない**（今回踏んだ。ファビコンはロゴ色・OGPは`OG_COLORS`と出どころが違う）
4. **OGP色を既定でテナントのテーマ色に追従させる**。既定の`#5B5B5B`はビルダー自身のアクセント色を流用しただけで、**新テナントにグレーの出番は無い**（グレーはルートポータル専用）。しかも黒背景では読めない画像が焼き込まれる
5. 手順書の `?tenant=` の記述を削除（下記のとおり効かない）

#### 🧰 新設: `scripts/suggest-keywords.mts`
Googleサジェストから「実際に検索されている語」を集める調査ツール。`npx tsx scripts/suggest-keywords.mts --out <名前> <シード語...>`。実需ランキングと採否判断用のまとめを出す。⚠️検索ボリュームの実数は取れない（キーワードプランナー等が必要）。**サイト内検索チップは「よく検索される」だけでは足りず、実際に質問本文にその文字列が出るかを投稿後に確認して確定すること**。
- 今回の発見例: `ペダル`単体は**自転車**（ペダルトレイン/ペダルレンチ）／`ピックアップ`は**ガチャ・トラック**／`ノイズ`は**ノイズキャンセリング**／逆に`弦高`(調整/測り方)・`エフェクター`(ボード/順番/電源)・`配線`(配線材/配線図)は実需が明確。ただし**サイト内検索なので外部の曖昧さは実害にならない**（この線引きを間違えないこと）

#### 📏 sitemap URL数のベースライン（2026-08-15・投稿開始前）
| ホスト | 合計 | 質問 |
|---|---|---|
| guitar.wisdomassemble.com | 12 | 0 |
| music-prod.wisdomassemble.com | 12 | 0 |
| wisdomassemble.com | 10 | 0 |
| bug.wisdomassemble.com | 0 | 0（休眠） |

---

### 🌐 2026-08-15 多言語の穴を一括で塞いだ（検索・マッチング・類似質問・エラー処理）

GUITAR & PEDALS を作った直後、ユーザーの指摘から**「日本語しか見ていない箇所」が
連鎖的に5つ**見つかった。**seed期は全部日本語なので表面化しないが、実ユーザーが
英語で投稿し始めた瞬間に全部壊れる**種類の問題だったため、投稿開始前にまとめて修正。

| # | 箇所 | 症状 | 状態 |
|---|---|---|---|
| 1 | ホーム検索 | 元言語の`title/body`しか見ず、**/enで英語を検索すると必ず0件** | 修正 `cd13533` |
| 2 | 検索チップ | 表示だけ翻訳し検索値は日本語 → /enで "Effects pedals" を押すと検索欄に「エフェクター」 | 修正 `cd13533` |
| 3 | **マッチング** | タグ照合が元言語のみ＋**翻訳保存前**に走る → 日本語タグは英語の質問に一生当たらない | 修正 `b3fccd8` |
| 4 | 類似質問(2箇所) | 同上。加えて**サーバ側だけ`.or()`サニタイズ漏れ**（括弧入りタイトルで無言で0件） | 修正 `5d5284c` |
| 5 | 未ログイン判定 | `err.message === 'ログインが必要です'` で判定 → **日本語以外ではログイン画面に飛ばない** | 修正 `ee5455e` |

**共通の原因**：`title`/`body` は投稿された**元言語**のテキストで、翻訳は
`title_i18n`/`body_i18n`(JSONB)に別で入る。ここを見ないコードは全部同じ穴になる。

**確立した対処**
- **検索系**：`title_i18n->>{locale}.ilike` を or 条件に足す。**全言語をまとめてではなく
  閲覧中の1言語だけ**に絞る（他言語の質問を拾わないため）。`::text`キャストは
  PostgRESTで通らない（実測）。localeは`routing.locales`で検証してから埋め込む
- **マッチング**：`findMatch`に翻訳を渡せるようにした。投稿直後はまだDBに無いため
  `route.ts`は翻訳Promiseの結果を引数で渡し、`escalate`は保存済みなのでDBから読む。
  人間ルートは通知メールでどのみち翻訳を待つので追加コストはほぼ無い
- **文言での分岐をやめる**：APIのエラーは8言語で返るので、**必ずステータスコードで判定**する

**実データでの確認**
- 検索: /en「noise」→ 修正前0件 / 修正後1件
- マッチング: 英語の質問に日本語タグ4/5一致（修正前0/5）。スコア20→40
- チップ: 全言語で表示と検索値が一致（既存のMUSIC PRODUCTIONも "Mixing"→"Mixing" に是正）

**あわせてロゴのTMのバグも修正**（`cd13533`→`9df2524`）。`background-clip:text`を使う
treatment（gradient/split/diagsplit/stripe系）でTMが透明になり見えなかった。色を明示
したら今度は**Safariで位置が飛んだ**（縮小表示時にforeignObject内容がviewBoxに追従しない）。
最終的に**TMをforeignObjectの外＝SVGのtext要素**に出して解決。以後どのtreatmentでも崩れない。

⚠️ **未検証**：`searchKeywords`の非英語（zh/id/vi/ko/es/pt）が実際の翻訳文に当たるかは
質問0件のため確認できていない。**投稿後に実ヒット数を数えて0件の語は差し替えること**。

---

### 🛠 2026-08-15 テナントビルダーに「毎回ミスる箇所」と初期コンテンツの作り方を内蔵

**ビルダー画面と、生成される実装依頼文の両方に入れた。** 画面だけだと次のClaudeが読まないため、
「すべてまとめてコピー」で出る依頼文にも同じ内容が入る（依頼文は約4,500字）。

**⚠️ 毎回ミスる箇所（実際に踏んだものだけ）**
1. 内部IDと公開サブドメインを揃える（違えると別名登録が3箇所必要＋訪問者ダッシュボードで2行に割れる）
2. 色を確定してから画像を書き出す（PNGに焼き込まれる）
3. ファビコン色=ロゴ色 / OGP色=OG_COLORS と**出どころが違う**（食い違うと別々の色で書き出される）
4. 画像2枚を置き忘れない（404＋Workerが毎回7.4KBのHTMLを描画）
5. スキルタグに `A・B` の複合語を入れない（部分一致なので一度も一致しない）
6. 同義語・表記ゆれは独立タグで両方入れる
7. **翻訳は3種類**：`{id}CardTagline`(8言語) / `skillTags`(7言語) / `searchKeywords`(7言語)。自動翻訳の仕組みは無い
8. `searchKeywords` は `skillTags` と別物（表示ラベル=検索値なので短い語にする）
9. ローカル確認に `?tenant=` は使えない → `curl -H "x-tenant-id: <id>"`
10. **テキストを扱うコードを足すときは `title_i18n`/`body_i18n` も見る**（見落として4箇所踏んだ）
11. デプロイ後は単発5〜10回＋Error Rate

**初期コンテンツの作り方（分業）**
1. **候補集め＝プランナー役のClaude**：そのジャンルで実際に検索・質問されている内容を調べ20〜30問。文章はコピーせず傾向を拾って書き起こす
2. **選別＝エンジニア役のClaude**：`calibrate-threshold.mts` で通し、閾値91超え**かつ回答が正しい**問だけに絞る（やらないと開設時に無回答だらけ）
3. **選定と清書＝本人**：10問を選び自分の言葉に直す。**Claudeが代筆しない**。人間のレビューと清書が入ることがポリシー違反回避の根拠そのもの
4. **投稿＝本人が実サイトのフォームから**。SQL一括投入はしない（タイムスタンプが偽物になり、AI回答・翻訳・マッチングを全部バイパスする）
5. レート制限3問/日/テナントなので数日に分散、毎日同数にしない

**ビルダーの穴は今回さらに5件修正**（UNDO/REDO・個数表示・色の食い違い警告・OGP色のテーマ追従・`?tenant=`の訂正）。
うち1件は**自分の修正で作り込んだもの**：STEP13の文面差し替えで `lv-id` 要素を消し、`render()` が
毎回そこで例外を投げて**ビルダー全体が停止**していた。実際に動かすまで気づけなかった。
以後、ビルダーを触ったら必ずローカルに置いて全機能を通すこと。

---

### 🔍 2026-08-15 プランナーによるレビューと反映（指摘4件・全部当たり）

**⭐空テナントのnoindexは「やらない」で確定**（プランナー判断・蒸し返さないこと）
理由: ①静的12URL（トップ/使い方/高難度/利用規約/プライバシー/お問い合わせ×en/ja）は
実際に文章があり「薄いページ」ではない。Googleが罰するのは**薄いページの大量生産**であって
「まだ質問がない新しいサイト」ではない ②投稿は数日〜3週間で終わり、効果を出す期間より
実装と検証の手間が大きい ③**pushはビルドのクジを引く**（7/27の「ソース無変更でビルドだけ
壊れる」事象）。投稿直前にリスクを取る理由がない ④AdSense申請は投稿完了後で、その時には67問ある。
- ⚠️ ただし**投稿開始が数週間以上ずれ込むなら再検討の余地あり**（前提が「すぐ埋まる」なので）
- 将来テナントを量産する段階で実装するときの仕様: **閾値10問 / 判定単位はテナント全体
  （言語別はやらない。既に`INDEXABLE_LOCALES`でen/jaに絞り済み）/ 自動解禁（手動は忘れる）**

**反映した指摘4件**（コミット`3f558a6`）
1. **`routeToHuman`のC探索が空振りだった**。BとCで同じ除外リストのまま`findMatch`を呼んでおり、
   Bがnull＝候補0人なのでCも必ずnull。無駄なDB往復1回。削除した。**Cへの割り当ては
   escalate側（Bが回答したあと質問者が別メンバーに依頼する）の役割**で、投稿時には発生しない
2. **検索チップを31問の実出現数に合わせた**。ビンテージ9/マルチエフェクター8/エフェクター5/
   アンプ4/オーバードライブ3/アコギ3/ファズ2/ピックアップ2/ノイズ1。**「弦高」は0問**だったので
   除外し「アンプ」へ、1問の「配線」は3問の「アコギ」へ差し替え。
   ⚠️**英語の`"弦高":"Action"`は削除**。actionは英語の一般語で、翻訳文への部分一致で無関係な
   質問に誤ヒットする（skillTags側の`String action`は語として正しいので残す）
3. **ポータルのタグラインのトーン**。jaだけ「人間のギタリスト」で、debug「現役エンジニア」/
   dtm「現役の制作者」とズレていた（英語は3つとも real で揃っていた）→「現役のギタリスト」に統一
4. **表示名ヒントの死んだ条件**。`startsWith('ユーザー#')`で判定していたが、**その名前を生成する
   コードは src にもマイグレーションにも存在しない**（DBに残るのは古いデータのみ）＝実質発火せず。
   未設定なら一覧で`user_XXXXXX`と出るので、空のときに出すよう修正

**変えないと判断したもの**
- **回答の翻訳失敗が無音**（`answers/route.ts`が`catch`してログのみ）。**回答を失わせない設計として
  正しい**ので変えない。これが**投稿1問目で必ず`verify-latest-post.mjs`を流す根拠**
- **`title_i18n->>ja`のilikeはインデックスが効かない**。67問なら体感差ゼロ。数百件超でGIN(pg_trgm)。
  ※補足: `ilike '%x%'`は`title`列でも元々インデックスが効かないので、i18n対応で**種類が変わった
  わけではなく走査する列が倍になっただけ**
- `AdminVisitors.tsx`の`'(direct / なし)'`ハードコード＝管理画面専用なので対象外

---

### 🔐 2026-08-15 本番のservice_roleキーが公開リポジトリに出ていた（解消済み・要点だけ残す）

**B1（Googleログインのみ化）の作業中に発見。** CLAUDE.mdに書いてあったテストアカウントの
パスワードが公開されているか確かめるためリポジトリの公開状態を見たら**公開**だったので、
秘密情報を総ざらいしたところ出てきた。**7週間（2026-06-28〜）この状態だった＝今日の作業とは無関係。**

| 何が | どこに |
|---|---|
| 本番の`service_role`キー（RLSを完全にバイパス） | `scripts/` の4ファイルに直書き（count-hard / local-rpg-test / test6-finish / test6-rpg） |
| テストアカウント12件＋共通パスワード | CLAUDE.md本文 |

**実際に有効だったことを確認**（漏洩キーでDBを読めた／`takeshi@test.com`でログイン成功）。
ただし**悪用の形跡はなし**（質問0・回答0・アカウント13件すべて6/27作成・見知らぬ行なし）。

**やったこと（この順番でないと本番が止まる）**
1. 新しいAPIキー形式へ移行：`sb_secret_...`（旧service_role）／`sb_publishable_...`（旧anon）
2. `.env.local` → Cloudflareの**Variables and secrets**と**Build variables の両方** → push で再ビルド
   （`NEXT_PUBLIC_*`は**ビルド時にJSへ焼き込まれる**ので、値を変えたら再デプロイが必須）
3. 配信中の全JSチャンク・全ホストのHTMLに**旧鍵が0箇所**であることを確認してから
   Supabase → API Keys → Legacy → **Disable JWT-based API keys**
4. Authentication → Providers → **Email をオフ**
5. コードから直書きを削除（`process.env`から読む形へ）／CLAUDE.mdからパスワードを削除

**結果**：漏洩キーは `Legacy API keys are disabled`、テストアカウントは `Email logins are disabled`、
メール新規登録も `Email signups are disabled`。**Googleログインは正常**（`/auth/v1/authorize?provider=google`が302でGoogleへ）。

**⚠️ 今後の前提（間違えると壊す）**
- **キーは新形式**。`eyJ...`のJWT形式は**もう使えない**。復活させないこと
- **`Disable JWT-based API keys` は anon と service_role の両方を落とす**。anonはサイトのほぼ全機能が
  使っているので、**anonを新形式へ移行する前に押すと全ページが死ぬ**（今回、押す直前に気づいて止めた）
- **UIを消しても塞がらない**。Supabaseの認証エンドポイントは外部から直接叩けるので、
  プロバイダ自体を無効化する必要がある。これがB1の本体だった

**✅ B1完了**：Supabase側の無効化に加え、ログイン画面からメール/パスワードのUIを削除。
`/auth/signup`（どこからもリンクされていないがURL直打ちで到達できた）はログインへリダイレクト。
全テナント＋ルートで`type="password"`が0箇所・Googleボタンのみになったことを本番で確認。
**認証テーブルとアカウントのデータは消していない。**

**残タスク（任意）**：テストアカウント13件の削除（ログインできないので急ぎではない）／
リポジトリを非公開にするか（鍵は無効化済みなので必須ではない）。

**教訓**：リポジトリの公開状態は早い段階で確認する。CLAUDE.mdに「service_roleは絶対に公開しない」と
書いてあったのに、**7週間誰も実際のファイルを見ていなかった**。方針を書くだけでは守られない。

---

### 🧹 2026-08-08 旧seed全削除・テナント独立性の是正・BUG休眠化（エンジニア）

**このセッションでやったこと。すべて本番反映済み・実データで検証済み。**

#### ① 旧seed/テストデータの全削除（SQL: `scripts/seed/cleanup_all_seed_data.sql`）
- 実測は**質問176件（debug 137 / dtm 39）・回答128件**で、チェックリストの「偽ペルソナ50問＋重複32件」より多かった。本物の67問が未投稿のため**事実上すべてが旧seed**と判断し全件削除（ユーザー確認済み）
- 外部キーを確認して順序を決定: `answers.question_id` は **ON DELETE CASCADE** なので questions 削除で自動的に消える。**`donations.question_id` はカスケード指定が無い**ので先に削除（未実装機能なので0件だったが、残っていると外部キー違反で失敗する）
- `user_titles` も削除し `active_title_id` を先に null に。`tenant_profiles` / `profiles` の実績カウントと `answered_tags` を0にリセット
- ⚠️**`tenant_profiles` は行ごと消さない**（display_name / skill_tags / is_available / email_notify を保持するため）
- 結果: questions 0 / answers 0 / tenants 10 / profiles 13 / tenant_profiles 26、実績が残る行 0

#### ② テストアカウントをマッチング対象から外す（SQL: `scripts/seed/disable_test_account_matching.sql`）
- アカウントの実態は **@test.com が12個（emailログイン）＋ wisdomassemble@gmail.com（Google・管理用）が1個**。**26行すべて `is_available=true`＝13人全員が候補**になっていた
- @test.com を全テナントで `is_available=false` ＋ `skill_tags='{}'`（音楽テナントに React / TypeScript / AWS が入っていた。2026-07-14のテナント分離時に全テナントへ複製された名残）
- **管理アカウントも候補から外した**。運営用で回答に使わないため、残すと質問が割り当たって誰も答えられなくなる
- ⚠️**本物の投稿は「本人の個人Gmail」と「妻のGmail」で行う。テストアカウントは一切使わない**（AdSenseの前提。ここを取り違えると全部無意味になる）

#### ③ テナント独立性の是正（コミット `0db08ab`）
ユーザーの仕様「各テナントで独立。ログインもログアウトもテナントごと」に対し、**3点が実装と食い違っていた**ので揃えた。

| 仕様 | 実装状況 | 対応 |
|---|---|---|
| 各テナントでログイン | Cookieに`domain`指定なし＝ホスト個別 | 元からOK |
| 各テナントでログアウト | `signOut()`の既定が **`scope:'global'`** で、サーバー側のリフレッシュトークンを全失効＝他テナントのログインまで切れていた | **`scope:'local'` に変更**（Header.tsx / contact/page.tsx） |
| 通知メールがテナント別 | 件名・リンク・`email_notify`はテナント別だったが、**差出人名が `Wisdom Assemble` 固定** | **テナント名を出すよう変更**（email.ts の `senderName`） |

- **`ensureTenantMembership`（auth/callback/route.ts）を追加**。**そのテナントでログインすると `tenant_profiles` に行が1つ作られ、候補になる**。従来この行は「マイページ保存」「質問投稿」「回答」でしか作られず、**ログインしただけの人は候補に入らないため、他に候補がいないと質問が高難度へ落ちていた**（答えられる人がいるのに機会を奪う）
  - **他テナントには一切触れない**。`ignoreDuplicates` なので既存行を書き換えず、`is_available=false` にしたアカウントが再ログインで候補に戻ることもない（実データで検証済み）
- **`prompt: 'select_account'` を追加**（auth/login/page.tsx・コミット `7d0df2e`）。無いとブラウザにGoogleセッションが残っている場合にアカウント選択画面が出ず、**ログアウトしても同じアカウントにしか入れない**。1台のブラウザで本人と妻のアカウントを使い分けるのに必須

#### ④ BUG DEBUG の休眠化（コミット `7d0df2e` → `a729de7` で修正）
- **サブドメイン・DB・Cloudflare設定は消さない**。将来リリースする
- `DORMANT_TENANT_IDS`（`src/lib/tenantNames.ts`）に入れると **①全ページ noindex,follow ②sitemap除外** が効き、あわせて `PortalHome.tsx` の `REVIEW_TENANT_IDS` から外すとポータルのカードも消える
- 🔴**一度 `robots.txt` に `Disallow: /` を入れたが誤りで、プランナーの指摘を受けて撤回した（`a729de7`）**。**robots.txtでブロックすると Googlebot がページを取得できず、HTML内の noindex を読めない**。結果、既にインデックスされたURLが消えないまま残る（タイトルとURLだけ検索結果に残る）＝**1層目が2層目を無効化していた**。
  - **コード内の説明も因果が逆だった**（「noindexだけだと既存インデックスが残るのでsitemapからも外す」）。正しくは**インデックスから消すにはクロールさせて noindex を読ませる必要がある**
  - あわせて `nofollow` → `follow` に変更（nofollowだとトップから下層へ辿らず noindex の認識が遅れる）
  - **今後、休眠テナントに robots.txt のブロックを入れないこと**

#### ⑤ 質問詳細ページのソフト404を解消（コミット `5904574`）
```
修正前: /ja/questions/<削除済みslug>  → 200（中身だけ「見つかりません」）＝ソフト404
修正後: /ja/questions/<削除済みslug>  → 404 ✅
```
- **原因**: 質問詳細ルートの `loading.tsx`。これがあるとページがストリーミングされ、**HTTPヘッダー(200)が送信済みになった後に `notFound()` が走る**ため、ステータスを404に変えられない
- **影響していたもの**: 削除した176問のURLが「200を返すが中身の無いページ」として残り、GSCにソフト404として出る＝*Low value content* と同じシグナル。**わざわざ削除した効果が半減していた**
- **試した案と結果（すべて `next start` の本番相当環境で実測）**
  | 案 | 結果 |
  |---|---|
  | A. `generateMetadata` で `notFound()`（loading.tsxは残す） | **200のまま**。ストリーミング開始前でも効かず不採用 |
  | B. 回答一覧だけページ内 `Suspense`（折衷案） | **不採用**。`answers` はページ全体の権限判定(`canRematch`/`canEscalateHard`/`showAnswerForm`/`alreadyAnswered`)とJSON-LDにも使われ、切り出すには page.tsx の構造変更が必要。スケルトンのために複雑さを持ち込む価値がない |
  | C. **`loading.tsx` を削除** | **404になることを確認 → 採用** |
- 本番検証: 存在しないslug(ja/en/BUG) すべて404・正常系6ページすべて200・単発10回で失敗0
- `QuestionDetailSkeleton.tsx` は未使用になったが、**経緯と復活方法をコメントに残してファイルは保持**。Median CPU が 141ms→44ms まで下がっておりページ自体が速いため、スケルトンを失う影響は小さいと判断
- ⚠️**今後 `loading.tsx` を追加するときは、そのルートで `notFound()` を使っていないか必ず確認すること**（同じソフト404が再発する）

#### ⑥【重大・適用済み】人間の回答が一切INSERTできない状態を発見・修正（`20260808000001_fix_answer_trigger_tenant.sql`）
プランナーの指摘（「実在する質問の詳細ページが未検証」）を受けて検証用データを入れたところ、**人間回答のINSERTが必ず失敗する**ことが判明した。

```
AI回答   （user_id なし・is_ai=true） → ✅ 成功
人間回答 （user_id あり・is_ai=false）→ ❌ 23502
   null value in column "tenant_id" of relation "user_titles" violates not-null constraint
```

**原因の連鎖**
1. `answers` の after insert トリガー `on_answer_created` → `handle_new_answer()` が2026-06-26の初期スキーマのまま
2. その中で **1引数版の `check_and_award_titles(new.user_id)`** を呼んでいる
3. 1引数版は `insert into user_titles (user_id, title_id)` と **tenant_id を入れずにINSERT**する
4. 2026-07-13に `user_titles` へ tenant_id が追加され複合キー（＝NOT NULL）になったため必ず違反
5. トリガーが失敗 → **回答のINSERT自体が巻き戻る**

**なぜ今まで気づかなかったか**: seedの回答はすべて2026-07-13より前にSQLで投入されており、**それ以降に実際の人間回答が1件も投稿されていなかった**ため。

**同時に見つかった副次バグ**: `handle_new_answer()` は `profiles.answer_count`（2026-07-14以降は凍結カラム）を更新しており、**マッチングが見る `tenant_profiles.answer_count` は一度も増えていなかった**（スコア加点 `answer_count*0.3` が機能していない）。

**修正**: トリガー関数をテナント対応に差し替える（`increment_answer_count(user_id, tenant_id)` ＋ `check_and_award_titles(user_id, tenant_id)`）。これで①回答INSERTが通る ②回答数が正しく増える ③称号がテナント別に付く、が同時に直る。

**✅ 2026-08-08に適用済み。実データで検証した結果**
| 検証 | 結果 |
|---|---|
| 人間回答のINSERT | **成功**（修正前は必ず 23502） |
| `tenant_profiles.answer_count` | **0→1（+1）**＝二重カウントなし |
| ベストアンサー確定後 | 1のまま（増えない） |
| `user_titles` | `answer_1 / tenant_id='debug'` が正しく付与＝**tenant_idが入る**ことを確認 |
| ベストアンサーの画面表示 | 正常（緑枠・✓バッジ・解決済み表示） |

⚠️**二重カウント対策が同時に必要だった**（プランナー指摘）。このSQLを当てると `increment_answer_count` が「回答投稿時（トリガー）」と「ベストアンサー選択時（`accept/route.ts:65`）」の2箇所から呼ばれ、1回の回答で **+2** になる（マッチング加点が実質0.6、称号が半分の回答数で付く）。**`accept/route.ts` 側の呼び出しを削除してトリガーに一本化した**（コミット `2fed56a`）。マッチングの設計は「総回答数」であって「ベストアンサーに選ばれた数」ではないため、トリガー側が定義どおり。`increment_hard_quest_count` は「高難度を解決した数」なのでベストアンサー選択時のままで正しい。

⚠️**`service_role` は `user_titles` を読み書きできない**（`tenant_profiles` の DELETE と同じパターン）。検証中に「称号0件」と読めたのは権限エラーで `null` が返っていたためで、実際には付与されていた。**`user_titles` の確認・削除は SQL Editor でしかできない**。

#### ⑦ 実在する質問の詳細ページの描画確認（loading.tsx 削除後）
プランナーの指摘どおり、sitemapが質問0件のため静的ページしか検証できていなかった。**休眠中のBUGテナント**（noindex・ポータル非掲載・アクセスゼロ）に一時データを入れて検証し、直後に削除した。

- HTTP 200・59.8KB・タイトル/本文/改行/パンくず/回答/ステータスバッジ/JSON-LD(`QAPage`,`suggestedAnswer`)すべて正常
- 英語版（`/en`）も200で、`title_i18n` の英訳が表示される
- 休眠テナントなので `noindex, follow` が付いている
- ブラウザで目視確認済み。**`loading.tsx` を外したことによる表示崩れは無い**
- 検証後に削除し、質問0件/回答0件/カウンタ0件に復帰。削除したURLは404を返す
- ⚠️**人間回答の描画（ベストアンサーのバッジ等）だけは未検証**。上記⑥のトリガーバグで人間回答をINSERTできなかったため。**マイグレーション適用後、投稿1問目で目視すること**

#### ⑥ sitemap URL数のベースライン記録（再発防止）
今回 music-prod 側の削除前URL数を測っておらず、後から確認できなくなった。**投稿前後で比較できるよう記録する運用にする。**

**2026-08-08 03:03（投稿開始前・旧seed削除後）**

| ホスト | 合計 | 質問 | 静的 |
|---|---|---|---|
| bug.wisdomassemble.com | 0 | 0 | 0（休眠のため空） |
| music-prod.wisdomassemble.com | 12 | 0 | 12 |
| wisdomassemble.com | 10 | 0 | 10 |

測り方（1コマンド）:
```bash
for h in bug.wisdomassemble.com music-prod.wisdomassemble.com wisdomassemble.com; do
  echo "$h $(curl -s https://$h/sitemap.xml | grep -c '<url>') 件（質問 $(curl -s https://$h/sitemap.xml | grep -c '/questions/') 件）"
done
```
**67問の投稿後にもう一度測ること。**「A6 投稿1問目の検証」「C1 sitemap再送信」「C3 インデックス確認」の材料としてそのまま使える。

#### ⑥ テナントビルダー（Artifact）を量産対応に更新（v6・URL不変）
https://claude.ai/code/artifact/cad8ed82-9f1f-4131-b389-5be73c9ada22

**実害のあった抜けを4つ埋めた**
- **`public/icons/<id>.png`・`public/og/<id>.png` の出力が無かった**（2026-07-30の静的ファイル化以降これが必須。無いと404で、しかも軽い404ではなく**7.4KBのHTMLをWorkerが毎回描画**する＝1102の原因と同種の無駄。ファビコンはほぼ全ページビューで取りに来る）
- `OG_COLORS` の貼り先が `src/app/opengraph-image.tsx` になっていた（退避済みで存在しない）→ `scripts/image-templates/` に訂正
- **公開名≠内部IDのときの `AdminVisitors.tsx` の名寄せ alias が出力されていなかった**（別名の登録先は middleware / tenantNames / AdminVisitors の**3箇所**）
- ロゴのロック等がチェックを入れるまで `display:none` で丸ごと隠れていた → 常時表示に

**追加した機能**
- 🖼 **画像2枚をビルダー内で書き出せる**（本番テンプレートと同じ描画をCanvasで再現。**5ステップのデプロイ往復が不要になった**）。本番PNGとピクセル比較して幅の差 0.7〜2.9%・縦位置の差2〜4pxまで合わせた（Satoriとブラウザで sans-serif の字幅が1〜2割ずれるため、実測から「1文字0.60em＋字間4px」と較正してサイズを逆算している）
- 保存は Artifact の正式API `window.claude.downloads` を使用（承認ダイアログが出る／拒否時は再試行しない／非対応環境は通常DLへ退避）
- 🔍 **公開前プレビュー**：ルートポータルのカード（**実在の2テナントと並べて表示**）／テナントのトップ（ロゴ・説明文・ボタンのテーマ色・検索候補・ダークモード）
- ✅ **抜けチェック**（★必須／▲ジャンル精度／手作業を13項目）
- 💾 **設定のJSON保存/読込**（貼り付け・ファイルの両対応。往復ロス0を検証済み）
- 🤖 **「Claudeに中身を作ってもらう」**：ジャンル名だけ入れると、説明文・タグライン・スキルタグ・検索キーワード・inScope/outScope の作成依頼文をチャットへ送信 → 返ってきたJSONを貼れば全項目が埋まる（ビルダーは外部通信が遮断されたページなのでAI呼び出しはできない。この往復で代替している）
- ロゴ一覧（25スタイル／30書体をクリックで適用）・保存した組み合わせ（最大30）・背景スウォッチ・スライダー

#### 学んだこと（次回以降のため）
- **`service_role` に `tenant_profiles` の DELETE 権限が無い**（select/insert/update はある）。検証で作った行を消せず、SQL Editorから消した。アプリはこの表を削除しないので実害はないが、掃除のときに詰まる
- **ローカルdevでは middleware の `?tenant=` が効かない**（全部 `debug` にフォールバックする）。テナント別の挙動を確認するときは **`curl -H "x-tenant-id: <id>"`** でヘッダーを直接付ける
- **SEOの「塞ぐ」は多層にすればよいものではない**。noindex と robots.txt は打ち消し合う。**消したいならクロールさせる**

### 🔎 2026-07-27 本番エラー(1102)の調査と、アイコン/OGPの無駄削減（エンジニア）

**きっかけ**: ユーザーがスマホで`music-prod`にアクセスした際に `Error 1102 Worker exceeded resource limits` が一瞬出た。Observabilityで追跡した記録。

**分かったこと（実測）**
- エラーは **7/27 02:40:14〜02:40:53 の40秒間に6件**が集中。2ホスト・5パス（`/ja/profile` `/en/profile` `/en/questions/...` `/ja`×2 `/favicon.ico`）に散っており、**特定ページのバグではなくインスタンス単位の一過性事象**。
- `GET /favicon.ico` の invocation は **CPU Time 10ms / HTTP 503 / "Worker exceeded CPU time limit."**。
- ⚠️ ただし **「CPU上限は10ms（無料プラン）」という推測は誤り**。同じログの `GET /ja` は **CPU Time 73ms で HTTP 200（成功）**。10msが上限なら通らない＝**上限は73ms以上のどこか（未確定）**。月間平均も約39ms/リクエストで整合する。**Workers Paidへのアップグレードは解決策として根拠がないので撤回**。GSCのクロール統計も「問題ありません」（5日で1.05万リクエスト・平均応答375ms）。
- 本番への**同時200×400件のバースト（デプロイ直後含む2回）では1102は再現しない**。＝「普通に使うと壊れる」状態ではない。コールドスタート説も未確認。
- 7/25〜7/27で **level=error は271件**。中身は少なくとも3種類（①1102 ②`translateToLocales: batch translation failed` ③エラー名のない生スタックトレース）。

**確定した別件**: ログの `translateToLocales: batch translation failed`（7/26 02:32:04・02:39:40）が、DBで`title_i18n`が空だった投稿（7/26 02:32:01・02:39:23）と**秒単位で一致**。＝翻訳欠落は**Groq時代＋TPMバグ（7/26 12:39の`abb6159`で修正）**が原因と確定。修正後の3投稿は全て7言語そろっており、**この件はクローズ**。

**入れた修正（すべて本番反映済み）**
1. `middleware.ts`：`/favicon.ico`・`/apple-touch-icon*` は**実体が無くNextのカスタム404(46KB)をフルレンダリング**していた（プローブ3種＝iPhoneは特に踏む）。先頭で**204+1日キャッシュを即返す**ようにし、matcherの除外から`favicon.ico`と`.png`を外して届かせた。※`public/`のファイルはCloudflareのAsset Workerが先に返す（`run_worker_first`未設定＝既定）ので、将来PNGを置いても壊れない
2. `icon.tsx`/`opengraph-image.tsx`：**毎リクエストでSatori生成し直していた**（実測`max-age=0, must-revalidate`）のでキャッシュヘッダーを付与（上のチェックリスト参照）
3. `icon.tsx`：`faviconFont()`のセリフ判定 `includes('serif')` が **`"...sans-serif"`の部分文字列に誤反応**し、MUSIC PRODUCTIONのファビコンが明朝(Lora)で描かれていた。判定前に`sans-serif`を潰して解消（`\bline\b`のLINE ID誤検知と同型のバグ）。修正前後の画像を拡大して目視確認済み

**✅ 結果（同日22:56〜23:20 JSTに検証・ほぼ決着）**
- `level=error` / `Jul 25 – Today` のグラフで、**修正のデプロイ（7/27 04:00頃）以降のバーが消滅＝19時間で0件**。271件は全て修正前で、最大のかたまりは7/25未明〜昼（約60件/バー）。直近1時間も 222 Success / **0 Errors**
- この19時間には**Googlebotのクロール（1日約2,000リクエスト）とエンジニアの負荷テスト550件以上**（同時200×400件、実ブラウザ相当30人×5リクエスト）が含まれており、それでゼロ
- 7/25が最多だった理由も整合する: GSCでクロールが7/22→7/24に急増（bugテナントに5日で7,647リクエスト）し、その1リクエストごとに「46KBの404×最大3種＋ファビコン生成＋OGP生成」が走っていた
- ⚠️ **断定は数日後**（過去も12〜24時間エラーが出ない期間はあった）。**67問の投稿キャンペーン開始時にもう一度この画面を見て、ゼロが続いていれば完全クローズ**

**未解決・次にやること**
- 271件を種類別に集計したい場合は、`.env.local`に`CF_ACCOUNT_ID`＋Workers Observability読み取り権限のトークンを置いてもらえばエンジニア側でAPIから引ける（件数が多いのでスクショより効率的）
- 7/26 11:33の**エラー名のないスタックトレース2件**は未特定（`worker.js:133290`をソースへ対応付ける作業が必要なため後回し）
- **ファビコンの静的化**（テナント作成時に1枚作って`public/`に置き、`/icon`をやめる）は方針としては合意済みだが、**今回のキャッシュで実行時のメリットが小さくなった**ため、質問投稿・AdSense申請の後に回す判断

**🔥 追加で判明した最大の増幅要因＝Link先読み（同日23:30に修正・本番検証済み）**
- ログの`11:33:40.397〜.704`（0.3秒）に`?_rsc=`が20本以上並んでいた。`/ja?tag=...`・`/ja/questions/...`・`/ja?q=...`・`/ja/questions/new`＝**Next.jsのLink先読み**で、**1本ごとにサーバーでページ生成**が走っていた。＝**1回の閲覧が20〜30回のページ生成**に膨らんでいた
- ヘッダー・フッターには既に`prefetch={false}`があったが、**一覧の質問リンク・タグchip・キーワードchip・ページ送り・Cookieバナー**には無かった（ログのURLと完全一致）。**20箇所に`prefetch={false}`を追加**（home 8／profile 5／hard 2／HardQuestionList 1／admin 1／AdminActions 1／質問詳細のパンくず 1／CookieConsentBanner 1）
- **Googlebotは先読みしないので、人が閲覧している時だけ負荷が20倍**になっていた＝エラーがmtさんのクリック中に固まった理由の説明がつく
- 本番検証: HTMLに`prefetch":false`が51箇所／新規タブで`/ja`を開くと**`_rsc`の先読みゼロ**（HTML1本＋静的チャンク13本＋フォントのみ）／質問リンクのクリック遷移は正常（クリック時に`_rsc`を1本だけ取得しページ描画も確認）
- **スタックトレース2件（7/26 11:33）の正体もほぼ判明**: 先読みのキャンセルで`net::ERR_ABORTED`が多発しており（ブラウザのネットワークログで実際に確認）、中断エラーがメッセージ無しのスタックだけで記録されたものと考えられる。**無害**（`/ja`は200を返している）

**🚨 2026-07-28 00:00〜00:31 障害: ソース無変更なのにビルド結果だけが壊れた（解決済み）**
- 症状: **低トラフィックなのに1102(HTTP 503)が6割**。ダッシュボードの **Error Rate 27.8% / Median CPU 21.8ms / 0.9 req/sec**。**全テナント・全ページで一律**（一番軽い`/ja/how-it-works`が90%失敗、一番重い`/ja`が60%＝**ページの重さと無相関**）
- 切り分けの決め手: **負荷が高い方がエラーが少なく（同時25で2.3%）、ほぼ無負荷の方が多い（単発で60%）**。＝CPU予算の枯渇では説明できず、**冷えたisolateの起動処理が上限を超えて失敗**しているsignature（暖まっているものだけ通る）
- 原因: **ビルド成果物**。ソースを1文字も変えず`git commit --allow-empty`で再ビルドしただけで解消（`99aa8019`(異常) → `cf85080e`(正常)）。おそらくチャンク分割の具合で起動コストが上限を超えた。**ロールバックは不要だった**＝今日の修正は全て残っている
- 確認: 再ビルド後、単発20回＋各ページ5回＝**35リクエスト全部200**（`/ja` `/how-it-works` `/hard` `/terms` `bug.`）
- ⚠️**この事象は「同じコードでもpushのたびに起こり得る」**。手順は「重要な実装メモ」の先頭に記載（**単発で叩く／Error Rateを見る／まず再ビルド／それでも直らなければRollback**）
- **経緯の注意（自分の誤診の記録）**: 最初「負荷テストで予算を枯渇させた」と判断し、次に「30分たっても戻らないので壊れている」と判断した。**低トラフィックの方が失敗率が高い**という1点に気づくまで遠回りした。負荷起因かコード起因かは**負荷を変えて失敗率の向きを見る**のが最短

**🔴 2026-07-29〜30 残存する1102（約3%）を実測。AdSense申請前に潰す（未着手・最優先の技術課題）**
- **2026-07-28 01:00の「エラーゼロ」は暖まった状態だけを見た誤った一般化だった**。1日半後（7/29 23:40〜）に測り直すと**低トラフィックでも1102が残っている**。
- **測定条件別の失敗率（実測）**: ①**人がページを見る速さ（10秒に1回×30回＝5分）＝1/30（3.3%）** ②休みなく連続（3〜5 req/s、1クライアント）＝約10%（60回中6回） ③同時25〜100（400件）＝**0%だが遅くなる**（同時100でp50 5.85秒）。**②③はテスト由来の速さで、実ユーザーの体感は①**。
- **体感**: 30ページ見て回ると1回エラーページに当たり、リロードで表示される。サイトが使えないわけではないが、**AdSenseのレビュアーが10ページ見れば一定確率で踏む**ため申請前に潰す。
- **原因の型が確定**: Cloudflareダッシュボードの **Median CPU Time = 141.12ms**（Error Rate 0.4% / 0 req/sec / version 91f20067）。**中央値で141msも使っている＝通常のリクエストが常に上限のすぐ下を走っている**状態で、裾（p99付近）が上限を超えて1102になる。＝**1リクエストあたりのCPUを減らすのが正しい対策**。
- **対策（次セッションの最優先・所要2〜3時間）**
  1. 【mt・1分】Deploymentsの Median CPU Time を再確認（141ms前後なら下記のまま進める）
  2. 【エンジニア・30分】**静的ページ（/terms /privacy /about /how-it-works）をエッジキャッシュ化**。中身が変わらないのでリスクほぼゼロ
  3. 【エンジニア・1時間】**質問詳細ページをキャッシュ化**（効果最大）。事前に「ログイン中/未ログインで内容が混ざらないか」を検証。回答が付いた時の反映は短TTLかオンデマンド再検証で担保
  4. 各段階でデプロイ→単発10回→**人間ペース30回測定**で3%→0%を確認
  5. それでも残るなら **Workers Paid $5** に切替（CPU上限が上がるので確実。月額なので後で戻せる）
- ⚠️ **現状のページは `cache-control: private, no-cache, no-store` で毎回必ずWorkerが動く**。ここがキャッシュ化の起点。
- **判断の順序を間違えないこと**: 「無料で問題なし」と結論づけるには**人間ペースでの測定（10秒に1回×30回）**が必要。連続叩きや同時接続テストだけでは実ユーザーの体験を測れない。

**✅ 2026-07-30未明 A+B② を実施し、CPUを1/3に削減（本番実測・pushはまだ／21:00の結論と一緒に）**
- **A: アイコン/OGPを静的ファイル化**。判断の根拠は実測2点 ①**Workerが生成したレスポンスは`Cache-Control`を付けてもエッジにキャッシュされない**（`/icon`に`s-maxage=2592000`を付けても`cf-cache-status`が付かない）②**`public/`配下の静的ファイルはAsset Workerが返し MISS→HIT する＝Workerを一切通らない**。従来の「動的ルート＋キャッシュヘッダー」はブラウザにしか効いておらず、**新規訪問者は毎回Workerを起動させていた**。
  - `public/icons/{debug,dtm,root}.png`(32x32)・`public/og/{debug,dtm,root}.png`(1200x630) を現行の本番出力から書き出して配置
  - `src/app/icon.tsx`・`opengraph-image.tsx` は **`scripts/image-templates/` へ退避**。⚠️**ファイル規約(app/icon.tsx)はmetadataの指定を上書きする**（Next公式ドキュメントで確認）ので**併存させないこと**
  - ⚠️ルート削除で旧URLが**307→46KBの404ページ生成**という新たな無駄経路を作ってしまい、デプロイ後の検証で発見。middlewareで **`/icon`→`/icons/<tenant>.png`、`/opengraph-image`→`/og/<tenant>.png` へ301** して解消（ブラウザの旧HTMLやSNSがキャッシュしている`og:image`のURLも救済）
  - ⚠️**新テナント追加時は `public/icons/<id>.png` と `public/og/<id>.png` を用意すること**（無いとファビコン/OGPが404）
- **B②: `tenants`テーブルの二重取得を解消**。`generateMetadata`と`layout`本体が同じ行を別々に取得していたのを React の `cache()` でリクエスト内メモ化。
- **結果（本番実測）**: **Median CPU Time 141.12ms → 44.12ms**／Error Rate 0.4%→**0%**／人間ペース **1/30 → 0/120失敗**（20分・`/ja`と`/ja/hard`交互）／静的画像6ファイルすべて`cf-cache-status: HIT`。
  - ※Median CPUが3分の1になった主因は「ページ描画が軽くなった」ことより「**数百msかかる画像生成invocationが母集団から消えた**」こと。ページ自体のCPUが1/3になったわけではない。
- **⚠️「210回0件」の意味を正確に持つこと（プランナー指摘）**: それは「**このビルドは大丈夫**」であって「コードが直った」ではない。7/28に確認したとおり**ソース無変更でもビルドのたびに壊れ得る**ので、**次のpushには適用されない**。投稿フェーズ中も「デプロイ後に単発5〜10回＋Error Rate確認」の恒久ルールを続ける。

**🧊 コールドスタート説は否定された（2026-07-30・既存ログの再検証）**
- 7/29の失敗位置は **1, 3, 5, 8, 19, 23, 29, 30回目**とバラバラで、**5分間連続アクセスした後の30回目でも落ちていた**＝暖まっていても出る。「冷えたisolateの起動失敗」では説明できない。
- 同じコードで **7/28 01:00 は 0/35、7/29 23:40 は 5〜10%**。＝**時間帯・日によって変動する要因**（拠点の状況やビルドのばらつき）が実態。
- **教訓**: 新しく測る前に既存ログの「失敗が何回目だったか」を見る。位置が分かれば原因の型が絞れる。
- そのため測定計画を「冷やして15回」→**「時間帯を変えて各30回×3セット＝90回」**に変更（3%ランダムなら15回で0件でも意味が薄い＝確率63%。210回で0件なら3%説は確率0.2%未満で否定できる）。7/30の 07:00/13:30/21:00 にスケジュール実行で自動測定（`~/.claude/coldstart-probe.log`に蓄積）。
- **✅ 結果（2026-07-30・3セット完了・調査終了）**: 空白を作ってからのプローブを3セット実施し、**全部失敗0件**。
  - セット1: 10:15・30回・直前の空白8時間半 → **0/30**
  - セット2: 14:33・5回・直前の空白4時間 → **0/5**
  - セット3: 18:33・5回・直前の空白4時間 → **0/5**
  - **昨夜の連続120回と合わせて 0/160**。7/29の約3%が続いているなら160回連続成功する確率は0.8%未満なので、**改善したと判断して調査を終了**する。
  - ⚠️**セット2の空白条件は不確実**: 無効化し忘れたスケジュールタスクが13:30に起動した記録があり（ログ未出力＝許可待ちで止まりリクエストは送っていない可能性が高いが断定不可）、もし実行されていた場合セット2の空白は1時間。セット1・3は条件を満たしている。
  - 記録: `~/.claude/coldstart-probe.log`
- **⛔ 打ち切り線（ユーザーとプランナーの合意）**: 3セットで0件なら**調査終了**。出たら**B①（翻訳メッセージ32KBの絞り込み＝ページ描画のCPUを下げる唯一の手）**のみ検討。それ以上は追わない。理由＝3%はリロードで回復する軽症、AdSenseは何度でも再申請できる、一方でコンテンツ側（旧seed削除・BUG休眠化・未解決比率）の方が審査に効く。

**📐 B①（翻訳メッセージの絞り込み）の設計 — 実装はAdSense申請の1回目の結果が出た後（2026-07-30 確定）**
- **現状の無駄**: `messages/ja.json` は29.7KB・24名前空間。`[locale]/layout.tsx` が `<NextIntlClientProvider messages={messages}>` で**24個すべてをどのページでもブラウザへ送っている**。利用規約を開いただけで質問投稿フォームやマイページの文言まで落ちてくる。**これがHTMLが61〜114KBある主因**で、表示速度＝Core Web Vitals＝SEOに効く（CPU削減より効果が大きい可能性あり）。
- **⭐採用する設計（実測で確定）**: 「ページごとに必要な名前空間を選ぶ」のではなく、**「クライアントコンポーネント(`'use client'`)で使われている名前空間だけ送る」**。サーバーコンポーネントは `getTranslations()` でサーバー側から読むのでクライアントに送る必要がない。**全ページ共通の1ルール**で済み、ページ×名前空間の組み合わせを間違える余地がないため**構造的にリスクが低い**（プランナーも当初案よりこちらが優れていると同意）。
- **実測値（24クライアントファイルを走査）**: クライアントで使用 **12.3KB**（profilePage/portalPage/questionForm/contactPage/questionActions/tutorial/home/titles/signupPage/hardPage/loginPage/answerForm/cookieConsent/header/common/footer/skillTags）／**サーバー専用 17.5KB＝59%削減可能**（privacyPage 5.3・termsPage 3.8・howItWorksPage 3.4・**questionPage 3.4**・apiErrors 1.3・notFound 0.2・newQuestionPage 0.0）。
- **リスク**: 唯一の壊れ方は「渡し忘れ→その文言が出ない」。言語数(8)・質問回答の翻訳(title_i18n/body_i18n)・表示内容そのものには**一切影響しない**。
  - ⚠️`useMessages()` を直接使う箇所（マイページの `skillTags` など）は `t()` を使わないので**機械的なgrepで見落としやすい**。実装時に手で確認する。
  - ⚠️名前空間が足りないときに「キー名がそのまま出る」のか「エラーで真っ白」なのかは next-intl の設定次第。**実装前にどちらの挙動か確認する**（後者なら影響が大きい）。
- **⭐確認の優先順位（プランナー指摘・リスクの重み順）**: ①**質問詳細（`/ja/questions/...`・`/en/questions/...`）← `questionPage` がサーバー専用側にあり、壊れると67問全滅**で影響最大 ②トップ（`/ja` `/en`）③`/hard`・マイページ ④terms/privacy/contact/how-it-works（壊れても影響は小さい）。**言語は en/ja を優先**し、他6言語はnoindexなので順位を下げる（「8言語×全ページを均等に見る」より同じ時間で効果が高い）。

**📝 投稿フェーズの運用ルール（2026-07-30 確定）**
- **1問投稿 → `node scripts/verify-latest-post.mjs <tenant> 1` で確認 → OKなら次の1問**。1問目で欠落があれば投稿を止めて原因を追う（7/26に翻訳が無音で欠落した前例があるため／プランナー指摘）。
- スクリプトの確認内容: `title_i18n`/`body_i18n`が7言語そろっているか、AI回答の有無とその翻訳、AI回答が無い場合は**人間ルーティングが割当済みか（宙ぶらりん検知）**。
- **⚠️ 今回の測定は全部GET**。**投稿(POST)＝AI回答生成＋7言語翻訳が最も重い処理**で、これは未検証。だから1問目の確認が必須。
- **作業順序（pushを伴うものは測定後に）**: ①**旧seed削除（SQLのみ・Workerに影響せず測定と並行可）** → ②**音楽36問の投稿開始**（測定は各5分なので 07:00/13:30/21:00 の前後だけ避ける） → ③21:00の結論 → ④**BUG休眠化（`PortalHome.tsx`の`REVIEW_TENANT_IDS`から`bug`削除＝push必要）＋ギターテナント作成をpush** → ⑤ギター31問の投稿開始。
- **⚠️ ギター31問の投稿先テナントはまだ存在しない**。`Guitar & Effector`テナントの新規作成（テナントビルダーの出力を5ファイルへ反映＋タグライン7言語＋GENRE_CONFIG追加＋`public/icons`/`public/og`の画像）が必要。**作成タイミングはユーザーが指示する／テナントビルダーを実際に使って機能確認しながら進める**（ユーザー希望）。音楽の投稿だけで2〜3週間かかるので急がない。

**⚖️ Workers Paid（$5/月）は現時点では不要（2026-07-28 判断）→ ⚠️2026-07-30に「申請前に要対策」へ更新 → A+B②で改善（上記参照）。mtさんの判断は「3%が数分で回復する軽症のためには払わない／AdSenseは何度でも出す」**
- 平常時の実トラフィックは **0.024 req/s**（GSCのクロール1.05万件÷5日）。AdSense審査（レビュアーが数ページ見る）もクロールも余裕がある
- 先読みを止めて**1閲覧＝1回のページ生成**にしたので、**同時に数十人が継続して見ない限り**上限に当たらない（昨日までは1閲覧＝25回で、1〜2人のクリックで7 req/s相当に達していた＝7/27 02:40の事象）
- **払うべきタイミングは「宣伝が当たって人が一気に来る段階」**。ショート動画やRedditが跳ねたら即Paidへ（月額サブスクなのでいつでも戻せる）。それ以外は無料で問題なし

**同時に入れた別の修正**: マイページを開くと**サイト全体の表示言語が保存値(`profiles.language`)へ引き戻される**問題を解消（`/en`で見ていても`/ja/profile`へ強制リダイレクトされ、next-intlが`NEXT_LOCALE=ja`を書くため以降ずっと日本語になっていた）。強制遷移を廃止しURL側のロケールを尊重、保存値と違うときは言語欄に注記を出す（`languageMismatchNote`・8言語）。`profiles.language`は通知メールの言語として引き続き使用。

## マッチングフロー
```
質問投稿
  → Groq AIが回答試みる
  → AIが答えられない or スキルタグなし → スキルマッチでBユーザーを選出 (status=open, matched_b_id=B)
  → Bが回答 → オーナーが「別のメンバーに依頼」→ status=matched_c, matched_c_id=C
  → Cが回答 → オーナーが「高難度移行」→ status=hard（全員公開）
  → いつでもベストアンサーで status=solved
```

## ステータス一覧
| status | 表示 | 説明 |
|---|---|---|
| open | メンバー対応中 | AI回答済み or Bマッチング中 |
| matched_c | 別メンバー対応中 | Cにエスカレーション中 |
| hard | 🔥みんなで解決 | 全員公開クエスト |
| solved | 解決済み | ベストアンサー確定 |
| ai_answered | AI回答済み | AIが回答（旧フロー） |

## テナント追加時の必須チェックリスト

> 📘 **手順の全体像・毎回ミスる11項目・確認コマンドは Notion「テナント作成マニュアル」にまとまっています。**
> https://app.notion.com/p/Wisdom-Assemble-3bdf5fa8bcb981a28bffc084f459fae3
> テナントビルダー（実装依頼文）にも同じ11項目が入るので、Claude側でも必ず確認されます。
> 以下はファイル単位の詳細（マニュアルの3章に対応）。

新テナントを追加するたびに必ず設定すること：

### 1. Supabase `tenants` テーブルにINSERT
| カラム | 例 | 説明 |
|---|---|---|
| `id` | `debug` | ミドルウェアで使うID |
| `name` | `バグ・デバッグ` | 表示名（日本語OK） |
| `description` | `AIが答えられない・不確かな{ジャンル}質問・問題を、人間のエキスパートに繋げるQ&Aサービス` | トップページ説明文（日本語版・2026-07-09〜共通テンプレート化。{ジャンル}部分だけ差し替える。例: debugは「コードのバグや技術的な」） |
| `description_i18n` | `{"en": "...", "zh": "...", "id": "...", "vi": "...", "ko": "...", "es": "...", "pt": "..."}` | トップページ説明文のen/ja以外7言語分（JSONB、2026-07-09追加。当初description_enという専用カラムだったが、8言語に拡張するタイミングで1つのJSONBカラムに統合。ロケールに応じて`description_i18n[locale] ?? description`で参照） |
| `color_theme` | `#10B981` | ロゴ・ボタン色（hex） |
| `subdomain` | `debug` | サブドメイン名 |
| `language` | `ja` または `en` | デフォルト言語 |

### 2. コード側で触る全箇所（テナントIDをキーに持つ設定の完全リスト・2026-07-17時点）

新テナントIDを `newid`、公開サブドメインを `newpub` とする。**★=必須（無いと壊れる/別テナント誤解決）／ジャンル=正しさに必要（未設定だとdebug相当にフォールバックし別ジャンルの候補が出る）／ポータル=ルート掲載時のみ／任意=フォールバックあり**

| 場所 | 定数 | 内容 | 区分 |
|---|---|---|---|
| `middleware.ts` | `VALID_SUBDOMAINS` | `newid` を追加 | ★必須 |
| `middleware.ts` | `SUBDOMAIN_ALIASES` | 公開名≠内部IDのときだけ `{ newpub: 'newid' }` | 条件付 |
| `src/lib/tenantNames.ts` | `TENANT_NAME_MAP` | 英語ロゴ表示名 | ★必須 |
| `src/lib/tenantNames.ts` | `PUBLIC_SUBDOMAIN_MAP` | エイリアス時だけ `{ newid: 'newpub' }` | 条件付 |
| `src/lib/tenantNames.ts` | `TENANT_SEARCH_TAGS` | ポータル検索キーワード | ポータル |
| `src/lib/tenantNames.ts` | `LOGO_STYLE_OVERRIDES` | ロゴビルダー製ロゴを使うときだけ（font/色/size/**widthEmPerChar**）。未設定なら既定のImpact 3Dロゴ | 任意 |
| `src/lib/gemini.ts` | `GENRE_CONFIG` | AIジャンル判定（label/threshold/inScope/outScope/dangerKeywords）。未設定は汎用フォールバック。**thresholdは必ず91から始めること**（Gemini基準。テナントビルダーが古い87を出力する場合は差し替える）。新ジャンルは`calibrate-threshold.mts`で較正して確定する | ジャンル |
| `src/lib/skillTags.ts` | `TENANT_SKILL_OPTIONS` | 専門家が選ぶスキルタグ。未設定はdebug（プログラミング）にフォールバック＝別ジャンルで誤り | ジャンル |
| `src/lib/skillTags.ts` | `TENANT_SUGGESTED_KEYWORDS` | トップ検索の候補キーワード。同上フォールバック注意 | ジャンル |
| `public/icons/{newid}.png` | （画像ファイル） | **32x32のファビコン。無いと404**（2026-07-30に静的ファイル化） | ★必須 |
| `public/og/{newid}.png` | （画像ファイル） | **1200x630のOGP。無いと404**（同上）。生成手順は下記 | ★必須 |
| `scripts/image-templates/opengraph-image.tsx` | `OG_COLORS` | OGP画像の色。**このファイルは退避中のテンプレート**で、実配信は上の静的PNG。色を変えたらPNGを書き出し直す | 任意 |
| `src/app/[locale]/admin/AdminVisitors.tsx` | `tenantKeyOf` の `alias` | 公開名≠内部IDのときだけ。Cloudflare Analyticsはホスト名別集計なので、ここに書かないと**訪問者ダッシュボードで同じテナントが2行に割れる** | 条件付 |
| `src/components/PortalHome.tsx` | `REVIEW_TENANT_IDS` | ルートポータルに掲載する場合に追加 | ポータル |
| `src/components/PortalHome.tsx` | `FALLBACK_COLOR_THEME` | ポータルカードの色フォールバック | ポータル |
| `messages/*.json`（8言語） | `{newid}CardTagline` | ポータルカードのタグライン（8言語ぶん） | ポータル |
| Cloudflare | Custom Domain | `newpub.wisdomassemble.com` を追加 | ★必須 |
| Supabase | `tenants` INSERT | 下記#1 | ★必須 |

- ⚠️**favicon/OGPは「自動生成」ではない（2026-07-30〜）**。`src/app/icon.tsx`・`opengraph-image.tsx` は `scripts/image-templates/` へ退避済みで、配信されるのは `public/icons/<id>.png`・`public/og/<id>.png` の**静的ファイル**。新テナントでは次の手順で書き出す（**順番厳守**）: ①テンプレート2枚を `src/app/` へ一時的に戻す →②デプロイ →③新テナントのホストで `/icon`・`/opengraph-image` を保存して `public/` へ置く →④テンプレートを `scripts/image-templates/` へ**戻す（退避）** →⑤再デプロイ。**④を忘れるとファイル規約がmetadata指定を上書きして静的ファイル化が無効になり、Workerが毎回画像を生成する状態（1102の原因だったもの）に逆戻りする**
- 画像の中身のロジック自体は従来どおりDBの`name`/`color_theme`＋`LOGO_STYLE_OVERRIDES`から生成される（ロゴのtreatmentに追従・30書体をGoogle Font代替で近似）
- ⚠️**【2026-07-27】ファビコン/OGP画像はキャッシュされる**。`/icon`・`/opengraph-image`に`max-age=86400`(ブラウザ1日)・`s-maxage=2592000`(エッジ30日)・`stale-while-revalidate=604800`を付けたので、**テナントの`color_theme`や`name`を変えても最大1日〜30日は古い画像が出る**。「変えたのに反映されない」はバグではない。即時反映したいときはCloudflareでキャッシュをパージする。加えて**ブラウザはファビコンをcache-controlとは別枠で強くキャッシュ**するので、確認するときは`https://<host>/icon`を直接開いてからスーパーリロードする（それでも残るならブラウザ再起動）
- **ロゴを崩さないコツ**: ロゴビルダーで作ったら `canvas.measureText(表示名).width / 表示名.length / fontSizePx` を `LOGO_STYLE_OVERRIDES[newid].widthEmPerChar` に入れる（viewBox幅が実測でぴったり合い、右切れ・中央ズレしない）。指定しなくても`maxWidth:100%`で溢れはしないが、フォントによっては見た目が寄る
- **ロゴのtreatment(2026-07-20〜)**: `LOGO_STYLE_OVERRIDES[newid].treatment`に25スタイル指定可(`globals.css`のfx-*をSiteLogoが`foreignObject`で適用)。未指定は平面グラデ(後方互換)。テナントビルダー(Artifact)で30書体×25スタイルを組んで出力するのが基本
- **テナント別ダークモード(2026-07-20〜)**: `tenants.theme='dark'`で`<html data-theme="dark">`＝全ページダーク(`globals.css`のダーク上書き層)。`tenants.bg_color`で背景色を個別変更。ルートポータルのカードもtheme/bg_colorに追従。INSERTの`theme`/`bg_color`列(migration `20260720000001`)をお忘れなく
- **ローカル確認**: ⚠️**`?tenant=xxx` は効かない**（2026-08-15に実測。middlewareに実装はあるが、そもそも**dev環境ではmiddlewareが1度も実行されていない**＝`/favicon.ico` が204でなく404、`/icon` も301でなく404 で確認）。`x-tenant-id` ヘッダーが効くのは、middlewareが無い分 `tenant.ts` がリクエストヘッダーを直接読むため。**必ずヘッダーで指定すること**:
  ```bash
  curl -s -H "x-tenant-id: newid" http://localhost:3000/ja    # テナント本体
  curl -s -H "x-tenant-id: root"  http://localhost:3000/ja    # ルートポータルのカード
  ```
  ブラウザで見た目を確認したいときは、上のHTMLを `public/icons/_preview.html` 等に保存して `http://localhost:3000/icons/_preview.html` を開く（同一オリジンなので `/_next/...` のCSS・フォントがそのまま解決し、ロゴのfx-*も正しく描画される）。**確認後は必ず削除すること**

### 3. UI規則（CSSやロゴデザインが変わっても必ず守ること）
- ログインページのロゴは **左揃え**
- ロゴの左端は「+ 質問する」ボタンの左端に **揃える**
- ロゴ色は `color_theme` が自動反映される

### 4. Supabase権限（テナントテーブルのSELECT権限）
初回のみ実行：
```sql
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.tenants TO service_role;
```

### 5. 将来対応予定（未実装）
- `bg_color`：背景色（デフォルト：白）
- `text_color`：本文テキスト色（デフォルト：グレー）
- `logo_style`：ロゴスタイル（`bold3d` / `neon` / `retro`）

---

## 重要な実装メモ
- 🚨**【2026-07-28】デプロイ後は必ず正常性を確認する（同じコードでもビルドのたびに壊れることがある）**。2026-07-27深夜に**ソース無変更なのにビルド結果だけが壊れ、低トラフィック時に1102(HTTP 503)が6割発生**する事象が起きた（Cloudflareダッシュボードの Error Rate も 27.8%）。**同じソースで再ビルド（空コミットpush）しただけで解消**＝壊れていたのはコードでなくビルド成果物。**docsだけのpushでもWorker全体が再ビルドされるので、どのpushでも起こり得る**。手順: ①push後に**単発で5〜10回**叩く（並列ではなく単発。この不具合は**アクセスが少ないほど失敗率が上がる**＝冷えたisolateの起動が失敗するため、並列テストでは見逃す） ②Deployments タブの **Error Rate** を見る（0%台が正常・20%超は異常） ③異常なら**まず同じソースで再ビルド**（`git commit --allow-empty` → push）、直らなければ Deployments の **Rollback**（GitHubのコードは変わらない・DBにも影響なし）
- ⚠️**【2026-07-27】新しく`<Link>`を追加するときは原則`prefetch={false}`を付ける**。Next.jsの既定（`auto`）だとリンクがビューポートに入るだけで先読みが走り、**その1本ごとにサーバーでページ生成**される。実測でトップページを1回開くと0.3秒間に20本以上の`?_rsc=`が飛び、**1閲覧が20〜30回のページ生成に膨らんでいた**（1102の主要因）。修正後は`_rsc`の先読みゼロ・クリック時に1本だけ取得＝クリック遷移は従来どおり動く。**先読みは本番のみ有効なのでローカルでは再現しない**（確認は本番でブラウザのネットワークログを見る）
- **【2026-07-17〜】questions/answersへの書き込み(INSERT/UPDATE)・全security definer RPCは必ずservice_role(admin)クライアント経由で行うこと**。一般ロール(anon/authenticated)向けのRLSは`questions_insert`/`answers_insert`=`with check(false)`、`questions_update`=`auth.uid()=user_id`のみに締めてあり、userクライアントで新規に書き込むと権限エラーになる。共通ヘルパー`createAdminClient()`（`src/lib/supabase/admin.ts`）を使う。`profiles`はlanguage列のみ、`tenant_profiles`は本人編集列(display_name/skill_tags/is_available/email_notify/active_title_id)のみ列単位GRANT済み（実績カウント等はRPCのみが更新）
- **AI回答生成はaskWithScoreInScope()に統合済み**（ジャンル判定＋回答＋スコア＋tagsを1回のGroq呼び出しで取得）。checkInScope/askWithScoreは後方互換で残置。質問投稿フローは①askWithScoreInScope→②質問INSERT(tags含む)→③結果を再利用してAI回答/マッチング、の順
- **自動高難度移行はpg_cronの`auto_escalate_expired()`（15分ごと）**。旧`auto_escalate_to_hard`は削除済み。B/C両段階で「担当者が期限切れまで未回答」の質問をhard化
- `canEscalateHard = isOwner && !isSolved && !isHard && isMatchedC && hasCAnswer`（Bステージでは絶対に出さない）
- `canRematch = isOwner && !isSolved && isOpen && question.matched_b_id && (hasAnswers || !!bExpired)`（期限切れでも質問者がアクション可能）
- `isExpiredMatchedB = user?.id === question.matched_b_id && isOpen && !!bExpired`（期限切れ専門家向けUI表示用）
- `bExpired/cExpired` の宣言は `canRematch` より前に置くこと（temporal dead zone回避）
- DB更新系APIは全てservice_role使用（RLS回避）
- `findMatch`の除外フィルター: `tenant_profiles`に対して`.not('user_id', 'in', \`(${excludeUserIds.join(',')})\`)` （引用符なし。2026-07-14にテナント分離のため`profiles`→`tenant_profiles`へ変更、カラム名も`id`→`user_id`）
- **新規テーブルを作るマイグレーションでは、RLSポリシーだけでなく`anon`/`authenticated`へのGRANTも必ずセットで書くこと**（2026-07-14の教訓。`grant select, insert, update, delete on <table> to anon, authenticated;`。既存テーブルは初期スキーマ作成時にGRANT済みだが、新設テーブルはRLSポリシーを設定してもGRANT自体がないとPostgRESTから`42501 insufficient_privilege`で弾かれ、RLSの設定ミスと誤認しやすいので要注意）
- テナント別プロフィール情報（表示名・スキルタグ・稼働状態・通知設定・実績カウント・称号）は`profiles`ではなく`tenant_profiles`（`tenant_id, user_id`複合キー）を参照すること。`profiles`には認証まわり（`id`/`is_banned`/`created_at`/`language`）だけが残っている
- 通知メール（`notifyMatchedUser`）の言語判定は`tenants.language`ではなく、受信者本人の`profiles.language`を優先すること（マッチされた本人がマイページで選んでいる表示言語に合わせるのが正しい仕様）

## ディレクトリ構成
```
src/
  app/
    page.tsx                        # トップ（質問一覧）
    layout.tsx
    questions/
      new/page.tsx                  # 質問投稿ページ
      [slug]/page.tsx               # 質問詳細
    api/
      questions/
        route.ts                    # 質問投稿API（AI回答 + マッチング）
        [id]/
          escalate/route.ts         # エスカレーション（B→C→hard）
          review/route.ts           # 既読マーク（owner_reviewed_at更新）
      answers/route.ts              # 回答投稿API（重複チェックあり）
      contact/route.ts              # 問い合わせフォームAPI（Brevo経由で運営者Gmailに転送）
      admin/
        questions/[id]/route.ts     # 管理者 質問削除
        users/[id]/ban/route.ts     # 管理者 BAN
    auth/
      login/page.tsx
      callback/route.ts
    admin/page.tsx
    profile/page.tsx
    hard/page.tsx
    how-it-works/page.tsx
  components/
    Header.tsx                      # バッジ（taskCount + reviewCount、既読フィルタ済み）
    QuestionForm.tsx                # 投稿フォーム + オーバーレイアニメーション
    QuestionActions.tsx             # RematchButton / EscalateHardButton / GiveUpButton + MatchingOverlay
    AnswerForm.tsx
    OwnerReviewTracker.tsx          # 質問詳細で既読API呼び出し
    StatusBadge.tsx
    TenantProvider.tsx
  lib/
    matching.ts                     # findMatch() + calcDeadline()
    email.ts                        # Brevo送信（notifyMatchedUser / sendContactInquiry）
    supabase/client.ts
    supabase/server.ts
    supabase/types.ts
    tenant.ts
supabase/migrations/               # DBマイグレーション履歴
```

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

## Supabase
- URL: https://scnkpmxvtwtsxzbhfdnf.supabase.co
- プロジェクト名: wisdom-assemble

## Google OAuth
- Client ID: 1004222264906-2nlc88pq3irlve65ul8b95ju5mbbm3ns.apps.googleusercontent.com
- テストユーザー: wisdomassemble@gmail.com

## テストアカウント（開発用・リリース前削除）
パスワードは全員 `test1234`（オーナーのみGoogleログイン）
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
- **バンド安定性を実測（閾値91の妥当性検証・プランナー指摘🟡3）**: スコアは5点刻みでブレるため「誤答が95に上がって公開されないか」を検証した。既知の誤答2問を独立に複数回実行した結果、**G02=[90,90,85,90,85,90,90]（7回）／G23=[90,90,70,85,65,90]（6回）＝計13サンプルで一度も91以上に達しなかった**。逆に正答は95→90に落ちることがある（G06）。つまり**ブレは「AI公開率が下がる」方向にしか効かず、誤答が公開される方向には出ていない＝安全側**。閾値91は妥当と判断する。※将来モデルを変えたら必ず再測定すること。
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

### 🚩 次セッションの入口（2026-07-30 更新・ここから読む）

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
- [ ] **A3. GUITAR & PEDALSテナント作成**（表示名`GUITAR & PEDALS`／サブドメイン`guitar.`）— エンジニア＋mtさん
  - ⭐**使うのは新版のテナントビルダー**: https://claude.ai/code/artifact/cad8ed82-9f1f-4131-b389-5be73c9ada22 （**ファビコン32x32とOGP1200x630のPNG自動生成つき**＝下のB2がこれで解決する）
  - ⚠️**旧版を開かないこと**: https://claude.ai/code/artifact/fa1da2f5-d0dc-42fb-b225-55b64d031206 （2026-07-17版・**画像生成がないのでB2が漏れる**）
- [ ] **A4. 誤字4件の修正**（投稿前）: M33「エッセンシャル」→**Elements**／G02「クアッドコア・デュアルコア」→**クアッド・デュアル**／G31「コンダンサー」→**コンデンサー**／M22「他ダム」→**他タム**
- [ ] **A5. 67問の投稿完了**（音楽36＋ギター31・約3週間）— mtさん・妻。配分は🤖22／✅BA選択31／📝回答のみ8／🔥高難度6＝**回答ゼロは6問(9%)に抑える**
- [ ] **A6. 投稿1問目でDB確認**（`node scripts/verify-latest-post.mjs <tenant> 1`）— AI回答と8言語の`title_i18n`/`body_i18n`が入ったか。**欠落があれば投稿を止めて原因を追う**

**【B. 技術・コード】※すべてpushを伴うので申請より前に済ませる（審査中はpush保留の方針）**
- [ ] **B1. Googleログインのみ化**（メールログインのUIを隠す。認証テーブル・データは消さない）— エンジニア
- [x] **B6. 質問詳細のソフト404を直す** — **2026-08-08 完了**。`loading.tsx` を削除。折衷案（回答一覧だけSuspense）と generateMetadata案は実測で不採用
- [ ] **B2. 新テナントの画像を用意**：`public/icons/guitar.png`(32x32)と`public/og/guitar.png`(1200x630)。**無いとファビコン/OGPが404になる**（2026-07-30のA対応で静的ファイル化したため）。→ **新版テナントビルダー（A3のURL）が2枚とも自動生成する**ので、出力されたPNGを所定の場所に置くだけでよい
- [ ] **B3. Google OAuthアプリの本番公開**（現在「テスト中」＝テストユーザーのみ・上限100）。**seed段階（本人＋妻）は不要、実ユーザー公開の直前に必須**。ログイン用の基本スコープのみなら審査不要で即公開可
- [ ] **B4. Brevoメール通知の本番到達確認**（妻→本人マッチで実際に受信箱に届くか＋迷惑メール判定されないか）。**投稿の👤ルート1問目で自動的に検証できる**
- [ ] **B5. About/運営者情報の十分性チェック**（AdSenseは運営者の明確さを見る。現状Footerに統合済み）

**【C. GSC】※申請の可否を判断する材料はここ**
- [ ] **C1. sitemap.xml の再送信**（新しい67問が入っているか）。**基本はこれ**＝自動的にクロールされる
- [ ] **C2. sitemapに404のURLが残っていないか**確認。旧シード削除で約80件が404になるが、**sitemapに残っていると「sitemapにエラー」扱いになる**
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
- [ ] **E1. 削除から申請まで1.5〜2ヶ月を空ける**。**削除直後の申請が最悪**＝「旧URL約80件が404で残り、新問は未インデックス」＝サイトが壊れて見える
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
- **ローカル確認**: 開発サーバはmiddleware未実行なので `http://localhost:3000/ja?tenant=newid` の `?tenant=` パラメータでテナントを指定して確認できる（middlewareの開発分岐がparam/headerを許可）。**ルートポータルのカード確認は `?tenant=root`**（新テナントのカード追加状態・ダーク/ライトを確認）

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

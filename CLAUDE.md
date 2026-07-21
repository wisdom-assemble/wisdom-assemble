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
- **Groq有料化＋Spend Limit（最重要・赤字の物理的な蓋＝③）**: 全体AU100到達時に判断。Developer planへ切替 → `Settings→Billing→Limits` で **Spend Limit ¥1,000スタート**（アラート50/75/90%）→ 実績を見て段階引き上げ（DAU500で¥3,000〜5,000、採算ラインで¥1万〜、スケール後¥2万目安）。無料枠ではSpend Limit設定不可。有料化後はアプリ自主上限も**ダッシュボード（管理→サマリー→AIコスト上限）でトグルON＋件数設定**（旧SQL手打ちは不要に）。反映10〜15分ラグあり＝上限は余裕を持たせる。
- **AdSense**: 申請 → 承認後に `public/ads.txt` 設置・Funding Choices(CMP)有効化。
- **Stripe Connect**: 投げ銭機能実装後に申請（承認後に本番決済有効化。資金決済法の専門家相談は本番で資金分配する前に）。
- **収益/黒字のダッシュボード表示**: AdSense/Stripe/アフィリのAPI連携で`daily_revenue`表に投入後に有効化（黒字額=収益−Groqコスト）。

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
| `src/lib/gemini.ts` | `GENRE_CONFIG` | AIジャンル判定（label/threshold/inScope/outScope/dangerKeywords）。未設定は汎用フォールバック | ジャンル |
| `src/lib/skillTags.ts` | `TENANT_SKILL_OPTIONS` | 専門家が選ぶスキルタグ。未設定はdebug（プログラミング）にフォールバック＝別ジャンルで誤り | ジャンル |
| `src/lib/skillTags.ts` | `TENANT_SUGGESTED_KEYWORDS` | トップ検索の候補キーワード。同上フォールバック注意 | ジャンル |
| `src/app/opengraph-image.tsx` | `OG_COLORS` | OGP画像の色。未設定はindigo | 任意 |
| `src/components/PortalHome.tsx` | `REVIEW_TENANT_IDS` | ルートポータルに掲載する場合に追加 | ポータル |
| `src/components/PortalHome.tsx` | `FALLBACK_COLOR_THEME` | ポータルカードの色フォールバック | ポータル |
| `messages/*.json`（8言語） | `{newid}CardTagline` | ポータルカードのタグライン（8言語ぶん） | ポータル |
| Cloudflare | Custom Domain | `newpub.wisdomassemble.com` を追加 | ★必須 |
| Supabase | `tenants` INSERT | 下記#1 | ★必須 |

- **favicon(`src/app/icon.tsx`)はDBの`name`/`color_theme`＋`LOGO_STYLE_OVERRIDES`から自動生成**＝コード編集不要。2026-07-20〜ロゴのstyle(treatment)に追従(gradient/3d/solid)＋30書体をGoogle Font代替で近似
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

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

**次にやること（確定）**:
①ルートサイト＋BUG＋MUSIC PRODUCTIONをAdSense・Stripe Connect申請用バージョンとして仕上げる（品質を上げる段階。ads.txtはAdSense登録後、重複データ削除はユーザー判断のタイミングで）
②Google AdSense・Stripe Connectを申請（ユーザーのアクション）
③Stripe Connect承認後に投げ銭（チップ）機能の実装に着手

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

### 2. コード `src/components/SiteLogo.tsx` の `NAME_MAP` に追記
```ts
'テナント名': 'ENGLISH LOGO',
```

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
- `canEscalateHard = isOwner && !isSolved && !isHard && isMatchedC && hasCAnswer`（Bステージでは絶対に出さない）
- `canRematch = isOwner && !isSolved && isOpen && question.matched_b_id && (hasAnswers || !!bExpired)`（期限切れでも質問者がアクション可能）
- `isExpiredMatchedB = user?.id === question.matched_b_id && isOpen && !!bExpired`（期限切れ専門家向けUI表示用）
- `bExpired/cExpired` の宣言は `canRematch` より前に置くこと（temporal dead zone回避）
- DB更新系APIは全てservice_role使用（RLS回避）
- `findMatch`の除外フィルター: `.not('id', 'in', \`(${excludeUserIds.join(',')})\`)` （引用符なし）

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

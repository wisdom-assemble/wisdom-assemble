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
- **アーキテクチャ確定**: next-intlでURL prefix方式。`profiles.language`（text型、Google locale自動取得＋初回ログイン後に言語選択UIで本人確認）。質問・回答は投稿時に8言語へ自動翻訳してDB保存（翻訳ボタン方式は不採用、SEO優位性のため）。翻訳は`llama-3.1-8b-instant`、AI回答は`llama-3.3-70b-versatile`と使い分けてコスト約10分の1に削減
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

**次にやること（確定）**: 多言語対応の実装から着手する（`profiles.language`カラム追加 → Google locale自動取得 → next-intl導入 → 質問・回答の自動翻訳の順。詳細設計はNotionローンチチェックリスト「多言語対応」セクション参照）。その後にフェーズ2（AdSense審査用2テナント準備）へ進む

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
| `description` | `コードのバグや...` | トップページ説明文 |
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

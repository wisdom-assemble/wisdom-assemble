# Wisdom Assemble - 引き継ぎドキュメント

> 次のClaudeセッションはこのファイルを最初に読むこと。
> プロジェクトの全体像・実装状況・ロードマップが全てここに集約されている。

最終更新：2026/06/27

---

## プロジェクト概要

AIが答えられない・不確かな質問を、人間のエキスパートにルーティングするC2C Q&Aサービス。

> 「AI時代だからこそ必要な、AIではできないセカンドオピニオンサービス。AIが普及するほどニーズが増える逆張り戦略。」

### 収益ゴール

| 指標 | 目標 |
|---|---|
| サイト数 | 20サイト |
| 1サイト月収 | 約¥10,000（ドネーション＋広告） |
| 月収合計 | 約¥200,000 |
| ランニングコスト | 実質¥0（ドメイン代のみ） |

---

## 技術スタック

| 役割 | 採用 |
|---|---|
| フロント | Next.js 14 App Router + TypeScript |
| DB・認証 | Supabase (PostgreSQL + RLS + Auth) |
| AI | Groq API (llama-3.3-70b-versatile) |
| スタイル | Tailwind CSS |
| ホスティング | Cloudflare Pages（予定） |
| バージョン管理 | GitHub (wisdom-assemble) |

---

## マルチテナント量産戦略

1コードベースでサブドメインごとにジャンルを切り替える。
**新ジャンル追加 = `src/lib/gemini.ts` の `GENRE_CONFIG` に1エントリ追加するだけ。**

```
wisdomassemble.com（メイン・表に出さない）
  ├ debug.wisdomassemble.com   → プログラミング・デバッグ（閾値87）
  ├ tax.wisdomassemble.com     → 確定申告・税務（閾値87）
  ├ medical.wisdomassemble.com → 医療・健康（閾値90）
  └ ...最大20サイトまで横展開
```

ステルスブランディング：各サブドメインを独立サービスに見せる（ロゴ・カラーのみ変える）

---

## 質問フロー（確定仕様・UX図解準拠）

```
質問投稿
  ↓
① ジャンル判定（YES/NO） ← AIが保存前に実行
  → NO：投稿を弾く・DBに保存しない
  → YES：②へ

② AI回答生成 + 信頼度スコア（0〜100）
  → スコア >= 閾値87：AI回答を表示 → status: ai_answered
  → スコア < 閾値87：人間Bへルーティング → status: open

③ 人間Bにマッチング（クローズド・24h制限）
  → matched_b_id / matched_b_deadline をDBに記録
  → B が回答 → 質問者がベストアンサー選択 → status: solved
  → B がギブアップ or タイムアウト → Cへエスカレーション

④ 人間Cにマッチング（クローズド・24h制限）
  → matched_c_id / matched_c_deadline をDBに記録
  → C が回答 → solved
  → C がギブアップ or タイムアウト → 高難度クエスト昇格

⑤ 高難度クエストボード（status: hard・全員オープン・時間制限なし）
  → 誰でも回答可。質問者がベストアンサーを選択 → solved
```

---

## AIルーティングロジック（src/lib/gemini.ts）

### GENRE_CONFIG パターン

```typescript
const GENRE_CONFIG = {
  debug:   { label: 'プログラミング・デバッグ', threshold: 87, inScope: '...', outScope: '...' },
  tax:     { label: '確定申告・税務',           threshold: 87, ... },
  medical: { label: '医療・健康',               threshold: 90, ... },
  // 新ジャンル追加はここに1行
}
function getConfig(tenantId: string) { return GENRE_CONFIG[tenantId] ?? { threshold: 87, ... } }
```

### 確定閾値（テスト③ 2026/06/27）

| カテゴリ | 閾値 | 備考 |
|---|---|---|
| 全般 | **87** | テスト③で確定 |
| 医療 | **90** | 命に関わる |
| セキュリティ | **AI完全無効** | スコア問わず即人間へ |

### ハルシネーション補正

```typescript
function adjustScore(score, answer) {
  if (/かもしれません|と思われます|可能性があります/.test(answer)) score -= 20
  if (/最新の情報|私の知識.*まで|確認.*ください/.test(answer)) return 0
  if (answer.length > 500) score -= 10
  return Math.max(0, score)
}
```

追加ルール：
- 「本番〜」「突然〜」「インシデント」を含む質問 → adjustScore -20
- セキュリティカテゴリ → AI完全無効（dangerKeywords で検知）

---

## マッチングロジック（src/lib/matching.ts）

```typescript
findMatch(tenantId, questionId, excludeUserIds[])
  → 質問本文にスキルタグが含まれる数 × 20
  → + answer_count × 0.1
  → スコア上位者を選出（is_available=true・除外リスト適用）

calcDeadline(hours)
  → 現在時刻 + hours をISO文字列で返す
```

---

## DBスキーマ（主要テーブル）

### questions
```
id, tenant_id, user_id, title, body, slug
status: open | ai_answered | matched_c | hard | solved
ai_score, view_count, solved_at, solved_by
matched_b_id, matched_b_deadline   ← 20260627000002で追加
matched_c_id, matched_c_deadline   ← 同上
time_limit_hours
```

### answers
```
id, question_id, tenant_id, user_id
body, is_ai, ai_score, is_accepted
created_at
```

### profiles
```
id (= auth.users.id)
username, display_name, bio, avatar_url
skill_tags[]    ← 20260627000001で追加
is_available    ← 同上
answer_count    ← 同上（increment_answer_count()で更新）
```

### マイグレーション適用済み
- `20260627000001_phase_a.sql` ← skill_tags, is_available, answer_count
- `20260627000002_matching.sql` ← matched_b/c_id, deadline, RLS更新

### service_role権限（付与済み）
```sql
grant select, insert, update, delete on public.questions to service_role;
grant select, insert, update, delete on public.answers to service_role;
grant select, insert, update on public.profiles to service_role;
```

---

## 実装状況（2026/06/28 現在）

### ✅ 完了

**Phase 0（基盤）**
- ジャンル判定・AI回答生成・信頼度スコア
- 質問投稿・一覧・詳細ページ
- Google認証 + メール/パスワード認証（テスト用）
- AnswerForm（x-tenant-idヘッダー付き）

**Phase A（マッチング）**
- ベストアンサーボタン（`/api/answers/accept`）
- B→C→高難度クエストのクローズドマッチング（`/api/questions/[id]/escalate`）
- プロフィールページ（スキルタグ・稼働状態）（`/profile`）
- 高難度クエストボード（`/hard`）
- タイトル最低文字数：5文字（英語対応）
- 質問一覧の表示上限：200件に変更（元50件）

**Phase B（公開前必須）**
- チュートリアルページ（`/how-it-works`・ヘッダーに「使い方」追加）
- お問い合わせフォーム（`/contact`・mailto方式）
- プライバシーポリシー（`/privacy`）
- 管理者ダッシュボード（`/admin`・質問削除・ユーザーBAN・wisdomassemble@gmail.comのみ）
  - `20260628000001_phase_b.sql`：`profiles.is_banned` カラム追加
- マイページに「投稿した質問」タブ追加（`/profile`）
- キーワード検索（title/body の ILIKE 検索）
- 質問一覧ページネーション（20件/ページ・URLパラメータ `?q=&page=`）
- バグ修正：マッチング候補なし時に `open` で止まる問題 → B候補なし→C探索→Cもなし→即`hard`昇格

### ❌ 未実装（フェーズC）

**リリース前に必須（フェーズC優先）**
- ログインページのメール/パスワード認証を削除 → Googleログインのみに（テスト用として追加したもの・個人情報を自社で持たない方針）
- テストデータ（RPGシミュレーション質問）をDBから一括削除
- 人間回答の最低文字数バリデーション（No.17：空回答防止・20文字以上）
- `time_limit_hours` カラム・UIの削除（24h固定化）

**フェーズC（公開後）**
- 回答フィードバックボタン（役に立った/立たなかった）
- 重複質問チェック（pgvector + Embedding）
- 称号システム
- 通知システム（メール/プッシュ）
- 多言語対応
- Cloudflare Pages デプロイ

---

## 仕様確定事項（2026/06/27）

### 時間制限
- 質問者が時間を選ぶ機能は**廃止**
- システム固定24h（確定）で自動エスカレーション（テスト⑥で決定）
- `time_limit_hours`カラム・UIは次セッション以降で削除予定（フェーズC）

### マッチングの思想（絶対に変えない）
- マッチングで「繋がり」を作るのがこのサービスの核心
- 高難度クエストはあくまで最後の手段
- いきなり全公開にする抜け道は作らない（普通の掲示板と差別化できなくなる）

### notifyCount（通知上限）
- **本番サービス：5**（1日5回まで・それ以上はユーザーが離脱する）
- **テスト用：10〜20**（シミュレーションで候補なし多発を防ぐため）

### ユーザー属性検索
- 回答者をスキルで検索する機能は**不要**（マッチングシステムが代替するため）

---

## テスト履歴

| テスト | スクリプト | 結果 | Notion |
|---|---|---|---|
| ③ 閾値決定（100問×3回） | `scripts/threshold-test-100.ts` | 閾値87確定 | `38bf5fa8-bcb9-80f1-bede-f2876b7ef115` |
| ④ AIユーザーRPG（100問） | `scripts/rpg-simulation-v4.ts` | B→C→hard フロー検証 | `38bf5fa8-bcb9-80e6-85d7-dd26c7b40883` |
| ⑤ ローカル実サイトRPG（100問） | `scripts/local-rpg-test.ts` | 実DB書き込み検証 | `38cf5fa8-bcb9-817a-a247-d57f828700d5` |
| ⑥ AIペルソナ意見収集＋RPG（50問） | `scripts/test6-rpg.ts` | → 下記参照 | `38cf5fa8-bcb9-8193-9028-cde3ebdd98e6` |

### テスト⑤ 結果サマリー（2026/06/27）

| 解決経路 | 件数 | 割合 |
|---|---|---|
| AI解決 | 46問 | 46% |
| 人間B解決 | 25問 | 25% |
| 人間C解決 | 8問 | 8% |
| 高難度クエスト | 21問 | 21% |

カテゴリ別高難度率：Git 88% / Node.js 75% / Supabase 33% / セキュリティ 33%
※Git/Node.jsはnotifyCount上限（5回）に達したため候補なしが多発。

### テスト⑥ 結果サマリー（2026/06/28）

テスト条件：パートA（12ペルソナ時間制限意見収集） + パートB（47問・notifyCount=10・AI閾値87）

| 解決経路 | 件数 | 割合 |
|---|---|---|
| AI解決 | 4問 | 9% |
| 人間B解決 | 25問 | 53% |
| 人間C解決 | 8問 | 17% |
| 高難度クエスト | 10問 | 21% |

※AI解決率9%はGroq rate limitでスコアが0になった影響。実際はテスト⑤の46%に近い数値になるはず。
※notifyCount=10にしたことでGit/Node.jsの「候補なし」は大幅に解消。
※パートA時間制限意見収集：平均理想時間11h、分布は1h×1人・2h×3人・6h×4人・24h×4人。

---

## 主要ファイル構成

```
src/
  app/
    api/
      questions/route.ts              # 質問投稿・AI判定・マッチングB選出
      questions/[id]/escalate/route.ts # ギブアップ→C→hard エスカレーション
      answers/route.ts                # 回答投稿
      answers/accept/route.ts         # ベストアンサー選択
    questions/[slug]/page.tsx         # 質問詳細（マッチング制御）
    hard/page.tsx                     # 高難度クエスト一覧
    profile/page.tsx                  # プロフィール（スキルタグ・稼働設定）
    auth/login/page.tsx               # メール/パスワードログイン
  lib/
    gemini.ts                         # GENRE_CONFIG・askWithScore
    matching.ts                       # findMatch・calcDeadline
    tenant.ts                         # テナントID取得
  components/
    QuestionActions.tsx               # AcceptButton・GiveUpButton
    AnswerForm.tsx                    # 回答フォーム
    Header.tsx                        # ヘッダー
supabase/migrations/
  20260627000001_phase_a.sql
  20260627000002_matching.sql
scripts/
  create-test-users.ts               # 12ペルソナ作成（password: test1234）
  fix-profiles.ts                    # profilesレコード手動作成（初回セットアップ用）
  local-rpg-test.ts                  # テスト⑤（実DB版RPGテスト・100問）
  test6-rpg.ts                       # テスト⑥（パートA意見収集＋パートBRPG・50問）
  rpg-simulation-v4.ts               # テスト④（純シミュレーション版）
  count-hard.ts                      # 高難度クエスト件数確認ユーティリティ
```

---

## テストユーザー（12ペルソナ）

全員パスワード: `test1234`

| email | 名前 | スキルタグ |
|---|---|---|
| takeshi@test.com | Takeshi | Linux, セキュリティ |
| yuki@test.com | Yuki | React, CSS, TypeScript |
| ryo@test.com | Ryo | SQL, PostgreSQL |
| mia@test.com | Mia | AWS, Docker |
| shin@test.com | Shin | Python |
| hana@test.com | Hana | セキュリティ, Supabase |
| ken@test.com | Ken | React, JavaScript |
| aoi@test.com | Aoi | Python, AWS |
| taro@test.com | Taro | JavaScript, React, Python, SQL |
| noa@test.com | Noa | JavaScript |
| john@test.com | John | React, Node.js, TypeScript, AWS, Docker, SQL |
| anthony@test.com | Anthony | React, TypeScript, Node.js |

---

## Notionページ一覧

| ページ名 | page_id |
|---|---|
| 開発まとめ（親） | `38bf5fa8-bcb9-80cb-a315-c0dc194c6fdc` |
| 開発仕様書（現行） | `38cf5fa8-bcb9-8160-9701-d619e8c5841b` |
| プロジェクト仕様書（初期コンセプト） | `38af5fa8-bcb9-8065-9ccb-c55550c8d4ed` |
| バグトラック | `38af5fa8-bcb9-802c-862b-dd515be9f586` |
| 開発ログ | `38af5fa8-bcb9-80d1-ac24-d3b3478d0fde` |
| テスト③ 閾値決定 | `38bf5fa8-bcb9-80f1-bede-f2876b7ef115` |
| テスト④ AIユーザーRPG | `38bf5fa8-bcb9-80e6-85d7-dd26c7b40883` |
| テスト⑤ ローカル実サイトRPG | `38cf5fa8-bcb9-817a-a247-d57f828700d5` |
| テスト⑥ AIペルソナ意見収集・時間制限最適化 | `38cf5fa8-bcb9-8193-9028-cde3ebdd98e6` |
| UX図解 | `38bf5fa8-bcb9-8051-930d-cbb36ef40855` |

---

## Supabase

- URL: `https://scnkpmxvtwtsxzbhfdnf.supabase.co`
- service_role権限付与済み: questions / answers / profiles（SELECT, INSERT, UPDATE, DELETE）
- RLSポリシー: questions/answers は `using (true)` で全員読み取り可

---

## 次のセッションでやること

1. **フェーズCの優先度高いものから着手**
   - 人間回答の最低文字数バリデーション（AnswerForm.tsx + `/api/answers/route.ts`・20文字以上）
   - `time_limit_hours` カラム・UIの削除（24h固定化・マイグレーション作成）
2. **Cloudflare Pages デプロイ準備**（本番公開に向けた環境設定）
3. **Notion更新**（開発ログ・バグトラックに本セッション分を追記）
   - バグトラック: `38af5fa8-bcb9-802c-862b-dd515be9f586`
   - 開発ログ: `38af5fa8-bcb9-80d1-ac24-d3b3478d0fde`

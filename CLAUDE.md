@AGENTS.md

# Wisdom Assemble - Claude向けプロジェクト情報

## プロジェクト概要
マルチテナントQ&Aプラットフォーム。AIが先に回答し、答えられない場合は人間の専門家にマッチングする。
「AIの隙間を人間が埋める」コンセプト。

## ビジネスモデル
- ジャンル別サブドメイン（例: debug.wisdom-assemble.com）
- 20〜100サイト展開予定
- 収益: ドネーション + 広告

## 技術スタック
- Next.js (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS
- Anthropic Claude API
- Vercel（デプロイ先）

## 重要ポリシー
- **セキュリティ・有料サービスは必ず事前に確認してから進める**
- **認証はGoogleログインのみ** - 個人情報を自社で持たない方針
- **service_roleキーは絶対に公開しない**（RLSをバイパスするため）
- バグ・懸念事項はNotionバグトラックに最新が上になるよう追記
- 開発ログはNotionに定期的にアーカイブする

## Notionドキュメント
- バグトラック page_id: 38af5fa8-bcb9-802c-862b-dd515be9f586
- 開発ログ page_id: 38af5fa8-bcb9-80d1-ac24-d3b3478d0fde
- 基本用語 page_id: 38af5fa8-bcb9-80a7-8b9b-da2f6d7064ae
- プロジェクト仕様書 page_id: 38af5fa8-bcb9-8065-9ccb-c55550c8d4ed

## Supabase
- URL: https://scnkpmxvtwtsxzbhfdnf.supabase.co
- プロジェクト名: wisdom-assemble

## Google OAuth
- Client ID: 1004222264906-2nlc88pq3irlve65ul8b95ju5mbbm3ns.apps.googleusercontent.com
- テストユーザー: wisdomassemble@gmail.com

## 開発進捗
### ✅ フェーズ① 完了（2026-06-26）
- Supabase DB設計・RLS・マイグレーション
- Next.js マルチテナント基盤（middleware.ts）
- 質問投稿・一覧・詳細ページ
- Google OAuth ログイン・ログアウト

### 🔜 フェーズ② 次回から
1. Claude API連携（質問投稿後にAI自動回答）
2. ログイン前トップページ整備（アーカイブ・称号ランキング）
3. モバイル対応
4. Vercelデプロイ

## マルチテナント設計
- サブドメイン → tenant_id をmiddleware.tsで解決
- 開発時: `?tenant=xxx` クエリパラメータで切り替え（デフォルト: 'debug'）
- 全テーブルに tenant_id カラム、RLSで分離

## ディレクトリ構成
```
src/
  app/
    page.tsx                  # トップ（質問一覧）
    layout.tsx                # テナント取得・TenantProvider
    questions/
      new/page.tsx            # 質問投稿ページ
      [slug]/page.tsx         # 質問詳細
    api/questions/route.ts    # 質問投稿API
    auth/
      login/page.tsx          # Googleログインページ
      callback/route.ts       # OAuthコールバック
  components/
    Header.tsx
    TenantProvider.tsx
    QuestionForm.tsx
  lib/
    supabase/client.ts        # ブラウザ用
    supabase/server.ts        # サーバー用
    supabase/types.ts         # 型定義
    tenant.ts                 # getTenantId()
middleware.ts                 # テナント解決・セッション更新
```

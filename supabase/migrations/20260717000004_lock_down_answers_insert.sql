-- 回答(answers)への直接INSERTを塞ぐ（質問と同じ「API直叩きバイパス」対策）。
--
-- 【重要・適用順序】アプリ側の対応コード（answers/route.ts の回答INSERT・翻訳保存を
-- service_role化）を本番デプロイした「後」に適用すること。
-- service_role はRLSをバイパスするため、デプロイ後であればUX・回答投稿は一切変わらない。
--
-- 効果: ログイン済みユーザーがanonキーで直接answersにINSERTして
-- コンテンツフィルタ・最低文字数(30字)・重複チェックを回避するのを防ぐ。
-- 人間の回答INSERT・AI回答INSERT・翻訳保存はすべてservice_role経由のため影響なし。
-- （ブラウザからanswersへの直接INSERTは存在しない＝読み取りのみ）

drop policy if exists "answers_insert" on answers;
create policy "answers_insert" on answers for insert with check (false);

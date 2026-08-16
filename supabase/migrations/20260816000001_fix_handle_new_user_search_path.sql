-- 【重大】新規ユーザーが一切ログインできない不具合の修正（2026-08-16）
--
-- ■ 症状
--   Google認証は通るのに、アプリ側にユーザーが作られずログイン状態にならない。
--   ヘッダーは「ログイン」のままでマイページに入れない。ブラウザ・端末を問わず再現。
--   管理API(POST /auth/v1/admin/users)でも 500 "Database error creating new user"。
--   2026-06-25・06-27 に作られた既存ユーザーだけがログインできる状態だった。
--
-- ■ 原因
--   handle_new_user() は security definer だが search_path を指定していなかった。
--   security definer 関数の search_path は、関数に明示がなければ「呼び出し元セッションの値」
--   がそのまま使われる。auth.users への INSERT を実行するのは GoTrue の
--   supabase_auth_admin ロールで、このロールの search_path は 'auth' のみ。
--
--     postgres            : "$user", public, extensions  → 解決できる
--     supabase_auth_admin : auth                          → public.profiles を解決できない
--
--   そのため関数内の profiles / normalize_language が見つからずトリガーが失敗し、
--   auth.users への INSERT ごとロールバックされていた。
--   （SQL Editor は postgres で動くため、そこから試すと成功してしまい原因が見えない。
--     実際 2026-08-16 の切り分けでは、SQL Editor からの INSERT は成功していた）
--
--   2026-07-09 の 20260709000002 で normalize_language() の呼び出しを追加して以降、
--   新規ユーザーが1人も作られなかったため、今日まで発覚しなかった。
--
-- ■ 対処
--   search_path = '' を明示し、すべての参照を完全修飾する。
--   これで「どのロールから呼ばれても」名前解決が同一になり、再発しない。
--   Supabase公式の User Management ドキュメントも同じ形を推奨している。
--
-- ■ 注意（今後 security definer 関数を書くとき）
--   security definer には必ず search_path を明示し、参照は完全修飾すること。
--   特に auth.users のトリガーは supabase_auth_admin（search_path=auth）から
--   呼ばれるため、public のオブジェクトは修飾しないと必ず見つからない。

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'),
    public.normalize_language(new.raw_user_meta_data->>'locale')
  );
  return new;
end;
$$;

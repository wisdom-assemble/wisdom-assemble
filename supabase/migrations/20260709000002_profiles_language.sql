-- 多言語対応: profiles.language カラム追加（2026-07-09）
-- 優先8言語: en/ja/zh/id/vi/ko/es/pt。将来の言語追加のためtext型（固定enumにしない）。
-- Googleログイン時にGoogleアカウントのlocaleクレーム（raw_user_meta_data->>'locale'）を
-- 初期値として自動取得する。未対応言語・取得失敗時は'en'にフォールバックする。

create or replace function normalize_language(loc text)
returns text
language sql
immutable
as $$
  select case lower(left(coalesce(loc, ''), 2))
    when 'en' then 'en'
    when 'ja' then 'ja'
    when 'zh' then 'zh'
    when 'id' then 'id'
    when 'vi' then 'vi'
    when 'ko' then 'ko'
    when 'es' then 'es'
    when 'pt' then 'pt'
    else 'en'
  end;
$$;

alter table profiles add column if not exists language text;

-- 既存ユーザーはauth.usersに保存済みのGoogle locale情報から遡って補完する
update profiles p
set language = normalize_language(u.raw_user_meta_data->>'locale')
from auth.users u
where p.id = u.id and p.language is null;

alter table profiles alter column language set default 'en';
alter table profiles alter column language set not null;

-- 新規ユーザー作成時にGoogle locale情報を自動取得してlanguageに設定するようトリガーを更新
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, display_name, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username'),
    normalize_language(new.raw_user_meta_data->>'locale')
  );
  return new;
end;
$$;

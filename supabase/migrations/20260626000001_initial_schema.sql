-- ============================================================
-- Wisdom Assemble - Initial Schema
-- Multi-tenant Q&A platform (tenant = genre/subdomain)
-- ============================================================

-- Enable necessary extensions
create extension if not exists "pg_trgm";  -- fuzzy search for archive matching

-- ============================================================
-- TENANTS (ジャンル・サブドメイン)
-- ============================================================
create table tenants (
  id          text primary key,             -- e.g. 'debug', 'tax-japan', 'australia-whv'
  name        text        not null,         -- 表示名
  description text,
  subdomain   text unique not null,         -- subdomain prefix
  language    text        not null default 'ja',
  color_theme text        not null default '#4F46E5',
  logo_url    text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- Seed initial tenants
insert into tenants (id, name, description, subdomain, language, color_theme) values
  ('debug',         'バグ・デバッグ',         'コードのバグや技術的な問題を解決するコミュニティ',  'debug',        'en', '#10B981'),
  ('tax-japan',     '確定申告（日本）',        '日本の確定申告・税金に関する質問コミュニティ',      'tax-japan',    'ja', '#F59E0B'),
  ('australia-whv', 'ワーホリ（オーストラリア）', 'オーストラリアのワーキングホリデー情報コミュニティ', 'australia-whv','ja', '#EF4444'),
  ('bali',          'バリ島移住',             'バリ島への移住・生活情報コミュニティ',             'bali',         'ja', '#8B5CF6'),
  ('chiangmai',     'チェンマイ移住',          'チェンマイへの移住・ノマド生活コミュニティ',        'chiangmai',    'ja', '#EC4899'),
  ('portugal',      'ポルトガル移住',          'ポルトガルへの移住情報コミュニティ',               'portugal',     'ja', '#14B8A6'),
  ('dtm',           'DTM・音楽制作',           'DTM・音楽制作に関する質問コミュニティ',           'dtm',          'ja', '#6366F1'),
  ('keyboard',      '自作キーボード',          '自作キーボードの設計・製作コミュニティ',            'keyboard',     'ja', '#F97316'),
  ('philippines',   'フィリピン留学',          'フィリピン留学情報コミュニティ',                   'philippines',  'ja', '#06B6D4'),
  ('canada',        'カナダ留学',             'カナダ留学・ワーホリ情報コミュニティ',              'canada',       'ja', '#84CC16');

-- ============================================================
-- PROFILES (auth.users の拡張)
-- ============================================================
create table profiles (
  id               uuid    primary key references auth.users(id) on delete cascade,
  username         text    unique not null,
  display_name     text,
  answer_count     int     not null default 0,
  hard_quest_count int     not null default 0,  -- 高難易度クエスト解決数
  active_title_id  text,                        -- 現在表示中の称号 (fk後で追加)
  created_at       timestamptz not null default now()
);

-- auth.users 作成時に自動でprofileを作るトリガー
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- TITLES (称号マスタ)
-- ============================================================
create table titles (
  id               text primary key,
  name             text not null,
  description      text,
  condition_type   text not null check (condition_type in ('answer_count', 'hard_quest', 'unsolved_solved')),
  condition_value  int,
  rarity           text not null default 'common' check (rarity in ('common', 'rare', 'legendary'))
);

insert into titles (id, name, description, condition_type, condition_value, rarity) values
  ('apprentice',     '見習い',         '初回回答を達成',                  'answer_count', 1,   'common'),
  ('sage',           '知恵袋',         '10回以上回答',                    'answer_count', 10,  'common'),
  ('elder',          '賢者',           '50回以上回答',                    'answer_count', 50,  'rare'),
  ('master',         'マスター',       '100回以上回答',                   'answer_count', 100, 'rare'),
  ('quest_clearer',  'クエストクリアラー', '高難易度クエストを解決',        'hard_quest',   1,   'rare'),
  ('legend',         '伝説の回答者',    '未解決案件を解決',               'unsolved_solved', 1, 'legendary');

-- profilesにfk追加
alter table profiles
  add constraint fk_active_title foreign key (active_title_id) references titles(id);

-- ============================================================
-- USER TITLES (ユーザー獲得称号)
-- ============================================================
create table user_titles (
  user_id   uuid references profiles(id) on delete cascade,
  title_id  text references titles(id),
  earned_at timestamptz not null default now(),
  primary key (user_id, title_id)
);

-- ============================================================
-- QUESTIONS (質問)
-- ============================================================
create type question_status as enum (
  'open',         -- 投稿直後
  'ai_answered',  -- AI暫定回答済み・マッチング待ち
  'matched',      -- 専門家にマッチング済み
  'solved',       -- 解決済み
  'hard'          -- 高難易度クエスト（未解決掲示板に掲載）
);

create table questions (
  id           uuid           primary key default gen_random_uuid(),
  tenant_id    text           not null references tenants(id),
  user_id      uuid           not null references profiles(id),
  title        text           not null,
  body         text           not null,
  slug         text           not null,             -- title から生成したURL slug
  status       question_status not null default 'open',
  ai_answer    text,                                -- AI暫定回答
  ai_answered_at timestamptz,
  solved_at    timestamptz,
  solved_by    uuid           references profiles(id),
  view_count   int            not null default 0,
  ip_address   inet,                                -- レートリミット用
  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  unique (tenant_id, slug)
);

-- 全文検索用インデックス（アーカイブ検索・API節約）
create index idx_questions_tenant     on questions(tenant_id);
create index idx_questions_status     on questions(tenant_id, status);
create index idx_questions_slug       on questions(tenant_id, slug);
create index idx_questions_created    on questions(tenant_id, created_at desc);
create index idx_questions_fts        on questions using gin(
  to_tsvector('simple', title || ' ' || body)
);

-- updated_at 自動更新
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_updated_at
  before update on questions
  for each row execute procedure update_updated_at();

-- ============================================================
-- ANSWERS (回答)
-- ============================================================
create table answers (
  id          uuid        primary key default gen_random_uuid(),
  question_id uuid        not null references questions(id) on delete cascade,
  tenant_id   text        not null references tenants(id),  -- RLS用に非正規化
  user_id     uuid        references profiles(id),           -- null = AI
  body        text        not null,
  is_ai       boolean     not null default false,
  is_accepted boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_answers_question on answers(question_id);
create index idx_answers_tenant   on answers(tenant_id);

create trigger answers_updated_at
  before update on answers
  for each row execute procedure update_updated_at();

-- 回答が付いたら answer_count をインクリメント（AI回答は除く）
create or replace function handle_new_answer()
returns trigger language plpgsql security definer as $$
begin
  if new.is_ai = false and new.user_id is not null then
    update profiles set answer_count = answer_count + 1 where id = new.user_id;
    -- 称号チェック・付与
    perform check_and_award_titles(new.user_id);
  end if;
  return new;
end;
$$;

create trigger on_answer_created
  after insert on answers
  for each row execute procedure handle_new_answer();

-- ============================================================
-- TITLE AWARD FUNCTION
-- ============================================================
create or replace function check_and_award_titles(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_answer_count     int;
  v_hard_quest_count int;
  v_title            record;
begin
  select answer_count, hard_quest_count
    into v_answer_count, v_hard_quest_count
    from profiles where id = p_user_id;

  for v_title in
    select id, condition_type, condition_value from titles
  loop
    if v_title.condition_type = 'answer_count'
       and v_answer_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id)
      values (p_user_id, v_title.id)
      on conflict do nothing;
    end if;

    if v_title.condition_type = 'hard_quest'
       and v_hard_quest_count >= v_title.condition_value then
      insert into user_titles (user_id, title_id)
      values (p_user_id, v_title.id)
      on conflict do nothing;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- DONATIONS (ドネーション)
-- ============================================================
create table donations (
  id                 uuid        primary key default gen_random_uuid(),
  question_id        uuid        references questions(id),
  tenant_id          text        not null references tenants(id),
  from_user_id       uuid        references profiles(id),
  to_user_id         uuid        references profiles(id),
  amount_jpy         int         not null check (amount_jpy > 0),
  platform_fee_jpy   int         not null default 0,
  stripe_payment_id  text,
  created_at         timestamptz not null default now()
);

create index idx_donations_tenant on donations(tenant_id);
create index idx_donations_to_user on donations(to_user_id);

-- ============================================================
-- RATE LIMITS (IP別レートリミット)
-- ============================================================
create table rate_limits (
  ip_address     inet    not null,
  tenant_id      text    not null references tenants(id),
  question_count int     not null default 0,
  window_start   timestamptz not null default now(),
  primary key (ip_address, tenant_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- tenants: 誰でも読める・書き込みは管理者のみ
alter table tenants enable row level security;
create policy "tenants_read" on tenants for select using (is_active = true);

-- profiles: 誰でも読める・自分のみ更新
alter table profiles enable row level security;
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- questions: tenant_id 条件で絞り込み、投稿はログイン必須
alter table questions enable row level security;
create policy "questions_read"   on questions for select using (true);
create policy "questions_insert" on questions for insert with check (auth.uid() = user_id);
create policy "questions_update" on questions for update using (auth.uid() = user_id);

-- answers: 同上
alter table answers enable row level security;
create policy "answers_read"   on answers for select using (true);
create policy "answers_insert" on answers for insert with check (
  auth.uid() = user_id or is_ai = true
);

-- user_titles: 読み取りのみ公開
alter table user_titles enable row level security;
create policy "user_titles_read" on user_titles for select using (true);

-- donations: 自分の送受信のみ見える
alter table donations enable row level security;
create policy "donations_read" on donations for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- ============================================================
-- ADMIN ROLE (管理者ダッシュボード用)
-- ============================================================
-- Supabase Dashboardで "service_role" を使用するか、
-- 別途 admin ロールを作成してすべてのRLSをバイパス可能にする

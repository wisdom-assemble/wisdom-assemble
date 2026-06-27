-- マッチング用カラム追加
alter table questions
  add column if not exists matched_b_id uuid references profiles(id),
  add column if not exists matched_b_deadline timestamptz,
  add column if not exists matched_c_id uuid references profiles(id),
  add column if not exists matched_c_deadline timestamptz,
  add column if not exists time_limit_hours int not null default 24;

-- questionsのupdateポリシーをシステム側も更新できるよう拡張
drop policy if exists "questions_update" on questions;
create policy "questions_update" on questions for update using (true);

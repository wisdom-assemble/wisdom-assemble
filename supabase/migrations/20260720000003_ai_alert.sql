-- ============================================================
-- Groqコストアラートの重複送信防止（1日1レベル1回）
-- try_mark_ai_alert(level): 本日(JST)そのlevelが未送信なら記録してtrue、
-- 既送信ならfalseを返す。route.tsがtrueの時だけBrevoでアラート送信する。
-- ============================================================
create table if not exists ai_alert_log (
  day     date not null,
  level   text not null,
  sent_at timestamptz not null default now(),
  primary key (day, level)
);
grant select, insert on ai_alert_log to service_role;

create or replace function try_mark_ai_alert(p_level text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_today date; v_count int;
begin
  v_today := (now() at time zone 'Asia/Tokyo')::date;
  insert into ai_alert_log (day, level) values (v_today, p_level)
  on conflict (day, level) do nothing;
  get diagnostics v_count = row_count;
  return v_count > 0;
end $$;
revoke execute on function try_mark_ai_alert(text) from public, anon, authenticated;
grant  execute on function try_mark_ai_alert(text) to service_role;

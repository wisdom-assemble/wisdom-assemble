-- ============================================================
-- ai_usage に model 列を追加（2026-07-22 Gemini移行の追跡用）
-- ------------------------------------------------------------
-- なぜ provider ではなく model か:
--   USE_GEMINI はモジュール定数なので1デプロイ内で必ず片方だけ＝providerは日付で切れる。
--   一方 gemini.ts は「固定ピンが404になったら gemini-flash-lite-latest へ静かに退避」する。
--   これは同一providerだが別モデルで、実測上 -latest は答えが変わる
--   （3.5-flash-lite=RC3403DB / -latest=RC4558P）＝閾値91の前提が崩れる。
--   後から「この日の回答はどのモデルが出したか」を追えるようにするため model を記録する。
--
-- record_ai_tokens に p_model を追加（デフォルトNULLなので既存の4引数呼び出しも動く）。
-- 4引数版はいったんdropしてから5引数版を作る（オーバーロードによる曖昧さを避けるため）。
-- ============================================================
alter table ai_usage add column if not exists model text;

drop function if exists record_ai_tokens(text, bigint, bigint, numeric);

create or replace function record_ai_tokens(
  p_tenant_id text,
  p_prompt bigint,
  p_completion bigint,
  p_cost numeric,
  p_model text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare v_today date;
begin
  v_today := (now() at time zone 'Asia/Tokyo')::date;
  insert into ai_usage (day, tenant_id, prompt_tokens, completion_tokens, est_cost_usd, model)
    values (v_today, p_tenant_id, p_prompt, p_completion, p_cost, p_model)
  on conflict (day, tenant_id) do update set
    prompt_tokens     = ai_usage.prompt_tokens + excluded.prompt_tokens,
    completion_tokens = ai_usage.completion_tokens + excluded.completion_tokens,
    est_cost_usd      = ai_usage.est_cost_usd + excluded.est_cost_usd,
    -- 回答生成モデルのみを記録したいので、翻訳側(NULL)では上書きしない
    model             = coalesce(excluded.model, ai_usage.model);
end $$;
revoke execute on function record_ai_tokens(text, bigint, bigint, numeric, text) from public, anon, authenticated;
grant  execute on function record_ai_tokens(text, bigint, bigint, numeric, text) to service_role;

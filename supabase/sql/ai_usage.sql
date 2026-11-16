-- Kais AI kullanım sayacı (işletme başına günlük ve aylık limit). SQL Editor'de bir kez çalıştır. Tablo adı: ai_quota.
create table if not exists public.ai_quota (
  business_id uuid not null,
  day date not null,
  kind text not null check (kind in ('chat','read')),
  n int not null default 0,
  primary key (business_id, day, kind)
);
alter table public.ai_quota enable row level security;

-- Yalnızca işletmenin sahibi kendi kullanımını okuyabilir; yazma yalnızca sunucudan (service role).
drop policy if exists aiq_owner_read on public.ai_quota;
create policy aiq_owner_read on public.ai_quota for select to authenticated
  using (exists (select 1 from public.businesses b where b.id = ai_quota.business_id and b.owner_id = auth.uid()));

-- Atomik sayaç: limit aşılmadıysa 1 artırır. Dönen: ok, gün, ay.
create or replace function public.ai_quota_hit(p_biz uuid, p_kind text, p_day_max int, p_month_max int)
returns table(ok boolean, day_n int, month_n int) language plpgsql security definer set search_path = public as $$
declare d int; m int; today date := (now() at time zone 'Europe/Istanbul')::date;
begin
  select coalesce(sum(n),0) into m from public.ai_quota where business_id = p_biz and kind = p_kind and day >= date_trunc('month', today)::date;
  select coalesce(n,0) into d from public.ai_quota where business_id = p_biz and kind = p_kind and day = today;
  d := coalesce(d,0);
  if d >= p_day_max or m >= p_month_max then return query select false, d, m::int; return; end if;
  insert into public.ai_quota(business_id, day, kind, n) values (p_biz, today, p_kind, 1)
    on conflict (business_id, day, kind) do update set n = public.ai_quota.n + 1;
  return query select true, d + 1, m::int + 1;
end $$;
revoke all on function public.ai_quota_hit(uuid, text, int, int) from public, anon, authenticated;
grant execute on function public.ai_quota_hit(uuid, text, int, int) to service_role;

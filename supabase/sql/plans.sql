-- KaisPilot: abonelik ve plan altyapısı. Tekrar çalıştırılabilir. Önce 00_base_schema.sql çalışmış olmalı.
-- Ödeme sağlayıcısı bağlanana kadar plan ve durum admin panelinden elle ayarlanır (plan_set).
-- Mevcut işletmeler "pro / aktif" olarak devam eder (kimse kilitlenmez). Yeni işletme 30 gün deneme alır.
-- Süre dolunca 7 gün ek süre, sonra yalnızca okuma (yazma 'plan_expired' hatası verir). Veri silinmez.
begin;

create table if not exists public.plans (
  id text primary key,
  name text not null,
  max_members int,            -- null = sınırsız
  price_try numeric,          -- admin panelinden belirlenir
  sort int not null default 0
);
insert into public.plans(id, name, max_members, sort) values
  ('deneme', 'Deneme', 10, 0), ('baslangic', 'Başlangıç', 5, 1), ('pro', 'Pro', 20, 2), ('kurumsal', 'Kurumsal', null, 3)
  on conflict (id) do nothing;

create table if not exists public.business_plans (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  plan text not null default 'deneme' references public.plans(id),
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'canceled')),
  trial_ends timestamptz default (now() + interval '30 days'),
  period_end timestamptz,
  grace_days int not null default 7,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.plans enable row level security;
alter table public.business_plans enable row level security;
drop policy if exists plans_read on public.plans; create policy plans_read on public.plans for select using (true);
drop policy if exists bp_read on public.business_plans; create policy bp_read on public.business_plans for select using (public.is_member(business_id));

-- mevcut işletmeler: pro / aktif, süre sınırı yok
insert into public.business_plans(business_id, plan, status, trial_ends, period_end)
  select b.id, 'pro', 'active', null, null from public.businesses b
  on conflict (business_id) do nothing;

-- yeni işletme: 30 gün deneme
create or replace function public.bp_new_business() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.business_plans(business_id) values (new.id) on conflict do nothing; return new; end $$;
drop trigger if exists trg_bp_new on public.businesses;
create trigger trg_bp_new after insert on public.businesses for each row execute function public.bp_new_business();

-- durum: ok | grace (süre doldu, ek süre) | readonly
create or replace function public.plan_state(bid uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p record; pl record; endt timestamptz; eff text := 'ok'; dl int; mem int;
begin
  select * into p from business_plans where business_id = bid;
  if not found then return jsonb_build_object('plan', 'pro', 'status', 'active', 'effective', 'ok', 'days_left', null, 'max_members', null); end if;
  select * into pl from plans where id = p.plan;
  endt := case p.status when 'trial' then p.trial_ends else p.period_end end;
  if p.status in ('active', 'trial') and endt is null then eff := 'ok';
  elsif p.status = 'canceled' and endt is null then eff := 'readonly';
  elsif endt is not null and now() > endt then eff := case when p.status in ('active', 'trial', 'past_due') and now() <= endt + make_interval(days => p.grace_days) then 'grace' else 'readonly' end;
  elsif p.status = 'past_due' then eff := 'grace'; end if;
  dl := case when endt is null then null else ceil(extract(epoch from (endt - now())) / 86400)::int end;
  select count(*) into mem from members where business_id = bid;
  return jsonb_build_object('plan', p.plan, 'plan_name', pl.name, 'status', p.status, 'effective', eff, 'days_left', dl, 'ends', endt, 'grace_days', p.grace_days, 'max_members', pl.max_members, 'members', mem);
end $$;

create or replace function public.plan_get(bid uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.is_member(bid) then raise exception 'yetki yok'; end if;
  return public.plan_state(bid);
end $$;
grant execute on function public.plan_get(uuid) to authenticated;

-- yazma koruması: süresi bitmiş işletmede kullanıcı yazamaz (sunucu/cron etkilenmez)
create or replace function public.plan_write_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if (public.plan_state(new.business_id) ->> 'effective') = 'readonly' then raise exception 'plan_expired'; end if;
  return new;
end $$;
drop trigger if exists trg_plan_write on public.app_state;
create trigger trg_plan_write before insert or update on public.app_state for each row execute function public.plan_write_guard();

-- üye limiti
create or replace function public.plan_member_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare s jsonb; mx int;
begin
  if auth.uid() is null then return new; end if;
  s := public.plan_state(new.business_id); mx := nullif(s ->> 'max_members', '')::int;
  if mx is not null and (s ->> 'members')::int >= mx then raise exception 'plan_limit_members'; end if;
  return new;
end $$;
drop trigger if exists trg_plan_members on public.members;
create trigger trg_plan_members before insert on public.members for each row execute function public.plan_member_guard();

-- admin (service role) için: plan ayarla
create or replace function public.plan_set(bid uuid, p_plan text, p_status text, p_period_end timestamptz, p_trial_ends timestamptz, p_note text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then raise exception 'yalnizca sunucu'; end if;
  insert into business_plans(business_id, plan, status, period_end, trial_ends, note, updated_at) values (bid, p_plan, p_status, p_period_end, p_trial_ends, left(coalesce(p_note, ''), 200), now())
  on conflict (business_id) do update set plan = excluded.plan, status = excluded.status, period_end = excluded.period_end, trial_ends = excluded.trial_ends, note = excluded.note, updated_at = now();
  return public.plan_state(bid);
end $$;
revoke execute on function public.plan_set(uuid, text, text, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.plan_state(uuid) from public, anon, authenticated;
grant execute on function public.plan_state(uuid) to service_role;
grant execute on function public.plan_set(uuid, text, text, timestamptz, timestamptz, text) to service_role;
commit;

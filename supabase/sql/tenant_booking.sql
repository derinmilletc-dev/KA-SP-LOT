-- KaisPilot: herkese açık online rezervasyon. Tekrar çalıştırılabilir.
begin;
create table if not exists public.booking_config (
  business_id uuid primary key references public.businesses(id),
  slug text unique not null,
  enabled boolean not null default true,
  title text, open_h int not null default 8, close_h int not null default 22,
  max_party int not null default 10, min_ahead_h int not null default 2, days_ahead int not null default 30,
  updated_at timestamptz default now()
);
create table if not exists public.booking_requests (
  id bigserial primary key,
  business_id uuid not null references public.businesses(id),
  name text not null, phone text not null, n int not null,
  date date not null, time text not null, note text,
  status text not null default 'bekliyor',
  created_at timestamptz default now()
);
create index if not exists booking_req_biz on public.booking_requests(business_id, status, date);
alter table public.booking_config enable row level security;
alter table public.booking_requests enable row level security;

drop policy if exists bkc_patron on public.booking_config;
create policy bkc_patron on public.booking_config for all
  using (has_role(business_id, array['patron'])) with check (has_role(business_id, array['patron']));
drop policy if exists bkr_read on public.booking_requests;
create policy bkr_read on public.booking_requests for select using (has_role(business_id, array['patron','mudur']));
drop policy if exists bkr_upd on public.booking_requests;
create policy bkr_upd on public.booking_requests for update
  using (has_role(business_id, array['patron','mudur'])) with check (has_role(business_id, array['patron','mudur']));
drop policy if exists bkr_del on public.booking_requests;
create policy bkr_del on public.booking_requests for delete using (has_role(business_id, array['patron','mudur']));

-- Herkese açık: işletme bilgisi (yalnızca ad ve saat kuralları)
create or replace function public.booking_info(p_slug text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('name', coalesce(c.title, b.name), 'open', c.open_h, 'close', c.close_h,
    'max', c.max_party, 'ahead', c.min_ahead_h, 'days', c.days_ahead)
  from booking_config c join businesses b on b.id = c.business_id
  where c.slug = p_slug and c.enabled and b.deleted_at is null;
$$;

-- Herkese açık: talep gönder. Hız sınırı ve doğrulama içerir.
create or replace function public.booking_submit(p_slug text, p_name text, p_phone text, p_n int, p_date date, p_time text, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare c booking_config; ph text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g'); h int; ts timestamp;
begin
  select * into c from booking_config where slug = p_slug and enabled;
  if not found then return 'kapali'; end if;
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 80 then return 'ad'; end if;
  if length(ph) < 10 or length(ph) > 13 then return 'telefon'; end if;
  if p_n is null or p_n < 1 or p_n > c.max_party then return 'kisi'; end if;
  if p_time !~ '^[0-2][0-9]:[0-5][0-9]$' then return 'saat'; end if;
  h := split_part(p_time, ':', 1)::int;
  if h < c.open_h or h >= c.close_h then return 'saat'; end if;
  ts := p_date::timestamp + p_time::time;
  if ts < (now() at time zone 'Europe/Istanbul') + make_interval(hours => c.min_ahead_h) then return 'gecmis'; end if;
  if p_date > (now() at time zone 'Europe/Istanbul')::date + c.days_ahead then return 'uzak'; end if;
  if (select count(*) from booking_requests where business_id = c.business_id and phone = ph and status = 'bekliyor') >= 3 then return 'cok'; end if;
  if (select count(*) from booking_requests where business_id = c.business_id and created_at > now() - interval '1 hour') >= 30 then return 'yogun'; end if;
  insert into booking_requests(business_id, name, phone, n, date, time, note)
  values (c.business_id, trim(p_name), ph, p_n, p_date, p_time, left(coalesce(p_note,''), 200));
  return 'ok';
end $$;
revoke all on function public.booking_info(text), public.booking_submit(text,text,text,int,date,text,text) from public;
grant execute on function public.booking_info(text), public.booking_submit(text,text,text,int,date,text,text) to anon, authenticated;
commit;

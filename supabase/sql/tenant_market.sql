-- KaisPilot: ilan yayını (işletme ihtiyaç ilanı açar, yakındaki üreticiler teklif verir).
-- Önce tenant_producers.sql çalışmış olmalı. Tekrar çalıştırmak güvenlidir.

create table if not exists public.market_needs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product text not null check (char_length(product) between 2 and 80),
  qty numeric not null check (qty > 0),
  unit text not null default 'kg' check (char_length(unit) <= 12),
  deliver_by date,
  note text check (note is null or char_length(note) <= 300),
  contact text check (contact is null or char_length(contact) <= 40),
  lat double precision, lng double precision,
  city text, district text,
  radius_km int not null default 100 check (radius_km between 5 and 1000),
  status text not null default 'acik' check (status in ('acik','kapali','verildi')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
create index if not exists market_needs_biz_idx on public.market_needs (business_id, created_at desc);
alter table public.market_needs enable row level security;

create or replace function public.market_can(bid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select has_role(bid, array['patron','mudur'])
      or exists (select 1 from public.businesses b where b.id = bid and b.owner_id = auth.uid())
$$;

drop policy if exists mn_all on public.market_needs;
create policy mn_all on public.market_needs for all
  using (public.market_can(business_id)) with check (public.market_can(business_id));
grant select, insert, update, delete on public.market_needs to authenticated;

create table if not exists public.market_offers (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.market_needs(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  supplier_name text not null,
  price numeric not null check (price > 0),
  qty numeric not null check (qty > 0),
  deliver_date date,
  note text check (note is null or char_length(note) <= 300),
  status text not null default 'bekliyor' check (status in ('bekliyor','kabul','red','geri')),
  created_at timestamptz not null default now(),
  unique (need_id, user_id)
);
alter table public.market_offers enable row level security;
drop policy if exists mo_own on public.market_offers;
create policy mo_own on public.market_offers for select using (user_id = auth.uid());
grant select on public.market_offers to authenticated;  -- yazma yalnızca aşağıdaki fonksiyonlarla

-- mesafe (km, kuş uçuşu x1.3 yol payı)
create or replace function public.market_km(a1 double precision, o1 double precision, a2 double precision, o2 double precision)
returns numeric language sql immutable as $$
  select case when a1 is null or o1 is null or a2 is null or o2 is null then null
    else round((6371 * 1.3 * acos(least(1, greatest(-1,
      cos(radians(a1)) * cos(radians(a2)) * cos(radians(o2 - o1)) + sin(radians(a1)) * sin(radians(a2))))))::numeric, 1) end
$$;

-- Üretici: yakınımdaki açık ilanlar
create or replace function public.market_feed()
returns table (id uuid, product text, qty numeric, unit text, deliver_by date, note text, city text, district text,
               biz_name text, km numeric, expires_at timestamptz, my_price numeric, my_status text)
language plpgsql stable security definer set search_path = public as $$
declare v_lat double precision; v_lng double precision; v_rad numeric;
begin
  if auth.uid() is null or not exists (select 1 from public.suppliers s where s.user_id = auth.uid()) then
    raise exception 'Üretici hesabı gerekli';
  end if;
  select p.lat, p.lng, coalesce(p.radius_km, 100) into v_lat, v_lng, v_rad
    from public.supplier_profiles p join public.suppliers s on s.id = p.supplier_id
   where s.user_id = auth.uid() order by (p.lat is null), p.updated_at desc nulls last limit 1;
  return query
    select n.id, n.product, n.qty, n.unit, n.deliver_by, n.note, n.city, n.district, b.name,
           public.market_km(v_lat, v_lng, n.lat, n.lng), n.expires_at, o.price, o.status
      from public.market_needs n
      join public.businesses b on b.id = n.business_id
      left join public.market_offers o on o.need_id = n.id and o.user_id = auth.uid()
     where n.status = 'acik' and n.expires_at > now()
       and (public.market_km(v_lat, v_lng, n.lat, n.lng) is null
            or public.market_km(v_lat, v_lng, n.lat, n.lng) <= greatest(n.radius_km, 0))
     order by public.market_km(v_lat, v_lng, n.lat, n.lng) nulls last, n.created_at desc
     limit 100;
end $$;

-- Üretici: teklif ver / güncelle
create or replace function public.market_offer_send(p_need uuid, p_price numeric, p_qty numeric, p_date date, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_n public.market_needs;
begin
  select * into v_n from public.market_needs where id = p_need;
  if not found or v_n.status <> 'acik' or v_n.expires_at <= now() then raise exception 'Bu ilan artık açık değil'; end if;
  select s.name into v_name from public.suppliers s where s.user_id = auth.uid() order by s.created_at limit 1;
  if v_name is null then raise exception 'Üretici hesabı gerekli'; end if;
  if p_price is null or p_price <= 0 or p_qty is null or p_qty <= 0 then raise exception 'Fiyat ve miktar gerekli'; end if;
  insert into public.market_offers (need_id, user_id, supplier_name, price, qty, deliver_date, note)
  values (p_need, auth.uid(), v_name, p_price, p_qty, p_date, nullif(left(coalesce(p_note, ''), 300), ''))
  on conflict (need_id, user_id) do update
    set price = excluded.price, qty = excluded.qty, deliver_date = excluded.deliver_date, note = excluded.note,
        status = case when public.market_offers.status in ('kabul') then 'kabul' else 'bekliyor' end;
end $$;

-- Üretici: teklifi geri çek
create or replace function public.market_offer_withdraw(p_need uuid) returns void
language sql security definer set search_path = public as $$
  update public.market_offers set status = 'geri' where need_id = p_need and user_id = auth.uid() and status = 'bekliyor'
$$;

-- Üretici: tekliflerim (kabul edildiyse işletme iletişimi görünür)
create or replace function public.market_mine()
returns table (offer_id uuid, need_id uuid, product text, qty numeric, unit text, price numeric, offer_qty numeric,
               deliver_date date, status text, biz_name text, contact text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.id, n.id, n.product, n.qty, n.unit, o.price, o.qty, o.deliver_date, o.status, b.name,
         case when o.status = 'kabul' then n.contact end, o.created_at
    from public.market_offers o
    join public.market_needs n on n.id = o.need_id
    join public.businesses b on b.id = n.business_id
   where o.user_id = auth.uid()
   order by o.created_at desc limit 100
$$;

-- İşletme: bir ilana gelen teklifler (üretici bilgisi, rozet, puan)
create or replace function public.market_offers_for(p_need uuid)
returns table (offer_id uuid, supplier_name text, price numeric, qty numeric, deliver_date date, note text, status text,
               kind text, origin text, verify text, km numeric, stars numeric, n int, on_time numeric, phone text)
language plpgsql stable security definer set search_path = public as $$
declare v_n public.market_needs;
begin
  select * into v_n from public.market_needs where id = p_need;
  if not found or not public.market_can(v_n.business_id) then raise exception 'Yetki yok'; end if;
  return query
    select o.id, o.supplier_name, o.price, o.qty, o.deliver_date, o.note, o.status,
           pr.kind, pr.origin, coalesce(pr.verify, 'yok'),
           public.market_km(pr.lat, pr.lng, v_n.lat, v_n.lng),
           st.stars, coalesce(st.n, 0), st.on_time,
           case when o.status = 'kabul' then pr.phone end
      from public.market_offers o
      left join lateral (
        select p.* from public.supplier_profiles p join public.suppliers s on s.id = p.supplier_id
         where s.user_id = o.user_id order by (p.lat is null), p.updated_at desc nulls last limit 1) pr on true
      left join lateral (
        select count(*)::int as n, round(avg(r.stars)::numeric, 2) as stars, round(100.0 * avg((r.on_time)::int)::numeric, 0) as on_time
          from public.supplier_ratings r join public.suppliers s2 on s2.id = r.supplier_id where s2.user_id = o.user_id) st on true
     where o.need_id = p_need and o.status <> 'geri'
     order by o.price;
end $$;

-- İşletme: teklifi kabul et
create or replace function public.market_accept(p_offer uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_o public.market_offers; v_n public.market_needs;
begin
  select * into v_o from public.market_offers where id = p_offer;
  if not found then raise exception 'Teklif bulunamadı'; end if;
  select * into v_n from public.market_needs where id = v_o.need_id;
  if not public.market_can(v_n.business_id) then raise exception 'Yetki yok'; end if;
  if v_n.status <> 'acik' or v_o.status <> 'bekliyor' then raise exception 'Bu teklif artık kabul edilemez'; end if;
  update public.market_offers set status = case when id = p_offer then 'kabul' else 'red' end
   where need_id = v_n.id and status in ('bekliyor');
  update public.market_needs set status = 'verildi' where id = v_n.id;
end $$;

revoke all on function public.market_feed(), public.market_offer_send(uuid, numeric, numeric, date, text),
  public.market_offer_withdraw(uuid), public.market_mine(), public.market_offers_for(uuid), public.market_accept(uuid) from public;
grant execute on function public.market_feed(), public.market_offer_send(uuid, numeric, numeric, date, text),
  public.market_offer_withdraw(uuid), public.market_mine(), public.market_offers_for(uuid), public.market_accept(uuid) to authenticated;

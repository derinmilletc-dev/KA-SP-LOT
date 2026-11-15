-- KaisPilot: teslimat akışı (teslim onayı, havale/dekont, karşılıklı puan, sorun bildirimi).
-- Önce tenant_producers.sql ve tenant_market.sql çalışmış olmalı. Tekrar çalıştırmak güvenlidir.

create table if not exists public.market_orders (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references public.market_needs(id) on delete cascade,
  offer_id uuid not null unique references public.market_offers(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  supplier_name text not null,
  product text not null,
  qty numeric not null,
  unit text not null,
  price numeric not null,
  total numeric not null,
  status text not null default 'onaylandi'
    check (status in ('onaylandi','teslim_edildi','alindi','odendi','tamam','sorun')),
  prev_status text,
  issue text, issue_by text,
  delivered_at timestamptz, received_at timestamptz, received_qty numeric,
  paid_at timestamptz, pay_amount numeric, pay_ref text, pay_date date, doc_path text,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists market_orders_biz_idx on public.market_orders (business_id, created_at desc);
create index if not exists market_orders_usr_idx on public.market_orders (user_id, created_at desc);
alter table public.market_orders enable row level security;  -- politika yok: yalnızca aşağıdaki fonksiyonlar

create table if not exists public.market_ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.market_orders(id) on delete cascade,
  by_side text not null check (by_side in ('isletme','uretici')),
  stars int not null check (stars between 1 and 5),
  on_time boolean not null default true,
  complete boolean not null default true,
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (order_id, by_side)
);
alter table public.market_ratings enable row level security;

create or replace function public.market_can_pay(bid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select has_role(bid, array['patron','mudur','muhasebeci'])
      or exists (select 1 from public.businesses b where b.id = bid and b.owner_id = auth.uid())
$$;

-- Teklif kabulü artık sipariş de oluşturur
create or replace function public.market_accept(p_offer uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_o public.market_offers; v_n public.market_needs; v_q numeric;
begin
  select * into v_o from public.market_offers where id = p_offer;
  if not found then raise exception 'Teklif bulunamadı'; end if;
  select * into v_n from public.market_needs where id = v_o.need_id;
  if not public.market_can(v_n.business_id) then raise exception 'Yetki yok'; end if;
  if v_n.status <> 'acik' or v_o.status <> 'bekliyor' then raise exception 'Bu teklif artık kabul edilemez'; end if;
  update public.market_offers set status = case when id = p_offer then 'kabul' else 'red' end
   where need_id = v_n.id and status in ('bekliyor');
  update public.market_needs set status = 'verildi' where id = v_n.id;
  v_q := least(v_o.qty, v_n.qty);
  insert into public.market_orders (need_id, offer_id, business_id, user_id, supplier_name, product, qty, unit, price, total)
  values (v_n.id, v_o.id, v_n.business_id, v_o.user_id, v_o.supplier_name, v_n.product, v_q, v_n.unit, v_o.price, round(v_o.price * v_q, 2))
  on conflict (offer_id) do nothing;
end $$;

-- Üretici puanı: eski tedarikçi puanları + ilan teslimat puanları
create or replace function public.producer_rating(p_user uuid)
returns table (n int, stars numeric, on_time numeric, complete numeric)
language sql stable security definer set search_path = public as $$
  with r as (
    select x.stars, x.on_time, x.complete from public.supplier_ratings x
      join public.suppliers s on s.id = x.supplier_id where s.user_id = p_user
    union all
    select m.stars, m.on_time, m.complete from public.market_ratings m
      join public.market_orders o on o.id = m.order_id where o.user_id = p_user and m.by_side = 'isletme')
  select count(*)::int, round(avg(stars)::numeric, 2),
         round(100.0 * avg((on_time)::int)::numeric, 0), round(100.0 * avg((complete)::int)::numeric, 0) from r
$$;

create or replace function public.supplier_stats(ids uuid[])
returns table (supplier_id uuid, n int, stars numeric, on_time numeric, complete numeric)
language sql stable security definer set search_path = public as $$
  select s.id, pr.n, pr.stars, pr.on_time, pr.complete
    from public.suppliers s cross join lateral public.producer_rating(s.user_id) pr
   where s.id = any(ids) and pr.n > 0
$$;
revoke all on function public.supplier_stats(uuid[]) from public;
grant execute on function public.supplier_stats(uuid[]) to authenticated;

-- İşletme puanı (üreticilerin verdiği)
create or replace function public.biz_rating(p_biz uuid)
returns table (n int, stars numeric)
language sql stable security definer set search_path = public as $$
  select count(*)::int, round(avg(m.stars)::numeric, 2) from public.market_ratings m
    join public.market_orders o on o.id = m.order_id where o.business_id = p_biz and m.by_side = 'uretici'
$$;

-- İşletmeye gelen teklif listesi: puan artık ilan puanlarını da içerir
drop function if exists public.market_offers_for(uuid);
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
      left join lateral public.producer_rating(o.user_id) st on true
     where o.need_id = p_need and o.status <> 'geri'
     order by o.price;
end $$;
revoke all on function public.market_offers_for(uuid) from public;
grant execute on function public.market_offers_for(uuid) to authenticated;

-- Üretici: ilanlar + işletme puanı; puanı iyi işletmeler öne çıkar
drop function if exists public.market_feed();
create or replace function public.market_feed()
returns table (id uuid, product text, qty numeric, unit text, deliver_by date, note text, city text, district text,
               biz_name text, km numeric, expires_at timestamptz, my_price numeric, my_status text, biz_stars numeric, biz_n int)
language plpgsql stable security definer set search_path = public as $$
declare v_lat double precision; v_lng double precision;
begin
  if auth.uid() is null or not exists (select 1 from public.suppliers s where s.user_id = auth.uid()) then
    raise exception 'Üretici hesabı gerekli';
  end if;
  select p.lat, p.lng into v_lat, v_lng
    from public.supplier_profiles p join public.suppliers s on s.id = p.supplier_id
   where s.user_id = auth.uid() order by (p.lat is null), p.updated_at desc nulls last limit 1;
  return query
    select n.id, n.product, n.qty, n.unit, n.deliver_by, n.note, n.city, n.district, b.name,
           public.market_km(v_lat, v_lng, n.lat, n.lng), n.expires_at, o.price, o.status, br.stars, coalesce(br.n, 0)
      from public.market_needs n
      join public.businesses b on b.id = n.business_id
      left join public.market_offers o on o.need_id = n.id and o.user_id = auth.uid()
      left join lateral public.biz_rating(n.business_id) br on true
     where n.status = 'acik' and n.expires_at > now()
       and (public.market_km(v_lat, v_lng, n.lat, n.lng) is null
            or public.market_km(v_lat, v_lng, n.lat, n.lng) <= n.radius_km)
     order by (case when coalesce(br.n, 0) >= 3 and br.stars >= 4.5 then 0 else 1 end),
              public.market_km(v_lat, v_lng, n.lat, n.lng) nulls last, n.created_at desc
     limit 100;
end $$;
revoke all on function public.market_feed() from public;
grant execute on function public.market_feed() to authenticated;

-- Sipariş listeleri
create or replace function public.market_orders_biz(p_biz uuid)
returns table (id uuid, product text, qty numeric, unit text, price numeric, total numeric, status text, supplier_name text,
               phone text, issue text, issue_by text, received_qty numeric, pay_amount numeric, pay_ref text, pay_date date,
               doc_path text, created_at timestamptz, rated boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.market_can_pay(p_biz) then raise exception 'Yetki yok'; end if;
  return query
    select o.id, o.product, o.qty, o.unit, o.price, o.total, o.status, o.supplier_name,
           (select p.phone from public.supplier_profiles p join public.suppliers s on s.id = p.supplier_id
             where s.user_id = o.user_id order by (p.phone is null), p.updated_at desc nulls last limit 1),
           o.issue, o.issue_by, o.received_qty, o.pay_amount, o.pay_ref, o.pay_date, o.doc_path, o.created_at,
           exists (select 1 from public.market_ratings r where r.order_id = o.id and r.by_side = 'isletme')
      from public.market_orders o where o.business_id = p_biz order by o.created_at desc limit 60;
end $$;

create or replace function public.market_orders_sup()
returns table (id uuid, product text, qty numeric, unit text, price numeric, total numeric, status text, biz_name text,
               contact text, issue text, issue_by text, pay_amount numeric, pay_ref text, pay_date date, doc_path text,
               created_at timestamptz, rated boolean)
language sql stable security definer set search_path = public as $$
  select o.id, o.product, o.qty, o.unit, o.price, o.total, o.status, b.name,
         (select n.contact from public.market_needs n where n.id = o.need_id),
         o.issue, o.issue_by, o.pay_amount, o.pay_ref, o.pay_date, o.doc_path, o.created_at,
         exists (select 1 from public.market_ratings r where r.order_id = o.id and r.by_side = 'uretici')
    from public.market_orders o join public.businesses b on b.id = o.business_id
   where o.user_id = auth.uid() order by o.created_at desc limit 60
$$;

-- Tek giriş noktası: durum geçişleri
create or replace function public.market_order_act(p_order uuid, p_act text, p_qty numeric default null, p_text text default null,
                                                   p_amount numeric default null, p_date date default null, p_doc text default null)
returns void language plpgsql security definer set search_path = public as $$
declare o public.market_orders; v_sup boolean; v_biz boolean; v_pay boolean;
begin
  select * into o from public.market_orders where id = p_order for update;
  if not found then raise exception 'Sipariş bulunamadı'; end if;
  v_sup := o.user_id = auth.uid(); v_biz := public.market_can(o.business_id); v_pay := public.market_can_pay(o.business_id);
  if not (v_sup or v_pay) then raise exception 'Yetki yok'; end if;
  if p_act = 'delivered' then
    if not v_sup or o.status <> 'onaylandi' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'teslim_edildi', delivered_at = now() where id = o.id;
  elsif p_act = 'received' then
    if not v_biz or o.status not in ('onaylandi','teslim_edildi') then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'alindi', received_at = now(), received_qty = coalesce(p_qty, o.qty),
      total = case when p_qty is not null and p_qty > 0 then round(o.price * p_qty, 2) else o.total end where id = o.id;
  elsif p_act = 'paid' then
    if not v_pay or o.status <> 'alindi' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'odendi', paid_at = now(), pay_amount = coalesce(p_amount, o.total),
      pay_ref = nullif(left(coalesce(p_text, ''), 60), ''), pay_date = coalesce(p_date, current_date), doc_path = nullif(left(coalesce(p_doc, ''), 200), '') where id = o.id;
  elsif p_act = 'confirm' then
    if not v_sup or o.status <> 'odendi' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'tamam', done_at = now() where id = o.id;
  elsif p_act = 'issue' then
    if o.status in ('tamam','sorun') then raise exception 'Bu işlem şu an yapılamaz'; end if;
    if coalesce(btrim(p_text), '') = '' then raise exception 'Sorunu kısaca yaz'; end if;
    update public.market_orders set prev_status = o.status, status = 'sorun', issue = left(p_text, 300),
      issue_by = case when v_sup then 'uretici' else 'isletme' end where id = o.id;
  elsif p_act = 'resolve' then
    if o.status <> 'sorun' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = coalesce(o.prev_status, 'onaylandi'), prev_status = null, issue = null, issue_by = null where id = o.id;
  else raise exception 'Bilinmeyen işlem'; end if;
end $$;

-- Karşılıklı puan: işletme üreticiyi (teslim alınca), üretici işletmeyi (ödeme gelince) puanlar
create or replace function public.market_rate(p_order uuid, p_stars int, p_on_time boolean, p_complete boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare o public.market_orders; v_side text;
begin
  select * into o from public.market_orders where id = p_order;
  if not found then raise exception 'Sipariş bulunamadı'; end if;
  if o.user_id = auth.uid() then
    v_side := 'uretici'; if o.status not in ('odendi','tamam') then raise exception 'Ödeme gelince puanlayabilirsin'; end if;
  elsif public.market_can(o.business_id) then
    v_side := 'isletme'; if o.status not in ('alindi','odendi','tamam') then raise exception 'Teslim alınca puanlayabilirsin'; end if;
  else raise exception 'Yetki yok'; end if;
  insert into public.market_ratings (order_id, by_side, stars, on_time, complete, note)
  values (p_order, v_side, p_stars, coalesce(p_on_time, true), coalesce(p_complete, true), nullif(left(coalesce(p_note, ''), 300), ''))
  on conflict (order_id, by_side) do nothing;
end $$;

revoke all on function public.market_accept(uuid), public.market_orders_biz(uuid), public.market_orders_sup(),
  public.market_order_act(uuid, text, numeric, text, numeric, date, text),
  public.market_rate(uuid, int, boolean, boolean, text) from public;
grant execute on function public.market_accept(uuid), public.market_orders_biz(uuid), public.market_orders_sup(),
  public.market_order_act(uuid, text, numeric, text, numeric, date, text),
  public.market_rate(uuid, int, boolean, boolean, text) to authenticated;

-- Dekont fotoğrafı için özel kayıt alanı (herkese açık değil). Hata verirse notice yazar, geri kalanı etkilenmez.
do $$ begin
  insert into storage.buckets (id, name, public) values ('market-docs', 'market-docs', false) on conflict (id) do nothing;
  drop policy if exists md_ins on storage.objects;
  create policy md_ins on storage.objects for insert to authenticated with check (
    bucket_id = 'market-docs' and exists (select 1 from public.market_orders o
      where o.id::text = (storage.foldername(name))[1] and (public.market_can_pay(o.business_id) or o.user_id = auth.uid())));
  drop policy if exists md_sel on storage.objects;
  create policy md_sel on storage.objects for select to authenticated using (
    bucket_id = 'market-docs' and exists (select 1 from public.market_orders o
      where o.id::text = (storage.foldername(name))[1] and (public.market_can_pay(o.business_id) or o.user_id = auth.uid())));
exception when others then raise notice 'Dekont alanı kurulamadı: %', sqlerrm;
end $$;

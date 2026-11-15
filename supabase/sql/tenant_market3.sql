-- KaisPilot: ilan ve teslimat bildirimleri (push). Sıra: producers -> market -> market2 -> bu dosya.
-- Olaylar bir kutuya yazılır; kais-cron her 5 dakikada okuyup push gönderir. Tekrar çalıştırmak güvenlidir.

create table if not exists public.market_events (
  id bigint generated always as identity primary key,
  kind text not null,
  need_id uuid, offer_id uuid, order_id uuid,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists market_events_todo_idx on public.market_events (id) where not done;
alter table public.market_events enable row level security;   -- politika yok: yalnızca sunucu

create or replace function public.market_ev_need() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.market_events (kind, need_id) values ('need_new', new.id); return new; end $$;
drop trigger if exists market_ev_need_t on public.market_needs;
create trigger market_ev_need_t after insert on public.market_needs for each row execute function public.market_ev_need();

create or replace function public.market_ev_offer() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then insert into public.market_events (kind, need_id, offer_id) values ('offer_new', new.need_id, new.id); end if;
  return new;
end $$;
drop trigger if exists market_ev_offer_t on public.market_offers;
create trigger market_ev_offer_t after insert on public.market_offers for each row execute function public.market_ev_offer();

create or replace function public.market_ev_order() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then insert into public.market_events (kind, order_id) values ('order_onaylandi', new.id);
  elsif new.status is distinct from old.status then insert into public.market_events (kind, order_id) values ('order_' || new.status, new.id); end if;
  return new;
end $$;
drop trigger if exists market_ev_order_t on public.market_orders;
create trigger market_ev_order_t after insert or update on public.market_orders for each row execute function public.market_ev_order();

create or replace function public.market_tl(x numeric) returns text language sql immutable as $$
  select replace(to_char(round(x), 'FM999G999G999'), ',', '.') || ' ₺' $$;

-- Gönderilecek bildirimleri üretir ve olayları işlenmiş sayar. Yalnızca service_role çağırır.
create or replace function public.market_outbox_pull()
returns table (to_user uuid, to_biz uuid, to_roles text[], title text, body text, tag text, url text)
language plpgsql security definer set search_path = public as $$
declare e record; n public.market_needs; o public.market_orders; v_off public.market_offers; v_biz text; v_km numeric;
begin
  for e in update public.market_events set done = true where id in (select id from public.market_events where not done order by id limit 200) returning * loop
    if e.kind = 'need_new' then
      select * into n from public.market_needs where id = e.need_id; if not found then continue; end if;
      select name into v_biz from public.businesses where id = n.business_id;
      return query
        select x.user_id, null::uuid, null::text[], 'Yakınında yeni ilan',
               coalesce(v_biz, 'Bir işletme') || ' ' || trim(trailing '.' from to_char(n.qty, 'FM999999990.99')) || ' ' || n.unit || ' ' || n.product || ' arıyor (' || round(x.km)::text || ' km).',
               'mkneed' || n.id::text, '/tedarikci/'
          from (select s.user_id, min(public.market_km(p.lat, p.lng, n.lat, n.lng)) as km
                  from public.suppliers s join public.supplier_profiles p on p.supplier_id = s.id
                 where s.user_id is not null and p.lat is not null and n.lat is not null
                 group by s.user_id) x
         where x.km <= n.radius_km order by x.km limit 50;
    elsif e.kind = 'offer_new' then
      select * into v_off from public.market_offers where id = e.offer_id; select * into n from public.market_needs where id = e.need_id;
      if v_off.id is null or n.id is null then continue; end if;
      return query select null::uuid, n.business_id, array['patron','mudur'], 'Yeni teklif geldi',
        v_off.supplier_name || ' ' || n.product || ' için ' || replace(trim(trailing '.' from trim(trailing '0' from round(v_off.price, 2)::text)), '.', ',') || ' ₺ / ' || n.unit || ' teklif verdi.', 'mkoffer' || v_off.id::text, '/';
    elsif e.kind like 'order_%' then
      select * into o from public.market_orders where id = e.order_id; if not found then continue; end if;
      select name into v_biz from public.businesses where id = o.business_id;
      if e.kind = 'order_onaylandi' then
        return query select o.user_id, null::uuid, null::text[], 'Teklifin kabul edildi', coalesce(v_biz, 'İşletme') || ' ' || o.product || ' için teklifini seçti. Teslimat için seni arayacak.', 'mkord' || o.id::text, '/tedarikci/';
      elsif e.kind = 'order_teslim_edildi' then
        return query select null::uuid, o.business_id, array['patron','mudur'], 'Teslimat bildirildi', o.supplier_name || ' ' || o.product || ' teslimatını yaptığını bildirdi. Teslim aldıysan onayla.', 'mkord' || o.id::text, '/';
      elsif e.kind = 'order_alindi' then
        return query select o.user_id, null::uuid, null::text[], 'Teslim onaylandı', coalesce(v_biz, 'İşletme') || ' ' || o.product || ' teslimatını onayladı. Ödeme bekleniyor.', 'mkord' || o.id::text, '/tedarikci/';
        return query select null::uuid, o.business_id, array['patron','mudur','muhasebeci'], 'Üretici ödemesi bekleniyor', o.supplier_name || ' için ' || public.market_tl(o.total) || ' ödeme yapılacak.', 'mkpay' || o.id::text, '/';
      elsif e.kind = 'order_odendi' then
        return query select o.user_id, null::uuid, null::text[], 'Ödeme bildirildi', coalesce(v_biz, 'İşletme') || ' ' || public.market_tl(coalesce(o.pay_amount, o.total)) || ' ödemeyi bildirdi. Hesabına geçince onayla.', 'mkord' || o.id::text, '/tedarikci/';
      elsif e.kind = 'order_sorun' then
        if o.issue_by = 'uretici' then
          return query select null::uuid, o.business_id, array['patron','mudur'], 'Üretici sorun bildirdi', o.supplier_name || ' ' || o.product || ': ' || left(coalesce(o.issue, ''), 100), 'mkord' || o.id::text, '/';
        else
          return query select o.user_id, null::uuid, null::text[], 'İşletme sorun bildirdi', coalesce(v_biz, 'İşletme') || ' ' || o.product || ': ' || left(coalesce(o.issue, ''), 100), 'mkord' || o.id::text, '/tedarikci/';
        end if;
      end if;
    end if;
  end loop;
end $$;
revoke all on function public.market_outbox_pull() from public, authenticated, anon;
grant execute on function public.market_outbox_pull() to service_role;

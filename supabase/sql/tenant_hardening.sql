-- KaisPilot: işletme (tenant) izolasyonunu sıkılaştırma.
-- Tekrar çalıştırılabilir (idempotent). Supabase SQL editöründe tek seferde çalıştır.
-- Önce Ayarlar > Yedek ile bir yedek al. Var olan kurallara dokunmaz, yalnızca aşağıdakileri değiştirir.
-- Yardımcı fonksiyonlar (has_role, is_member) mevcut olanlardır.

begin;

-- 1) Çalışan rolü finans, sipariş teslim ve fiyat/indirim tablolarına erişmesin.
--    İzinli roller: patron, müdür, muhasebeci (ve işletme sahibi).
drop policy if exists cpay_biz on public.cari_pay;
create policy cpay_biz on public.cari_pay for all
  using (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = cari_pay.business_id and b.owner_id = auth.uid()))
  with check (by_side = 'isletme' and (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = cari_pay.business_id and b.owner_id = auth.uid())));

drop policy if exists crec_biz on public.cari_recon;
create policy crec_biz on public.cari_recon for all
  using (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = cari_recon.business_id and b.owner_id = auth.uid()))
  with check (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = cari_recon.business_id and b.owner_id = auth.uid()));

drop policy if exists ord_biz_recv on public.orders;
create policy ord_biz_recv on public.orders for update
  using (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = orders.business_id and b.owner_id = auth.uid()))
  with check (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = orders.business_id and b.owner_id = auth.uid()));

drop policy if exists rt_biz on public.supplier_ratings;
create policy rt_biz on public.supplier_ratings for all
  using (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = supplier_ratings.business_id and b.owner_id = auth.uid()))
  with check (has_role(business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = supplier_ratings.business_id and b.owner_id = auth.uid()));

drop policy if exists scp_biz on public.supplier_cprice;
create policy scp_biz on public.supplier_cprice for select
  using (exists (select 1 from public.suppliers s where s.id = supplier_cprice.supplier_id
    and (has_role(s.business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = s.business_id and b.owner_id = auth.uid()))));

drop policy if exists sc_biz on public.supplier_customer;
create policy sc_biz on public.supplier_customer for select
  using (exists (select 1 from public.suppliers s where s.id = supplier_customer.supplier_id
    and (has_role(s.business_id, array['patron','mudur','muhasebeci']) or exists (select 1 from public.businesses b where b.id = s.business_id and b.owner_id = auth.uid()))));

-- 2) Tedarikçi, siparişin işletmesini/tedarikçisini değiştiremesin; onaydan sonra kalem ve tutarı oynatamasın.
create or replace function public.orders_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_staff boolean; v_sup boolean;
begin
  if auth.uid() is null then return new; end if; -- sunucu (service role) serbest
  v_staff := is_member(old.business_id) or exists (select 1 from public.businesses b where b.id = old.business_id and b.owner_id = auth.uid());
  v_sup := exists (select 1 from public.suppliers s where s.id = old.supplier_id and s.user_id = auth.uid());
  if v_sup and not v_staff then
    if new.business_id is distinct from old.business_id or new.supplier_id is distinct from old.supplier_id then
      raise exception 'Siparişin işletmesi ve tedarikçisi değiştirilemez';
    end if;
    if old.status in ('onaylandi','teslim') and (new.lines is distinct from old.lines or new.total is distinct from old.total) then
      raise exception 'Onaylanan siparişin kalemleri ve tutarı değiştirilemez';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_guard_t on public.orders;
create trigger orders_guard_t before update on public.orders for each row execute function public.orders_guard();

-- 3) Tedarikçi yalnızca kendi bağlı olduğu işletmenin teklif isteğine fiyat verebilsin.
drop policy if exists quo_sup on public.quotes;
create policy quo_sup on public.quotes for all
  using (exists (select 1 from public.suppliers s where s.id = quotes.supplier_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.suppliers s join public.rfqs r on r.business_id = s.business_id
    where s.id = quotes.supplier_id and s.user_id = auth.uid() and r.id = quotes.rfq_id));

-- 4) Yüklenen belge başka işletmeye taşınamasın.
drop policy if exists od_upd on public.onboard_docs;
create policy od_upd on public.onboard_docs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_member(business_id));

-- 5) Yalnızca sunucunun yazdığı tablolar: RLS açık, politika yok (istemci erişemez).
alter table if exists public.ai_usage enable row level security;
alter table if exists public.push_log enable row level security;
alter table if exists public.supplier_push_log enable row level security;
alter table if exists public.mail_log enable row level security;

-- 6) Denetim kaydı: üye yazar, yalnızca patron okur, kimse değiştiremez veya silemez.
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  role text,
  action text not null check (char_length(action) <= 80),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_biz_idx on public.audit_log (business_id, created_at desc);
alter table public.audit_log enable row level security;
drop policy if exists al_ins on public.audit_log;
create policy al_ins on public.audit_log for insert with check (user_id = auth.uid() and is_member(business_id));
drop policy if exists al_sel on public.audit_log;
create policy al_sel on public.audit_log for select using (has_role(business_id, array['patron']));
grant select, insert on public.audit_log to authenticated;

-- 7) Kais hafızası: işletmeye özel (user_id boş) ve kişiye özel (user_id dolu). İşletmeler arası asla karışmaz.
create table if not exists public.kais_memory (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid,
  kind text not null default 'fact' check (kind in ('fact','rule','pref')),
  content text not null check (char_length(content) between 1 and 500),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists kais_memory_biz_idx on public.kais_memory (business_id, user_id);
alter table public.kais_memory enable row level security;
drop policy if exists km_sel on public.kais_memory;
create policy km_sel on public.kais_memory for select using (
  (user_id is null and has_role(business_id, array['patron','mudur','muhasebeci']))
  or (user_id = auth.uid() and is_member(business_id)));
drop policy if exists km_ins on public.kais_memory;
create policy km_ins on public.kais_memory for insert with check (
  created_by = auth.uid() and (
    (user_id is null and has_role(business_id, array['patron','mudur']))
    or (user_id = auth.uid() and is_member(business_id))));
drop policy if exists km_del on public.kais_memory;
create policy km_del on public.kais_memory for delete using (
  (user_id is null and has_role(business_id, array['patron','mudur']))
  or (user_id = auth.uid() and is_member(business_id)));

grant select, insert, delete on public.kais_memory to authenticated;

-- 8) Hesap silme (mağaza şartı). İşletme sahibi önce işletmeyi devretmeli ya da silmeli.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'Oturum yok'; end if;
  if exists (select 1 from public.businesses where owner_id = v) then
    raise exception 'İşletme sahibi hesabını silmeden önce işletmeyi devretmeli ya da silmeli';
  end if;
  delete from public.push_subs where user_id = v;
  delete from public.supplier_push where user_id = v;
  delete from public.supplier_push_log where user_id = v;
  delete from public.onboard_docs where user_id = v;
  delete from public.onboard_sub where user_id = v;
  delete from public.kais_memory where user_id = v;
  delete from public.ai_usage where user_id = v;
  delete from public.supplier_staff where staff_user = v;
  update public.suppliers set user_id = null where user_id = v;
  delete from public.members where user_id = v;
  delete from auth.users where id = v;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

commit;

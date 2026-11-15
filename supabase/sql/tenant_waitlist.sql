-- Üretici bekleme listesi: tedarikçi paneli açılmadan önce ilgilenenlerin bıraktığı bilgiler.
-- Anonim kullanıcı yalnızca ekleyebilir, okuyamaz. Kayıtları Supabase panelinde Table Editor'dan görürsün.
create table if not exists public.producer_waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  business text check (business is null or char_length(business) <= 100),
  phone text not null check (char_length(phone) between 10 and 30),
  city text not null check (char_length(city) between 2 and 80),
  products text check (products is null or char_length(products) <= 200)
);
alter table public.producer_waitlist enable row level security;
drop policy if exists producer_waitlist_insert on public.producer_waitlist;
create policy producer_waitlist_insert on public.producer_waitlist for insert to anon, authenticated with check (true);
revoke all on public.producer_waitlist from anon, authenticated;
grant insert on public.producer_waitlist to anon, authenticated;

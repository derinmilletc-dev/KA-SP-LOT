-- KaisPilot: üretici/satıcı türü, doğrulama rozeti ve herkese açık puan özeti.
-- Supabase SQL Editor'da bir kez çalıştır. Tekrar çalıştırmak güvenlidir.

alter table public.supplier_profiles add column if not exists kind text;
alter table public.supplier_profiles add column if not exists origin text;
alter table public.supplier_profiles add column if not exists verify text not null default 'yok';

alter table public.supplier_profiles drop constraint if exists supplier_profiles_kind_chk;
alter table public.supplier_profiles add constraint supplier_profiles_kind_chk
  check (kind is null or kind in ('uretici','toptanci','seyyar','dagitici','sevkiyat'));
alter table public.supplier_profiles drop constraint if exists supplier_profiles_verify_chk;
alter table public.supplier_profiles add constraint supplier_profiles_verify_chk
  check (verify in ('yok','kimlik','uretici'));

-- Satıcı kendi doğrulama seviyesini değiştiremez; sadece service_role / SQL Editor değiştirir.
create or replace function public.supplier_verify_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '');
begin
  if r in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.verify := 'yok'; else new.verify := old.verify; end if;
  end if;
  return new;
end $$;
drop trigger if exists supplier_verify_guard on public.supplier_profiles;
create trigger supplier_verify_guard before insert or update on public.supplier_profiles
  for each row execute function public.supplier_verify_guard();

-- Puan özeti: işletmeler başka işletmelerin verdiği puanların sadece toplamını görür.
create or replace function public.supplier_stats(ids uuid[])
returns table (supplier_id uuid, n int, stars numeric, on_time numeric, complete numeric)
language sql stable security definer set search_path = public as $$
  select r.supplier_id, count(*)::int,
         round(avg(r.stars)::numeric, 2),
         round(100.0 * avg((r.on_time)::int)::numeric, 0),
         round(100.0 * avg((r.complete)::int)::numeric, 0)
  from public.supplier_ratings r
  where r.supplier_id = any(ids)
  group by r.supplier_id
$$;
revoke all on function public.supplier_stats(uuid[]) from public;
grant execute on function public.supplier_stats(uuid[]) to authenticated;

-- Doğrulama vermek için (örnek):
--   update public.supplier_profiles set verify = 'uretici' where supplier_id = '<tedarikçi id>';
--   'kimlik'  = kimliği doğrulanmış satıcı, 'uretici' = doğrulanmış doğrudan üretici

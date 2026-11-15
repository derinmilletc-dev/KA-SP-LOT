-- KaisPilot: davet kodu ve yazma yetkisi sertleştirme. Önce tenant_hardening.sql çalışmış olmalı.
-- Tekrar çalıştırılabilir. Supabase SQL editöründe tek seferde çalıştır.

begin;

-- 1) Yanlış kod denemelerini say (kod tahmin saldırısına karşı).
create table if not exists public.invite_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index if not exists invite_attempts_idx on public.invite_attempts (user_id, at desc);
alter table public.invite_attempts enable row level security; -- politika yok: yalnızca fonksiyon yazar

-- 2) Davet oluşturulurken: süre en çok 14 gün, rol geçerli olmalı, kod büyük harf.
create or replace function public.invites_guard() returns trigger language plpgsql as $$
begin
  if new.expires_at is null or new.expires_at > now() + interval '14 days' then
    new.expires_at := now() + interval '7 days';
  end if;
  new.code := upper(trim(new.code));
  if new.role is null or new.role not in ('patron','mudur','muhasebeci','calisan') then
    raise exception 'invalid_role';
  end if;
  return new;
end $$;
drop trigger if exists invites_guard_t on public.invites;
create trigger invites_guard_t before insert on public.invites for each row execute function public.invites_guard();

-- 3) Daveti kullanma: 15 dakikada en çok 8 yanlış deneme, katılım denetim kaydına yazılır.
--    Yanlış kod artık hata fırlatmaz, {"error":"invalid_code"} döner (deneme kaydı geri alınmasın diye).
create or replace function public.claim_invite(p_code text) returns json
language plpgsql security definer set search_path to 'public' as $$
declare inv public.invites; em text; v_n int;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  delete from public.invite_attempts where at < now() - interval '1 day';
  select count(*) into v_n from public.invite_attempts where user_id = auth.uid() and at > now() - interval '15 minutes';
  if v_n >= 8 then raise exception 'too_many_attempts'; end if;
  select * into inv from public.invites where code = upper(trim(p_code)) and used_at is null and expires_at > now() for update;
  if not found then
    insert into public.invite_attempts(user_id) values (auth.uid());
    return json_build_object('error', 'invalid_code');
  end if;
  if exists (select 1 from public.members where business_id = inv.business_id and user_id = auth.uid()) then raise exception 'already_member'; end if;
  if exists (select 1 from public.members where business_id = inv.business_id and app_uid = inv.app_uid) then raise exception 'seat_taken'; end if;
  select email into em from auth.users where id = auth.uid();
  insert into public.members (business_id, user_id, role, app_uid, display_name, email)
  values (inv.business_id, auth.uid(), inv.role, inv.app_uid, inv.name, em);
  update public.invites set used_by = auth.uid(), used_at = now() where id = inv.id;
  insert into public.audit_log (business_id, user_id, role, action, detail)
  values (inv.business_id, auth.uid(), inv.role, 'uye_katildi', jsonb_build_object('app_uid', inv.app_uid, 'ad', inv.name));
  return json_build_object('business_id', inv.business_id, 'role', inv.role, 'app_uid', inv.app_uid);
end $$;

-- 4) Çalışan "stok" kapsamını yalnızca okuyabilsin (yazamasın). Diğer roller aynı kalır.
create or replace function public.scope_ok(bid uuid, sc text, w boolean) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.members m
    where m.business_id = bid and m.user_id = auth.uid() and (
      m.role = 'patron'
      or (m.role = 'mudur' and sc in ('stok', 'ekip'))
      or (m.role = 'muhasebeci' and (sc in ('muh', 'ekip') or (not w and left(sc, 5) = 'maas_')))
      or (m.role = 'calisan' and (sc = 'ekip' or (not w and sc = 'stok') or (not w and sc = 'maas_' || m.app_uid)))
    )
  )
$$;

commit;

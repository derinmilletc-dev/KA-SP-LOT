-- KaisPilot: kurye canlı konum + yardım çağrısı. Supabase SQL editöründe tek seferde çalıştır. Tekrar çalıştırılabilir.
-- Önce giriş tabloları (members) kurulmuş olmalı.
begin;

-- Son konum: kurye başına tek satır, 10 sn'de bir güncellenir.
create table if not exists public.kurye_konum (
  business_id uuid not null,
  app_uid text not null,
  lat double precision not null,
  lng double precision not null,
  acc real,
  spd real,
  hdg real,
  bat smallint,
  on_duty boolean not null default true,
  still_since timestamptz,
  at timestamptz not null default now(),
  primary key (business_id, app_uid)
);

-- Rota geçmişi: son 24 saat (kendiliğinden temizlenir).
create table if not exists public.kurye_iz (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  app_uid text not null,
  lat double precision not null,
  lng double precision not null,
  spd real,
  at timestamptz not null default now()
);
create index if not exists kurye_iz_idx on public.kurye_iz (business_id, app_uid, at desc);

-- Yardım / çarpma / sinyal alarmları
create table if not exists public.kurye_alarm (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  app_uid text not null,
  kind text not null check (kind in ('yardim','carpma')),
  lat double precision,
  lng double precision,
  at timestamptz not null default now(),
  ack_by text,
  ack_at timestamptz
);
create index if not exists kurye_alarm_idx on public.kurye_alarm (business_id, at desc);

alter table public.kurye_konum enable row level security;
alter table public.kurye_iz enable row level security;
alter table public.kurye_alarm enable row level security;

-- Yardımcılar
create or replace function public.kurye_is_boss(bid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.members m where m.business_id = bid and m.user_id = auth.uid() and m.role in ('patron','mudur'));
$$;
create or replace function public.kurye_is_me(bid uuid, uid text) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.members m where m.business_id = bid and m.user_id = auth.uid() and m.app_uid = uid);
$$;

-- Konum: kişi sadece kendi satırını yazar; patron ve müdür hepsini okur, kişi kendininkini okur.
drop policy if exists kk_sel on public.kurye_konum;
create policy kk_sel on public.kurye_konum for select using (public.kurye_is_boss(business_id) or public.kurye_is_me(business_id, app_uid));
drop policy if exists kk_ins on public.kurye_konum;
create policy kk_ins on public.kurye_konum for insert with check (public.kurye_is_me(business_id, app_uid));
drop policy if exists kk_upd on public.kurye_konum;
create policy kk_upd on public.kurye_konum for update using (public.kurye_is_me(business_id, app_uid)) with check (public.kurye_is_me(business_id, app_uid));

drop policy if exists ki_sel on public.kurye_iz;
create policy ki_sel on public.kurye_iz for select using (public.kurye_is_boss(business_id));
drop policy if exists ki_ins on public.kurye_iz;
create policy ki_ins on public.kurye_iz for insert with check (public.kurye_is_me(business_id, app_uid));

drop policy if exists ka_sel on public.kurye_alarm;
create policy ka_sel on public.kurye_alarm for select using (public.kurye_is_boss(business_id) or public.kurye_is_me(business_id, app_uid));
drop policy if exists ka_ins on public.kurye_alarm;
create policy ka_ins on public.kurye_alarm for insert with check (public.kurye_is_me(business_id, app_uid));
drop policy if exists ka_upd on public.kurye_alarm;
create policy ka_upd on public.kurye_alarm for update using (public.kurye_is_boss(business_id)) with check (public.kurye_is_boss(business_id));

-- Rota satırı eklenirken eski (24 saatten eski) satırları ara sıra sil.
create or replace function public.kurye_iz_purge() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if random() < 0.02 then delete from public.kurye_iz where at < now() - interval '24 hours'; end if;
  return new;
end $$;
drop trigger if exists kurye_iz_purge_t on public.kurye_iz;
create trigger kurye_iz_purge_t after insert on public.kurye_iz for each row execute function public.kurye_iz_purge();

commit;

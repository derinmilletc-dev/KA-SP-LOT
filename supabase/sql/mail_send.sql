-- KaisPilot: müşteriye e-posta gönderme kayıtları (kais-send fonksiyonu için)
-- Supabase > SQL Editor'de bir kez çalıştır. Tekrar çalıştırmak zararsızdır.
-- İki tablo da yalnızca sunucu (service role) tarafından kullanılır; uygulama istemcisi göremez ya da yazamaz.

-- Gönderilen her e-posta: çift gönderimi engeller ve günlük sınırı saymak için kullanılır.
create table if not exists public.mail_sends (
  business_id uuid not null references public.businesses(id) on delete cascade,
  key         text not null,
  kind        text not null check (kind in ('remind','campaign')),
  to_email    text not null,
  created_at  timestamptz not null default now(),
  primary key (business_id, key)
);
create index if not exists mail_sends_day on public.mail_sends (business_id, created_at);

-- Listeden çıkan adresler (e-postadaki "buradan çık" bağlantısı yazar).
create table if not exists public.mail_optout (
  business_id uuid not null references public.businesses(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  primary key (business_id, email)
);

alter table public.mail_sends  enable row level security;
alter table public.mail_optout enable row level security;
revoke all on public.mail_sends  from anon, authenticated;
revoke all on public.mail_optout from anon, authenticated;

-- Kontrol (çalıştırınca 2 satır, ikisinde de rls = true olmalı):
-- select relname, relrowsecurity as rls from pg_class where relname in ('mail_sends','mail_optout');

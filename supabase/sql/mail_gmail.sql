-- Gmail bağlantısı (e-postadaki faturaları bulma). SQL Editor'de bir kez çalıştır; tekrar çalıştırılabilir.
-- Üç tablo:
--   mail_connections : hangi işletme hangi Gmail adresini bağlamış (şifre/anahtar YOK, istemci okuyabilir)
--   mail_secrets     : Google yenileme anahtarı (şifreli). Hiçbir politika yok: yalnızca sunucu (service role) erişir.
--   mail_docs        : e-postadan bulunan belgeler (istemci okur, yazma yalnızca sunucudan)
-- Okuma: işletme sahibi ile Patron, Müdür, Muhasebeci. Çalışan göremez.

create table if not exists public.mail_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  provider text not null default 'gmail' check (provider in ('gmail')),
  email text not null,
  status text not null default 'active' check (status in ('active','error','revoked')),
  last_error text,
  last_scan_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, email)
);

create table if not exists public.mail_secrets (
  connection_id uuid primary key references public.mail_connections(id) on delete cascade,
  refresh_token_enc text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.mail_docs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  connection_id uuid not null references public.mail_connections(id) on delete cascade,
  msg_id text not null,
  from_name text,
  from_addr text,
  subject text,
  received_at timestamptz,
  kind text not null default 'none' check (kind in ('none','xml','pdf','image','text')),
  seller text,
  invoice_no text,
  invoice_date date,
  total numeric(14,2),
  currency text,
  tax_rate numeric(5,2),
  category text,
  confidence text check (confidence in ('yuksek','orta','dusuk')),
  ai_used boolean not null default false,   -- yapay zekâ çağrıldı mı (günlük sınır için)
  status text not null default 'yeni' check (status in ('yeni','eklendi','atla')),
  created_at timestamptz not null default now(),
  unique (connection_id, msg_id)
);
alter table public.mail_docs add column if not exists ai_used boolean not null default false;
create index if not exists mail_docs_biz_idx on public.mail_docs (business_id, received_at desc);

alter table public.mail_connections enable row level security;
alter table public.mail_secrets enable row level security;   -- politika yok: istemci hiçbir şey okuyamaz
alter table public.mail_docs enable row level security;

create or replace function public.mail_can_read(p_biz uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses b where b.id = p_biz and b.owner_id = auth.uid())
      or exists (select 1 from public.members m where m.business_id = p_biz and m.user_id = auth.uid()
                 and m.role in ('patron','mudur','muhasebeci'));
$$;
revoke all on function public.mail_can_read(uuid) from public, anon;
grant execute on function public.mail_can_read(uuid) to authenticated;

drop policy if exists mail_conn_read on public.mail_connections;
create policy mail_conn_read on public.mail_connections for select to authenticated
  using (public.mail_can_read(business_id));

drop policy if exists mail_docs_read on public.mail_docs;
create policy mail_docs_read on public.mail_docs for select to authenticated
  using (public.mail_can_read(business_id));

-- Yazma, güncelleme ve silme politikası yok: yalnızca Edge Function (service role) yapar.
revoke all on public.mail_secrets from anon, authenticated;
revoke all on public.mail_connections, public.mail_docs from anon;
revoke insert, update, delete, truncate on public.mail_connections, public.mail_docs from authenticated;

-- Kontrol (çalıştırınca 3 satır, hepsinde rls = true olmalı):
-- select relname, relrowsecurity as rls from pg_class where relname in ('mail_connections','mail_secrets','mail_docs');

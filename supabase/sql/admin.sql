-- KaisPilot admin paneli (v146). SQL Editor'de bir kez çalıştır.
-- Admin tablolarına yalnızca sunucu (service role, kais-admin fonksiyonu) erişir; istemciye hiçbir politika verilmez.

create table if not exists public.admin_users (
  user_id uuid primary key,
  email text not null,
  role text not null check (role in ('super','mod')),
  perms jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by text
);
alter table public.admin_users enable row level security;

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  admin_id uuid, email text, action text not null, target text, meta jsonb
);
create index if not exists admin_audit_at on public.admin_audit (at desc);
alter table public.admin_audit enable row level security;

-- İşletme başına özel AI limiti (yoksa varsayılan limitler geçerli)
create table if not exists public.ai_limits (
  business_id uuid primary key,
  chat_day int, chat_month int, read_day int, read_month int,
  note text, updated_at timestamptz not null default now(), updated_by text
);
alter table public.ai_limits enable row level security;

-- İşletmeyi askıya alma
alter table public.businesses add column if not exists suspended_at timestamptz;
alter table public.businesses add column if not exists suspended_note text;

-- Ana admin: kayıtlı e-posta (hesap yoksa önce ana uygulamadan bu e-postayla kayıt ol, sonra bu bloğu yeniden çalıştır)
insert into public.admin_users (user_id, email, role, perms, created_by)
select id, email, 'super', '{}'::jsonb, 'kurulum' from auth.users where lower(email) = 'ahmtt4565@gmail.com'
on conflict (user_id) do update set role = 'super', active = true;

select count(*) as ana_admin_sayisi from public.admin_users where role = 'super';

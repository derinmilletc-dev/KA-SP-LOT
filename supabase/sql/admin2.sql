-- v147 Admin: duyurular, işletme notları, özellik bayrakları, destek talepleri.
-- Supabase > SQL Editor'de bir kez çalıştır. Tekrar çalıştırmak zararsızdır.

-- 1) Duyurular
create table if not exists public.admin_announcements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  body text,
  kind text not null default 'info',
  target uuid[],
  expires_at timestamptz,
  created_by text,
  active boolean not null default true
);
alter table public.admin_announcements enable row level security;
drop policy if exists ann_read on public.admin_announcements;
create policy ann_read on public.admin_announcements for select to authenticated
using (
  active and (expires_at is null or expires_at > now())
  and (target is null or exists (select 1 from public.members m where m.user_id = auth.uid() and m.business_id = any(target)))
);

-- 2) İşletme notları ve etiketleri (yalnızca admin, servis anahtarıyla)
create table if not exists public.business_notes (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  note text,
  tags text[] not null default '{}',
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.business_notes enable row level security;

-- 3) Özellik bayrakları
create table if not exists public.feature_flags (
  key text primary key,
  label text,
  description text,
  enabled_all boolean not null default false,
  business_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.feature_flags enable row level security;
create or replace function public.my_flags() returns text[]
language sql security definer set search_path = public stable as $$
  select coalesce(array_agg(f.key), '{}'::text[]) from public.feature_flags f
  where f.enabled_all or exists (select 1 from public.members m where m.user_id = auth.uid() and m.business_id = any(f.business_ids));
$$;
revoke all on function public.my_flags() from public;
grant execute on function public.my_flags() to authenticated;

-- 4) Destek talepleri
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_id uuid not null,
  user_id uuid not null,
  role text,
  kind text not null default 'sorun',
  message text not null,
  ver text,
  status text not null default 'open',
  reply text,
  replied_at timestamptz,
  replied_by text
);
alter table public.support_tickets enable row level security;
drop policy if exists st_ins on public.support_tickets;
create policy st_ins on public.support_tickets for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.members m where m.user_id = auth.uid() and m.business_id = support_tickets.business_id));
drop policy if exists st_sel on public.support_tickets;
create policy st_sel on public.support_tickets for select to authenticated using (user_id = auth.uid());

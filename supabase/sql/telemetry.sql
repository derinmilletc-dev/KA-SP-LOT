-- Hata kaydı ve kullanım sayacı (v145). SQL Editor'de bir kez çalıştır.
-- Kişisel veri tutulmaz: yalnızca hata metni, ekran adı, rol ve olay sayıları.
create table if not exists public.app_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  business_id uuid, user_id uuid, role text, view text,
  msg text not null, stack text, ua text, ver text
);
create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  business_id uuid, user_id uuid, role text,
  ev text not null, n int not null default 1
);
create index if not exists app_errors_created on public.app_errors (created_at desc);
create index if not exists app_events_created on public.app_events (created_at desc);
alter table public.app_errors enable row level security;
alter table public.app_events enable row level security;
-- Giriş yapmış kullanıcı yalnızca kendi adına ekleyebilir; okuma yalnızca sunucu (service role).
drop policy if exists app_errors_ins on public.app_errors;
create policy app_errors_ins on public.app_errors for insert to authenticated with check (user_id = auth.uid());
drop policy if exists app_events_ins on public.app_events;
create policy app_events_ins on public.app_events for insert to authenticated with check (user_id = auth.uid());
-- 90 günden eski kayıtları temizle
create or replace function public.telemetry_clean() returns void language sql as $$
  delete from public.app_errors where created_at < now() - interval '90 days';
  delete from public.app_events where created_at < now() - interval '90 days';
$$;

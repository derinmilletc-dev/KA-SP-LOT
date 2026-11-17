-- Kullanım şartları ve KVKK onay kayıtları. SQL Editor'de bir kez çalıştır (tekrar çalıştırmak güvenli).
-- Kullanıcı yalnızca kendi onayını ekleyebilir ve görebilir. Admin paneli kayıtları sunucu üzerinden (kais-admin) okur.

create table if not exists public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  business_id uuid,
  email text,
  kind text not null check (kind in ('kurulum', 'davet', 'google')),
  ver text not null,                      -- belge sürümü (örn. 2026-11-15)
  docs jsonb not null default '{}'::jsonb, -- onaylanan belgeler
  ua text,                                 -- cihaz bilgisi (kısa)
  accepted_at timestamptz not null default now(),
  unique (user_id, kind, ver)
);
create index if not exists consents_at on public.consents (accepted_at desc);
alter table public.consents enable row level security;
drop policy if exists consents_ins on public.consents;
create policy consents_ins on public.consents for insert to authenticated with check (user_id = auth.uid());
drop policy if exists consents_sel on public.consents;
create policy consents_sel on public.consents for select to authenticated using (user_id = auth.uid());

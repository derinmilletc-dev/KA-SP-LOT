-- Hesap silinirken sorulan "neden ayrılıyorsun" cevaplarını saklar.
-- Kimlik tutmaz: yalnızca neden, not, rol ve işletme sahibi olup olmadığı. Okuma kapalı, yalnızca ekleme açık.
-- SQL Editor'de bir kez çalıştır. Tekrar çalıştırılabilir.
create table if not exists public.account_feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  reason text,
  note text,
  role text,
  was_owner boolean not null default false
);
alter table public.account_feedback enable row level security;
drop policy if exists af_ins on public.account_feedback;
create policy af_ins on public.account_feedback for insert to authenticated with check (true);
revoke all on public.account_feedback from anon;
grant insert on public.account_feedback to authenticated;

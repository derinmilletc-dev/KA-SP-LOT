-- Kais zamanlayıcı kurulumu. Supabase SQL Editor'de bir kez çalıştır.
-- 1) Aynı e-posta ve bildirimin iki kez gitmesini engelleyen kayıt tablosu
create table if not exists public.mail_log (
  business_id uuid not null,
  key text not null,
  kind text not null,
  created_at timestamptz not null default now(),
  primary key (business_id, key)
);
alter table public.mail_log enable row level security; -- politika yok: yalnızca sunucu (service role) erişir
create index if not exists mail_log_created on public.mail_log (created_at);

-- 2) Eski kayıtları 90 günde bir temizle
create or replace function public.mail_log_clean() returns void language sql as $$
  delete from public.mail_log where created_at < now() - interval '90 days';
$$;

-- 3) Her 5 dakikada fonksiyonu çağır. BURAYA_GIZLI_SIFRE yerine CRON_SECRET ile aynı değeri yaz.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('kais-cron') where exists (select 1 from cron.job where jobname = 'kais-cron');
select cron.schedule('kais-cron', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://bbcsbkgbwzciyfymvpxh.supabase.co/functions/v1/kais-cron',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'BURAYA_GIZLI_SIFRE'),
    body := '{}'::jsonb
  );
$$);
select cron.unschedule('kais-mail-log-clean') where exists (select 1 from cron.job where jobname = 'kais-mail-log-clean');
select cron.schedule('kais-mail-log-clean', '30 3 * * *', 'select public.mail_log_clean()');

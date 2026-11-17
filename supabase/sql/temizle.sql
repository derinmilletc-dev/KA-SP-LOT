-- CANLIYI SIFIRLA: tüm işletmeleri, kullanıcı verilerini, test hesaplarını ve kayıtları siler. GERİ ALINAMAZ.
-- Korunanlar: planlar, özellik bayrakları, admin hesapları (admin_users) ve aşağıdaki keep_emails listesi.
-- Kullanmak için: aşağıdaki onay satırında 'HAYIR' yerine 'EVET' yaz, sonra Run et.
-- Silmeden önce otomatik yedek alınır: yedek_<tarih> adlı şemada (Table Editor'de şema listesinden görürsün).
-- Ayrıca Supabase → Database → Backups'a da bak. Storage'daki yüklenmiş dosyalar (fiş fotoğrafları) bu script ile silinmez:
-- Supabase → Storage'dan klasörleri elle boşalt.

do $$
declare
  onay text := 'EVET';                        -- <== hazır: çalıştırınca siler (iptal için 'HAYIR' yap)
  keep_emails text[] := array['ahmtt4565@gmail.com'];   -- <== tutulacak hesap(lar); admin hesapları zaten tutulur
  t text; n int; sema text := 'yedek_' || to_char(now(), 'YYYYMMDD_HH24MI');
  veri text[] := array[
    'businesses',
    'account_feedback','ai_quota','ai_usage','ai_limits','app_errors','app_events','booking_config','booking_requests',
    'invite_attempts','mail_log','market_events','market_offers','market_ratings','price_hist','producer_waitlist','quotes',
    'supplier_books','supplier_cprice','supplier_customer','supplier_dnote','supplier_private','supplier_products','supplier_profiles',
    'support_tickets','admin_audit'];
begin
  if onay <> 'EVET' then raise exception 'Onay verilmedi. onay değerini EVET yap.'; end if;

  -- önce yedek: public tabloların kopyası ayrı bir şemaya alınır (silinen her şey burada durur)
  execute format('create schema %I', sema);
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('create table %I.%I as table public.%I', sema, t, t);
  end loop;
  execute format('create table %I.auth_users as select id, email from auth.users', sema);
  raise notice 'Yedek şeması: %', sema;

  -- işletmeler silinince üyeler, davetler, fişler, plan kayıtları, hafıza, bildirimler vb. zincirleme gider
  foreach t in array veri loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I', t);
      get diagnostics n = row_count; raise notice '% : % satır silindi', t, n;
    end if;
  end loop;

  -- hesaplar: admin ve tutulacaklar hariç
  delete from auth.users u
   where u.id not in (select user_id from public.admin_users)
     and lower(coalesce(u.email, '')) <> all (select lower(x) from unnest(keep_emails) x);
  get diagnostics n = row_count; raise notice 'auth.users : % hesap silindi', n;
end $$;

-- kontrol
-- select (select count(*) from public.businesses) as isletme, (select count(*) from auth.users) as hesap, (select count(*) from public.admin_users) as admin;

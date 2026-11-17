-- CANLIYI SIFIRLA: tüm işletmeleri, kullanıcı verilerini, test hesaplarını ve kayıtları siler. GERİ ALINAMAZ.
-- Korunanlar: planlar, özellik bayrakları, admin hesapları (admin_users) ve aşağıdaki keep_emails listesi.
-- Kullanmak için: aşağıdaki onay satırında 'HAYIR' yerine 'EVET' yaz, sonra Run et.
-- Önce Supabase → Database → Backups'tan yedek olduğuna bak. Storage'daki yüklenmiş dosyalar (fiş fotoğrafları) bu script ile silinmez:
-- Supabase → Storage'dan klasörleri elle boşalt.

do $$
declare
  onay text := 'HAYIR';                       -- <== silmek için 'EVET' yaz
  keep_emails text[] := array[]::text[];      -- <== ayrıca tutulacak e-postalar, örn. array['ben@gmail.com']
  t text; n int;
  veri text[] := array[
    'businesses',
    'account_feedback','ai_quota','ai_usage','ai_limits','app_errors','app_events','booking_config','booking_requests',
    'invite_attempts','mail_log','market_events','market_offers','market_ratings','price_hist','producer_waitlist','quotes',
    'supplier_books','supplier_cprice','supplier_customer','supplier_dnote','supplier_private','supplier_products','supplier_profiles',
    'support_tickets','admin_audit'];
begin
  if onay <> 'EVET' then raise exception 'Onay verilmedi. onay değerini EVET yap.'; end if;

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

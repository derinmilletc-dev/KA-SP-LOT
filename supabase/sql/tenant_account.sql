-- KaisPilot: hesap silme (App Store ve Google Play şartı). Önce tenant_hardening.sql çalışmış olmalı.
-- Tekrar çalıştırılabilir. Supabase SQL editöründe tek seferde çalıştır.
-- Önce deneme hesabıyla dene: bu işlem geri alınamaz.
--
-- Davranış:
--  * Çalışan/müdür/muhasebeci/tedarikçi: üyelikleri, bildirim kayıtları, yüklediği belgeler, sözleşme formu,
--    Kais hafızası silinir ve giriş hesabı kaldırılır.
--  * İşletme sahibi: sahibi olduğu işletmenin tüm verisi (ekip, stok, muhasebe, rezervasyon, yedekler, davetler,
--    denetim kaydı, Kais hafızası) silinir, çalışanların erişimi kapanır. Tedarikçilerle ortak ticari kayıtlar
--    (sipariş, cari) yasal saklama süresi için anonimleştirilmiş işletme satırına bağlı olarak kalır.

begin;

alter table public.businesses add column if not exists deleted_at timestamptz;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare v uuid := auth.uid(); b uuid; t text;
begin
  if v is null then raise exception 'not_signed_in'; end if;

  for b in select id from public.businesses where owner_id = v and deleted_at is null loop
    foreach t in array array['app_state','backups','invites','members','onboard_config','onboard_docs','onboard_sub',
                             'pos_tokens','push_subs','push_log','sales_inbox','audit_log','kais_memory','mail_log'] loop
      if to_regclass('public.' || t) is not null then
        execute format('delete from public.%I where business_id = $1', t) using b;
      end if;
    end loop;
    update public.businesses set name = 'Silinmiş işletme', lat = null, lng = null, deleted_at = now() where id = b;
  end loop;

  delete from public.push_subs where user_id = v;
  delete from public.supplier_push where user_id = v;
  delete from public.supplier_push_log where user_id = v;
  delete from public.onboard_docs where user_id = v;
  delete from public.onboard_sub where user_id = v;
  delete from public.kais_memory where user_id = v;
  delete from public.ai_usage where user_id = v;
  delete from public.supplier_staff where staff_user = v;
  update public.suppliers set user_id = null where user_id = v;
  delete from public.members where user_id = v;
  update public.businesses set owner_id = null where owner_id = v;
  delete from auth.users where id = v;
exception
  when not_null_violation then raise exception 'owner_required';
  when foreign_key_violation then raise exception 'delete_blocked';
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

commit;

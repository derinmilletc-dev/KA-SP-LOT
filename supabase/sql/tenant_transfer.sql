-- KaisPilot: işletme sahipliğini müdüre devretme. Önce tenant_hardening.sql çalışmış olmalı.
-- Tekrar çalıştırılabilir.
-- Davranış: sahip ile seçilen müdür yer değiştirir. Müdür patron olur ve işletmenin sahibi sayılır,
-- eski patron müdür olur. Veri yerinde kalır. Sahip hesabını silmek isterse artık önce bu devri yapar.

begin;

create or replace function public.transfer_business(p_business uuid, p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := auth.uid(); o public.members%rowtype; n public.members%rowtype;
begin
  if v is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.businesses where id = p_business and owner_id = v and deleted_at is null) then
    raise exception 'not_owner';
  end if;
  select * into o from public.members where business_id = p_business and user_id = v and role = 'patron';
  if not found then raise exception 'not_owner'; end if;
  select * into n from public.members where id = p_member and business_id = p_business and role = 'mudur';
  if not found then raise exception 'target_must_be_mudur'; end if;

  update public.members set app_uid = '_tmp_' || id::text where id = o.id;
  update public.members set app_uid = o.app_uid, role = 'patron', display_name = o.display_name where id = n.id;
  update public.members set app_uid = n.app_uid, role = 'mudur', display_name = n.display_name where id = o.id;
  update public.businesses set owner_id = n.user_id where id = p_business;
  if to_regclass('public.audit_log') is not null then
    insert into public.audit_log(business_id, user_id, role, action, detail)
    values (p_business, v, 'patron', 'devir', jsonb_build_object('text', 'İşletme sahipliği devredildi'));
  end if;
end $$;
revoke all on function public.transfer_business(uuid, uuid) from public, anon;
grant execute on function public.transfer_business(uuid, uuid) to authenticated;

commit;

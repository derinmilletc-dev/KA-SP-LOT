-- KaisPilot: ekip verisi koruması (v100). Önce tenant_hardening.sql çalışmış olmalı. Tekrar çalıştırılabilir.
-- Sorun: 'ekip' kaydı tek parça JSON. Çalışan hesabı onu bütünüyle yazabildiği için ayarları, yetkileri, adları,
--        vardiya planını ve masa düzenini de değiştirebilirdi.
-- Çözüm: Kayıt yazılırken sunucu, çalışanın değiştirmeye hakkı olmayan bölümleri eski haline geri koyar.
--        Müdür için yetki ayarı (SETTINGS.perm) ve roller (ROLES) korunur. Patron ve sahip serbesttir.
--        Hata vermez, yalnızca yetkisiz değişikliği yok sayar; uygulama bir sonraki eşitlemede doğru veriyi alır.

begin;

create or replace function public.app_state_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role text; v_old jsonb; v_new jsonb; k text;
  allow_emp text[] := array['ATT','EMPDATA','HOURS','CLOCK','CLKSUM','LVREQ','MSGS','RECEIPTS','TASKS','CHKI','CHKL','REQS','MAINT','KASA','SEATS','RESV','seq'];
begin
  if auth.uid() is null or new.scope is distinct from 'ekip' then return new; end if;
  select role into v_role from public.members where business_id = new.business_id and user_id = auth.uid() limit 1;
  if v_role is null or v_role in ('patron') then return new; end if;
  if v_role not in ('calisan','mudur') then return new; end if;
  begin
    v_old := coalesce(old.state, '{}')::jsonb; v_new := coalesce(new.state, '{}')::jsonb;
  exception when others then return new;
  end;
  if jsonb_typeof(v_old) <> 'object' or jsonb_typeof(v_new) <> 'object' then return new; end if;

  if v_role = 'calisan' then
    for k in select jsonb_object_keys(v_new) union select jsonb_object_keys(v_old) loop
      if k = any(allow_emp) then continue; end if;
      if v_old ? k then v_new := jsonb_set(v_new, array[k], v_old -> k, true); else v_new := v_new - k; end if;
    end loop;
  else
    if v_old ? 'ROLES' then v_new := jsonb_set(v_new, '{ROLES}', v_old -> 'ROLES', true); else v_new := v_new - 'ROLES'; end if;
    if jsonb_typeof(v_new -> 'SETTINGS') = 'object' then
      if (v_old -> 'SETTINGS') ? 'perm' then v_new := jsonb_set(v_new, '{SETTINGS,perm}', v_old -> 'SETTINGS' -> 'perm', true);
      else v_new := jsonb_set(v_new, '{SETTINGS}', (v_new -> 'SETTINGS') - 'perm', true); end if;
    end if;
    if jsonb_typeof(v_new -> 'SETTINGS') = 'object' then
      if (v_old -> 'SETTINGS') ? 'mperm' then v_new := jsonb_set(v_new, '{SETTINGS,mperm}', v_old -> 'SETTINGS' -> 'mperm', true);
      else v_new := jsonb_set(v_new, '{SETTINGS}', (v_new -> 'SETTINGS') - 'mperm', true); end if;
    end if;
    if jsonb_typeof(v_new -> 'SETTINGS') = 'object' then
      if (v_old -> 'SETTINGS') ? 'mudurMaas' then v_new := jsonb_set(v_new, '{SETTINGS,mudurMaas}', v_old -> 'SETTINGS' -> 'mudurMaas', true);
      else v_new := jsonb_set(v_new, '{SETTINGS}', (v_new -> 'SETTINGS') - 'mudurMaas', true); end if;
    end if;
  end if;
  new.state := v_new::text;
  return new;
end $$;

drop trigger if exists app_state_guard on public.app_state;
create trigger app_state_guard before update on public.app_state for each row execute function public.app_state_guard();

commit;

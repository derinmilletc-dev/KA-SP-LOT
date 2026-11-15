-- KaisPilot: işletmeler arası "saldırı" testi. Hiçbir veri kalıcı değişmez (her deneme geri alınır).
-- Supabase SQL editöründe çalıştır. Önce aşağıdaki 5 değeri doldur:
--   a_patron : A işletmesinin patronunun auth kullanıcı id'si (members.user_id)
--   a_emp    : A işletmesinde "calisan" rolündeki bir kullanıcının id'si
--   a_biz    : A işletmesinin id'si
--   b_biz    : BAŞKA bir işletmenin id'si (a_patron bu işletmede üye OLMAMALI)
--   sup_user : tedarikçi hesabının auth kullanıcı id'si (yoksa a_emp ile aynı bırak)
-- Sonuçta "ok = false" satır varsa o kontrol BAŞARISIZ demektir ve o satırı bana gönder.

create temp table p as select
  '00000000-0000-0000-0000-000000000001'::uuid as a_patron,
  '00000000-0000-0000-0000-000000000002'::uuid as a_emp,
  '00000000-0000-0000-0000-000000000003'::uuid as a_biz,
  '00000000-0000-0000-0000-000000000004'::uuid as b_biz,
  '00000000-0000-0000-0000-000000000005'::uuid as sup_user;

create temp table res (n serial, name text, ok boolean, info text);
grant all on res to authenticated; grant all on res_n_seq to authenticated;

do $$
declare p record; t text; n int; w int;
  tabs text[] := array['app_state','backups','cari_pay','cari_recon','invites','members','onboard_config','onboard_docs','onboard_sub','orders','pos_tokens','push_subs','rfqs','sales_inbox','supplier_ratings','suppliers','audit_log','kais_memory'];
  emp_tabs text[] := array['cari_pay','cari_recon','backups','invites','supplier_ratings','orders','rfqs','suppliers','pos_tokens','sales_inbox','audit_log'];
begin
  select * into p from pg_temp.p;

  -- ===== A patronu, B işletmesine saldırıyor =====
  perform set_config('request.jwt.claims', json_build_object('sub', p.a_patron, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p.a_patron::text, true);
  set local role authenticated;

  foreach t in array tabs loop
    begin
      execute format('select count(*) from public.%I where business_id = $1', t) into n using p.b_biz;
      insert into pg_temp.res(name, ok, info) values ('A patronu B''nin ' || t || ' satırlarını OKUYAMAZ', n = 0, 'okunan: ' || n);
    exception when undefined_table then
      insert into pg_temp.res(name, ok, info) values ('A patronu B''nin ' || t || ' satırlarını OKUYAMAZ', null, 'tablo yok');
    when others then
      insert into pg_temp.res(name, ok, info) values ('A patronu B''nin ' || t || ' satırlarını OKUYAMAZ', true, 'engellendi: ' || sqlerrm);
    end;
  end loop;
  begin select count(*) into n from public.businesses where id = p.b_biz;
    insert into pg_temp.res(name, ok, info) values ('A patronu B işletmesini görmez', n = 0, 'görülen: ' || n);
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B işletmesini görmez', true, sqlerrm); end;

  begin insert into public.app_state(business_id, scope, state, version) values (p.b_biz, 'ekip', '{}', 1); raise exception 'KP_YAZILDI';
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B''ye veri YAZAMAZ (app_state)', case when sqlerrm like '%does not exist%' then null else sqlerrm <> 'KP_YAZILDI' end, sqlerrm); end;
  begin insert into public.audit_log(business_id, action) values (p.b_biz, 'saldiri'); raise exception 'KP_YAZILDI';
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B''ye denetim kaydı YAZAMAZ', case when sqlerrm like '%does not exist%' then null else sqlerrm <> 'KP_YAZILDI' end, sqlerrm); end;
  begin insert into public.kais_memory(business_id, content) values (p.b_biz, 'saldiri'); raise exception 'KP_YAZILDI';
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B''nin Kais hafızasına YAZAMAZ', case when sqlerrm like '%does not exist%' then null else sqlerrm <> 'KP_YAZILDI' end, sqlerrm); end;
  begin insert into public.invites(business_id, code, role) values (p.b_biz, 'SALDIRI1', 'patron'); raise exception 'KP_YAZILDI';
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B adına davet kodu ÜRETEMEZ', case when sqlerrm like '%does not exist%' then null else sqlerrm <> 'KP_YAZILDI' end, sqlerrm); end;
  begin update public.members set role = 'patron' where business_id = p.b_biz; get diagnostics w = row_count; raise exception 'KP_W%', w;
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B üyelerini DEĞİŞTİREMEZ', case when sqlerrm like '%does not exist%' then null else sqlerrm = 'KP_W0' or sqlerrm like 'permission denied%' end, sqlerrm); end;
  begin delete from public.app_state where business_id = p.b_biz; get diagnostics w = row_count; raise exception 'KP_W%', w;
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B verisini SİLEMEZ', case when sqlerrm like '%does not exist%' then null else sqlerrm = 'KP_W0' or sqlerrm like 'permission denied%' end, sqlerrm); end;
  begin update public.businesses set name = 'ele geçirildi' where id = p.b_biz; get diagnostics w = row_count; raise exception 'KP_W%', w;
  exception when others then insert into pg_temp.res(name, ok, info) values ('A patronu B işletmesini DEĞİŞTİREMEZ', case when sqlerrm like '%does not exist%' then null else sqlerrm = 'KP_W0' or sqlerrm like 'permission denied%' end, sqlerrm); end;

  -- ===== A çalışanı, kendi işletmesinde yetkisini aşmaya çalışıyor =====
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p.a_emp, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p.a_emp::text, true);
  set local role authenticated;

  foreach t in array emp_tabs loop
    begin
      execute format('select count(*) from public.%I where business_id = $1', t) into n using p.a_biz;
      insert into pg_temp.res(name, ok, info) values ('A çalışanı kendi işletmesinin ' || t || ' satırlarını GÖREMEZ', n = 0, 'görülen: ' || n);
    exception when undefined_table then
      insert into pg_temp.res(name, ok, info) values ('A çalışanı kendi işletmesinin ' || t || ' satırlarını GÖREMEZ', null, 'tablo yok');
    when others then
      insert into pg_temp.res(name, ok, info) values ('A çalışanı kendi işletmesinin ' || t || ' satırlarını GÖREMEZ', true, 'engellendi: ' || sqlerrm);
    end;
  end loop;
  begin update public.members set role = 'patron' where user_id = p.a_emp; get diagnostics w = row_count; raise exception 'KP_W%', w;
  exception when others then insert into pg_temp.res(name, ok, info) values ('Çalışan kendini patron YAPAMAZ', case when sqlerrm like '%does not exist%' then null else sqlerrm = 'KP_W0' or sqlerrm like 'permission denied%' end, sqlerrm); end;
  begin insert into public.invites(business_id, code, role) values (p.a_biz, 'SALDIRI2', 'patron'); raise exception 'KP_YAZILDI';
  exception when others then insert into pg_temp.res(name, ok, info) values ('Çalışan davet kodu ÜRETEMEZ', case when sqlerrm like '%does not exist%' then null else sqlerrm <> 'KP_YAZILDI' end, sqlerrm); end;
  begin insert into public.kais_memory(business_id, content) values (p.a_biz, 'saldiri'); raise exception 'KP_YAZILDI';
  exception when others then insert into pg_temp.res(name, ok, info) values ('Çalışan işletme geneli Kais hafızasına YAZAMAZ', case when sqlerrm like '%does not exist%' then null else sqlerrm <> 'KP_YAZILDI' end, sqlerrm); end;
  begin select count(*) into n from public.onboard_sub where business_id = p.a_biz and user_id <> p.a_emp;
    insert into pg_temp.res(name, ok, info) values ('Çalışan başkasının sözleşme formunu GÖREMEZ', n = 0, 'görülen: ' || n);
  exception when others then insert into pg_temp.res(name, ok, info) values ('Çalışan başkasının sözleşme formunu GÖREMEZ', true, sqlerrm); end;

  -- ===== Tedarikçi hesabı =====
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p.sup_user, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p.sup_user::text, true);
  set local role authenticated;
  begin select count(*) into n from public.orders o where not exists (select 1 from public.suppliers s where s.id = o.supplier_id and s.user_id = p.sup_user);
    insert into pg_temp.res(name, ok, info) values ('Tedarikçi başkasının siparişini GÖREMEZ', n = 0, 'görülen: ' || n);
  exception when others then insert into pg_temp.res(name, ok, info) values ('Tedarikçi başkasının siparişini GÖREMEZ', true, sqlerrm); end;
  begin select count(*) into n from public.supplier_cprice c where not exists (select 1 from public.suppliers s where s.id = c.supplier_id and s.user_id = p.sup_user);
    insert into pg_temp.res(name, ok, info) values ('Tedarikçi başkasının özel fiyatını GÖREMEZ', n = 0, 'görülen: ' || n);
  exception when others then insert into pg_temp.res(name, ok, info) values ('Tedarikçi başkasının özel fiyatını GÖREMEZ', true, sqlerrm); end;
  begin select count(*) into n from public.app_state;
    insert into pg_temp.res(name, ok, info) values ('Tedarikçi işletme verisini (app_state) GÖREMEZ', n = 0, 'görülen: ' || n);
  exception when others then insert into pg_temp.res(name, ok, info) values ('Tedarikçi işletme verisini (app_state) GÖREMEZ', true, sqlerrm); end;
  begin select count(*) into n from public.rfqs where status <> 'acik';
    insert into pg_temp.res(name, ok, info) values ('Tedarikçi kapalı teklif isteğini GÖREMEZ', n = 0, 'görülen: ' || n);
  exception when others then insert into pg_temp.res(name, ok, info) values ('Tedarikçi kapalı teklif isteğini GÖREMEZ', true, sqlerrm); end;
  begin update public.orders set business_id = p.b_biz; get diagnostics w = row_count; raise exception 'KP_W%', w;
  exception when others then insert into pg_temp.res(name, ok, info) values ('Tedarikçi siparişi başka işletmeye TAŞIYAMAZ', case when sqlerrm like '%does not exist%' then null else sqlerrm = 'KP_W0' or sqlerrm like '%değiştirilemez%' or sqlerrm like 'permission denied%' end, sqlerrm); end;

  reset role;
end $$;

select case when ok is null then 'ATLANDI' when ok then 'GEÇTİ' else 'BAŞARISIZ' end as sonuc, name, info from res order by ok nulls last, n;
select count(*) filter (where ok) as gecti, count(*) filter (where ok = false) as basarisiz, count(*) filter (where ok is null) as atlandi from res;

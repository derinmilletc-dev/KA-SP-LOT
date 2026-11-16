-- Plan altyapısı testi. Sırayla: stub.sql, 00_base_schema.sql, plans.sql, bu dosya.
insert into auth.users(id, email) values ('00000000-0000-0000-0000-0000000000a1', 'p@x'), ('00000000-0000-0000-0000-0000000000a2', 'm@x'), ('00000000-0000-0000-0000-0000000000a3', 'n@x');
grant select, insert, update, delete on all tables in schema public to authenticated;
do $$
declare
  old_b uuid := '22222222-2222-2222-2222-222222222222'; biz uuid := '33333333-3333-3333-3333-333333333333';
  u1 text := '00000000-0000-0000-0000-0000000000a1'; u2 text := '00000000-0000-0000-0000-0000000000a2'; u3 text := '00000000-0000-0000-0000-0000000000a3';
  s jsonb; ok boolean;
begin
  -- yeni işletme: deneme, 30 gün
  insert into businesses(id, name, owner_id) values (biz, 'Yeni', u1::uuid);
  insert into app_state(business_id, scope, state, version) values (biz, 'muh', '{}', 1);
  s := plan_state(biz); assert s ->> 'plan' = 'deneme' and s ->> 'status' = 'trial' and s ->> 'effective' = 'ok', 'yeni isletme deneme degil: ' || s::text;
  assert (s ->> 'days_left')::int between 29 and 30, 'gun sayisi: ' || s::text;

  -- üye kullanıcı plan_get okur, üye olmayan okuyamaz
  perform set_config('request.jwt.claim.sub', u1, true); execute 'set local role authenticated';
  assert (plan_get(biz) ->> 'plan') = 'deneme', 'uye plan okuyamadi';
  update app_state set state = '{"a":1}' where business_id = biz and scope = 'muh';
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', u3, true); execute 'set local role authenticated';
  begin perform plan_get(biz); ok := false; exception when others then ok := true; end; assert ok, 'uye olmayan plan okudu';
  begin perform plan_set(biz, 'pro', 'active', null, null, ''); ok := false; exception when others then ok := true; end; assert ok, 'kullanici plan_set cagirdi';
  execute 'reset role';

  -- sunucu planı ayarlar; süre dolmuş + ek süre -> grace, yazma serbest
  perform set_config('request.jwt.claim.sub', '', true);
  update business_plans set trial_ends = now() - interval '2 days' where business_id = biz;
  assert (plan_state(biz) ->> 'effective') = 'grace', 'ek sure yok';
  perform set_config('request.jwt.claim.sub', u1, true); execute 'set local role authenticated';
  update app_state set state = '{"a":2}' where business_id = biz and scope = 'muh';
  execute 'reset role';
  -- ek süre de bitti -> readonly, kullanıcı yazamaz, sunucu yazar
  perform set_config('request.jwt.claim.sub', '', true);
  update business_plans set trial_ends = now() - interval '10 days' where business_id = biz;
  assert (plan_state(biz) ->> 'effective') = 'readonly', 'readonly degil';
  perform set_config('request.jwt.claim.sub', u1, true); execute 'set local role authenticated';
  begin update app_state set state = '{"a":3}' where business_id = biz and scope = 'muh'; ok := false; exception when others then ok := sqlerrm like '%plan_expired%'; end; assert ok, 'readonly yazmaya izin verdi';
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  update app_state set state = '{"a":4}' where business_id = biz and scope = 'muh';   -- cron/sunucu serbest

  -- admin aktifleştirir
  perform plan_set(biz, 'baslangic', 'active', now() + interval '30 days', null, 'test');
  assert (plan_state(biz) ->> 'effective') = 'ok' and (plan_state(biz) ->> 'max_members')::int = 5, 'aktif plan';
  perform set_config('request.jwt.claim.sub', u1, true); execute 'set local role authenticated';
  update app_state set state = '{"a":5}' where business_id = biz and scope = 'muh';
  execute 'reset role';

  -- üye limiti (başlangıç = 5): davet akışı security definer çalışır, burada tetikleyiciyi doğrudan sınıyoruz
  perform set_config('request.jwt.claim.sub', u1, true);
  for i in 2..5 loop insert into auth.users(id, email) values (('00000000-0000-0000-0000-00000000b00' || i)::uuid, 'e' || i); insert into members(business_id, user_id, role, app_uid) values (biz, ('00000000-0000-0000-0000-00000000b00' || i)::uuid, 'calisan', 'x' || i); end loop;
  insert into auth.users(id, email) values ('00000000-0000-0000-0000-00000000b006', 'e6');
  begin insert into members(business_id, user_id, role, app_uid) values (biz, '00000000-0000-0000-0000-00000000b006', 'calisan', 'x6'); ok := false; exception when others then ok := sqlerrm like '%plan_limit_members%'; end; assert ok, 'uye limiti calismadi';

  -- iptal + dönem sonu yok -> readonly
  perform set_config('request.jwt.claim.sub', '', true);
  perform plan_set(biz, 'pro', 'canceled', null, null, '');
  assert (plan_state(biz) ->> 'effective') = 'readonly', 'iptal readonly degil';
  -- ödeme gecikmesi: dönem bitmemiş ama past_due -> grace
  perform plan_set(biz, 'pro', 'past_due', now() + interval '3 days', null, '');
  assert (plan_state(biz) ->> 'effective') = 'grace', 'past_due grace degil';
  raise notice 'PLAN TESTLERI TAMAM';
end $$;

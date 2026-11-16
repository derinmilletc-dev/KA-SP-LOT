-- Şube yetkisi sunucu testi. Sırayla: stub.sql, 00_base_schema.sql, branch_scope.sql, bu dosya.
-- Başarısızlıkta exception ile durur (psql -v ON_ERROR_STOP=1).
insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'p@x'), ('00000000-0000-0000-0000-00000000000b', 'm@x'), ('00000000-0000-0000-0000-00000000000c', 'u@x');
insert into businesses(id, name, owner_id) values ('11111111-1111-1111-1111-111111111111', 'Biz', '00000000-0000-0000-0000-00000000000a');
insert into members(business_id, user_id, role, app_uid) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b', 'muhasebeci', 'u2'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000c', 'muhasebeci', 'u3')
  on conflict do nothing;
insert into members(business_id, user_id, role, app_uid)
  select '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', 'patron', 'u1'
  where not exists (select 1 from members where role = 'patron' and business_id = '11111111-1111-1111-1111-111111111111');
insert into app_state(business_id, scope, state, version) values
  ('11111111-1111-1111-1111-111111111111', 'muh', '{"BRANCHES":[{"id":"b1","name":"A"},{"id":"b2","name":"B"}],"LEDGER":[{"id":"l1","br":"b1","total":10,"rc":"f1"},{"id":"l2","br":"b2","total":20,"rc":"f2"},{"id":"l3","br":"","total":30},{"id":"l4","br":"b1","total":40}],"INV":[{"id":"i1","br":"b1"},{"id":"i2","br":"b2"}],"DEBTS":[{"id":"d1"}],"NOTES":{"x":1}}', 1),
  ('11111111-1111-1111-1111-111111111111', 'ekip', '{"ROLES":{"u2":"muhasebeci"},"RECEIPTS":[{"id":"f1"},{"id":"f2"},{"id":"f9"}],"SETTINGS":{"perm":{"a":1},"rec":[{"x":1}],"cashStart":5,"shop":3}}', 1);
grant select, insert, update, delete on all tables in schema public to authenticated;

do $$
declare
  biz uuid := '11111111-1111-1111-1111-111111111111';
  u2 text := '00000000-0000-0000-0000-00000000000b'; u3 text := '00000000-0000-0000-0000-00000000000c'; u1 text := '00000000-0000-0000-0000-00000000000a';
  j jsonb; n int; v bigint; ok boolean;
begin
  -- patron kuralı yazar
  perform set_config('request.jwt.claim.sub', u1, true); execute 'set local role authenticated';
  perform br_set(biz, 'u2', '{"b":["b1"],"none":false}');
  j := br_list(biz); assert j -> 'u2' ->> 'none' = 'false' and j -> 'u2' -> 'b' ->> 0 = 'b1', 'patron kuralı okuyamadı';
  execute 'reset role';

  -- kısıtlı muhasebeci
  perform set_config('request.jwt.claim.sub', u2, true); execute 'set local role authenticated';
  select count(*) into n from app_state where scope in ('muh', 'ekip'); assert n = 0, 'doğrudan okuma açık: ' || n;
  with u as (update app_state set state = '{}' where scope = 'muh' returning 1) select count(*) into n from u; assert n = 0, 'doğrudan yazma açık';
  begin perform br_set(biz, 'u2', null); assert false, 'br_set kısıtlıya açık'; exception when others then if sqlerrm like 'br_set%' or sqlerrm = 'br_set kısıtlıya açık' then raise; end if; end;

  select state::jsonb into j from st_get(biz) where scope = 'muh';
  assert (select array_agg(r ->> 'id' order by r ->> 'id') from jsonb_array_elements(j -> 'LEDGER') r) = array['l1', 'l4'], 'defter süzgeci yanlış';
  assert (select count(*) from jsonb_array_elements(j -> 'INV')) = 1, 'fatura süzgeci yanlış';
  assert (select count(*) from jsonb_array_elements(j -> 'BRANCHES')) = 1, 'şube süzgeci yanlış';
  assert not (j ? 'DEBTS') and not (j ? 'NOTES'), 'şubesiz veri sızdı';
  select state::jsonb into j from st_get(biz) where scope = 'ekip';
  assert (select array_agg(r ->> 'id' order by r ->> 'id') from jsonb_array_elements(j -> 'RECEIPTS') r) = array['f1', 'f9'], 'fiş süzgeci yanlış';
  assert not ((j -> 'SETTINGS') ? 'rec') and not ((j -> 'SETTINGS') ? 'cashStart'), 'ayar sızdı';
  assert (j -> 'SETTINGS') ? 'shop', 'normal ayar kayboldu';

  v := st_put(biz, 'muh', '{"LEDGER":[{"id":"l1","br":"b1","total":99,"rc":"f1"},{"id":"l5","br":"b1","total":5},{"id":"l6","br":"b2","total":6},{"id":"l2","br":"b1","total":777}],"INV":[{"id":"i1","br":"b1"}],"BRANCHES":[],"DEBTS":[]}', 1);
  assert v = 2, 'st_put sürümü';
  assert st_put(biz, 'muh', '{}', 1) is null, 'eski sürüm reddedilmedi';
  v := st_put(biz, 'ekip', '{"ROLES":{"u2":"patron"},"RECEIPTS":[{"id":"f1","n":1}],"SETTINGS":{"perm":{"a":9},"rec":[],"cashStart":0,"shop":4}}', 1);
  assert v = 2, 'ekip st_put';
  execute 'reset role';

  -- sunucudaki tam durum
  select state::jsonb into j from app_state where scope = 'muh';
  assert (select array_agg(r ->> 'id' order by r ->> 'id') from jsonb_array_elements(j -> 'LEDGER') r) = array['l1', 'l2', 'l3', 'l5'], 'defter birleşimi yanlış: ' || (j -> 'LEDGER')::text;
  assert (select (r ->> 'total')::int from jsonb_array_elements(j -> 'LEDGER') r where r ->> 'id' = 'l2') = 20, 'başka şube satırı ezildi';
  assert (select (r ->> 'total')::int from jsonb_array_elements(j -> 'LEDGER') r where r ->> 'id' = 'l1') = 99, 'kendi satırı kaydedilmedi';
  assert j ? 'DEBTS' and j ? 'NOTES' and (select count(*) from jsonb_array_elements(j -> 'BRANCHES')) = 2 and (select count(*) from jsonb_array_elements(j -> 'INV')) = 2, 'gizli veri silindi';
  select state::jsonb into j from app_state where scope = 'ekip';
  assert j -> 'ROLES' ->> 'u2' = 'muhasebeci', 'ROLES değişti';
  assert (j -> 'SETTINGS' -> 'perm' ->> 'a') = '1' and (j -> 'SETTINGS' ->> 'cashStart') = '5' and (j -> 'SETTINGS' ->> 'shop') = '4', 'ayar birleşimi yanlış';
  assert (select array_agg(r ->> 'id' order by r ->> 'id') from jsonb_array_elements(j -> 'RECEIPTS') r) = array['f1', 'f2'], 'fiş birleşimi yanlış';

  -- kısıtsız muhasebeci
  perform set_config('request.jwt.claim.sub', u3, true); execute 'set local role authenticated';
  select count(*) into n from app_state where scope in ('muh', 'ekip'); assert n = 2, 'kısıtsız muhasebeci okuyamıyor';
  begin perform st_put(biz, 'muh', '{}', 2); assert false, 'kısıtsız st_put kabul edildi'; exception when others then if sqlerrm = 'kısıtsız st_put kabul edildi' then raise; end if; end;
  execute 'reset role';

  -- kuralı kaldırınca doğrudan erişim geri gelir
  perform set_config('request.jwt.claim.sub', u1, true); execute 'set local role authenticated';
  perform br_set(biz, 'u2', null); execute 'reset role';
  perform set_config('request.jwt.claim.sub', u2, true); execute 'set local role authenticated';
  select count(*) into n from app_state where scope in ('muh', 'ekip'); assert n = 2, 'kural kalkınca erişim dönmedi';
  execute 'reset role';
  raise notice 'branch_scope_test: HEPSI GECTI';
end $$;

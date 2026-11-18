-- Gmail bağlantı tabloları yetki testi. Sırayla: stub.sql, 00_base_schema.sql, mail_gmail.sql, bu dosya.
-- Repo kökünden çalıştırılır (CI böyle yapar). Başarısızlıkta exception ile durur (psql -v ON_ERROR_STOP=1).
insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'patron@x'), ('00000000-0000-0000-0000-0000000000a2', 'muh@x'),
  ('00000000-0000-0000-0000-0000000000a3', 'calisan@x'), ('00000000-0000-0000-0000-0000000000a4', 'yabanci@x');
insert into businesses(id, name, owner_id) values ('22222222-2222-2222-2222-222222222222', 'Biz', '00000000-0000-0000-0000-0000000000a1');
insert into businesses(id, name, owner_id) values ('33333333-3333-3333-3333-333333333333', 'Baska', '00000000-0000-0000-0000-0000000000a4');
insert into members(business_id, user_id, role, app_uid) values
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000a2', 'muhasebeci', 'u3'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000a3', 'calisan', 'u4') on conflict do nothing;

-- Supabase yeni tablolara varsayılan olarak anon/authenticated'a tam yetki verir; bunu taklit edip SQL'in geri aldığını doğrula.
grant all on public.mail_connections, public.mail_secrets, public.mail_docs to anon, authenticated;
\i supabase/sql/mail_gmail.sql

-- sunucu (service role) bir bağlantı, anahtar ve iki belge yazar
insert into mail_connections(id, business_id, user_id, email) values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000a1', 'a@gmail.com');
insert into mail_secrets(connection_id, refresh_token_enc) values ('44444444-4444-4444-4444-444444444444', 'gizli');
insert into mail_docs(business_id, connection_id, msg_id, kind, total) values
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'm1', 'xml', 100),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'm2', 'pdf', 200);
grant usage on schema public to authenticated;

do $$
declare n int; ok boolean;
begin
  -- sahip okur
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true); execute 'set local role authenticated';
  select count(*) into n from mail_connections; assert n = 1, 'sahip bağlantıyı göremedi';
  select count(*) into n from mail_docs; assert n = 2, 'sahip belgeleri göremedi';
  execute 'reset role';
  -- muhasebeci okur
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true); execute 'set local role authenticated';
  select count(*) into n from mail_docs; assert n = 2, 'muhasebeci belgeleri göremedi';
  execute 'reset role';
  -- çalışan göremez
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true); execute 'set local role authenticated';
  select count(*) into n from mail_connections; assert n = 0, 'çalışan bağlantıyı gördü';
  select count(*) into n from mail_docs; assert n = 0, 'çalışan belgeleri gördü';
  execute 'reset role';
  -- başka işletmenin sahibi göremez
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a4', true); execute 'set local role authenticated';
  select count(*) into n from mail_connections; assert n = 0, 'yabancı bağlantıyı gördü';
  select count(*) into n from mail_docs; assert n = 0, 'yabancı belgeleri gördü';
  execute 'reset role';
  -- hiç kimse (sahip dahil) anahtarı okuyamaz
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true); execute 'set local role authenticated';
  ok := false; begin perform 1 from mail_secrets; exception when insufficient_privilege then ok := true; end;
  assert ok, 'sahip mail_secrets okuyabildi';
  -- istemci yazamaz
  ok := false; begin insert into mail_docs(business_id, connection_id, msg_id) values ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'x'); exception when insufficient_privilege then ok := true; end;
  assert ok, 'istemci mail_docs yazabildi';
  ok := false; begin update mail_docs set status = 'atla'; exception when insufficient_privilege then ok := true; end;
  assert ok, 'istemci mail_docs güncelleyebildi';
  ok := false; begin delete from mail_connections; exception when insufficient_privilege then ok := true; end;
  assert ok, 'istemci bağlantı silebildi';
  execute 'reset role';
  -- anon hiçbir şey göremez
  execute 'set local role anon';
  ok := false; begin perform 1 from mail_docs; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon mail_docs okuyabildi';
  execute 'reset role';
  raise notice 'mail_gmail testleri geçti';
end $$;

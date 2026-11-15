-- KaisPilot: Muhasebe Excel dosyası (arka planda otomatik saklanır)
-- Supabase SQL Editor'de bir kez çalıştır.
begin;

insert into storage.buckets (id, name, public)
values ('muhasebe-excel', 'muhasebe-excel', false)
on conflict (id) do nothing;

-- Klasör adı işletme kimliğidir: <business_id>/muhasebe.xlsx
-- Patron ve muhasebeci okuyabilir ve güncelleyebilir. Müdür ve çalışan erişemez.
drop policy if exists mx_sel on storage.objects;
create policy mx_sel on storage.objects for select to authenticated using (
  bucket_id = 'muhasebe-excel'
  and public.scope_ok(((storage.foldername(name))[1])::uuid, 'muh', false)
);

drop policy if exists mx_ins on storage.objects;
create policy mx_ins on storage.objects for insert to authenticated with check (
  bucket_id = 'muhasebe-excel'
  and name = (storage.foldername(name))[1] || '/muhasebe.xlsx'
  and public.scope_ok(((storage.foldername(name))[1])::uuid, 'muh', true)
);

drop policy if exists mx_upd on storage.objects;
create policy mx_upd on storage.objects for update to authenticated using (
  bucket_id = 'muhasebe-excel'
  and public.scope_ok(((storage.foldername(name))[1])::uuid, 'muh', true)
) with check (
  bucket_id = 'muhasebe-excel'
  and name = (storage.foldername(name))[1] || '/muhasebe.xlsx'
  and public.scope_ok(((storage.foldername(name))[1])::uuid, 'muh', true)
);

commit;

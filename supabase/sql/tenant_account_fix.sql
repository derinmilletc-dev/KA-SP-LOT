-- İşletme sahibi hesabını silebilsin (canlı denemede "owner_required" hatası verdi).
-- Neden: delete_my_account() işletmeyi silinmiş işaretleyip owner_id'yi boşaltıyor, ama sütun boş bırakılamıyordu.
-- SQL Editor'de bir kez çalıştır. Tekrar çalıştırılabilir.
alter table public.businesses alter column owner_id drop not null;

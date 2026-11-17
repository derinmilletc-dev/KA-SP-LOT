-- Ücretsiz dönem: yeni işletmeler süresiz "deneme" ile açılır, hesap salt okunur olmaz.
-- Fiyatlandırma gelince: alter table public.business_plans alter column trial_ends set default (now() + interval '30 days');
-- ve gerekli işletmelere plan_set ile süre/plan atanır. Tekrar çalıştırmak güvenlidir.

alter table public.business_plans alter column trial_ends drop default;

-- süresi bitmiş ya da bitecek tüm denemeleri süresiz yap (aboneliği olanlara dokunma)
update public.business_plans
   set trial_ends = null, updated_at = now()
 where status = 'trial' and trial_ends is not null;

-- kontrol: her satır effective = ok olmalı
-- select business_id, public.plan_state(business_id) ->> 'effective' as durum from public.business_plans;

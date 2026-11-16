-- KaisPilot: şube yetkisi SUNUCU tarafında (v156).
-- Kısıtlı muhasebeci artık 'muh' ve 'ekip' paketlerini doğrudan okuyamaz/yazamaz;
-- yalnızca st_get / st_put fonksiyonlarından, kendi şubelerine süzülmüş halde alır.
-- Kısıt members.br_scope kolonunda tutulur; sadece patron br_set ile değiştirir.
-- Güvenle tekrar çalıştırılabilir. Geri alma: en altta.

alter table public.members add column if not exists br_scope jsonb;

-- Bu kullanıcının (bid işletmesindeki) şube kuralı; kısıtsızsa null.
create or replace function public.br_rule(bid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case
    when m.role = 'muhasebeci' and jsonb_typeof(m.br_scope) = 'object'
      and ((jsonb_typeof(m.br_scope -> 'b') = 'array' and jsonb_array_length(m.br_scope -> 'b') > 0)
           or coalesce(m.br_scope ->> 'none', 'false') = 'true')
    then jsonb_build_object('b', coalesce(m.br_scope -> 'b', '[]'::jsonb), 'none', coalesce(m.br_scope ->> 'none', 'false') = 'true')
    else null end
  from public.members m
  where m.business_id = bid and m.user_id = auth.uid() limit 1
$$;

-- Bir satır (br alanı) kurala uyuyor mu? Geçersiz/boş şube = "şubesiz".
create or replace function public.br_row_ok(br text, rule jsonb, branches jsonb) returns boolean
language sql immutable set search_path = public as $$
  select case
    when coalesce(br, '') <> '' and exists (select 1 from jsonb_array_elements(coalesce(branches, '[]'::jsonb)) b where b ->> 'id' = br)
      then (rule -> 'b') ? br
    else coalesce((rule ->> 'none')::boolean, false) end
$$;

-- 'muh' paketinin kısıtlı görünümü: yalnızca izinli şubelerin defter/fatura/şube kayıtları.
-- Şubesiz veriler (borç, taslak, not, e-belge, mail, denetim...) gizlenir.
create or replace function public.br_filter_muh(st jsonb, rule jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'LEDGER', coalesce((select jsonb_agg(r) from jsonb_array_elements(case when jsonb_typeof(st -> 'LEDGER') = 'array' then st -> 'LEDGER' else '[]'::jsonb end) r
                        where public.br_row_ok(r ->> 'br', rule, st -> 'BRANCHES')), '[]'::jsonb),
    'INV', coalesce((select jsonb_agg(r) from jsonb_array_elements(case when jsonb_typeof(st -> 'INV') = 'array' then st -> 'INV' else '[]'::jsonb end) r
                     where public.br_row_ok(r ->> 'br', rule, st -> 'BRANCHES')), '[]'::jsonb),
    'BRANCHES', coalesce((select jsonb_agg(b) from jsonb_array_elements(case when jsonb_typeof(st -> 'BRANCHES') = 'array' then st -> 'BRANCHES' else '[]'::jsonb end) b
                          where (rule -> 'b') ? (b ->> 'id')), '[]'::jsonb))
$$;

-- Başka şubenin defter satırına bağlı fişlerin id'leri.
create or replace function public.br_hidden_receipts(muh jsonb, rule jsonb) returns text[]
language sql immutable set search_path = public as $$
  select coalesce(array(
    select r ->> 'rc' from jsonb_array_elements(case when jsonb_typeof(muh -> 'LEDGER') = 'array' then muh -> 'LEDGER' else '[]'::jsonb end) r
    where coalesce(r ->> 'rc', '') <> '' and not public.br_row_ok(r ->> 'br', rule, muh -> 'BRANCHES')), array[]::text[])
$$;

-- Sunucu tarafında yönetilen ve kısıtlı kullanıcıdan saklanan / onun değiştiremediği ayar anahtarları.
create or replace function public.br_set_keys() returns text[] language sql immutable as $$
  select array['brs', 'rec', 'xlast', 'xhist', 'cashStart']
$$;

-- 'ekip' paketinin kısıtlı görünümü.
create or replace function public.br_filter_ekip(st jsonb, muh jsonb, rule jsonb) returns jsonb
language plpgsql immutable set search_path = public as $$
declare res jsonb := st; hid text[];
begin
  if jsonb_typeof(res) <> 'object' then return res; end if;
  hid := public.br_hidden_receipts(muh, rule);
  if jsonb_typeof(res -> 'RECEIPTS') = 'array' then
    res := jsonb_set(res, '{RECEIPTS}', coalesce((select jsonb_agg(f) from jsonb_array_elements(res -> 'RECEIPTS') f where not ((f ->> 'id') = any(hid))), '[]'::jsonb));
  end if;
  if jsonb_typeof(res -> 'SETTINGS') = 'object' then
    res := jsonb_set(res, '{SETTINGS}', (res -> 'SETTINGS') - public.br_set_keys());
  end if;
  return res;
end $$;

-- Erişim kuralı: kısıtlı muhasebeci 'muh' ve 'ekip' paketlerine doğrudan ulaşamaz.
create or replace function public.scope_ok(bid uuid, sc text, w boolean) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members m
    where m.business_id = bid and m.user_id = auth.uid() and (
      m.role = 'patron'
      or (m.role = 'mudur' and sc in ('stok', 'ekip'))
      or (m.role = 'muhasebeci' and ((sc in ('muh', 'ekip') and public.br_rule(bid) is null) or (not w and left(sc, 5) = 'maas_')))
      or (m.role = 'calisan' and (sc = 'ekip' or (not w and sc = 'stok') or (not w and sc = 'maas_' || m.app_uid)))
    )
  )
$$;

-- Okuma: kısıtlıysa süzülmüş paketler, değilse normal erişim kuralıyla satırlar.
create or replace function public.st_get(bid uuid) returns table(scope text, state text, version bigint)
language plpgsql stable security definer set search_path = public as $$
declare rule jsonb; muh jsonb;
begin
  if auth.uid() is null or not public.is_member(bid) then return; end if;
  rule := public.br_rule(bid);
  if rule is null then
    return query select a.scope, a.state, a.version from public.app_state a where a.business_id = bid and public.scope_ok(bid, a.scope, false);
    return;
  end if;
  select coalesce(nullif(a.state, '')::jsonb, '{}'::jsonb) into muh from public.app_state a where a.business_id = bid and a.scope = 'muh';
  muh := coalesce(muh, '{}'::jsonb);
  return query
    select a.scope,
      case when a.scope = 'muh' then public.br_filter_muh(muh, rule)::text
           when a.scope = 'ekip' then public.br_filter_ekip(coalesce(nullif(a.state, '')::jsonb, '{}'::jsonb), muh, rule)::text
           else a.state end,
      a.version
    from public.app_state a
    where a.business_id = bid and (a.scope in ('muh', 'ekip') or public.scope_ok(bid, a.scope, false));
end $$;

create or replace function public.st_versions(bid uuid) returns table(scope text, version bigint)
language sql stable security definer set search_path = public as $$
  select a.scope, a.version from public.app_state a
  where a.business_id = bid and public.is_member(bid)
    and (public.scope_ok(bid, a.scope, false) or (public.br_rule(bid) is not null and a.scope in ('muh', 'ekip')))
$$;

-- Yazma (yalnızca kısıtlı muhasebeci için): gelen değişikliği sunucudaki tam paketle birleştirir.
-- Dönüş: yeni sürüm; sürüm uyuşmazsa null (istemci güncel veriyi çeker).
create or replace function public.st_put(bid uuid, sc text, st text, ver bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  rule jsonb; f jsonb; c jsonb; fm jsonb; res jsonb; cur bigint; hid text[]; k text; nv bigint;
  fb jsonb; newl jsonb; hidl jsonb; fset jsonb;
begin
  if auth.uid() is null or not public.is_member(bid) then raise exception 'yetki yok'; end if;
  rule := public.br_rule(bid);
  if rule is null then raise exception 'kisitli degil'; end if;
  if sc not in ('muh', 'ekip') then raise exception 'kapsam yok'; end if;
  begin c := st::jsonb; exception when others then raise exception 'gecersiz veri'; end;
  if jsonb_typeof(c) <> 'object' then raise exception 'gecersiz veri'; end if;
  select coalesce(nullif(a.state, '')::jsonb, '{}'::jsonb), a.version into f, cur
    from public.app_state a where a.business_id = bid and a.scope = sc for update;
  if cur is null or cur <> ver then return null; end if;
  select coalesce(nullif(a.state, '')::jsonb, '{}'::jsonb) into fm from public.app_state a where a.business_id = bid and a.scope = 'muh';
  fm := coalesce(fm, '{}'::jsonb);
  fb := case when jsonb_typeof(fm -> 'BRANCHES') = 'array' then fm -> 'BRANCHES' else '[]'::jsonb end;

  if sc = 'muh' then
    res := f;
    foreach k in array array['LEDGER', 'INV'] loop
      -- istemcinin görebildiği ve yazabildiği satırlar + sunucudaki görünmeyen satırlar
      newl := coalesce((select jsonb_agg(r) from jsonb_array_elements(case when jsonb_typeof(c -> k) = 'array' then c -> k else '[]'::jsonb end) r
                        where jsonb_typeof(r) = 'object' and public.br_row_ok(r ->> 'br', rule, fb)
                          and not exists (select 1 from jsonb_array_elements(case when jsonb_typeof(f -> k) = 'array' then f -> k else '[]'::jsonb end) x
                                          where x ->> 'id' = r ->> 'id' and not public.br_row_ok(x ->> 'br', rule, fb))), '[]'::jsonb);
      hidl := coalesce((select jsonb_agg(x) from jsonb_array_elements(case when jsonb_typeof(f -> k) = 'array' then f -> k else '[]'::jsonb end) x
                        where not public.br_row_ok(x ->> 'br', rule, fb)), '[]'::jsonb);
      res := jsonb_set(res, array[k], newl || hidl, true);
    end loop;
    -- BRANCHES ve diğer tüm anahtarlar sunucudaki gibi kalır
  else
    hid := public.br_hidden_receipts(fm, rule);
    res := c;
    -- korunan alanlar sunucudan
    if f ? 'ROLES' then res := jsonb_set(res, '{ROLES}', f -> 'ROLES', true); else res := res - 'ROLES'; end if;
    if jsonb_typeof(res -> 'SETTINGS') <> 'object' then res := jsonb_set(res, '{SETTINGS}', '{}'::jsonb, true); end if;
    foreach k in array array['perm', 'mperm', 'mudurMaas'] || public.br_set_keys() loop
      if (f -> 'SETTINGS') ? k then res := jsonb_set(res, array['SETTINGS', k], f -> 'SETTINGS' -> k, true);
      else res := jsonb_set(res, '{SETTINGS}', (res -> 'SETTINGS') - k, true); end if;
    end loop;
    -- fişler: görünenler istemciden, görünmeyenler sunucudan
    newl := coalesce((select jsonb_agg(r) from jsonb_array_elements(case when jsonb_typeof(c -> 'RECEIPTS') = 'array' then c -> 'RECEIPTS' else '[]'::jsonb end) r
                      where not ((r ->> 'id') = any(hid))), '[]'::jsonb);
    hidl := coalesce((select jsonb_agg(x) from jsonb_array_elements(case when jsonb_typeof(f -> 'RECEIPTS') = 'array' then f -> 'RECEIPTS' else '[]'::jsonb end) x
                      where (x ->> 'id') = any(hid)), '[]'::jsonb);
    res := jsonb_set(res, '{RECEIPTS}', newl || hidl, true);
  end if;

  nv := cur + 1;
  update public.app_state set state = res::text, version = nv, updated_at = now(), updated_by = auth.uid()
    where business_id = bid and scope = sc and version = cur;
  if not found then return null; end if;
  return nv;
end $$;

-- Patron: bir muhasebecinin şube kuralını yaz (rule = {"b":[...],"none":bool} veya null = kısıtsız).
create or replace function public.br_set(bid uuid, au text, rule jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.has_role(bid, array['patron']) then raise exception 'yetki yok'; end if;
  if rule is not null then
    if jsonb_typeof(rule) <> 'object' or jsonb_typeof(coalesce(rule -> 'b', '[]'::jsonb)) <> 'array'
       or jsonb_array_length(coalesce(rule -> 'b', '[]'::jsonb)) > 200
       or exists (select 1 from jsonb_array_elements(coalesce(rule -> 'b', '[]'::jsonb)) e where jsonb_typeof(e) <> 'string') then
      raise exception 'gecersiz kural';
    end if;
    rule := jsonb_build_object('b', coalesce(rule -> 'b', '[]'::jsonb), 'none', coalesce(rule ->> 'none', 'false') = 'true');
    if jsonb_array_length(rule -> 'b') = 0 and not (rule ->> 'none')::boolean then rule := null; end if;
  end if;
  update public.members set br_scope = rule where business_id = bid and app_uid = au and role = 'muhasebeci';
  get diagnostics n = row_count;
  if n = 0 then raise exception 'muhasebeci bulunamadi'; end if;
end $$;

-- Patron: tüm kurallar {app_uid: kural}
create or replace function public.br_list(bid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.has_role(bid, array['patron'])
    then coalesce((select jsonb_object_agg(m.app_uid, m.br_scope) from public.members m
                   where m.business_id = bid and m.role = 'muhasebeci' and m.br_scope is not null
                     and ((jsonb_typeof(m.br_scope -> 'b') = 'array' and jsonb_array_length(m.br_scope -> 'b') > 0) or coalesce(m.br_scope ->> 'none', 'false') = 'true')), '{}'::jsonb)
    else null end
$$;

grant execute on function public.br_rule(uuid), public.st_get(uuid), public.st_versions(uuid), public.st_put(uuid, text, text, bigint),
  public.br_set(uuid, text, jsonb), public.br_list(uuid) to authenticated;
revoke execute on function public.br_set(uuid, text, jsonb), public.br_list(uuid), public.st_put(uuid, text, text, bigint) from anon, public;

-- Eski kayıtların taşınması: ekip paketindeki SETTINGS.brs → members.br_scope (varsa, boş olanları ezmeden).
do $$
declare r record; e record; v jsonb;
begin
  for r in select a.business_id, nullif(a.state, '')::jsonb as st from public.app_state a where a.scope = 'ekip' loop
    if jsonb_typeof(r.st -> 'SETTINGS' -> 'brs') = 'object' then
      for e in select key, value from jsonb_each(r.st -> 'SETTINGS' -> 'brs') loop
        v := e.value;
        if jsonb_typeof(v) = 'object' and jsonb_typeof(coalesce(v -> 'b', '[]'::jsonb)) = 'array'
           and (jsonb_array_length(coalesce(v -> 'b', '[]'::jsonb)) > 0 or coalesce(v ->> 'none', 'false') = 'true') then
          update public.members set br_scope = jsonb_build_object('b', coalesce(v -> 'b', '[]'::jsonb), 'none', coalesce(v ->> 'none', 'false') = 'true')
            where business_id = r.business_id and app_uid = e.key and role = 'muhasebeci' and br_scope is null;
        end if;
      end loop;
    end if;
  end loop;
end $$;

/* GERİ ALMA (gerekirse): scope_ok'u 00_base_schema.sql'deki haline döndür (muhasebeci: sc in ('muh','ekip') koşulundan br_rule kısmını kaldır).
   Kolon ve fonksiyonlar zararsızdır, kalabilir. */

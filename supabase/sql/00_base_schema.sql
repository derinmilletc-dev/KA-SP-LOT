-- KaisPilot ana semasi (public). Canli Supabase'den 2026-11-16 tarihinde cikarildi.
-- Sira: tablolar, kisitlar, indeksler, fonksiyonlar, tetikleyiciler, RLS, politikalar.
-- Not: otomatik dokum; diger supabase/sql/*.sql dosyalari artimli degisiklik gecmisidir.

-- TABLO account_feedback
create table if not exists public.account_feedback (
  id bigint not null,
  created_at timestamp with time zone not null default now(),
  reason text,
  note text,
  role text,
  was_owner boolean not null default false
);

-- TABLO admin_announcements
create table if not exists public.admin_announcements (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  title text not null,
  body text,
  kind text not null default 'info'::text,
  target uuid[],
  expires_at timestamp with time zone,
  created_by text,
  active boolean not null default true
);

-- TABLO admin_audit
create table if not exists public.admin_audit (
  id bigint not null,
  at timestamp with time zone not null default now(),
  admin_id uuid,
  email text,
  action text not null,
  target text,
  meta jsonb
);

-- TABLO admin_users
create table if not exists public.admin_users (
  user_id uuid not null,
  email text not null,
  role text not null,
  perms jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  created_by text
);

-- TABLO ai_limits
create table if not exists public.ai_limits (
  business_id uuid not null,
  chat_day integer,
  chat_month integer,
  read_day integer,
  read_month integer,
  note text,
  updated_at timestamp with time zone not null default now(),
  updated_by text
);

-- TABLO ai_quota
create table if not exists public.ai_quota (
  business_id uuid not null,
  day date not null,
  kind text not null,
  n integer not null default 0
);

-- TABLO ai_usage
create table if not exists public.ai_usage (
  user_id uuid not null,
  day date not null,
  n integer not null default 0
);

-- TABLO app_errors
create table if not exists public.app_errors (
  id bigint not null,
  created_at timestamp with time zone not null default now(),
  business_id uuid,
  user_id uuid,
  role text,
  view text,
  msg text not null,
  stack text,
  ua text,
  ver text
);

-- TABLO app_events
create table if not exists public.app_events (
  id bigint not null,
  created_at timestamp with time zone not null default now(),
  business_id uuid,
  user_id uuid,
  role text,
  ev text not null,
  n integer not null default 1
);

-- TABLO app_state
create table if not exists public.app_state (
  business_id uuid not null,
  state text not null,
  version bigint not null default 1,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  scope text not null default 'all'::text
);

-- TABLO audit_log
create table if not exists public.audit_log (
  id bigint not null,
  business_id uuid not null,
  user_id uuid not null default auth.uid(),
  role text,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

-- TABLO backups
create table if not exists public.backups (
  id bigint not null default nextval('backups_id_seq'::regclass),
  business_id uuid not null,
  created_at timestamp with time zone default now(),
  kind text not null default 'gunluk'::text,
  by_name text,
  size integer,
  snap text not null
);

-- TABLO booking_config
create table if not exists public.booking_config (
  business_id uuid not null,
  slug text not null,
  enabled boolean not null default true,
  title text,
  open_h integer not null default 8,
  close_h integer not null default 22,
  max_party integer not null default 10,
  min_ahead_h integer not null default 2,
  days_ahead integer not null default 30,
  updated_at timestamp with time zone default now()
);

-- TABLO booking_requests
create table if not exists public.booking_requests (
  id bigint not null default nextval('booking_requests_id_seq'::regclass),
  business_id uuid not null,
  name text not null,
  phone text not null,
  n integer not null,
  date date not null,
  "time" text not null,
  note text,
  status text not null default 'bekliyor'::text,
  created_at timestamp with time zone default now()
);

-- TABLO business_notes
create table if not exists public.business_notes (
  business_id uuid not null,
  note text,
  tags text[] not null default '{}'::text[],
  updated_by text,
  updated_at timestamp with time zone not null default now()
);

-- TABLO businesses
create table if not exists public.businesses (
  id uuid not null default gen_random_uuid(),
  name text not null,
  owner_id uuid,
  created_at timestamp with time zone default now(),
  lat double precision,
  lng double precision,
  deleted_at timestamp with time zone,
  suspended_at timestamp with time zone,
  suspended_note text
);

-- TABLO cari_pay
create table if not exists public.cari_pay (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  supplier_id uuid not null,
  amt numeric not null,
  pay_date date not null default CURRENT_DATE,
  note text,
  by_side text not null,
  created_at timestamp with time zone default now()
);

-- TABLO cari_recon
create table if not exists public.cari_recon (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  supplier_id uuid not null,
  period text not null,
  bal numeric not null,
  sent_by text not null,
  status text not null default 'bekliyor'::text,
  note text,
  updated_at timestamp with time zone default now()
);

-- TABLO feature_flags
create table if not exists public.feature_flags (
  key text not null,
  label text,
  description text,
  enabled_all boolean not null default false,
  business_ids uuid[] not null default '{}'::uuid[],
  updated_at timestamp with time zone not null default now(),
  updated_by text
);

-- TABLO invite_attempts
create table if not exists public.invite_attempts (
  user_id uuid not null,
  at timestamp with time zone not null default now()
);

-- TABLO invites
create table if not exists public.invites (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  code text not null,
  role text not null,
  app_uid text not null,
  name text,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + '1 day'::interval),
  used_by uuid,
  used_at timestamp with time zone
);

-- TABLO kais_memory
create table if not exists public.kais_memory (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid,
  kind text not null default 'fact'::text,
  content text not null,
  created_by uuid not null default auth.uid(),
  created_at timestamp with time zone not null default now()
);

-- TABLO mail_log
create table if not exists public.mail_log (
  business_id uuid not null,
  key text not null,
  kind text not null,
  created_at timestamp with time zone not null default now()
);

-- TABLO market_events
create table if not exists public.market_events (
  id bigint not null,
  kind text not null,
  need_id uuid,
  offer_id uuid,
  order_id uuid,
  done boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- TABLO market_needs
create table if not exists public.market_needs (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  product text not null,
  qty numeric not null,
  unit text not null default 'kg'::text,
  deliver_by date,
  note text,
  contact text,
  lat double precision,
  lng double precision,
  city text,
  district text,
  radius_km integer not null default 100,
  status text not null default 'acik'::text,
  created_by uuid default auth.uid(),
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default (now() + '7 days'::interval)
);

-- TABLO market_offers
create table if not exists public.market_offers (
  id uuid not null default gen_random_uuid(),
  need_id uuid not null,
  user_id uuid not null default auth.uid(),
  supplier_name text not null,
  price numeric not null,
  qty numeric not null,
  deliver_date date,
  note text,
  status text not null default 'bekliyor'::text,
  created_at timestamp with time zone not null default now()
);

-- TABLO market_orders
create table if not exists public.market_orders (
  id uuid not null default gen_random_uuid(),
  need_id uuid not null,
  offer_id uuid not null,
  business_id uuid not null,
  user_id uuid not null,
  supplier_name text not null,
  product text not null,
  qty numeric not null,
  unit text not null,
  price numeric not null,
  total numeric not null,
  status text not null default 'onaylandi'::text,
  prev_status text,
  issue text,
  issue_by text,
  delivered_at timestamp with time zone,
  received_at timestamp with time zone,
  received_qty numeric,
  paid_at timestamp with time zone,
  pay_amount numeric,
  pay_ref text,
  pay_date date,
  doc_path text,
  done_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

-- TABLO market_ratings
create table if not exists public.market_ratings (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  by_side text not null,
  stars integer not null,
  on_time boolean not null default true,
  complete boolean not null default true,
  note text,
  created_at timestamp with time zone not null default now()
);

-- TABLO members
create table if not exists public.members (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid not null,
  role text not null,
  app_uid text not null,
  display_name text,
  email text,
  created_at timestamp with time zone default now()
);

-- TABLO onboard_config
create table if not exists public.onboard_config (
  business_id uuid not null,
  config jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamp with time zone default now(),
  updated_by uuid
);

-- TABLO onboard_docs
create table if not exists public.onboard_docs (
  business_id uuid not null,
  user_id uuid not null,
  doc_id text not null,
  name text,
  mime text,
  data text not null,
  created_at timestamp with time zone default now()
);

-- TABLO onboard_sub
create table if not exists public.onboard_sub (
  business_id uuid not null,
  user_id uuid not null,
  app_uid text,
  answers jsonb not null default '{}'::jsonb,
  consents jsonb not null default '{}'::jsonb,
  signature text,
  contract_version integer not null default 0,
  contract_snapshot text,
  accepted_at timestamp with time zone,
  updated_at timestamp with time zone default now()
);

-- TABLO orders
create table if not exists public.orders (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  supplier_id uuid not null,
  lines jsonb not null,
  total numeric not null,
  status text not null default 'gonderildi'::text,
  created_at timestamp with time zone default now(),
  recv jsonb,
  recv_status text,
  recv_reply text,
  rfq_id uuid,
  change jsonb,
  delivery text,
  delivery_at timestamp with time zone,
  delivery_by text,
  proof jsonb,
  invoice jsonb
);

-- TABLO pos_tokens
create table if not exists public.pos_tokens (
  business_id uuid not null,
  token text not null,
  created_at timestamp with time zone default now()
);

-- TABLO price_hist
create table if not exists public.price_hist (
  id uuid not null default gen_random_uuid(),
  supplier_id uuid not null,
  product_id uuid not null,
  name text not null,
  unit text,
  old_price numeric,
  new_price numeric not null,
  at timestamp with time zone default now()
);

-- TABLO producer_waitlist
create table if not exists public.producer_waitlist (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  name text not null,
  business text,
  phone text not null,
  city text not null,
  products text
);

-- TABLO push_log
create table if not exists public.push_log (
  business_id uuid not null,
  app_uid text not null,
  key text not null,
  sent_at timestamp with time zone default now()
);

-- TABLO push_subs
create table if not exists public.push_subs (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid not null,
  app_uid text not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  ua text,
  created_at timestamp with time zone default now()
);

-- TABLO quotes
create table if not exists public.quotes (
  id uuid not null default gen_random_uuid(),
  rfq_id uuid not null,
  supplier_id uuid not null,
  prices jsonb not null,
  note text,
  created_at timestamp with time zone default now()
);

-- TABLO rfqs
create table if not exists public.rfqs (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  status text not null default 'acik'::text,
  lines jsonb not null,
  created_at timestamp with time zone default now()
);

-- TABLO sales_inbox
create table if not exists public.sales_inbox (
  id bigint not null default nextval('sales_inbox_id_seq'::regclass),
  business_id uuid not null,
  payload jsonb not null,
  created_at timestamp with time zone default now(),
  imported boolean default false
);

-- TABLO supplier_books
create table if not exists public.supplier_books (
  supplier_id uuid not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- TABLO supplier_cprice
create table if not exists public.supplier_cprice (
  supplier_id uuid not null,
  product_id uuid not null,
  price numeric not null,
  updated_at timestamp with time zone default now()
);

-- TABLO supplier_customer
create table if not exists public.supplier_customer (
  supplier_id uuid not null,
  discount_pct numeric not null default 0,
  note text,
  updated_at timestamp with time zone default now()
);

-- TABLO supplier_dnote
create table if not exists public.supplier_dnote (
  supplier_id uuid not null,
  note text,
  updated_at timestamp with time zone default now()
);

-- TABLO supplier_private
create table if not exists public.supplier_private (
  supplier_id uuid not null,
  vehicle jsonb,
  updated_at timestamp with time zone default now()
);

-- TABLO supplier_products
create table if not exists public.supplier_products (
  id uuid not null default gen_random_uuid(),
  supplier_id uuid not null,
  name text not null,
  brand text,
  category text,
  unit text not null default 'kg'::text,
  price numeric not null default 0,
  vat integer default 10,
  min_qty numeric default 1,
  stock text default 'var'::text,
  shelf_days integer,
  lot_exp date,
  tiers jsonb default '[]'::jsonb,
  promo_pct numeric default 0,
  promo_until date,
  note text,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  qty numeric default 0,
  min_stock numeric default 0,
  cost numeric default 0,
  photos jsonb default '[]'::jsonb
);

-- TABLO supplier_profiles
create table if not exists public.supplier_profiles (
  supplier_id uuid not null,
  phone text,
  about text,
  address text,
  city text,
  district text,
  lat double precision,
  lng double precision,
  radius_km numeric default 25,
  hours jsonb default '{}'::jsonb,
  delivery_days integer[] default '{}'::integer[],
  cutoff text,
  lead_days numeric default 1,
  min_order numeric default 0,
  delivery_fee numeric default 0,
  free_over numeric default 0,
  pay_terms integer default 0,
  updated_at timestamp with time zone default now(),
  kind text,
  origin text,
  verify text not null default 'yok'::text
);

-- TABLO supplier_push
create table if not exists public.supplier_push (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now()
);

-- TABLO supplier_push_log
create table if not exists public.supplier_push_log (
  user_id uuid not null,
  key text not null,
  sent_at timestamp with time zone default now()
);

-- TABLO supplier_ratings
create table if not exists public.supplier_ratings (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  supplier_id uuid not null,
  order_id uuid,
  stars integer,
  on_time boolean,
  complete boolean,
  fresh boolean,
  note text,
  created_at timestamp with time zone default now()
);

-- TABLO supplier_staff
create table if not exists public.supplier_staff (
  id uuid not null default gen_random_uuid(),
  owner_user uuid not null,
  staff_user uuid,
  name text not null,
  role text not null default 'surucu'::text,
  code text not null,
  created_at timestamp with time zone default now()
);

-- TABLO suppliers
create table if not exists public.suppliers (
  id uuid not null default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid,
  name text not null,
  phone text,
  lead_days integer not null default 2,
  min_amount numeric default 0,
  invite_email text,
  created_at timestamp with time zone default now(),
  src_id uuid
);

-- TABLO support_tickets
create table if not exists public.support_tickets (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  business_id uuid not null,
  user_id uuid not null,
  role text,
  kind text not null default 'sorun'::text,
  message text not null,
  ver text,
  status text not null default 'open'::text,
  reply text,
  replied_at timestamp with time zone,
  replied_by text
);

alter table account_feedback add constraint account_feedback_pkey PRIMARY KEY (id);

alter table admin_announcements add constraint admin_announcements_pkey PRIMARY KEY (id);

alter table admin_audit add constraint admin_audit_pkey PRIMARY KEY (id);

alter table admin_users add constraint admin_users_pkey PRIMARY KEY (user_id);

alter table admin_users add constraint admin_users_role_check CHECK ((role = ANY (ARRAY['super'::text, 'mod'::text])));

alter table ai_limits add constraint ai_limits_pkey PRIMARY KEY (business_id);

alter table ai_quota add constraint ai_quota_kind_check CHECK ((kind = ANY (ARRAY['chat'::text, 'read'::text])));

alter table ai_quota add constraint ai_quota_pkey PRIMARY KEY (business_id, day, kind);

alter table ai_usage add constraint ai_usage_pkey PRIMARY KEY (user_id, day);

alter table app_errors add constraint app_errors_pkey PRIMARY KEY (id);

alter table app_events add constraint app_events_pkey PRIMARY KEY (id);

alter table app_state add constraint app_state_pkey PRIMARY KEY (business_id, scope);

alter table audit_log add constraint audit_log_action_check CHECK ((char_length(action) <= 80));

alter table audit_log add constraint audit_log_pkey PRIMARY KEY (id);

alter table backups add constraint backups_pkey PRIMARY KEY (id);

alter table booking_config add constraint booking_config_pkey PRIMARY KEY (business_id);

alter table booking_config add constraint booking_config_slug_key UNIQUE (slug);

alter table booking_requests add constraint booking_requests_pkey PRIMARY KEY (id);

alter table business_notes add constraint business_notes_pkey PRIMARY KEY (business_id);

alter table businesses add constraint businesses_pkey PRIMARY KEY (id);

alter table cari_pay add constraint cari_pay_amt_check CHECK ((amt > (0)::numeric));

alter table cari_pay add constraint cari_pay_by_side_check CHECK ((by_side = ANY (ARRAY['isletme'::text, 'toptanci'::text])));

alter table cari_pay add constraint cari_pay_pkey PRIMARY KEY (id);

alter table cari_recon add constraint cari_recon_pkey PRIMARY KEY (id);

alter table cari_recon add constraint cari_recon_sent_by_check CHECK ((sent_by = ANY (ARRAY['isletme'::text, 'toptanci'::text])));

alter table cari_recon add constraint cari_recon_status_check CHECK ((status = ANY (ARRAY['bekliyor'::text, 'onaylandi'::text, 'itiraz'::text])));

alter table cari_recon add constraint cari_recon_supplier_id_period_key UNIQUE (supplier_id, period);

alter table feature_flags add constraint feature_flags_pkey PRIMARY KEY (key);

alter table invites add constraint invites_code_key UNIQUE (code);

alter table invites add constraint invites_pkey PRIMARY KEY (id);

alter table invites add constraint invites_role_check CHECK ((role = ANY (ARRAY['mudur'::text, 'muhasebeci'::text, 'calisan'::text])));

alter table kais_memory add constraint kais_memory_content_check CHECK (((char_length(content) >= 1) AND (char_length(content) <= 500)));

alter table kais_memory add constraint kais_memory_kind_check CHECK ((kind = ANY (ARRAY['fact'::text, 'rule'::text, 'pref'::text])));

alter table kais_memory add constraint kais_memory_pkey PRIMARY KEY (id);

alter table mail_log add constraint mail_log_pkey PRIMARY KEY (business_id, key);

alter table market_events add constraint market_events_pkey PRIMARY KEY (id);

alter table market_needs add constraint market_needs_contact_check CHECK (((contact IS NULL) OR (char_length(contact) <= 40)));

alter table market_needs add constraint market_needs_note_check CHECK (((note IS NULL) OR (char_length(note) <= 300)));

alter table market_needs add constraint market_needs_pkey PRIMARY KEY (id);

alter table market_needs add constraint market_needs_product_check CHECK (((char_length(product) >= 2) AND (char_length(product) <= 80)));

alter table market_needs add constraint market_needs_qty_check CHECK ((qty > (0)::numeric));

alter table market_needs add constraint market_needs_radius_km_check CHECK (((radius_km >= 5) AND (radius_km <= 1000)));

alter table market_needs add constraint market_needs_status_check CHECK ((status = ANY (ARRAY['acik'::text, 'kapali'::text, 'verildi'::text])));

alter table market_needs add constraint market_needs_unit_check CHECK ((char_length(unit) <= 12));

alter table market_offers add constraint market_offers_need_id_user_id_key UNIQUE (need_id, user_id);

alter table market_offers add constraint market_offers_note_check CHECK (((note IS NULL) OR (char_length(note) <= 300)));

alter table market_offers add constraint market_offers_pkey PRIMARY KEY (id);

alter table market_offers add constraint market_offers_price_check CHECK ((price > (0)::numeric));

alter table market_offers add constraint market_offers_qty_check CHECK ((qty > (0)::numeric));

alter table market_offers add constraint market_offers_status_check CHECK ((status = ANY (ARRAY['bekliyor'::text, 'kabul'::text, 'red'::text, 'geri'::text])));

alter table market_orders add constraint market_orders_offer_id_key UNIQUE (offer_id);

alter table market_orders add constraint market_orders_pkey PRIMARY KEY (id);

alter table market_orders add constraint market_orders_status_check CHECK ((status = ANY (ARRAY['onaylandi'::text, 'teslim_edildi'::text, 'alindi'::text, 'odendi'::text, 'tamam'::text, 'sorun'::text])));

alter table market_ratings add constraint market_ratings_by_side_check CHECK ((by_side = ANY (ARRAY['isletme'::text, 'uretici'::text])));

alter table market_ratings add constraint market_ratings_note_check CHECK (((note IS NULL) OR (char_length(note) <= 300)));

alter table market_ratings add constraint market_ratings_order_id_by_side_key UNIQUE (order_id, by_side);

alter table market_ratings add constraint market_ratings_pkey PRIMARY KEY (id);

alter table market_ratings add constraint market_ratings_stars_check CHECK (((stars >= 1) AND (stars <= 5)));

alter table members add constraint members_business_id_app_uid_key UNIQUE (business_id, app_uid);

alter table members add constraint members_business_id_user_id_key UNIQUE (business_id, user_id);

alter table members add constraint members_pkey PRIMARY KEY (id);

alter table members add constraint members_role_check CHECK ((role = ANY (ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text, 'calisan'::text])));

alter table onboard_config add constraint onboard_config_pkey PRIMARY KEY (business_id);

alter table onboard_docs add constraint onboard_docs_pkey PRIMARY KEY (business_id, user_id, doc_id);

alter table onboard_sub add constraint onboard_sub_pkey PRIMARY KEY (business_id, user_id);

alter table orders add constraint orders_pkey PRIMARY KEY (id);

alter table orders add constraint orders_status_check CHECK ((status = ANY (ARRAY['taslak'::text, 'gonderildi'::text, 'onaylandi'::text, 'teslim'::text, 'iptal'::text])));

alter table pos_tokens add constraint pos_tokens_pkey PRIMARY KEY (business_id);

alter table pos_tokens add constraint pos_tokens_token_key UNIQUE (token);

alter table price_hist add constraint price_hist_pkey PRIMARY KEY (id);

alter table producer_waitlist add constraint producer_waitlist_business_check CHECK (((business IS NULL) OR (char_length(business) <= 100)));

alter table producer_waitlist add constraint producer_waitlist_city_check CHECK (((char_length(city) >= 2) AND (char_length(city) <= 80)));

alter table producer_waitlist add constraint producer_waitlist_name_check CHECK (((char_length(name) >= 2) AND (char_length(name) <= 80)));

alter table producer_waitlist add constraint producer_waitlist_phone_check CHECK (((char_length(phone) >= 10) AND (char_length(phone) <= 30)));

alter table producer_waitlist add constraint producer_waitlist_pkey PRIMARY KEY (id);

alter table producer_waitlist add constraint producer_waitlist_products_check CHECK (((products IS NULL) OR (char_length(products) <= 200)));

alter table push_log add constraint push_log_pkey PRIMARY KEY (business_id, app_uid, key);

alter table push_subs add constraint push_subs_endpoint_key UNIQUE (endpoint);

alter table push_subs add constraint push_subs_pkey PRIMARY KEY (id);

alter table quotes add constraint quotes_pkey PRIMARY KEY (id);

alter table quotes add constraint quotes_rfq_id_supplier_id_key UNIQUE (rfq_id, supplier_id);

alter table rfqs add constraint rfqs_pkey PRIMARY KEY (id);

alter table rfqs add constraint rfqs_status_check CHECK ((status = ANY (ARRAY['acik'::text, 'kapali'::text])));

alter table sales_inbox add constraint sales_inbox_pkey PRIMARY KEY (id);

alter table supplier_books add constraint supplier_books_pkey PRIMARY KEY (supplier_id);

alter table supplier_cprice add constraint supplier_cprice_pkey PRIMARY KEY (supplier_id, product_id);

alter table supplier_cprice add constraint supplier_cprice_price_check CHECK ((price > (0)::numeric));

alter table supplier_customer add constraint supplier_customer_discount_pct_check CHECK (((discount_pct >= (0)::numeric) AND (discount_pct <= (60)::numeric)));

alter table supplier_customer add constraint supplier_customer_pkey PRIMARY KEY (supplier_id);

alter table supplier_dnote add constraint supplier_dnote_pkey PRIMARY KEY (supplier_id);

alter table supplier_private add constraint supplier_private_pkey PRIMARY KEY (supplier_id);

alter table supplier_products add constraint supplier_products_pkey PRIMARY KEY (id);

alter table supplier_products add constraint supplier_products_stock_check CHECK ((stock = ANY (ARRAY['var'::text, 'az'::text, 'yok'::text])));

alter table supplier_profiles add constraint supplier_profiles_kind_chk CHECK (((kind IS NULL) OR (kind = ANY (ARRAY['uretici'::text, 'toptanci'::text, 'seyyar'::text, 'dagitici'::text, 'sevkiyat'::text]))));

alter table supplier_profiles add constraint supplier_profiles_pkey PRIMARY KEY (supplier_id);

alter table supplier_profiles add constraint supplier_profiles_verify_chk CHECK ((verify = ANY (ARRAY['yok'::text, 'kimlik'::text, 'uretici'::text])));

alter table supplier_push_log add constraint supplier_push_log_pkey PRIMARY KEY (user_id, key);

alter table supplier_push add constraint supplier_push_endpoint_key UNIQUE (endpoint);

alter table supplier_push add constraint supplier_push_pkey PRIMARY KEY (id);

alter table supplier_ratings add constraint supplier_ratings_pkey PRIMARY KEY (id);

alter table supplier_ratings add constraint supplier_ratings_stars_check CHECK (((stars >= 1) AND (stars <= 5)));

alter table supplier_staff add constraint supplier_staff_code_key UNIQUE (code);

alter table supplier_staff add constraint supplier_staff_pkey PRIMARY KEY (id);

alter table supplier_staff add constraint supplier_staff_role_check CHECK ((role = ANY (ARRAY['surucu'::text, 'depocu'::text, 'yonetici'::text])));

alter table suppliers add constraint suppliers_pkey PRIMARY KEY (id);

alter table support_tickets add constraint support_tickets_pkey PRIMARY KEY (id);

alter table app_state add constraint app_state_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table audit_log add constraint audit_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table backups add constraint backups_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table booking_config add constraint booking_config_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id);

alter table booking_requests add constraint booking_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id);

alter table business_notes add constraint business_notes_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table businesses add constraint businesses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);

alter table cari_pay add constraint cari_pay_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table cari_pay add constraint cari_pay_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table cari_recon add constraint cari_recon_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table cari_recon add constraint cari_recon_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table invites add constraint invites_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table kais_memory add constraint kais_memory_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table market_needs add constraint market_needs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table market_offers add constraint market_offers_need_id_fkey FOREIGN KEY (need_id) REFERENCES market_needs(id) ON DELETE CASCADE;

alter table market_orders add constraint market_orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table market_orders add constraint market_orders_need_id_fkey FOREIGN KEY (need_id) REFERENCES market_needs(id) ON DELETE CASCADE;

alter table market_orders add constraint market_orders_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES market_offers(id) ON DELETE CASCADE;

alter table market_ratings add constraint market_ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES market_orders(id) ON DELETE CASCADE;

alter table members add constraint members_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table members add constraint members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table onboard_config add constraint onboard_config_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table onboard_config add constraint onboard_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

alter table onboard_docs add constraint onboard_docs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table onboard_docs add constraint onboard_docs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table onboard_sub add constraint onboard_sub_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table onboard_sub add constraint onboard_sub_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table orders add constraint orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table orders add constraint orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

alter table pos_tokens add constraint pos_tokens_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table price_hist add constraint price_hist_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table push_log add constraint push_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table push_subs add constraint push_subs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table push_subs add constraint push_subs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table quotes add constraint quotes_rfq_id_fkey FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE;

alter table quotes add constraint quotes_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table rfqs add constraint rfqs_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table sales_inbox add constraint sales_inbox_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table supplier_books add constraint supplier_books_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_cprice add constraint supplier_cprice_product_id_fkey FOREIGN KEY (product_id) REFERENCES supplier_products(id) ON DELETE CASCADE;

alter table supplier_cprice add constraint supplier_cprice_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_customer add constraint supplier_customer_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_dnote add constraint supplier_dnote_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_private add constraint supplier_private_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_products add constraint supplier_products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_profiles add constraint supplier_profiles_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_push_log add constraint supplier_push_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table supplier_push add constraint supplier_push_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table supplier_ratings add constraint supplier_ratings_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table supplier_ratings add constraint supplier_ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

alter table supplier_ratings add constraint supplier_ratings_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;

alter table supplier_staff add constraint supplier_staff_owner_user_fkey FOREIGN KEY (owner_user) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table supplier_staff add constraint supplier_staff_staff_user_fkey FOREIGN KEY (staff_user) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table suppliers add constraint suppliers_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

alter table suppliers add constraint suppliers_src_id_fkey FOREIGN KEY (src_id) REFERENCES suppliers(id) ON DELETE SET NULL;

alter table suppliers add constraint suppliers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE INDEX admin_audit_at ON public.admin_audit USING btree (at DESC);

CREATE INDEX app_errors_created ON public.app_errors USING btree (created_at DESC);

CREATE INDEX app_events_created ON public.app_events USING btree (created_at DESC);

CREATE INDEX audit_log_biz_idx ON public.audit_log USING btree (business_id, created_at DESC);

CREATE INDEX backups_biz_idx ON public.backups USING btree (business_id, created_at DESC);

CREATE INDEX booking_req_biz ON public.booking_requests USING btree (business_id, status, date);

CREATE INDEX invite_attempts_idx ON public.invite_attempts USING btree (user_id, at DESC);

CREATE INDEX kais_memory_biz_idx ON public.kais_memory USING btree (business_id, user_id);

CREATE INDEX mail_log_created ON public.mail_log USING btree (created_at);

CREATE INDEX market_events_todo_idx ON public.market_events USING btree (id) WHERE (NOT done);

CREATE INDEX market_needs_biz_idx ON public.market_needs USING btree (business_id, created_at DESC);

CREATE INDEX market_orders_biz_idx ON public.market_orders USING btree (business_id, created_at DESC);

CREATE INDEX market_orders_usr_idx ON public.market_orders USING btree (user_id, created_at DESC);

CREATE INDEX price_hist_sup ON public.price_hist USING btree (supplier_id, at DESC);

CREATE INDEX supplier_products_sup ON public.supplier_products USING btree (supplier_id);

CREATE OR REPLACE FUNCTION public.ai_hit(p_user uuid, p_day date)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.ai_usage(user_id, day, n) values (p_user, p_day, 1)
  on conflict (user_id, day) do update set n = public.ai_usage.n + 1 returning n;
$function$
;

CREATE OR REPLACE FUNCTION public.ai_quota_hit(p_biz uuid, p_kind text, p_day_max integer, p_month_max integer)
 RETURNS TABLE(ok boolean, day_n integer, month_n integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare d int; m int; today date := (now() at time zone 'Europe/Istanbul')::date;
begin
  select coalesce(sum(n),0) into m from public.ai_quota where business_id = p_biz and kind = p_kind and day >= date_trunc('month', today)::date;
  select coalesce(n,0) into d from public.ai_quota where business_id = p_biz and kind = p_kind and day = today;
  d := coalesce(d,0);
  if d >= p_day_max or m >= p_month_max then return query select false, d, m::int; return; end if;
  insert into public.ai_quota(business_id, day, kind, n) values (p_biz, today, p_kind, 1)
    on conflict (business_id, day, kind) do update set n = public.ai_quota.n + 1;
  return query select true, d + 1, m::int + 1;
end $function$
;

CREATE OR REPLACE FUNCTION public.app_state_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.biz_make_patron()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.members (business_id, user_id, role, app_uid, email)
  values (new.id, new.owner_id, 'patron', 'u1', (select email from auth.users where id = new.owner_id))
  on conflict do nothing;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.biz_rating(p_biz uuid)
 RETURNS TABLE(n integer, stars numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::int, round(avg(m.stars)::numeric, 2) from public.market_ratings m
    join public.market_orders o on o.id = m.order_id where o.business_id = p_biz and m.by_side = 'uretici'
$function$
;

CREATE OR REPLACE FUNCTION public.booking_info(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object('name', coalesce(c.title, b.name), 'open', c.open_h, 'close', c.close_h,
    'max', c.max_party, 'ahead', c.min_ahead_h, 'days', c.days_ahead)
  from booking_config c join businesses b on b.id = c.business_id
  where c.slug = p_slug and c.enabled and b.deleted_at is null;
$function$
;

CREATE OR REPLACE FUNCTION public.booking_submit(p_slug text, p_name text, p_phone text, p_n integer, p_date date, p_time text, p_note text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c booking_config; ph text := regexp_replace(coalesce(p_phone,''), '\\D', '', 'g'); h int; ts timestamp;
begin
  select * into c from booking_config where slug = p_slug and enabled;
  if not found then return 'kapali'; end if;
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 80 then return 'ad'; end if;
  if length(ph) < 10 or length(ph) > 13 then return 'telefon'; end if;
  if p_n is null or p_n < 1 or p_n > c.max_party then return 'kisi'; end if;
  if p_time !~ '^[0-2][0-9]:[0-5][0-9]$' then return 'saat'; end if;
  h := split_part(p_time, ':', 1)::int;
  if h < c.open_h or h >= c.close_h then return 'saat'; end if;
  ts := p_date::timestamp + p_time::time;
  if ts < (now() at time zone 'Europe/Istanbul') + make_interval(hours => c.min_ahead_h) then return 'gecmis'; end if;
  if p_date > (now() at time zone 'Europe/Istanbul')::date + c.days_ahead then return 'uzak'; end if;
  if (select count(*) from booking_requests where business_id = c.business_id and phone = ph and status = 'bekliyor') >= 3 then return 'cok'; end if;
  if (select count(*) from booking_requests where business_id = c.business_id and created_at > now() - interval '1 hour') >= 30 then return 'yogun'; end if;
  insert into booking_requests(business_id, name, phone, n, date, time, note)
  values (c.business_id, trim(p_name), ph, p_n, p_date, p_time, left(coalesce(p_note,''), 200));
  return 'ok';
end $function$
;

CREATE OR REPLACE FUNCTION public.claim_invite(p_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare inv public.invites; em text; v_n int;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  delete from public.invite_attempts where at < now() - interval '1 day';
  select count(*) into v_n from public.invite_attempts where user_id = auth.uid() and at > now() - interval '15 minutes';
  if v_n >= 8 then raise exception 'too_many_attempts'; end if;
  select * into inv from public.invites where code = upper(trim(p_code)) and used_at is null and expires_at > now() for update;
  if not found then
    insert into public.invite_attempts(user_id) values (auth.uid());
    return json_build_object('error', 'invalid_code');
  end if;
  if exists (select 1 from public.members where business_id = inv.business_id and user_id = auth.uid()) then raise exception 'already_member'; end if;
  if exists (select 1 from public.members where business_id = inv.business_id and app_uid = inv.app_uid) then raise exception 'seat_taken'; end if;
  select email into em from auth.users where id = auth.uid();
  insert into public.members (business_id, user_id, role, app_uid, display_name, email)
  values (inv.business_id, auth.uid(), inv.role, inv.app_uid, inv.name, em);
  update public.invites set used_by = auth.uid(), used_at = now() where id = inv.id;
  insert into public.audit_log (business_id, user_id, role, action, detail)
  values (inv.business_id, auth.uid(), inv.role, 'uye_katildi', jsonb_build_object('app_uid', inv.app_uid, 'ad', inv.name));
  return json_build_object('business_id', inv.business_id, 'role', inv.role, 'app_uid', inv.app_uid);
end $function$
;

CREATE OR REPLACE FUNCTION public.claim_supplier()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
  update public.suppliers s set user_id = auth.uid()
  where s.user_id is null and lower(s.invite_email) = lower((select email from auth.users where id = auth.uid()));
  get diagnostics n = row_count; return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.delete_my_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare v uuid := auth.uid(); b uuid; t text;
begin
  if v is null then raise exception 'not_signed_in'; end if;

  for b in select id from public.businesses where owner_id = v and deleted_at is null loop
    foreach t in array array['app_state','backups','invites','members','onboard_config','onboard_docs','onboard_sub',
                             'pos_tokens','booking_requests','booking_config','push_subs','push_log','sales_inbox','audit_log','kais_memory','mail_log'] loop
      if to_regclass('public.' \|\| t) is not null then
        execute format('delete from public.%I where business_id = $1', t) using b;
      end if;
    end loop;
    update public.businesses set name = 'Silinmiş işletme', lat = null, lng = null, deleted_at = now() where id = b;
  end loop;

  delete from public.push_subs where user_id = v;
  delete from public.supplier_push where user_id = v;
  delete from public.supplier_push_log where user_id = v;
  delete from public.onboard_docs where user_id = v;
  delete from public.onboard_sub where user_id = v;
  delete from public.kais_memory where user_id = v;
  delete from public.ai_usage where user_id = v;
  delete from public.supplier_staff where staff_user = v;
  update public.suppliers set user_id = null where user_id = v;
  delete from public.members where user_id = v;
  update public.businesses set owner_id = null where owner_id = v;
  delete from auth.users where id = v;
exception
  when not_null_violation then raise exception 'owner_required';
  when foreign_key_violation then raise exception 'delete_blocked';
end $function$
;

CREATE OR REPLACE FUNCTION public.find_suppliers(q text)
 RETURNS TABLE(src_id uuid, user_id uuid, name text, city text, district text, lat double precision, lng double precision, phone text, about text, product_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select distinct on (s.user_id) s.id, s.user_id, s.name, p.city, p.district, p.lat::double precision, p.lng::double precision, p.phone, p.about,
    (select count(*) from public.supplier_products x where x.supplier_id = s.id and x.active)
  from public.suppliers s
  join public.supplier_profiles p on p.supplier_id = s.id
  where s.user_id is not null and auth.uid() is not null
    and (length(coalesce(q,'')) < 2 or s.name ilike '%'\|\|q\|\|'%' or p.city ilike '%'\|\|q\|\|'%' or p.district ilike '%'\|\|q\|\|'%')
  order by s.user_id, s.created_at
  limit 30;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(bid uuid, roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists (select 1 from public.members m where m.business_id = bid and m.user_id = auth.uid() and m.role = any(roles)) $function$
;

CREATE OR REPLACE FUNCTION public.invites_guard()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.expires_at is null or new.expires_at > now() + interval '14 days' then
    new.expires_at := now() + interval '7 days';
  end if;
  new.code := upper(trim(new.code));
  if new.role is null or new.role not in ('patron','mudur','muhasebeci','calisan') then
    raise exception 'invalid_role';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.is_member(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists (select 1 from public.members m where m.business_id = bid and m.user_id = auth.uid()) $function$
;

CREATE OR REPLACE FUNCTION public.is_supplier_of(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.suppliers s where s.business_id = bid and s.user_id = auth.uid())
$function$
;

CREATE OR REPLACE FUNCTION public.link_supplier(p_src uuid, p_business uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare src public.suppliers; mine uuid;
begin
  if not (public.is_member(p_business) or exists (select 1 from public.businesses b where b.id = p_business and b.owner_id = auth.uid())) then
    raise exception 'yetki yok';
  end if;
  select * into src from public.suppliers where id = p_src and user_id is not null;
  if src.id is null then raise exception 'toptancı bulunamadı'; end if;
  select id into mine from public.suppliers where business_id = p_business and user_id = src.user_id limit 1;
  if mine is null then
    insert into public.suppliers (business_id, user_id, name, phone, lead_days, min_amount, src_id)
    values (p_business, src.user_id, src.name, src.phone, src.lead_days, src.min_amount, src.id) returning id into mine;
  else
    update public.suppliers set src_id = src.id where id = mine;
  end if;
  return mine;
end $function$
;

CREATE OR REPLACE FUNCTION public.log_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'UPDATE' and new.price is distinct from old.price then
    insert into public.price_hist (supplier_id, product_id, name, unit, old_price, new_price) values (new.supplier_id, new.id, new.name, new.unit, old.price, new.price);
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.mail_log_clean()
 RETURNS void
 LANGUAGE sql
AS $function$
  delete from public.mail_log where created_at < now() - interval '90 days';
$function$
;

CREATE OR REPLACE FUNCTION public.market_accept(p_offer uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_o public.market_offers; v_n public.market_needs; v_q numeric;
begin
  select * into v_o from public.market_offers where id = p_offer;
  if not found then raise exception 'Teklif bulunamadı'; end if;
  select * into v_n from public.market_needs where id = v_o.need_id;
  if not public.market_can(v_n.business_id) then raise exception 'Yetki yok'; end if;
  if v_n.status <> 'acik' or v_o.status <> 'bekliyor' then raise exception 'Bu teklif artık kabul edilemez'; end if;
  update public.market_offers set status = case when id = p_offer then 'kabul' else 'red' end
   where need_id = v_n.id and status in ('bekliyor');
  update public.market_needs set status = 'verildi' where id = v_n.id;
  v_q := least(v_o.qty, v_n.qty);
  insert into public.market_orders (need_id, offer_id, business_id, user_id, supplier_name, product, qty, unit, price, total)
  values (v_n.id, v_o.id, v_n.business_id, v_o.user_id, v_o.supplier_name, v_n.product, v_q, v_n.unit, v_o.price, round(v_o.price * v_q, 2))
  on conflict (offer_id) do nothing;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_can(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select has_role(bid, array['patron','mudur'])
      or exists (select 1 from public.businesses b where b.id = bid and b.owner_id = auth.uid())
$function$
;

CREATE OR REPLACE FUNCTION public.market_can_pay(bid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select has_role(bid, array['patron','mudur','muhasebeci'])
      or exists (select 1 from public.businesses b where b.id = bid and b.owner_id = auth.uid())
$function$
;

CREATE OR REPLACE FUNCTION public.market_ev_need()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin insert into public.market_events (kind, need_id) values ('need_new', new.id); return new; end $function$
;

CREATE OR REPLACE FUNCTION public.market_ev_offer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then insert into public.market_events (kind, need_id, offer_id) values ('offer_new', new.need_id, new.id); end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_ev_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then insert into public.market_events (kind, order_id) values ('order_onaylandi', new.id);
  elsif new.status is distinct from old.status then insert into public.market_events (kind, order_id) values ('order_' \|\| new.status, new.id); end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_feed()
 RETURNS TABLE(id uuid, product text, qty numeric, unit text, deliver_by date, note text, city text, district text, biz_name text, km numeric, expires_at timestamp with time zone, my_price numeric, my_status text, biz_stars numeric, biz_n integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_lat double precision; v_lng double precision;
begin
  if auth.uid() is null or not exists (select 1 from public.suppliers s where s.user_id = auth.uid()) then
    raise exception 'Üretici hesabı gerekli';
  end if;
  select p.lat, p.lng into v_lat, v_lng
    from public.supplier_profiles p join public.suppliers s on s.id = p.supplier_id
   where s.user_id = auth.uid() order by (p.lat is null), p.updated_at desc nulls last limit 1;
  return query
    select n.id, n.product, n.qty, n.unit, n.deliver_by, n.note, n.city, n.district, b.name,
           public.market_km(v_lat, v_lng, n.lat, n.lng), n.expires_at, o.price, o.status, br.stars, coalesce(br.n, 0)
      from public.market_needs n
      join public.businesses b on b.id = n.business_id
      left join public.market_offers o on o.need_id = n.id and o.user_id = auth.uid()
      left join lateral public.biz_rating(n.business_id) br on true
     where n.status = 'acik' and n.expires_at > now()
       and (public.market_km(v_lat, v_lng, n.lat, n.lng) is null
            or public.market_km(v_lat, v_lng, n.lat, n.lng) <= n.radius_km)
     order by (case when coalesce(br.n, 0) >= 3 and br.stars >= 4.5 then 0 else 1 end),
              public.market_km(v_lat, v_lng, n.lat, n.lng) nulls last, n.created_at desc
     limit 100;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_km(a1 double precision, o1 double precision, a2 double precision, o2 double precision)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case when a1 is null or o1 is null or a2 is null or o2 is null then null
    else round((6371 * 1.3 * acos(least(1, greatest(-1,
      cos(radians(a1)) * cos(radians(a2)) * cos(radians(o2 - o1)) + sin(radians(a1)) * sin(radians(a2))))))::numeric, 1) end
$function$
;

CREATE OR REPLACE FUNCTION public.market_mine()
 RETURNS TABLE(offer_id uuid, need_id uuid, product text, qty numeric, unit text, price numeric, offer_qty numeric, deliver_date date, status text, biz_name text, contact text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select o.id, n.id, n.product, n.qty, n.unit, o.price, o.qty, o.deliver_date, o.status, b.name,
         case when o.status = 'kabul' then n.contact end, o.created_at
    from public.market_offers o
    join public.market_needs n on n.id = o.need_id
    join public.businesses b on b.id = n.business_id
   where o.user_id = auth.uid()
   order by o.created_at desc limit 100
$function$
;

CREATE OR REPLACE FUNCTION public.market_offer_send(p_need uuid, p_price numeric, p_qty numeric, p_date date, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_name text; v_n public.market_needs;
begin
  select * into v_n from public.market_needs where id = p_need;
  if not found or v_n.status <> 'acik' or v_n.expires_at <= now() then raise exception 'Bu ilan artık açık değil'; end if;
  select s.name into v_name from public.suppliers s where s.user_id = auth.uid() order by s.created_at limit 1;
  if v_name is null then raise exception 'Üretici hesabı gerekli'; end if;
  if p_price is null or p_price <= 0 or p_qty is null or p_qty <= 0 then raise exception 'Fiyat ve miktar gerekli'; end if;
  insert into public.market_offers (need_id, user_id, supplier_name, price, qty, deliver_date, note)
  values (p_need, auth.uid(), v_name, p_price, p_qty, p_date, nullif(left(coalesce(p_note, ''), 300), ''))
  on conflict (need_id, user_id) do update
    set price = excluded.price, qty = excluded.qty, deliver_date = excluded.deliver_date, note = excluded.note,
        status = case when public.market_offers.status in ('kabul') then 'kabul' else 'bekliyor' end;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_offer_withdraw(p_need uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.market_offers set status = 'geri' where need_id = p_need and user_id = auth.uid() and status = 'bekliyor'
$function$
;

CREATE OR REPLACE FUNCTION public.market_offers_for(p_need uuid)
 RETURNS TABLE(offer_id uuid, supplier_name text, price numeric, qty numeric, deliver_date date, note text, status text, kind text, origin text, verify text, km numeric, stars numeric, n integer, on_time numeric, phone text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_n public.market_needs;
begin
  select * into v_n from public.market_needs where id = p_need;
  if not found or not public.market_can(v_n.business_id) then raise exception 'Yetki yok'; end if;
  return query
    select o.id, o.supplier_name, o.price, o.qty, o.deliver_date, o.note, o.status,
           pr.kind, pr.origin, coalesce(pr.verify, 'yok'),
           public.market_km(pr.lat, pr.lng, v_n.lat, v_n.lng),
           st.stars, coalesce(st.n, 0), st.on_time,
           case when o.status = 'kabul' then pr.phone end
      from public.market_offers o
      left join lateral (
        select p.* from public.supplier_profiles p join public.suppliers s on s.id = p.supplier_id
         where s.user_id = o.user_id order by (p.lat is null), p.updated_at desc nulls last limit 1) pr on true
      left join lateral public.producer_rating(o.user_id) st on true
     where o.need_id = p_need and o.status <> 'geri'
     order by o.price;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_order_act(p_order uuid, p_act text, p_qty numeric DEFAULT NULL::numeric, p_text text DEFAULT NULL::text, p_amount numeric DEFAULT NULL::numeric, p_date date DEFAULT NULL::date, p_doc text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.market_orders; v_sup boolean; v_biz boolean; v_pay boolean;
begin
  select * into o from public.market_orders where id = p_order for update;
  if not found then raise exception 'Sipariş bulunamadı'; end if;
  v_sup := o.user_id = auth.uid(); v_biz := public.market_can(o.business_id); v_pay := public.market_can_pay(o.business_id);
  if not (v_sup or v_pay) then raise exception 'Yetki yok'; end if;
  if p_act = 'delivered' then
    if not v_sup or o.status <> 'onaylandi' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'teslim_edildi', delivered_at = now() where id = o.id;
  elsif p_act = 'received' then
    if not v_biz or o.status not in ('onaylandi','teslim_edildi') then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'alindi', received_at = now(), received_qty = coalesce(p_qty, o.qty),
      total = case when p_qty is not null and p_qty > 0 then round(o.price * p_qty, 2) else o.total end where id = o.id;
  elsif p_act = 'paid' then
    if not v_pay or o.status <> 'alindi' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'odendi', paid_at = now(), pay_amount = coalesce(p_amount, o.total),
      pay_ref = nullif(left(coalesce(p_text, ''), 60), ''), pay_date = coalesce(p_date, current_date), doc_path = nullif(left(coalesce(p_doc, ''), 200), '') where id = o.id;
  elsif p_act = 'confirm' then
    if not v_sup or o.status <> 'odendi' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = 'tamam', done_at = now() where id = o.id;
  elsif p_act = 'issue' then
    if o.status in ('tamam','sorun') then raise exception 'Bu işlem şu an yapılamaz'; end if;
    if coalesce(btrim(p_text), '') = '' then raise exception 'Sorunu kısaca yaz'; end if;
    update public.market_orders set prev_status = o.status, status = 'sorun', issue = left(p_text, 300),
      issue_by = case when v_sup then 'uretici' else 'isletme' end where id = o.id;
  elsif p_act = 'resolve' then
    if o.status <> 'sorun' then raise exception 'Bu işlem şu an yapılamaz'; end if;
    update public.market_orders set status = coalesce(o.prev_status, 'onaylandi'), prev_status = null, issue = null, issue_by = null where id = o.id;
  else raise exception 'Bilinmeyen işlem'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_orders_biz(p_biz uuid)
 RETURNS TABLE(id uuid, product text, qty numeric, unit text, price numeric, total numeric, status text, supplier_name text, phone text, issue text, issue_by text, received_qty numeric, pay_amount numeric, pay_ref text, pay_date date, doc_path text, created_at timestamp with time zone, rated boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.market_can_pay(p_biz) then raise exception 'Yetki yok'; end if;
  return query
    select o.id, o.product, o.qty, o.unit, o.price, o.total, o.status, o.supplier_name,
           (select p.phone from public.supplier_profiles p join public.suppliers s on s.id = p.supplier_id
             where s.user_id = o.user_id order by (p.phone is null), p.updated_at desc nulls last limit 1),
           o.issue, o.issue_by, o.received_qty, o.pay_amount, o.pay_ref, o.pay_date, o.doc_path, o.created_at,
           exists (select 1 from public.market_ratings r where r.order_id = o.id and r.by_side = 'isletme')
      from public.market_orders o where o.business_id = p_biz order by o.created_at desc limit 60;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_orders_sup()
 RETURNS TABLE(id uuid, product text, qty numeric, unit text, price numeric, total numeric, status text, biz_name text, contact text, issue text, issue_by text, pay_amount numeric, pay_ref text, pay_date date, doc_path text, created_at timestamp with time zone, rated boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select o.id, o.product, o.qty, o.unit, o.price, o.total, o.status, b.name,
         (select n.contact from public.market_needs n where n.id = o.need_id),
         o.issue, o.issue_by, o.pay_amount, o.pay_ref, o.pay_date, o.doc_path, o.created_at,
         exists (select 1 from public.market_ratings r where r.order_id = o.id and r.by_side = 'uretici')
    from public.market_orders o join public.businesses b on b.id = o.business_id
   where o.user_id = auth.uid() order by o.created_at desc limit 60
$function$
;

CREATE OR REPLACE FUNCTION public.market_outbox_pull()
 RETURNS TABLE(to_user uuid, to_biz uuid, to_roles text[], title text, body text, tag text, url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e record; n public.market_needs; o public.market_orders; v_off public.market_offers; v_biz text; v_km numeric;
begin
  for e in update public.market_events set done = true where id in (select id from public.market_events where not done order by id limit 200) returning * loop
    if e.kind = 'need_new' then
      select * into n from public.market_needs where id = e.need_id; if not found then continue; end if;
      select name into v_biz from public.businesses where id = n.business_id;
      return query
        select x.user_id, null::uuid, null::text[], 'Yakınında yeni ilan',
               coalesce(v_biz, 'Bir işletme') \|\| ' ' \|\| trim(trailing '.' from to_char(n.qty, 'FM999999990.99')) \|\| ' ' \|\| n.unit \|\| ' ' \|\| n.product \|\| ' arıyor (' \|\| round(x.km)::text \|\| ' km).',
               'mkneed' \|\| n.id::text, '/tedarikci/'
          from (select s.user_id, min(public.market_km(p.lat, p.lng, n.lat, n.lng)) as km
                  from public.suppliers s join public.supplier_profiles p on p.supplier_id = s.id
                 where s.user_id is not null and p.lat is not null and n.lat is not null
                 group by s.user_id) x
         where x.km <= n.radius_km order by x.km limit 50;
    elsif e.kind = 'offer_new' then
      select * into v_off from public.market_offers where id = e.offer_id; select * into n from public.market_needs where id = e.need_id;
      if v_off.id is null or n.id is null then continue; end if;
      return query select null::uuid, n.business_id, array['patron','mudur'], 'Yeni teklif geldi',
        v_off.supplier_name \|\| ' ' \|\| n.product \|\| ' için ' \|\| replace(trim(trailing '.' from trim(trailing '0' from round(v_off.price, 2)::text)), '.', ',') \|\| ' ₺ / ' \|\| n.unit \|\| ' teklif verdi.', 'mkoffer' \|\| v_off.id::text, '/';
    elsif e.kind like 'order_%' then
      select * into o from public.market_orders where id = e.order_id; if not found then continue; end if;
      select name into v_biz from public.businesses where id = o.business_id;
      if e.kind = 'order_onaylandi' then
        return query select o.user_id, null::uuid, null::text[], 'Teklifin kabul edildi', coalesce(v_biz, 'İşletme') \|\| ' ' \|\| o.product \|\| ' için teklifini seçti. Teslimat için seni arayacak.', 'mkord' \|\| o.id::text, '/tedarikci/';
      elsif e.kind = 'order_teslim_edildi' then
        return query select null::uuid, o.business_id, array['patron','mudur'], 'Teslimat bildirildi', o.supplier_name \|\| ' ' \|\| o.product \|\| ' teslimatını yaptığını bildirdi. Teslim aldıysan onayla.', 'mkord' \|\| o.id::text, '/';
      elsif e.kind = 'order_alindi' then
        return query select o.user_id, null::uuid, null::text[], 'Teslim onaylandı', coalesce(v_biz, 'İşletme') \|\| ' ' \|\| o.product \|\| ' teslimatını onayladı. Ödeme bekleniyor.', 'mkord' \|\| o.id::text, '/tedarikci/';
        return query select null::uuid, o.business_id, array['patron','mudur','muhasebeci'], 'Üretici ödemesi bekleniyor', o.supplier_name \|\| ' için ' \|\| public.market_tl(o.total) \|\| ' ödeme yapılacak.', 'mkpay' \|\| o.id::text, '/';
      elsif e.kind = 'order_odendi' then
        return query select o.user_id, null::uuid, null::text[], 'Ödeme bildirildi', coalesce(v_biz, 'İşletme') \|\| ' ' \|\| public.market_tl(coalesce(o.pay_amount, o.total)) \|\| ' ödemeyi bildirdi. Hesabına geçince onayla.', 'mkord' \|\| o.id::text, '/tedarikci/';
      elsif e.kind = 'order_sorun' then
        if o.issue_by = 'uretici' then
          return query select null::uuid, o.business_id, array['patron','mudur'], 'Üretici sorun bildirdi', o.supplier_name \|\| ' ' \|\| o.product \|\| ': ' \|\| left(coalesce(o.issue, ''), 100), 'mkord' \|\| o.id::text, '/';
        else
          return query select o.user_id, null::uuid, null::text[], 'İşletme sorun bildirdi', coalesce(v_biz, 'İşletme') \|\| ' ' \|\| o.product \|\| ': ' \|\| left(coalesce(o.issue, ''), 100), 'mkord' \|\| o.id::text, '/tedarikci/';
        end if;
      end if;
    end if;
  end loop;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_rate(p_order uuid, p_stars integer, p_on_time boolean, p_complete boolean, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o public.market_orders; v_side text;
begin
  select * into o from public.market_orders where id = p_order;
  if not found then raise exception 'Sipariş bulunamadı'; end if;
  if o.user_id = auth.uid() then
    v_side := 'uretici'; if o.status not in ('odendi','tamam') then raise exception 'Ödeme gelince puanlayabilirsin'; end if;
  elsif public.market_can(o.business_id) then
    v_side := 'isletme'; if o.status not in ('alindi','odendi','tamam') then raise exception 'Teslim alınca puanlayabilirsin'; end if;
  else raise exception 'Yetki yok'; end if;
  insert into public.market_ratings (order_id, by_side, stars, on_time, complete, note)
  values (p_order, v_side, p_stars, coalesce(p_on_time, true), coalesce(p_complete, true), nullif(left(coalesce(p_note, ''), 300), ''))
  on conflict (order_id, by_side) do nothing;
end $function$
;

CREATE OR REPLACE FUNCTION public.market_tl(x numeric)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select replace(to_char(round(x), 'FM999G999G999'), ',', '.') \|\| ' ₺' $function$
;

CREATE OR REPLACE FUNCTION public.my_flags()
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(array_agg(f.key), '{}'::text[]) from public.feature_flags f
  where f.enabled_all or exists (select 1 from public.members m where m.user_id = auth.uid() and m.business_id = any(f.business_ids));
$function$
;

CREATE OR REPLACE FUNCTION public.orders_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_staff boolean; v_sup boolean;
begin
  if auth.uid() is null then return new; end if; -- sunucu (service role) serbest
  v_staff := is_member(old.business_id) or exists (select 1 from public.businesses b where b.id = old.business_id and b.owner_id = auth.uid());
  v_sup := exists (select 1 from public.suppliers s where s.id = old.supplier_id and s.user_id = auth.uid());
  if v_sup and not v_staff then
    if new.business_id is distinct from old.business_id or new.supplier_id is distinct from old.supplier_id then
      raise exception 'Siparişin işletmesi ve tedarikçisi değiştirilemez';
    end if;
    if old.status in ('onaylandi','teslim') and (new.lines is distinct from old.lines or new.total is distinct from old.total) then
      raise exception 'Onaylanan siparişin kalemleri ve tutarı değiştirilemez';
    end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.pos_push(p_token text, p_rows jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare bid uuid; n integer := 0; r jsonb;
begin
  select business_id into bid from public.pos_tokens where token = p_token;
  if bid is null then raise exception 'invalid_token'; end if;
  if jsonb_typeof(p_rows) <> 'array' then p_rows := jsonb_build_array(p_rows); end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    if n >= 500 then exit; end if;
    insert into public.sales_inbox(business_id, payload) values (bid, r); n := n + 1;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.producer_rating(p_user uuid)
 RETURNS TABLE(n integer, stars numeric, on_time numeric, complete numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with r as (
    select x.stars, x.on_time, x.complete from public.supplier_ratings x
      join public.suppliers s on s.id = x.supplier_id where s.user_id = p_user
    union all
    select m.stars, m.on_time, m.complete from public.market_ratings m
      join public.market_orders o on o.id = m.order_id where o.user_id = p_user and m.by_side = 'isletme')
  select count(*)::int, round(avg(stars)::numeric, 2),
         round(100.0 * avg((on_time)::int)::numeric, 0), round(100.0 * avg((complete)::int)::numeric, 0) from r
$function$
;

CREATE OR REPLACE FUNCTION public.push_log_clean()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$ delete from public.push_log where sent_at < now() - interval '30 days'; $function$
;

CREATE OR REPLACE FUNCTION public.scope_ok(bid uuid, sc text, w boolean)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.members m
    where m.business_id = bid and m.user_id = auth.uid() and (
      m.role = 'patron'
      or (m.role = 'mudur' and sc in ('stok', 'ekip'))
      or (m.role = 'muhasebeci' and (sc in ('muh', 'ekip') or (not w and left(sc, 5) = 'maas_')))
      or (m.role = 'calisan' and (sc = 'ekip' or (not w and sc = 'stok') or (not w and sc = 'maas_' \|\| m.app_uid)))
    )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.staff_create(p_name text, p_role text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c text; begin
  if not exists (select 1 from public.suppliers where user_id = auth.uid()) then raise exception 'toptancı değilsin'; end if;
  c := upper(substr(md5(random()::text \|\| clock_timestamp()::text), 1, 6));
  insert into public.supplier_staff (owner_user, name, role, code) values (auth.uid(), left(p_name, 60), coalesce(p_role, 'surucu'), c);
  return c; end $function$
;

CREATE OR REPLACE FUNCTION public.staff_join(p_code text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.supplier_staff; begin
  select * into r from public.supplier_staff where code = upper(trim(p_code)) and (staff_user is null or staff_user = auth.uid());
  if r.id is null then raise exception 'kod geçersiz'; end if;
  update public.supplier_staff set staff_user = auth.uid() where id = r.id; return r.name; end $function$
;

CREATE OR REPLACE FUNCTION public.staff_me()
 RETURNS TABLE(name text, role text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select st.name, st.role from public.supplier_staff st where st.staff_user = auth.uid() limit 1; $function$
;

CREATE OR REPLACE FUNCTION public.staff_orders()
 RETURNS TABLE(id uuid, business_name text, lat double precision, lng double precision, lines jsonb, total numeric, delivery text, status text, created_at timestamp with time zone, staff_name text, staff_role text, dnote text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select o.id, b.name, b.lat, b.lng,
    case when st.role = 'yonetici' then o.lines else (select coalesce(jsonb_agg(l - 'price'), '[]'::jsonb) from jsonb_array_elements(o.lines) l) end,
    case when st.role = 'yonetici' then o.total else null end,
    o.delivery, o.status, o.created_at, st.name, st.role, dn.note
  from public.supplier_staff st
  join public.suppliers s on s.user_id = st.owner_user
  join public.orders o on o.supplier_id = s.id
  join public.businesses b on b.id = o.business_id
  left join public.supplier_dnote dn on dn.supplier_id = s.id
  where st.staff_user = auth.uid() and o.status in ('onaylandi') and coalesce(o.delivery, '') <> 'teslim_edildi'
  order by o.created_at;
$function$
;

CREATE OR REPLACE FUNCTION public.staff_set(p_order uuid, p_state text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare nm text; begin
  if p_state not in ('hazirlaniyor','yolda','teslim_edildi') then raise exception 'durum geçersiz'; end if;
  select st.name into nm from public.supplier_staff st join public.suppliers s on s.user_id = st.owner_user join public.orders o on o.supplier_id = s.id
    where st.staff_user = auth.uid() and o.id = p_order limit 1;
  if nm is null then raise exception 'yetki yok'; end if;
  update public.orders set delivery = p_state, delivery_at = now(), delivery_by = nm where id = p_order; end $function$
;

CREATE OR REPLACE FUNCTION public.staff_set2(p_order uuid, p_state text, p_proof jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare nm text; rl text; begin
  if p_state not in ('hazirlaniyor','yolda','teslim_edildi') then raise exception 'durum geçersiz'; end if;
  select st.name, st.role into nm, rl from public.supplier_staff st join public.suppliers s on s.user_id = st.owner_user join public.orders o on o.supplier_id = s.id
    where st.staff_user = auth.uid() and o.id = p_order limit 1;
  if nm is null then raise exception 'yetki yok'; end if;
  if rl = 'depocu' and p_state <> 'hazirlaniyor' then raise exception 'depocu yalnızca hazırlanıyor işaretler'; end if;
  if rl = 'surucu' and p_state = 'hazirlaniyor' then raise exception 'sürücü yola çıkış ve teslim işaretler'; end if;
  update public.orders set delivery = p_state, delivery_at = now(), delivery_by = nm,
    proof = case when p_state = 'teslim_edildi' and p_proof is not null then p_proof \|\| jsonb_build_object('by', nm, 'at', now()) else proof end
  where id = p_order; end $function$
;

CREATE OR REPLACE FUNCTION public.supplier_stats(ids uuid[])
 RETURNS TABLE(supplier_id uuid, n integer, stars numeric, on_time numeric, complete numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.id, pr.n, pr.stars, pr.on_time, pr.complete
    from public.suppliers s cross join lateral public.producer_rating(s.user_id) pr
   where s.id = any(ids) and pr.n > 0
$function$
;

CREATE OR REPLACE FUNCTION public.supplier_verify_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '');
begin
  if r in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.verify := 'yok'; else new.verify := old.verify; end if;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.telemetry_clean()
 RETURNS void
 LANGUAGE sql
AS $function$
  delete from public.app_errors where created_at < now() - interval '90 days';
  delete from public.app_events where created_at < now() - interval '90 days';
$function$
;

CREATE OR REPLACE FUNCTION public.transfer_business(p_business uuid, p_member uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  update public.members set app_uid = '_tmp_' \|\| id::text where id = o.id;
  update public.members set app_uid = o.app_uid, role = 'patron', display_name = o.display_name where id = n.id;
  update public.members set app_uid = n.app_uid, role = 'mudur', display_name = n.display_name where id = o.id;
  update public.businesses set owner_id = n.user_id where id = p_business;
  if to_regclass('public.audit_log') is not null then
    insert into public.audit_log(business_id, user_id, role, action, detail)
    values (p_business, v, 'patron', 'devir', jsonb_build_object('text', 'İşletme sahipliği devredildi'));
  end if;
end $function$
;

CREATE TRIGGER app_state_guard BEFORE UPDATE ON public.app_state FOR EACH ROW EXECUTE FUNCTION app_state_guard();

CREATE TRIGGER biz_patron_trg AFTER INSERT ON public.businesses FOR EACH ROW EXECUTE FUNCTION biz_make_patron();

CREATE TRIGGER invites_guard_t BEFORE INSERT ON public.invites FOR EACH ROW EXECUTE FUNCTION invites_guard();

CREATE TRIGGER market_ev_need_t AFTER INSERT ON public.market_needs FOR EACH ROW EXECUTE FUNCTION market_ev_need();

CREATE TRIGGER market_ev_offer_t AFTER INSERT ON public.market_offers FOR EACH ROW EXECUTE FUNCTION market_ev_offer();

CREATE TRIGGER market_ev_order_t AFTER INSERT OR UPDATE ON public.market_orders FOR EACH ROW EXECUTE FUNCTION market_ev_order();

CREATE TRIGGER orders_guard_t BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION orders_guard();

CREATE TRIGGER supplier_verify_guard BEFORE INSERT OR UPDATE ON public.supplier_profiles FOR EACH ROW EXECUTE FUNCTION supplier_verify_guard();

CREATE TRIGGER trg_log_price AFTER UPDATE ON public.supplier_products FOR EACH ROW EXECUTE FUNCTION log_price();

alter table public.account_feedback enable row level security;

alter table public.admin_announcements enable row level security;

alter table public.admin_audit enable row level security;

alter table public.admin_users enable row level security;

alter table public.ai_limits enable row level security;

alter table public.ai_quota enable row level security;

alter table public.ai_usage enable row level security;

alter table public.app_errors enable row level security;

alter table public.app_events enable row level security;

alter table public.app_state enable row level security;

alter table public.audit_log enable row level security;

alter table public.backups enable row level security;

alter table public.booking_config enable row level security;

alter table public.booking_requests enable row level security;

alter table public.business_notes enable row level security;

alter table public.businesses enable row level security;

alter table public.cari_pay enable row level security;

alter table public.cari_recon enable row level security;

alter table public.feature_flags enable row level security;

alter table public.invite_attempts enable row level security;

alter table public.invites enable row level security;

alter table public.kais_memory enable row level security;

alter table public.mail_log enable row level security;

alter table public.market_events enable row level security;

alter table public.market_needs enable row level security;

alter table public.market_offers enable row level security;

alter table public.market_orders enable row level security;

alter table public.market_ratings enable row level security;

alter table public.members enable row level security;

alter table public.onboard_config enable row level security;

alter table public.onboard_docs enable row level security;

alter table public.onboard_sub enable row level security;

alter table public.orders enable row level security;

alter table public.pos_tokens enable row level security;

alter table public.price_hist enable row level security;

alter table public.producer_waitlist enable row level security;

alter table public.push_log enable row level security;

alter table public.push_subs enable row level security;

alter table public.quotes enable row level security;

alter table public.rfqs enable row level security;

alter table public.sales_inbox enable row level security;

alter table public.supplier_books enable row level security;

alter table public.supplier_cprice enable row level security;

alter table public.supplier_customer enable row level security;

alter table public.supplier_dnote enable row level security;

alter table public.supplier_private enable row level security;

alter table public.supplier_products enable row level security;

alter table public.supplier_profiles enable row level security;

alter table public.supplier_push enable row level security;

alter table public.supplier_push_log enable row level security;

alter table public.supplier_ratings enable row level security;

alter table public.supplier_staff enable row level security;

alter table public.suppliers enable row level security;

alter table public.support_tickets enable row level security;

create policy af_ins on public.account_feedback as PERMISSIVE for INSERT to authenticated with check (true);

create policy ann_read on public.admin_announcements as PERMISSIVE for SELECT to authenticated using ((active AND ((expires_at IS NULL) OR (expires_at > now())) AND ((target IS NULL) OR (EXISTS ( SELECT 1
   FROM members m
  WHERE ((m.user_id = auth.uid()) AND (m.business_id = ANY (admin_announcements.target))))))));

create policy aiq_owner_read on public.ai_quota as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = ai_quota.business_id) AND (b.owner_id = auth.uid())))));

create policy app_errors_ins on public.app_errors as PERMISSIVE for INSERT to authenticated with check ((user_id = auth.uid()));

create policy app_events_ins on public.app_events as PERMISSIVE for INSERT to authenticated with check ((user_id = auth.uid()));

create policy as_del on public.app_state as PERMISSIVE for DELETE to public using (has_role(business_id, ARRAY['patron'::text]));

create policy as_ins on public.app_state as PERMISSIVE for INSERT to public with check (scope_ok(business_id, scope, true));

create policy as_sel on public.app_state as PERMISSIVE for SELECT to public using (scope_ok(business_id, scope, false));

create policy as_upd on public.app_state as PERMISSIVE for UPDATE to public using (scope_ok(business_id, scope, true)) with check (scope_ok(business_id, scope, true));

create policy al_ins on public.audit_log as PERMISSIVE for INSERT to public with check (((user_id = auth.uid()) AND is_member(business_id)));

create policy al_sel on public.audit_log as PERMISSIVE for SELECT to public using (has_role(business_id, ARRAY['patron'::text]));

create policy bk_patron on public.backups as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text])) with check (has_role(business_id, ARRAY['patron'::text]));

create policy bkc_patron on public.booking_config as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text])) with check (has_role(business_id, ARRAY['patron'::text]));

create policy bkr_del on public.booking_requests as PERMISSIVE for DELETE to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy bkr_read on public.booking_requests as PERMISSIVE for SELECT to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy bkr_upd on public.booking_requests as PERMISSIVE for UPDATE to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) with check (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy biz_member_read on public.businesses as PERMISSIVE for SELECT to public using (is_member(id));

create policy biz_owner on public.businesses as PERMISSIVE for ALL to public using ((owner_id = auth.uid())) with check ((owner_id = auth.uid()));

create policy biz_sup_read on public.businesses as PERMISSIVE for SELECT to public using (is_supplier_of(id));

create policy cpay_biz on public.cari_pay as PERMISSIVE for ALL to public using ((has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = cari_pay.business_id) AND (b.owner_id = auth.uid())))))) with check (((by_side = 'isletme'::text) AND (has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = cari_pay.business_id) AND (b.owner_id = auth.uid())))))));

create policy cpay_sup on public.cari_pay as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = cari_pay.supplier_id) AND (s.user_id = auth.uid()))))) with check (((by_side = 'toptanci'::text) AND (EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = cari_pay.supplier_id) AND (s.user_id = auth.uid()))))));

create policy crec_biz on public.cari_recon as PERMISSIVE for ALL to public using ((has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = cari_recon.business_id) AND (b.owner_id = auth.uid())))))) with check ((has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = cari_recon.business_id) AND (b.owner_id = auth.uid()))))));

create policy crec_sup on public.cari_recon as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = cari_recon.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = cari_recon.supplier_id) AND (s.user_id = auth.uid())))));

create policy inv_patron on public.invites as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text])) with check (has_role(business_id, ARRAY['patron'::text]));

create policy km_del on public.kais_memory as PERMISSIVE for DELETE to public using ((((user_id IS NULL) AND has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) OR ((user_id = auth.uid()) AND is_member(business_id))));

create policy km_ins on public.kais_memory as PERMISSIVE for INSERT to public with check (((created_by = auth.uid()) AND (((user_id IS NULL) AND has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) OR ((user_id = auth.uid()) AND is_member(business_id)))));

create policy km_sel on public.kais_memory as PERMISSIVE for SELECT to public using ((((user_id IS NULL) AND has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text])) OR ((user_id = auth.uid()) AND is_member(business_id))));

create policy mn_all on public.market_needs as PERMISSIVE for ALL to public using (market_can(business_id)) with check (market_can(business_id));

create policy mo_own on public.market_offers as PERMISSIVE for SELECT to public using ((user_id = auth.uid()));

create policy mem_del on public.members as PERMISSIVE for DELETE to public using ((has_role(business_id, ARRAY['patron'::text]) AND (user_id <> auth.uid())));

create policy mem_read on public.members as PERMISSIVE for SELECT to public using (is_member(business_id));

create policy oc_ins on public.onboard_config as PERMISSIVE for INSERT to public with check (has_role(business_id, ARRAY['patron'::text, 'muhasebeci'::text]));

create policy oc_sel on public.onboard_config as PERMISSIVE for SELECT to public using (is_member(business_id));

create policy oc_upd on public.onboard_config as PERMISSIVE for UPDATE to public using (has_role(business_id, ARRAY['patron'::text, 'muhasebeci'::text])) with check (has_role(business_id, ARRAY['patron'::text, 'muhasebeci'::text]));

create policy od_del on public.onboard_docs as PERMISSIVE for DELETE to public using ((user_id = auth.uid()));

create policy od_ins on public.onboard_docs as PERMISSIVE for INSERT to public with check (((user_id = auth.uid()) AND is_member(business_id)));

create policy od_sel on public.onboard_docs as PERMISSIVE for SELECT to public using (((user_id = auth.uid()) OR has_role(business_id, ARRAY['patron'::text, 'muhasebeci'::text])));

create policy od_upd on public.onboard_docs as PERMISSIVE for UPDATE to public using ((user_id = auth.uid())) with check (((user_id = auth.uid()) AND is_member(business_id)));

create policy os_ins on public.onboard_sub as PERMISSIVE for INSERT to public with check (((user_id = auth.uid()) AND is_member(business_id)));

create policy os_sel on public.onboard_sub as PERMISSIVE for SELECT to public using (((user_id = auth.uid()) OR has_role(business_id, ARRAY['patron'::text, 'muhasebeci'::text])));

create policy os_upd on public.onboard_sub as PERMISSIVE for UPDATE to public using ((user_id = auth.uid())) with check (((user_id = auth.uid()) AND is_member(business_id)));

create policy ord_biz_recv on public.orders as PERMISSIVE for UPDATE to public using ((has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = orders.business_id) AND (b.owner_id = auth.uid())))))) with check ((has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = orders.business_id) AND (b.owner_id = auth.uid()))))));

create policy ord_owner on public.orders as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = orders.business_id) AND (b.owner_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = orders.business_id) AND (b.owner_id = auth.uid())))));

create policy ord_staff on public.orders as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) with check (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy ord_sup_confirm on public.orders as PERMISSIVE for UPDATE to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = orders.supplier_id) AND (s.user_id = auth.uid()))))) with check ((status = ANY (ARRAY['gonderildi'::text, 'onaylandi'::text, 'teslim'::text])));

create policy ord_sup_draft on public.orders as PERMISSIVE for INSERT to public with check (((status = 'taslak'::text) AND (EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = orders.supplier_id) AND (s.user_id = auth.uid()) AND (s.business_id = orders.business_id))))));

create policy ord_sup_read on public.orders as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = orders.supplier_id) AND (s.user_id = auth.uid())))));

create policy pt_all on public.pos_tokens as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) with check (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy ph_biz on public.price_hist as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE (((s.id = price_hist.supplier_id) OR (s.src_id = price_hist.supplier_id)) AND (is_member(s.business_id) OR (EXISTS ( SELECT 1
           FROM businesses b
          WHERE ((b.id = s.business_id) AND (b.owner_id = auth.uid())))))))));

create policy ph_self on public.price_hist as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = price_hist.supplier_id) AND (s.user_id = auth.uid())))));

create policy producer_waitlist_insert on public.producer_waitlist as PERMISSIVE for INSERT to anon, authenticated with check (true);

create policy push_subs_own on public.push_subs as PERMISSIVE for ALL to public using ((user_id = auth.uid())) with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM members m
  WHERE ((m.business_id = push_subs.business_id) AND (m.user_id = auth.uid()) AND (m.app_uid = push_subs.app_uid))))));

create policy quo_owner on public.quotes as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM (rfqs r
     JOIN businesses b ON ((b.id = r.business_id)))
  WHERE ((r.id = quotes.rfq_id) AND (b.owner_id = auth.uid())))));

create policy quo_staff on public.quotes as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM rfqs r
  WHERE ((r.id = quotes.rfq_id) AND has_role(r.business_id, ARRAY['patron'::text, 'mudur'::text])))));

create policy quo_sup on public.quotes as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = quotes.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM (suppliers s
     JOIN rfqs r ON ((r.business_id = s.business_id)))
  WHERE ((s.id = quotes.supplier_id) AND (s.user_id = auth.uid()) AND (r.id = quotes.rfq_id)))));

create policy rfq_owner on public.rfqs as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = rfqs.business_id) AND (b.owner_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = rfqs.business_id) AND (b.owner_id = auth.uid())))));

create policy rfq_staff on public.rfqs as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) with check (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy rfq_sup_read on public.rfqs as PERMISSIVE for SELECT to public using (((status = 'acik'::text) AND (EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.business_id = rfqs.business_id) AND (s.user_id = auth.uid()))))));

create policy si_all on public.sales_inbox as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) with check (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy sbk_self on public.supplier_books as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_books.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_books.supplier_id) AND (s.user_id = auth.uid())))));

create policy scp_biz on public.supplier_cprice as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_cprice.supplier_id) AND (has_role(s.business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
           FROM businesses b
          WHERE ((b.id = s.business_id) AND (b.owner_id = auth.uid())))))))));

create policy scp_owner on public.supplier_cprice as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_cprice.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_cprice.supplier_id) AND (s.user_id = auth.uid())))));

create policy sc_biz on public.supplier_customer as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_customer.supplier_id) AND (has_role(s.business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
           FROM businesses b
          WHERE ((b.id = s.business_id) AND (b.owner_id = auth.uid())))))))));

create policy sc_owner on public.supplier_customer as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_customer.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_customer.supplier_id) AND (s.user_id = auth.uid())))));

create policy sdn_owner on public.supplier_dnote as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_dnote.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_dnote.supplier_id) AND (s.user_id = auth.uid())))));

create policy spv_self on public.supplier_private as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_private.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_private.supplier_id) AND (s.user_id = auth.uid())))));

create policy spr_biz on public.supplier_products as PERMISSIVE for SELECT to public using ((active AND (EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_products.supplier_id) AND (is_member(s.business_id) OR (EXISTS ( SELECT 1
           FROM businesses b
          WHERE ((b.id = s.business_id) AND (b.owner_id = auth.uid()))))))))));

create policy spr_biz2 on public.supplier_products as PERMISSIVE for SELECT to public using ((active AND (EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.src_id = supplier_products.supplier_id) AND (is_member(s.business_id) OR (EXISTS ( SELECT 1
           FROM businesses b
          WHERE ((b.id = s.business_id) AND (b.owner_id = auth.uid()))))))))));

create policy spr_self on public.supplier_products as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_products.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_products.supplier_id) AND (s.user_id = auth.uid())))));

create policy spf_biz on public.supplier_profiles as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_profiles.supplier_id) AND (is_member(s.business_id) OR (EXISTS ( SELECT 1
           FROM businesses b
          WHERE ((b.id = s.business_id) AND (b.owner_id = auth.uid())))))))));

create policy spf_biz2 on public.supplier_profiles as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.src_id = supplier_profiles.supplier_id) AND (is_member(s.business_id) OR (EXISTS ( SELECT 1
           FROM businesses b
          WHERE ((b.id = s.business_id) AND (b.owner_id = auth.uid())))))))));

create policy spf_self on public.supplier_profiles as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_profiles.supplier_id) AND (s.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_profiles.supplier_id) AND (s.user_id = auth.uid())))));

create policy spush_own on public.supplier_push as PERMISSIVE for ALL to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

create policy rt_biz on public.supplier_ratings as PERMISSIVE for ALL to public using ((has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = supplier_ratings.business_id) AND (b.owner_id = auth.uid())))))) with check ((has_role(business_id, ARRAY['patron'::text, 'mudur'::text, 'muhasebeci'::text]) OR (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = supplier_ratings.business_id) AND (b.owner_id = auth.uid()))))));

create policy rt_sup on public.supplier_ratings as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = supplier_ratings.supplier_id) AND (s.user_id = auth.uid())))));

create policy sst_owner on public.supplier_staff as PERMISSIVE for ALL to public using ((owner_user = auth.uid())) with check ((owner_user = auth.uid()));

create policy sup_owner on public.suppliers as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = suppliers.business_id) AND (b.owner_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = suppliers.business_id) AND (b.owner_id = auth.uid())))));

create policy sup_self on public.suppliers as PERMISSIVE for SELECT to public using ((user_id = auth.uid()));

create policy sup_staff on public.suppliers as PERMISSIVE for ALL to public using (has_role(business_id, ARRAY['patron'::text, 'mudur'::text])) with check (has_role(business_id, ARRAY['patron'::text, 'mudur'::text]));

create policy st_ins on public.support_tickets as PERMISSIVE for INSERT to authenticated with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM members m
  WHERE ((m.user_id = auth.uid()) AND (m.business_id = support_tickets.business_id))))));

create policy st_sel on public.support_tickets as PERMISSIVE for SELECT to authenticated using ((user_id = auth.uid()));

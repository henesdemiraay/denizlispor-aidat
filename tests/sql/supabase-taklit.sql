-- Sınamalar için Supabase'in asgari taklidi + mevcut şemanın göçlerin dayandığı kısmı.
-- Gerçek taban şema değildir; yalnızca göçlerin bağımlılıklarını karşılar.

create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (id uuid primary key);

-- Oturum: set_config('istek.kullanici', '<uuid>') ve set_config('istek.rol', 'yonetici')
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('istek.kullanici', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create schema storage;
create table storage.buckets (
  id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text
);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant select, insert, delete on storage.objects to authenticated;

grant usage on schema public to anon, authenticated;

create function public.spor_yonetici_mi() returns boolean language sql stable as $$
  select coalesce(current_setting('istek.rol', true), '') in ('yonetici', 'baskan')
$$;
create function public.spor_personel_mi() returns boolean language sql stable as $$
  select coalesce(current_setting('istek.rol', true), '') in ('yonetici', 'baskan', 'antrenor', 'yardimci_antrenor')
$$;
grant execute on function public.spor_yonetici_mi() to authenticated;
grant execute on function public.spor_personel_mi() to authenticated;

create table public.spor_sporcular (
  id uuid primary key default gen_random_uuid(),
  ad text, soyad text, yas_grubu text, forma_no int
);
create table public.spor_maclar (
  id uuid primary key default gen_random_uuid(),
  tarih date not null, rakip text not null default 'Rakip', yas_grubu text,
  yer text default 'ic', tur text default 'lig', skor_biz int, skor_rakip int
);
create table public.spor_mac_katilim (
  id uuid primary key default gen_random_uuid(),
  mac_id uuid not null references public.spor_maclar (id) on delete cascade,
  sporcu_id uuid not null references public.spor_sporcular (id) on delete cascade,
  dakika int not null default 0, ilk_onbir boolean not null default false,
  gol int not null default 0, asist int not null default 0,
  unique (mac_id, sporcu_id)
);
create table public.spor_antrenmanlar (
  id uuid primary key default gen_random_uuid(),
  tarih date not null, sure_dk int, yas_grubu text, baslik text default 'Antrenman', tur text default 'teknik'
);
create table public.spor_yoklama (
  id uuid primary key default gen_random_uuid(),
  antrenman_id uuid not null references public.spor_antrenmanlar (id) on delete cascade,
  sporcu_id uuid not null references public.spor_sporcular (id) on delete cascade,
  durum text not null
);

-- Personel uygulamada bu tablolara erişebiliyor; sınamada RLS'siz tam yetki.
grant select, insert, update, delete on
  public.spor_sporcular, public.spor_maclar, public.spor_mac_katilim,
  public.spor_antrenmanlar, public.spor_yoklama
to authenticated;

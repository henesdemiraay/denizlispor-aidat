-- ============================================================================
-- 00000000 · TABAN ŞEMA (Denizlispor canlı veritabanının 29 Ekim 2026 yapısı)
-- Yeni kulüp kurulumunda BOŞ Supabase projesine ilk olarak bu dosya çalıştırılır,
-- ardından supabase/migrations/ içindeki diğer göçler tarih sırasıyla.
-- Veri içermez; yalnızca tablolar, fonksiyonlar, tetikleyiciler, erişim kuralları,
-- dosya kovaları. Testler: tests/sql/ (PGlite).
-- ============================================================================
-- Denizlispor Altyapı uygulaması — yeni Supabase projesi için şema
-- Kaynak: ferhatlar-crm (uoesccavfuthvwuchelj), spor_ ön ekli nesneler. Üretim: 29 Ekim 2026.
-- Yeni projede SQL Editor'da TEK SEFERDE çalıştırın (boş proje). Okul verisine hiçbir bağımlılığı yoktur.
set check_function_bodies = off;


-- ===== Diziler =====

create sequence if not exists public.spor_kayit_gecmisi_id_seq;

-- ===== Tablolar =====

create table if not exists public.spor_aidatlar (
  id uuid default gen_random_uuid() not null,
  sporcu_id uuid not null,
  donem date not null,
  tutar numeric(10,2) not null,
  son_odeme_tarihi date,
  durum text default 'bekliyor'::text not null,
  aciklama text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_antrenmanlar (
  id uuid default gen_random_uuid() not null,
  tarih date not null,
  baslangic time without time zone,
  sure_dk integer,
  yas_grubu text,
  yer text,
  tur text default 'saha'::text not null,
  baslik text not null,
  icerik text,
  hedef text,
  ekleyen_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.spor_ayarlar (
  anahtar text not null,
  deger text,
  guncellendi timestamp with time zone default now() not null
);

create table if not exists public.spor_belgeler (
  id uuid default gen_random_uuid() not null,
  sporcu_id uuid not null,
  tur text default 'diger'::text not null,
  dosya_yolu text not null,
  dosya_adi text,
  aciklama text,
  yukleyen_id uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_degerlendirmeler (
  id uuid default gen_random_uuid() not null,
  sporcu_id uuid not null,
  donem date not null,
  teknik smallint,
  fizik smallint,
  taktik smallint,
  disiplin smallint,
  takim_oyunu smallint,
  yorum text,
  yazan_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.spor_kasa_hareketleri (
  id uuid default gen_random_uuid() not null,
  tarih date default CURRENT_DATE not null,
  tur text not null,
  tutar numeric(12,2) not null,
  kategori text,
  aciklama text not null,
  belge_yolu text,
  ekleyen_id uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_kayit_gecmisi (
  id bigint default nextval('spor_kayit_gecmisi_id_seq'::regclass) not null,
  tablo text not null,
  kayit_id uuid,
  islem text not null,
  eski jsonb not null,
  yapan_id uuid,
  zaman timestamp with time zone default now() not null
);

create table if not exists public.spor_mac_katilim (
  id uuid default gen_random_uuid() not null,
  mac_id uuid not null,
  sporcu_id uuid not null,
  dakika integer default 0 not null,
  ilk_onbir boolean default false not null,
  gol integer default 0 not null,
  asist integer default 0 not null,
  kart text default 'yok'::text not null,
  notlar text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_maclar (
  id uuid default gen_random_uuid() not null,
  tarih date not null,
  saat time without time zone,
  rakip text not null,
  yas_grubu text,
  yer text default 'ic'::text not null,
  tur text default 'lig'::text not null,
  skor_biz integer,
  skor_rakip integer,
  aciklama text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_odemeler (
  id uuid default gen_random_uuid() not null,
  aidat_id uuid,
  sporcu_id uuid not null,
  tutar numeric(10,2) not null,
  odeme_tarihi date default CURRENT_DATE not null,
  yontem text default 'havale'::text not null,
  dekont_yolu text,
  durum text default 'beklemede'::text not null,
  aciklama text,
  bildiren_id uuid,
  onaylayan_id uuid,
  onay_tarihi timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_olcumler (
  id uuid default gen_random_uuid() not null,
  sporcu_id uuid not null,
  tarih date default CURRENT_DATE not null,
  boy_cm numeric(5,1),
  kilo_kg numeric(5,1),
  sprint_20m numeric(5,2),
  dikey_sicrama_cm numeric(5,1),
  dayaniklilik_dk numeric(5,2),
  notlar text,
  yazan_id uuid,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_profiller (
  id uuid not null,
  eposta text,
  ad_soyad text,
  telefon text,
  rol text default 'veli'::text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_rol_talepleri (
  id uuid default gen_random_uuid() not null,
  kullanici_id uuid not null,
  talep_rol text not null,
  aciklama text,
  durum text default 'beklemede'::text not null,
  karar_veren uuid,
  karar_tarihi timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.spor_sporcu_notlari (
  id uuid default gen_random_uuid() not null,
  sporcu_id uuid not null,
  tarih date default CURRENT_DATE not null,
  icerik text not null,
  gorunurluk text default 'veli'::text not null,
  yazan_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.spor_sporcular (
  id uuid default gen_random_uuid() not null,
  ad text not null,
  soyad text not null,
  dogum_tarihi date,
  yas_grubu text,
  mevki text,
  forma_no integer,
  veli_ad_soyad text,
  veli_telefon text,
  veli_eposta text,
  veli_id uuid,
  aylik_aidat numeric(10,2) default 0 not null,
  durum text default 'aktif'::text not null,
  kayit_tarihi date default CURRENT_DATE not null,
  notlar text,
  created_at timestamp with time zone default now() not null,
  foto_yolu text,
  acil_kisi text,
  acil_telefon text,
  okul text,
  ayak text,
  ekleyen_id uuid,
  sporcu_eposta text,
  sporcu_kullanici_id uuid
);

create table if not exists public.spor_yoklama (
  id uuid default gen_random_uuid() not null,
  antrenman_id uuid not null,
  sporcu_id uuid not null,
  durum text default 'geldi'::text not null,
  notlar text,
  created_at timestamp with time zone default now() not null
);

-- ===== Kısıtlar (birincil, tekil, kontrol, yabancı anahtar) =====

alter table public.spor_aidatlar add constraint spor_aidatlar_pkey PRIMARY KEY (id);
alter table public.spor_antrenmanlar add constraint spor_antrenmanlar_pkey PRIMARY KEY (id);
alter table public.spor_ayarlar add constraint spor_ayarlar_pkey PRIMARY KEY (anahtar);
alter table public.spor_belgeler add constraint spor_belgeler_pkey PRIMARY KEY (id);
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_pkey PRIMARY KEY (id);
alter table public.spor_kasa_hareketleri add constraint spor_kasa_hareketleri_pkey PRIMARY KEY (id);
alter table public.spor_kayit_gecmisi add constraint spor_kayit_gecmisi_pkey PRIMARY KEY (id);
alter table public.spor_mac_katilim add constraint spor_mac_katilim_pkey PRIMARY KEY (id);
alter table public.spor_maclar add constraint spor_maclar_pkey PRIMARY KEY (id);
alter table public.spor_odemeler add constraint spor_odemeler_pkey PRIMARY KEY (id);
alter table public.spor_olcumler add constraint spor_olcumler_pkey PRIMARY KEY (id);
alter table public.spor_profiller add constraint spor_profiller_pkey PRIMARY KEY (id);
alter table public.spor_rol_talepleri add constraint spor_rol_talepleri_pkey PRIMARY KEY (id);
alter table public.spor_sporcu_notlari add constraint spor_sporcu_notlari_pkey PRIMARY KEY (id);
alter table public.spor_sporcular add constraint spor_sporcular_pkey PRIMARY KEY (id);
alter table public.spor_yoklama add constraint spor_yoklama_pkey PRIMARY KEY (id);
alter table public.spor_aidatlar add constraint spor_aidatlar_sporcu_id_donem_key UNIQUE (sporcu_id, donem);
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_sporcu_id_donem_key UNIQUE (sporcu_id, donem);
alter table public.spor_mac_katilim add constraint spor_mac_katilim_mac_id_sporcu_id_key UNIQUE (mac_id, sporcu_id);
alter table public.spor_olcumler add constraint spor_olcumler_sporcu_id_tarih_key UNIQUE (sporcu_id, tarih);
alter table public.spor_yoklama add constraint spor_yoklama_antrenman_id_sporcu_id_key UNIQUE (antrenman_id, sporcu_id);
alter table public.spor_aidatlar add constraint spor_aidatlar_durum_check CHECK ((durum = ANY (ARRAY['bekliyor'::text, 'odendi'::text, 'muaf'::text])));
alter table public.spor_antrenmanlar add constraint spor_antrenmanlar_sure_dk_check CHECK (((sure_dk IS NULL) OR ((sure_dk > 0) AND (sure_dk <= 400))));
alter table public.spor_antrenmanlar add constraint spor_antrenmanlar_tur_check CHECK ((tur = ANY (ARRAY['saha'::text, 'kondisyon'::text, 'taktik'::text, 'kuvvet'::text, 'mac_provasi'::text, 'tesis_disi'::text, 'diger'::text])));
alter table public.spor_belgeler add constraint spor_belgeler_tur_check CHECK ((tur = ANY (ARRAY['lisans'::text, 'saglik'::text, 'kimlik'::text, 'veli_izin'::text, 'diger'::text])));
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_disiplin_check CHECK (((disiplin >= 1) AND (disiplin <= 10)));
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_fizik_check CHECK (((fizik >= 1) AND (fizik <= 10)));
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_takim_oyunu_check CHECK (((takim_oyunu >= 1) AND (takim_oyunu <= 10)));
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_taktik_check CHECK (((taktik >= 1) AND (taktik <= 10)));
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_teknik_check CHECK (((teknik >= 1) AND (teknik <= 10)));
alter table public.spor_kasa_hareketleri add constraint spor_kasa_hareketleri_tur_check CHECK ((tur = ANY (ARRAY['gelir'::text, 'gider'::text, 'aktarim'::text])));
alter table public.spor_kasa_hareketleri add constraint spor_kasa_hareketleri_tutar_check CHECK ((tutar > (0)::numeric));
alter table public.spor_mac_katilim add constraint spor_mac_katilim_asist_check CHECK ((asist >= 0));
alter table public.spor_mac_katilim add constraint spor_mac_katilim_dakika_check CHECK (((dakika >= 0) AND (dakika <= 130)));
alter table public.spor_mac_katilim add constraint spor_mac_katilim_gol_check CHECK ((gol >= 0));
alter table public.spor_mac_katilim add constraint spor_mac_katilim_kart_check CHECK ((kart = ANY (ARRAY['yok'::text, 'sari'::text, 'cift_sari'::text, 'kirmizi'::text])));
alter table public.spor_maclar add constraint spor_maclar_tur_check CHECK ((tur = ANY (ARRAY['lig'::text, 'kupa'::text, 'hazirlik'::text, 'turnuva'::text])));
alter table public.spor_maclar add constraint spor_maclar_yer_check CHECK ((yer = ANY (ARRAY['ic'::text, 'dis'::text, 'notr'::text])));
alter table public.spor_odemeler add constraint spor_odemeler_durum_check CHECK ((durum = ANY (ARRAY['beklemede'::text, 'onaylandi'::text, 'reddedildi'::text])));
alter table public.spor_odemeler add constraint spor_odemeler_tutar_check CHECK ((tutar > (0)::numeric));
alter table public.spor_odemeler add constraint spor_odemeler_yontem_check CHECK ((yontem = ANY (ARRAY['havale'::text, 'nakit'::text, 'kart'::text, 'diger'::text])));
alter table public.spor_profiller add constraint spor_profiller_rol_check CHECK ((rol = ANY (ARRAY['veli'::text, 'sporcu'::text, 'antrenor'::text, 'yardimci_antrenor'::text, 'baskan'::text, 'yonetici'::text])));
alter table public.spor_rol_talepleri add constraint spor_rol_talepleri_durum_check CHECK ((durum = ANY (ARRAY['beklemede'::text, 'onaylandi'::text, 'reddedildi'::text])));
alter table public.spor_rol_talepleri add constraint spor_rol_talepleri_talep_rol_check CHECK ((talep_rol = ANY (ARRAY['antrenor'::text, 'yardimci_antrenor'::text, 'baskan'::text])));
alter table public.spor_sporcu_notlari add constraint spor_sporcu_notlari_gorunurluk_check CHECK ((gorunurluk = ANY (ARRAY['veli'::text, 'kulup'::text])));
alter table public.spor_sporcular add constraint spor_sporcular_durum_check CHECK ((durum = ANY (ARRAY['aktif'::text, 'pasif'::text, 'onay_bekliyor'::text])));
alter table public.spor_yoklama add constraint spor_yoklama_durum_check CHECK ((durum = ANY (ARRAY['geldi'::text, 'gelmedi'::text, 'izinli'::text, 'gec'::text])));
alter table public.spor_aidatlar add constraint spor_aidatlar_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;
alter table public.spor_antrenmanlar add constraint spor_antrenmanlar_ekleyen_id_fkey FOREIGN KEY (ekleyen_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_belgeler add constraint spor_belgeler_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;
alter table public.spor_belgeler add constraint spor_belgeler_yukleyen_id_fkey FOREIGN KEY (yukleyen_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;
alter table public.spor_degerlendirmeler add constraint spor_degerlendirmeler_yazan_id_fkey FOREIGN KEY (yazan_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_kasa_hareketleri add constraint spor_kasa_hareketleri_ekleyen_id_fkey FOREIGN KEY (ekleyen_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_mac_katilim add constraint spor_mac_katilim_mac_id_fkey FOREIGN KEY (mac_id) REFERENCES spor_maclar(id) ON DELETE CASCADE;
alter table public.spor_mac_katilim add constraint spor_mac_katilim_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;
alter table public.spor_odemeler add constraint spor_odemeler_aidat_id_fkey FOREIGN KEY (aidat_id) REFERENCES spor_aidatlar(id) ON DELETE SET NULL;
alter table public.spor_odemeler add constraint spor_odemeler_bildiren_id_fkey FOREIGN KEY (bildiren_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_odemeler add constraint spor_odemeler_onaylayan_id_fkey FOREIGN KEY (onaylayan_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_odemeler add constraint spor_odemeler_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;
alter table public.spor_olcumler add constraint spor_olcumler_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;
alter table public.spor_olcumler add constraint spor_olcumler_yazan_id_fkey FOREIGN KEY (yazan_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_profiller add constraint spor_profiller_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.spor_rol_talepleri add constraint spor_rol_talepleri_karar_veren_fkey FOREIGN KEY (karar_veren) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_rol_talepleri add constraint spor_rol_talepleri_kullanici_id_fkey FOREIGN KEY (kullanici_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.spor_sporcu_notlari add constraint spor_sporcu_notlari_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;
alter table public.spor_sporcu_notlari add constraint spor_sporcu_notlari_yazan_id_fkey FOREIGN KEY (yazan_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_sporcular add constraint spor_sporcular_ekleyen_id_fkey FOREIGN KEY (ekleyen_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_sporcular add constraint spor_sporcular_sporcu_kullanici_id_fkey FOREIGN KEY (sporcu_kullanici_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_sporcular add constraint spor_sporcular_veli_id_fkey FOREIGN KEY (veli_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.spor_yoklama add constraint spor_yoklama_antrenman_id_fkey FOREIGN KEY (antrenman_id) REFERENCES spor_antrenmanlar(id) ON DELETE CASCADE;
alter table public.spor_yoklama add constraint spor_yoklama_sporcu_id_fkey FOREIGN KEY (sporcu_id) REFERENCES spor_sporcular(id) ON DELETE CASCADE;

-- ===== İndeksler =====

CREATE INDEX spor_aidatlar_sporcu_idx ON public.spor_aidatlar USING btree (sporcu_id);
CREATE INDEX spor_kayit_gecmisi_idx ON public.spor_kayit_gecmisi USING btree (tablo, kayit_id, zaman DESC);
CREATE INDEX spor_sporcular_veli_eposta_idx ON public.spor_sporcular USING btree (lower(veli_eposta));
CREATE INDEX spor_kasa_tarih_idx ON public.spor_kasa_hareketleri USING btree (tarih DESC);
CREATE INDEX spor_sporcular_sporcu_eposta_idx ON public.spor_sporcular USING btree (lower(sporcu_eposta));
CREATE INDEX spor_odemeler_sporcu_idx ON public.spor_odemeler USING btree (sporcu_id);
CREATE INDEX spor_notlar_sporcu_idx ON public.spor_sporcu_notlari USING btree (sporcu_id);
CREATE INDEX spor_mac_katilim_sporcu_idx ON public.spor_mac_katilim USING btree (sporcu_id);
CREATE INDEX spor_sporcular_veli_id_idx ON public.spor_sporcular USING btree (veli_id);
CREATE INDEX spor_antrenmanlar_tarih_idx ON public.spor_antrenmanlar USING btree (tarih DESC);
CREATE INDEX spor_sporcular_sporcu_kullanici_idx ON public.spor_sporcular USING btree (sporcu_kullanici_id);
CREATE INDEX spor_maclar_tarih_idx ON public.spor_maclar USING btree (tarih DESC);
CREATE INDEX spor_rol_talepleri_durum_idx ON public.spor_rol_talepleri USING btree (durum);
CREATE INDEX spor_yoklama_sporcu_idx ON public.spor_yoklama USING btree (sporcu_id);
CREATE INDEX spor_odemeler_aidat_idx ON public.spor_odemeler USING btree (aidat_id);
CREATE INDEX spor_odemeler_durum_idx ON public.spor_odemeler USING btree (durum);
CREATE INDEX spor_belgeler_sporcu_idx ON public.spor_belgeler USING btree (sporcu_id);

-- ===== Satır düzeyi güvenlik =====

alter table public.spor_ayarlar enable row level security;
alter table public.spor_belgeler enable row level security;
alter table public.spor_maclar enable row level security;
alter table public.spor_mac_katilim enable row level security;
alter table public.spor_kasa_hareketleri enable row level security;
alter table public.spor_sporcu_notlari enable row level security;
alter table public.spor_degerlendirmeler enable row level security;
alter table public.spor_olcumler enable row level security;
alter table public.spor_antrenmanlar enable row level security;
alter table public.spor_yoklama enable row level security;
alter table public.spor_kayit_gecmisi enable row level security;
alter table public.spor_rol_talepleri enable row level security;
alter table public.spor_odemeler enable row level security;
alter table public.spor_profiller enable row level security;
alter table public.spor_sporcular enable row level security;
alter table public.spor_aidatlar enable row level security;

-- ===== Fonksiyonlar =====

CREATE OR REPLACE FUNCTION public.spor_aidat_akisi(p_donem date)
 RETURNS TABLE(aidat_id uuid, ad text, soyad text, yas_grubu text, tutar numeric, durum text, son_odeme_tarihi date, benim boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.id, public.spor_maskele(s.ad,'ad'), public.spor_maskele(s.soyad,'soyad'),
         s.yas_grubu, a.tutar, a.durum, a.son_odeme_tarihi, (s.veli_id = auth.uid())
    from public.spor_aidatlar a
    join public.spor_sporcular s on s.id = a.sporcu_id
   where exists (select 1 from public.spor_profiller p
                  where p.id = auth.uid() and p.rol <> 'sporcu')
     and a.donem = date_trunc('month', p_donem)::date
   order by s.yas_grubu nulls last, s.ad, s.soyad;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_aidat_donemleri()
 RETURNS TABLE(donem date, sporcu_sayisi integer, toplam numeric, odenen numeric, bekleyen numeric, odeyen_sayisi integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.donem, count(*)::integer, coalesce(sum(a.tutar),0),
         coalesce(sum(a.tutar) filter (where a.durum='odendi'),0),
         coalesce(sum(a.tutar) filter (where a.durum='bekliyor'),0),
         count(*) filter (where a.durum='odendi')::integer
    from public.spor_aidatlar a
   where exists (select 1 from public.spor_profiller p
                  where p.id = auth.uid() and p.rol <> 'sporcu')
   group by a.donem
   order by a.donem desc;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_antrenor_mi()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.spor_profiller
                  where id = auth.uid() and rol in ('antrenor','yardimci_antrenor'));
$function$
;

CREATE OR REPLACE FUNCTION public.spor_belge_erisimi(p_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.spor_sporcu_gorebilir_mi(public.spor_dekont_sporcu(p_name));
$function$
;

CREATE OR REPLACE FUNCTION public.spor_dekont_sporcu(p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare v text := split_part(p_name, '/', 1);
begin
  if v ~ '^[0-9a-fA-F-]{36}$' then
    return v::uuid;
  end if;
  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_donem_olustur(p_donem date, p_son_odeme date DEFAULT NULL::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ay date := date_trunc('month', p_donem)::date;
  v_adet integer;
begin
  if not public.spor_yonetici_mi() then
    raise exception 'Bu işlem için yönetici yetkisi gerekir.';
  end if;

  insert into public.spor_aidatlar (sporcu_id, donem, tutar, son_odeme_tarihi)
  select s.id, v_ay, s.aylik_aidat, coalesce(p_son_odeme, (v_ay + interval '9 days')::date)
    from public.spor_sporcular s
   where s.durum = 'aktif' and s.aylik_aidat > 0
  on conflict (sporcu_id, donem) do nothing;

  get diagnostics v_adet = row_count;
  return v_adet;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_eksik_tahakkuk(p_donem date)
 RETURNS TABLE(sporcu_id uuid, ad text, soyad text, yas_grubu text, aylik_aidat numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.id, s.ad, s.soyad, s.yas_grubu, s.aylik_aidat
    from public.spor_sporcular s
   where public.spor_yonetici_mi()
     and s.durum = 'aktif' and s.aylik_aidat > 0
     and not exists (
       select 1 from public.spor_aidatlar a
        where a.sporcu_id = s.id and a.donem = date_trunc('month', p_donem)::date
     )
   order by s.ad, s.soyad;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_gecmis_kaydet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.spor_kayit_gecmisi (tablo, kayit_id, islem, eski, yapan_id)
  values (tg_table_name, old.id, tg_op, to_jsonb(old), auth.uid());
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_rol    text := 'veli';
  v_istek  text := nullif(new.raw_user_meta_data->>'talep_rol','');
begin
  if not public.spor_kaydi_mi(new.raw_user_meta_data) then
    return new;
  end if;

  if not exists (select 1 from public.spor_profiller where rol in ('yonetici','baskan')) then
    v_rol := 'yonetici';
  elsif v_istek = 'sporcu' then
    v_rol := 'sporcu';
  end if;

  insert into public.spor_profiller (id, eposta, ad_soyad, telefon, rol)
  values (
    new.id, new.email,
    nullif(new.raw_user_meta_data->>'ad_soyad',''),
    nullif(new.raw_user_meta_data->>'telefon',''),
    v_rol
  )
  on conflict (id) do nothing;

  if v_rol = 'veli' and v_istek in ('antrenor','yardimci_antrenor','baskan') then
    insert into public.spor_rol_talepleri (kullanici_id, talep_rol)
    values (new.id, v_istek);
  end if;

  update public.spor_sporcular
     set veli_id = new.id
   where veli_id is null and lower(veli_eposta) = lower(new.email);

  update public.spor_sporcular
     set sporcu_kullanici_id = new.id
   where sporcu_kullanici_id is null and lower(sporcu_eposta) = lower(new.email);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_kasa_ozeti()
 RETURNS TABLE(ay date, tahsilat numeric, ek_gelir numeric, aktarim numeric, gider numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with izin as (
    select 1 from public.spor_profiller p
     where p.id = auth.uid() and p.rol <> 'sporcu'
  ),
  odemeler as (
    select date_trunc('month', o.odeme_tarihi)::date as ay,
           sum(o.tutar) as tutar
      from public.spor_odemeler o
     where o.durum = 'onaylandi' and exists (select 1 from izin)
     group by 1
  ),
  hareketler as (
    select date_trunc('month', k.tarih)::date as ay,
           sum(k.tutar) filter (where k.tur = 'gelir')   as ek_gelir,
           sum(k.tutar) filter (where k.tur = 'aktarim') as aktarim,
           sum(k.tutar) filter (where k.tur = 'gider')   as gider
      from public.spor_kasa_hareketleri k
     where exists (select 1 from izin)
     group by 1
  )
  select coalesce(o.ay, h.ay) as ay,
         coalesce(o.tutar, 0),
         coalesce(h.ek_gelir, 0),
         coalesce(h.aktarim, 0),
         coalesce(h.gider, 0)
    from odemeler o
    full outer join hareketler h on h.ay = o.ay
   order by 1 desc;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_kaydi_mi(p_meta jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(p_meta->>'uygulama','') = 'spor'
      or coalesce(p_meta, '{}'::jsonb) ?| array['ad_soyad','telefon','talep_rol']
$function$
;

CREATE OR REPLACE FUNCTION public.spor_maskele(p_metin text, p_tip text DEFAULT 'ad'::text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare
  s text := coalesce(trim(p_metin), '');
  n integer;
begin
  if s = '' then return '—'; end if;
  n := length(s);

  if p_tip = 'soyad' then
    if n = 1 then return s; end if;
    if n = 2 then return left(s, 1) || '*'; end if;
    return left(s, 1) || repeat('*', n - 2) || right(s, 1);
  end if;

  if n = 1 then return s; end if;
  return left(s, 1) || repeat('*', n - 1);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_odeme_sonrasi()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_aidat uuid := coalesce(new.aidat_id, old.aidat_id);
  v_tutar numeric;
  v_odenen numeric;
begin
  if v_aidat is null then
    return coalesce(new, old);
  end if;

  select tutar into v_tutar from public.spor_aidatlar where id = v_aidat;
  select coalesce(sum(tutar),0) into v_odenen
    from public.spor_odemeler
   where aidat_id = v_aidat and durum = 'onaylandi';

  update public.spor_aidatlar
     set durum = case when v_odenen >= v_tutar then 'odendi' else 'bekliyor' end
   where id = v_aidat and durum <> 'muaf';

  return coalesce(new, old);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_odemeyenler(p_donem date DEFAULT NULL::date)
 RETURNS TABLE(donem date, ad text, soyad text, yas_grubu text, tutar numeric, son_odeme_tarihi date, gecikti boolean, benim boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.donem,
         public.spor_maskele(s.ad,'ad'),
         public.spor_maskele(s.soyad,'soyad'),
         s.yas_grubu, a.tutar, a.son_odeme_tarihi,
         (a.son_odeme_tarihi is not null and a.son_odeme_tarihi < current_date),
         (s.veli_id = auth.uid())
    from public.spor_aidatlar a
    join public.spor_sporcular s on s.id = a.sporcu_id
   where a.durum = 'bekliyor'
     and (p_donem is null or a.donem = date_trunc('month', p_donem)::date)
     and exists (select 1 from public.spor_profiller p
                  where p.id = auth.uid() and p.rol <> 'sporcu')
   order by a.donem desc, s.yas_grubu nulls last, s.ad;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_personel_mi()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.spor_profiller
                  where id = auth.uid()
                    and rol in ('antrenor','yardimci_antrenor','baskan','yonetici'));
$function$
;

CREATE OR REPLACE FUNCTION public.spor_profil()
 RETURNS spor_profiller
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid   uuid := auth.uid();
  v_kayit public.spor_profiller;
  v_mail  text;
begin
  if v_uid is null then raise exception 'Oturum bulunamadı.'; end if;

  select email into v_mail from auth.users where id = v_uid;

  select * into v_kayit from public.spor_profiller where id = v_uid;
  if not found then
    insert into public.spor_profiller (id, eposta, rol)
    values (
      v_uid, v_mail,
      case when not exists (select 1 from public.spor_profiller
                             where rol in ('yonetici','baskan'))
           then 'yonetici' else 'veli' end
    )
    on conflict (id) do nothing
    returning * into v_kayit;
    if v_kayit.id is null then
      select * into v_kayit from public.spor_profiller where id = v_uid;
    end if;
  end if;

  update public.spor_sporcular
     set veli_id = v_uid
   where veli_id is null and lower(veli_eposta) = lower(coalesce(v_mail,''));

  update public.spor_sporcular
     set sporcu_kullanici_id = v_uid
   where sporcu_kullanici_id is null and lower(sporcu_eposta) = lower(coalesce(v_mail,''));

  return v_kayit;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_profil_rol_koru()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if current_user not in ('authenticated','anon') or public.spor_yonetici_mi() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.rol is distinct from 'sporcu' then new.rol := 'veli'; end if;
  else
    new.rol := old.rol;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_sporcu_aktif_tahakkuk()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ay date := date_trunc('month', current_date)::date;
begin
  if new.durum = 'aktif'
     and coalesce(new.aylik_aidat, 0) > 0
     and (tg_op = 'INSERT' or old.durum is distinct from 'aktif'
          or coalesce(old.aylik_aidat,0) = 0)
  then
    insert into public.spor_aidatlar (sporcu_id, donem, tutar, son_odeme_tarihi, aciklama)
    values (new.id, v_ay, new.aylik_aidat, (v_ay + interval '9 days')::date,
            'Kayıt onayında otomatik oluşturuldu')
    on conflict (sporcu_id, donem) do nothing;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_sporcu_foto_kaydet(p_id uuid, p_yol text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not (public.spor_sporcu_gorebilir_mi(p_id) or public.spor_personel_mi()) then
    raise exception 'Bu sporcu üzerinde yetkiniz yok.';
  end if;
  update public.spor_sporcular set foto_yolu = p_yol where id = p_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_sporcu_gorebilir_mi(p_sporcu uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.spor_sporcular
     where id = p_sporcu
       and (veli_id = auth.uid() or sporcu_kullanici_id = auth.uid())
  );
$function$
;

CREATE OR REPLACE FUNCTION public.spor_sporcu_on_kayit(p_ad text, p_soyad text, p_dogum_tarihi date, p_mevki text, p_okul text, p_ayak text, p_veli_ad_soyad text, p_veli_telefon text, p_acil_kisi text, p_acil_telefon text, p_notlar text, p_sporcu_eposta text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_rol text;
  v_mail text;
  v_sporcu_mail text := lower(nullif(trim(p_sporcu_eposta), ''));
  v_id uuid;
begin
  if v_uid is null then raise exception 'Oturum bulunamadı.'; end if;

  select rol into v_rol from public.spor_profiller where id = v_uid;
  if v_rol = 'sporcu' then
    raise exception 'Sporcu hesabı yeni kayıt oluşturamaz. Kaydınızı veliniz ya da kulüp oluşturur.';
  end if;
  if coalesce(trim(p_ad),'') = '' or coalesce(trim(p_soyad),'') = '' then
    raise exception 'Ad ve soyad zorunludur.';
  end if;

  select email into v_mail from auth.users where id = v_uid;

  if (select count(*) from public.spor_sporcular
       where veli_id = v_uid and durum = 'onay_bekliyor') >= 5 then
    raise exception 'Onay bekleyen kayıt sayısı sınırına ulaştınız.';
  end if;

  insert into public.spor_sporcular (
    ad, soyad, dogum_tarihi, mevki, okul, ayak,
    veli_ad_soyad, veli_telefon, veli_eposta, veli_id, sporcu_eposta,
    acil_kisi, acil_telefon, notlar, aylik_aidat, durum, ekleyen_id
  ) values (
    trim(p_ad), trim(p_soyad), p_dogum_tarihi, nullif(trim(p_mevki),''),
    nullif(trim(p_okul),''), nullif(trim(p_ayak),''),
    nullif(trim(p_veli_ad_soyad),''), nullif(trim(p_veli_telefon),''), v_mail, v_uid, v_sporcu_mail,
    nullif(trim(p_acil_kisi),''), nullif(trim(p_acil_telefon),''), nullif(trim(p_notlar),''),
    0, 'onay_bekliyor', v_uid
  ) returning id into v_id;

  if v_sporcu_mail is not null then
    update public.spor_sporcular s
       set sporcu_kullanici_id = u.id
      from auth.users u
     where s.id = v_id and lower(u.email) = v_sporcu_mail;
  end if;

  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_sporcu_veli_guncelle(p_id uuid, p_ad text, p_soyad text, p_dogum_tarihi date, p_mevki text, p_okul text, p_ayak text, p_veli_ad_soyad text, p_veli_telefon text, p_acil_kisi text, p_acil_telefon text, p_notlar text, p_sporcu_eposta text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_mail text := lower(nullif(trim(p_sporcu_eposta), ''));
begin
  if not public.spor_sporcu_gorebilir_mi(p_id) then
    raise exception 'Bu sporcu üzerinde yetkiniz yok.';
  end if;

  if v_mail is not null and exists (
    select 1 from public.spor_sporcular s
     where s.sporcu_eposta = v_mail and s.id <> p_id
  ) then
    raise exception 'Bu e-posta başka bir sporcuya tanımlı.';
  end if;

  update public.spor_sporcular set
    ad            = coalesce(nullif(trim(p_ad),''), ad),
    soyad         = coalesce(nullif(trim(p_soyad),''), soyad),
    dogum_tarihi  = p_dogum_tarihi,
    mevki         = nullif(trim(p_mevki),''),
    okul          = nullif(trim(p_okul),''),
    ayak          = nullif(trim(p_ayak),''),
    veli_ad_soyad = nullif(trim(p_veli_ad_soyad),''),
    veli_telefon  = nullif(trim(p_veli_telefon),''),
    acil_kisi     = nullif(trim(p_acil_kisi),''),
    acil_telefon  = nullif(trim(p_acil_telefon),''),
    notlar        = nullif(trim(p_notlar),''),
    sporcu_eposta = v_mail
  where id = p_id;

  -- E-posta ile daha önce kayıt olmuş bir sporcu hesabı varsa hemen bağla.
  if v_mail is not null then
    update public.spor_sporcular s
       set sporcu_kullanici_id = u.id
      from auth.users u
     where s.id = p_id and lower(u.email) = v_mail;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.spor_veli_mi(p_sporcu uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.spor_sporcular
    where id = p_sporcu and veli_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.spor_yonetici_mi()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.spor_profiller
                  where id = auth.uid() and rol in ('yonetici','baskan'));
$function$
;

-- ===== Tetikleyiciler =====

CREATE TRIGGER on_auth_user_created_spor AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION spor_handle_new_user();
CREATE TRIGGER spor_odeme_sonrasi_trg AFTER INSERT OR DELETE OR UPDATE ON public.spor_odemeler FOR EACH ROW EXECUTE FUNCTION spor_odeme_sonrasi();
CREATE TRIGGER spor_antrenman_gecmis BEFORE DELETE OR UPDATE ON public.spor_antrenmanlar FOR EACH ROW EXECUTE FUNCTION spor_gecmis_kaydet();
CREATE TRIGGER spor_not_gecmis BEFORE DELETE OR UPDATE ON public.spor_sporcu_notlari FOR EACH ROW EXECUTE FUNCTION spor_gecmis_kaydet();
CREATE TRIGGER spor_degerlendirme_gecmis BEFORE DELETE OR UPDATE ON public.spor_degerlendirmeler FOR EACH ROW EXECUTE FUNCTION spor_gecmis_kaydet();
CREATE TRIGGER spor_kasa_gecmis BEFORE DELETE OR UPDATE ON public.spor_kasa_hareketleri FOR EACH ROW EXECUTE FUNCTION spor_gecmis_kaydet();
CREATE TRIGGER spor_sporcu_aktif_tahakkuk_trg AFTER INSERT OR UPDATE OF durum, aylik_aidat ON public.spor_sporcular FOR EACH ROW EXECUTE FUNCTION spor_sporcu_aktif_tahakkuk();
CREATE TRIGGER spor_profil_rol_koru_trg BEFORE INSERT OR UPDATE ON public.spor_profiller FOR EACH ROW EXECUTE FUNCTION spor_profil_rol_koru();

-- ===== Erişim kuralları =====

create policy spor_ayarlar_select on public.spor_ayarlar as PERMISSIVE for SELECT to authenticated using (true);
create policy spor_ayarlar_yaz on public.spor_ayarlar as PERMISSIVE for ALL to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_belgeler_delete on public.spor_belgeler as PERMISSIVE for DELETE to authenticated using ((spor_yonetici_mi() OR (yukleyen_id = auth.uid())));
create policy spor_belgeler_insert on public.spor_belgeler as PERMISSIVE for INSERT to authenticated with check ((spor_yonetici_mi() OR (spor_veli_mi(sporcu_id) AND (yukleyen_id = auth.uid()))));
create policy spor_belgeler_select on public.spor_belgeler as PERMISSIVE for SELECT to authenticated using ((spor_sporcu_gorebilir_mi(sporcu_id) OR spor_yonetici_mi()));
create policy spor_belgeler_update on public.spor_belgeler as PERMISSIVE for UPDATE to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_maclar_select on public.spor_maclar as PERMISSIVE for SELECT to authenticated using (true);
create policy spor_maclar_yaz on public.spor_maclar as PERMISSIVE for ALL to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_mac_katilim_select on public.spor_mac_katilim as PERMISSIVE for SELECT to authenticated using ((spor_sporcu_gorebilir_mi(sporcu_id) OR spor_personel_mi()));
create policy spor_mac_katilim_yaz on public.spor_mac_katilim as PERMISSIVE for ALL to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_kasa_select on public.spor_kasa_hareketleri as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM spor_profiller p
  WHERE ((p.id = auth.uid()) AND (p.rol <> 'sporcu'::text)))));
create policy spor_kasa_yaz on public.spor_kasa_hareketleri as PERMISSIVE for ALL to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_notlar_delete on public.spor_sporcu_notlari as PERMISSIVE for DELETE to authenticated using (spor_yonetici_mi());
create policy spor_notlar_insert on public.spor_sporcu_notlari as PERMISSIVE for INSERT to authenticated with check ((spor_personel_mi() AND (yazan_id = auth.uid())));
create policy spor_notlar_select on public.spor_sporcu_notlari as PERMISSIVE for SELECT to authenticated using ((spor_personel_mi() OR ((gorunurluk = 'veli'::text) AND spor_sporcu_gorebilir_mi(sporcu_id))));
create policy spor_notlar_update on public.spor_sporcu_notlari as PERMISSIVE for UPDATE to authenticated using ((spor_yonetici_mi() OR (yazan_id = auth.uid()))) with check (spor_personel_mi());
create policy spor_degerlendirme_guncelle on public.spor_degerlendirmeler as PERMISSIVE for UPDATE to authenticated using (spor_personel_mi()) with check (spor_personel_mi());
create policy spor_degerlendirme_select on public.spor_degerlendirmeler as PERMISSIVE for SELECT to authenticated using ((spor_sporcu_gorebilir_mi(sporcu_id) OR spor_personel_mi()));
create policy spor_degerlendirme_sil on public.spor_degerlendirmeler as PERMISSIVE for DELETE to authenticated using (spor_yonetici_mi());
create policy spor_degerlendirme_yaz on public.spor_degerlendirmeler as PERMISSIVE for INSERT to authenticated with check (spor_personel_mi());
create policy spor_olcum_guncelle on public.spor_olcumler as PERMISSIVE for UPDATE to authenticated using (spor_personel_mi()) with check (spor_personel_mi());
create policy spor_olcum_select on public.spor_olcumler as PERMISSIVE for SELECT to authenticated using ((spor_sporcu_gorebilir_mi(sporcu_id) OR spor_personel_mi()));
create policy spor_olcum_sil on public.spor_olcumler as PERMISSIVE for DELETE to authenticated using (spor_yonetici_mi());
create policy spor_olcum_yaz on public.spor_olcumler as PERMISSIVE for INSERT to authenticated with check (spor_personel_mi());
create policy spor_antrenmanlar_delete on public.spor_antrenmanlar as PERMISSIVE for DELETE to authenticated using (spor_yonetici_mi());
create policy spor_antrenmanlar_insert on public.spor_antrenmanlar as PERMISSIVE for INSERT to authenticated with check (spor_personel_mi());
create policy spor_antrenmanlar_select on public.spor_antrenmanlar as PERMISSIVE for SELECT to authenticated using (true);
create policy spor_antrenmanlar_update on public.spor_antrenmanlar as PERMISSIVE for UPDATE to authenticated using (spor_personel_mi()) with check (spor_personel_mi());
create policy spor_yoklama_select on public.spor_yoklama as PERMISSIVE for SELECT to authenticated using ((spor_sporcu_gorebilir_mi(sporcu_id) OR spor_personel_mi()));
create policy spor_yoklama_yaz on public.spor_yoklama as PERMISSIVE for ALL to authenticated using (spor_personel_mi()) with check (spor_personel_mi());
create policy spor_gecmis_select on public.spor_kayit_gecmisi as PERMISSIVE for SELECT to authenticated using (spor_yonetici_mi());
create policy spor_rol_talep_select on public.spor_rol_talepleri as PERMISSIVE for SELECT to authenticated using (((kullanici_id = auth.uid()) OR spor_yonetici_mi()));
create policy spor_rol_talep_yaz on public.spor_rol_talepleri as PERMISSIVE for ALL to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_odemeler_select on public.spor_odemeler as PERMISSIVE for SELECT to authenticated using ((spor_veli_mi(sporcu_id) OR spor_yonetici_mi()));
create policy spor_odemeler_sil on public.spor_odemeler as PERMISSIVE for DELETE to authenticated using ((spor_yonetici_mi() OR ((bildiren_id = auth.uid()) AND (durum = 'beklemede'::text))));
create policy spor_odemeler_veli_bildir on public.spor_odemeler as PERMISSIVE for INSERT to authenticated with check ((spor_yonetici_mi() OR (spor_veli_mi(sporcu_id) AND (durum = 'beklemede'::text) AND (bildiren_id = auth.uid()) AND (onaylayan_id IS NULL))));
create policy spor_odemeler_yonetici_yaz on public.spor_odemeler as PERMISSIVE for UPDATE to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_profiller_delete on public.spor_profiller as PERMISSIVE for DELETE to authenticated using (spor_yonetici_mi());
create policy spor_profiller_insert on public.spor_profiller as PERMISSIVE for INSERT to authenticated with check (((id = auth.uid()) OR spor_yonetici_mi()));
create policy spor_profiller_select on public.spor_profiller as PERMISSIVE for SELECT to authenticated using (((id = auth.uid()) OR spor_yonetici_mi()));
create policy spor_profiller_update on public.spor_profiller as PERMISSIVE for UPDATE to authenticated using (((id = auth.uid()) OR spor_yonetici_mi())) with check (((id = auth.uid()) OR spor_yonetici_mi()));
create policy spor_sporcular_select on public.spor_sporcular as PERMISSIVE for SELECT to authenticated using (((veli_id = auth.uid()) OR (sporcu_kullanici_id = auth.uid()) OR spor_personel_mi()));
create policy spor_sporcular_yonetici_yaz on public.spor_sporcular as PERMISSIVE for ALL to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());
create policy spor_aidatlar_select on public.spor_aidatlar as PERMISSIVE for SELECT to authenticated using ((spor_veli_mi(sporcu_id) OR spor_yonetici_mi()));
create policy spor_aidatlar_yonetici_yaz on public.spor_aidatlar as PERMISSIVE for ALL to authenticated using (spor_yonetici_mi()) with check (spor_yonetici_mi());

-- ===== Dosya kovaları =====

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('spor-dekontlar','spor-dekontlar',false,10485760,'{image/jpeg,image/png,image/webp,image/heic,application/pdf}') on conflict (id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('spor-belgeler','spor-belgeler',false,10485760,'{image/jpeg,image/png,image/webp,image/heic,application/pdf}') on conflict (id) do nothing;

-- ===== Dosya erişim kuralları =====

create policy spor_dekont_select on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'spor-dekontlar'::text) AND (spor_yonetici_mi() OR spor_veli_mi(spor_dekont_sporcu(name)))));
create policy spor_dekont_insert on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'spor-dekontlar'::text) AND (spor_yonetici_mi() OR spor_veli_mi(spor_dekont_sporcu(name)))));
create policy spor_dekont_delete on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'spor-dekontlar'::text) AND (spor_yonetici_mi() OR ((owner = auth.uid()) AND spor_veli_mi(spor_dekont_sporcu(name))))));
create policy spor_belge_delete on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'spor-belgeler'::text) AND (spor_yonetici_mi() OR ((owner = auth.uid()) AND spor_veli_mi(spor_dekont_sporcu(name))))));
create policy spor_belge_select on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'spor-belgeler'::text) AND (spor_yonetici_mi() OR spor_belge_erisimi(name))));
create policy spor_belge_insert on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'spor-belgeler'::text) AND (spor_personel_mi() OR spor_belge_erisimi(name))));

-- ===== Yetkiler =====

grant select, insert, update, delete on public.spor_ayarlar to authenticated, service_role;
grant select, insert, update, delete on public.spor_belgeler to authenticated, service_role;
grant select, insert, update, delete on public.spor_maclar to authenticated, service_role;
grant select, insert, update, delete on public.spor_mac_katilim to authenticated, service_role;
grant select, insert, update, delete on public.spor_kasa_hareketleri to authenticated, service_role;
grant select, insert, update, delete on public.spor_sporcu_notlari to authenticated, service_role;
grant select, insert, update, delete on public.spor_degerlendirmeler to authenticated, service_role;
grant select, insert, update, delete on public.spor_olcumler to authenticated, service_role;
grant select, insert, update, delete on public.spor_antrenmanlar to authenticated, service_role;
grant select, insert, update, delete on public.spor_yoklama to authenticated, service_role;
grant select, insert, update, delete on public.spor_kayit_gecmisi to authenticated, service_role;
grant select, insert, update, delete on public.spor_rol_talepleri to authenticated, service_role;
grant select, insert, update, delete on public.spor_odemeler to authenticated, service_role;
grant select, insert, update, delete on public.spor_profiller to authenticated, service_role;
grant select, insert, update, delete on public.spor_sporcular to authenticated, service_role;
grant select, insert, update, delete on public.spor_aidatlar to authenticated, service_role;

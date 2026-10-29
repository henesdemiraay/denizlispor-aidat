-- ============================================================================
-- 2026-10-31 · Esnek aidat + otomatik aylık tahakkuk
--
-- Ne getirir
--   Sporcuya özel indirim (oran + neden; burs için %100 → aidat "muaf" açılır)
--   Kardeş indirimi   Aynı velinin ikinci ve sonraki aktif sporcusuna (ayar: kardes_indirimi)
--   Kıst hesap        Ay ortası kayıtta kalan gün kadar (ayar: kist_hesap = acik)
--   Dondurma          Dondurma aralığı ayın tamamını kapsıyorsa o ay borç açılmaz
--   Son ödeme günü    Ayar: son_odeme_gunu (varsayılan 10)
--   Otomatik tahakkuk Her ayın ilk çalıştırmasında aktif sporculara borç (ayar:
--                     otomatik_tahakkuk ≠ kapali). Günlük iş spor_gunluk_isler() ile.
--   Kısmi ödeme       Zaten vardı (spor_odeme_sonrasi toplamı karşılaştırır); ekranda
--                     "kalan" gösterilir.
--
-- İndirimler TOPLANMAZ: sporcuya özel indirim ile kardeş indiriminden büyük olan uygulanır.
-- Hesap tek yerde: spor_aidat_hesapla(). Tahakkukun açıklamasına hesabın nedeni yazılır.
--
-- Kural: RLS açık; yeni fonksiyonlar authenticated'a (otomatik iş hiç kimseye) açılır.
-- Tekrar çalıştırılabilir.
-- ============================================================================

-- ---------------------------------------------------------- yeni alanlar
alter table public.spor_sporcular
  add column if not exists indirim_orani numeric(5,2) not null default 0,
  add column if not exists indirim_nedeni text,
  add column if not exists dondurma_bas date,
  add column if not exists dondurma_bit date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'spor_sporcular_indirim_check') then
    alter table public.spor_sporcular add constraint spor_sporcular_indirim_check
      check (indirim_orani between 0 and 100 and char_length(coalesce(indirim_nedeni, '')) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spor_sporcular_dondurma_check') then
    alter table public.spor_sporcular add constraint spor_sporcular_dondurma_check
      check (dondurma_bas is null or dondurma_bit is null or dondurma_bit >= dondurma_bas);
  end if;
end $$;

-- ------------------------------------------------------------ ayar okuma
create or replace function public.spor_ayar(p_anahtar text, p_varsayilan text default null)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(trim((select deger from public.spor_ayarlar where anahtar = p_anahtar)), ''), p_varsayilan)
$$;

create or replace function public.spor_ayar_sayi(p_anahtar text, p_varsayilan numeric default 0)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v text := public.spor_ayar(p_anahtar);
begin
  if v is null then return p_varsayilan; end if;
  return replace(v, ',', '.')::numeric;
exception when others then
  return p_varsayilan;
end;
$$;

-- Dönemin son ödeme tarihi (ayın son_odeme_gunu'ncü günü; 1–28)
create or replace function public.spor_son_odeme(p_donem date)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (date_trunc('month', p_donem)::date
          + (greatest(1, least(28, public.spor_ayar_sayi('son_odeme_gunu', 10)::integer)) - 1))
$$;

-- -------------------------------------------------------- aidat hesabı
-- Satır dönmezse o dönem borç açılmaz (aidatsız ya da ay boyu dondurulmuş).
create or replace function public.spor_aidat_hesapla(
  p_sporcu uuid,
  p_donem date,
  p_baslangic date default null
)
returns table (tutar numeric, aciklama text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s         public.spor_sporcular%rowtype;
  v_ay      date := date_trunc('month', p_donem)::date;
  v_ay_son  date := (date_trunc('month', p_donem) + interval '1 month - 1 day')::date;
  v_oran    numeric := 0;
  v_neden   text[] := '{}';
  v_kardes  numeric;
  v_once    integer;
  v_tutar   numeric;
  v_bas     date;
  v_gun     integer;
  v_kalan   integer;
begin
  select * into s from public.spor_sporcular where id = p_sporcu;
  if not found or coalesce(s.aylik_aidat, 0) <= 0 then
    return;
  end if;

  -- Ayın tamamı dondurulmuşsa borç yok
  if s.dondurma_bas is not null and s.dondurma_bas <= v_ay
     and (s.dondurma_bit is null or s.dondurma_bit >= v_ay_son) then
    return;
  end if;

  if s.indirim_orani > 0 then
    v_oran := s.indirim_orani;
    v_neden := array[coalesce(nullif(trim(s.indirim_nedeni), ''), 'İndirim')
                     || ' %' || trim(to_char(s.indirim_orani, 'FM990.##'))];
  end if;

  v_kardes := least(100, greatest(0, public.spor_ayar_sayi('kardes_indirimi', 0)));
  if v_kardes > v_oran and s.veli_id is not null then
    select count(*) into v_once
      from public.spor_sporcular k
     where k.veli_id = s.veli_id
       and k.id <> s.id
       and k.durum = 'aktif'
       and k.aylik_aidat > 0
       and (k.kayit_tarihi, k.id) < (s.kayit_tarihi, s.id);
    if v_once >= 1 then
      v_oran := v_kardes;
      v_neden := array['Kardeş indirimi %' || trim(to_char(v_kardes, 'FM990.##'))];
    end if;
  end if;

  v_tutar := round(s.aylik_aidat * (1 - v_oran / 100), 2);

  -- Kıst: ay ortasında başlayan sporcu yalnızca kalan günleri öder (tam TL'ye yuvarlanır)
  v_bas := coalesce(p_baslangic, s.kayit_tarihi);
  if public.spor_ayar('kist_hesap', 'kapali') = 'acik'
     and v_tutar > 0 and v_bas > v_ay and v_bas <= v_ay_son then
    v_gun := extract(day from v_ay_son)::integer;
    v_kalan := (v_ay_son - v_bas) + 1;
    v_tutar := ceil(v_tutar * v_kalan / v_gun);
    v_neden := v_neden || ('Kıst ' || v_kalan || '/' || v_gun || ' gün');
  end if;

  tutar := v_tutar;
  aciklama := nullif(array_to_string(v_neden, ' · '), '');
  return next;
end;
$$;

-- -------------------------------------- tahakkuk fonksiyonları (yenilendi)
create or replace function public.spor_donem_olustur(p_donem date, p_son_odeme date default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ay   date := date_trunc('month', p_donem)::date;
  v_adet integer;
begin
  if not public.spor_yonetici_mi() then
    raise exception 'Bu işlem için yönetici yetkisi gerekir.';
  end if;

  insert into public.spor_aidatlar (sporcu_id, donem, tutar, son_odeme_tarihi, durum, aciklama)
  select s.id, v_ay, h.tutar, coalesce(p_son_odeme, public.spor_son_odeme(v_ay)),
         case when h.tutar = 0 then 'muaf' else 'bekliyor' end, h.aciklama
    from public.spor_sporcular s
    cross join lateral public.spor_aidat_hesapla(s.id, v_ay) h
   where s.durum = 'aktif' and s.aylik_aidat > 0
  on conflict (sporcu_id, donem) do nothing;

  get diagnostics v_adet = row_count;
  return v_adet;
end;
$$;

-- Dondurulmuş sporcular "eksik" sayılmaz; tutar hesaplanmış haliyle döner.
create or replace function public.spor_eksik_tahakkuk(p_donem date)
returns table (sporcu_id uuid, ad text, soyad text, yas_grubu text, aylik_aidat numeric)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.ad, s.soyad, s.yas_grubu, h.tutar
    from public.spor_sporcular s
    cross join lateral public.spor_aidat_hesapla(s.id, p_donem) h
   where public.spor_yonetici_mi()
     and s.durum = 'aktif' and s.aylik_aidat > 0
     and not exists (
       select 1 from public.spor_aidatlar a
        where a.sporcu_id = s.id and a.donem = date_trunc('month', p_donem)::date
     )
   order by s.ad, s.soyad;
$$;

create or replace function public.spor_sporcu_aktif_tahakkuk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bugun date := (now() at time zone 'Europe/Istanbul')::date;
  v_ay    date := date_trunc('month', (now() at time zone 'Europe/Istanbul'))::date;
  h       record;
begin
  if new.durum = 'aktif'
     and coalesce(new.aylik_aidat, 0) > 0
     and (tg_op = 'INSERT' or old.durum is distinct from 'aktif'
          or coalesce(old.aylik_aidat, 0) = 0)
  then
    select * into h from public.spor_aidat_hesapla(new.id, v_ay, greatest(new.kayit_tarihi, v_bugun));
    if found then
      insert into public.spor_aidatlar (sporcu_id, donem, tutar, son_odeme_tarihi, durum, aciklama)
      values (new.id, v_ay, h.tutar, greatest(public.spor_son_odeme(v_ay), v_bugun + 7),
              case when h.tutar = 0 then 'muaf' else 'bekliyor' end,
              concat_ws(' · ', 'Kayıt onayında oluşturuldu', h.aciklama))
      on conflict (sporcu_id, donem) do nothing;
    end if;
  end if;
  return new;
end;
$$;

-- --------------------------------------------- otomatik aylık tahakkuk
-- Ayda bir kez çalışır (son_otomatik_tahakkuk ayarı). Yönetim bir borcu bilerek
-- sildiyse aynı ay yeniden açılmaz. Yalnızca zamanlanmış görev çağırır.
create or replace function public.spor_otomatik_tahakkuk(p_bugun date default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bugun date := coalesce(p_bugun, (now() at time zone 'Europe/Istanbul')::date);
  v_ay    date := date_trunc('month', v_bugun)::date;
  v_adet  integer := 0;
begin
  if public.spor_ayar('otomatik_tahakkuk', 'acik') = 'kapali' then
    return 0;
  end if;
  if public.spor_ayar('son_otomatik_tahakkuk') = v_ay::text then
    return 0;
  end if;

  insert into public.spor_aidatlar (sporcu_id, donem, tutar, son_odeme_tarihi, durum, aciklama)
  select s.id, v_ay, h.tutar, public.spor_son_odeme(v_ay),
         case when h.tutar = 0 then 'muaf' else 'bekliyor' end,
         concat_ws(' · ', 'Otomatik', h.aciklama)
    from public.spor_sporcular s
    cross join lateral public.spor_aidat_hesapla(s.id, v_ay) h
   where s.durum = 'aktif' and s.aylik_aidat > 0
  on conflict (sporcu_id, donem) do nothing;
  get diagnostics v_adet = row_count;

  insert into public.spor_ayarlar (anahtar, deger, guncellendi)
  values ('son_otomatik_tahakkuk', v_ay::text, now())
  on conflict (anahtar) do update set deger = excluded.deger, guncellendi = now();

  return v_adet;
end;
$$;

-- Günlük iş: sonraki göçler (hatırlatmalar) bu fonksiyonu genişletir.
create or replace function public.spor_gunluk_isler(p_bugun date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object('tahakkuk', public.spor_otomatik_tahakkuk(p_bugun));
end;
$$;

-- Önizleme: yönetim bir sporcunun bu ayki tutarını formda görebilsin
create or replace function public.spor_aidat_onizle(p_sporcu uuid, p_donem date default null)
returns table (tutar numeric, aciklama text)
language sql
stable
security definer
set search_path = public
as $$
  select h.tutar, h.aciklama
    from public.spor_aidat_hesapla(
           p_sporcu,
           coalesce(p_donem, (now() at time zone 'Europe/Istanbul')::date)) h
   where public.spor_yonetici_mi()
$$;

-- ------------------------------------------------------------ izinler
revoke execute on function public.spor_ayar(text, text)                    from public, anon;
revoke execute on function public.spor_ayar_sayi(text, numeric)            from public, anon;
revoke execute on function public.spor_son_odeme(date)                     from public, anon;
revoke execute on function public.spor_aidat_hesapla(uuid, date, date)     from public, anon, authenticated;
revoke execute on function public.spor_otomatik_tahakkuk(date)             from public, anon, authenticated;
revoke execute on function public.spor_gunluk_isler(date)                  from public, anon, authenticated;
revoke execute on function public.spor_aidat_onizle(uuid, date)            from public, anon;

grant execute on function public.spor_ayar(text, text)                     to authenticated;
grant execute on function public.spor_ayar_sayi(text, numeric)             to authenticated;
grant execute on function public.spor_son_odeme(date)                      to authenticated;
grant execute on function public.spor_aidat_onizle(uuid, date)             to authenticated;

-- ------------------------------------------------- günlük zamanlanmış görev
-- Supabase'de pg_cron vardır; sınama ortamında (PGlite) yoksa atlanır.
-- Her gün 00:15 UTC (03:15 TSİ). Aynı adla yeniden çalıştırmak görevi günceller.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('spor-gunluk-isler', '15 0 * * *', 'select public.spor_gunluk_isler()');
  end if;
exception when others then
  raise notice 'Zamanlanmış görev kurulamadı: %. Supabase > Database > Extensions > pg_cron açılıp bu bölüm yeniden çalıştırılmalı.', sqlerrm;
end $$;

notify pgrst, 'reload schema';

-- ============================================================================
-- 2026-11-02 · Ön kayıt ve aday panosu
--
-- Akış: QR / bağlantı → veli hesap açar → çocuğunu kaydeder (onay_bekliyor) →
--       yönetim deneme dersi planlar (veliye bildirim) → kesin kayıt (aktif) ya da kapatma.
-- Girişsiz kişiye veritabanı yazma hakkı açılmaz; başvuru her zaman hesapla yapılır.
--
-- Bağımlılık: 20261101_bildirimler.sql
-- Tekrar çalıştırılabilir.
-- ============================================================================

alter table public.spor_sporcular
  add column if not exists deneme_zamani timestamptz,
  add column if not exists deneme_yeri text,
  add column if not exists aday_notu text,
  add column if not exists aday_kapanis date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'spor_sporcular_aday_check') then
    alter table public.spor_sporcular add constraint spor_sporcular_aday_check
      check (char_length(coalesce(deneme_yeri, '')) <= 120 and char_length(coalesce(aday_notu, '')) <= 500);
  end if;
end $$;

-- Bildirim türlerine deneme dersi
alter table public.spor_bildirimler drop constraint if exists spor_bildirimler_tur_check;
alter table public.spor_bildirimler add constraint spor_bildirimler_tur_check check (tur in (
  'aidat_yaklasiyor', 'aidat_bugun', 'aidat_gecikti',
  'yoklama_gelmedi', 'odeme_onaylandi', 'odeme_reddedildi',
  'kayit_onaylandi', 'yeni_odeme', 'yeni_kayit', 'deneme_dersi'));

-- Deneme dersi planla / değiştir (personel). Veliye bildirim gider.
create or replace function public.spor_deneme_dersi_planla(
  p_sporcu uuid, p_zaman timestamptz, p_yer text default null, p_not text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.spor_sporcular%rowtype;
begin
  if not public.spor_personel_mi() then
    raise exception 'Deneme dersini kulüp personeli planlar.';
  end if;
  select * into s from public.spor_sporcular where id = p_sporcu;
  if not found or s.durum <> 'onay_bekliyor' then
    raise exception 'Yalnızca onay bekleyen başvurulara deneme dersi planlanır.';
  end if;
  if p_zaman is null then
    raise exception 'Deneme dersinin tarih ve saatini girin.';
  end if;

  update public.spor_sporcular
     set deneme_zamani = p_zaman,
         deneme_yeri = nullif(trim(p_yer), ''),
         aday_notu = coalesce(nullif(trim(p_not), ''), aday_notu)
   where id = p_sporcu;

  perform public.spor_bildirim_yaz(
    s.veli_id, 'deneme_dersi',
    s.ad || ' için deneme dersi: ' || to_char(p_zaman at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI'),
    coalesce('Yer: ' || nullif(trim(p_yer), '') || '. ', '')
      || 'Rahat kıyafet, krampon ya da halı saha ayakkabısı ve su getirmeyi unutmayın.',
    '/panel', 'deneme:' || p_sporcu || ':' || extract(epoch from p_zaman)::bigint);
end;
$$;

-- Başvuruyu kapat (yönetim): kayıt silinmez, pasife alınır ve nedeni saklanır.
create or replace function public.spor_aday_kapat(p_sporcu uuid, p_neden text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.spor_yonetici_mi() then
    raise exception 'Başvuruyu kulüp yönetimi kapatır.';
  end if;
  update public.spor_sporcular
     set durum = 'pasif',
         aday_kapanis = (now() at time zone 'Europe/Istanbul')::date,
         aday_notu = left(concat_ws(' · ', nullif(aday_notu, ''), nullif(trim(p_neden), '')), 500)
   where id = p_sporcu and durum = 'onay_bekliyor';
  if not found then
    raise exception 'Bu başvuru zaten sonuçlanmış.';
  end if;
end;
$$;

revoke execute on function public.spor_deneme_dersi_planla(uuid, timestamptz, text, text) from public, anon;
revoke execute on function public.spor_aday_kapat(uuid, text)                           from public, anon;
grant  execute on function public.spor_deneme_dersi_planla(uuid, timestamptz, text, text) to authenticated;
grant  execute on function public.spor_aday_kapat(uuid, text)                           to authenticated;

notify pgrst, 'reload schema';

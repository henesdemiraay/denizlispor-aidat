-- ============================================================================
-- 2026-11-01 · Bildirim kutusu + aidat hatırlatma kuralları
--
-- Ne getirir
--   spor_bildirimler     Kişiye özel bildirim kutusu. Uygulama içinde görünür; ileride
--                        telefon bildirimi / WhatsApp aynı kayıtlardan gönderilir.
--   Sessiz saat          22:00–08:30 (ayar: sessiz_bas / sessiz_bit). Uygulama içindeki kutuda
--                        bildirim hemen görünür; telefon / WhatsApp gönderimi (dis_gonderim)
--                        sessiz saatte sabaha ertelenir. Hatırlatmalar günün 10:00'unda görünür.
--   Aidat hatırlatma     Günlük işte: vadeden N gün önce, vade günü, gecikmenin N. günü
--                        (ayarlar: hatirlatma = acik|kapali, hatirlatma_once = "3",
--                        hatirlatma_gecikme = "3,10"). Alıcı: veli. Sporcu hesabı para görmez.
--   Olay bildirimleri    Yoklamada "gelmedi" (veli), ödeme onay/ret (bildiren), kayıt onayı (veli),
--                        yeni ödeme bildirimi ve yeni kayıt başvurusu (yönetim).
--   Tekrar engeli        Her bildirimin benzersiz anahtarı vardır; aynı olay iki kez yazılmaz.
--
-- Kural: RLS açık; kişi yalnızca kendi bildirimini okur; yazma yalnızca fonksiyonlarla.
-- Bağımlılık: 20261031_esnek_aidat.sql (spor_ayar, spor_gunluk_isler)
-- Tekrar çalıştırılabilir.
-- ============================================================================

create table if not exists public.spor_bildirimler (
  id            uuid primary key default gen_random_uuid(),
  kullanici_id  uuid not null references auth.users (id) on delete cascade,
  tur           text not null check (tur in (
                  'aidat_yaklasiyor', 'aidat_bugun', 'aidat_gecikti',
                  'yoklama_gelmedi', 'odeme_onaylandi', 'odeme_reddedildi',
                  'kayit_onaylandi', 'yeni_odeme', 'yeni_kayit')),
  baslik        text not null check (char_length(baslik) between 1 and 140),
  govde         text check (char_length(govde) <= 600),
  yol           text check (yol is null or yol like '/%'),
  anahtar       text not null unique,
  gorunur_zaman timestamptz not null default now(),   -- kutuda görünme anı
  dis_gonderim  timestamptz,                         -- dış kanal (push / WhatsApp) en erken gönderim
  dis_gonderildi timestamptz,                        -- dış kanaldan gönderildiği an
  okundu        timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists spor_bildirimler_kutu_idx
  on public.spor_bildirimler (kullanici_id, gorunur_zaman desc);

alter table public.spor_bildirimler add column if not exists dis_gonderim timestamptz;
alter table public.spor_bildirimler add column if not exists dis_gonderildi timestamptz;

alter table public.spor_bildirimler enable row level security;
revoke all on public.spor_bildirimler from anon;
grant select on public.spor_bildirimler to authenticated;

drop policy if exists "bildirim_kendi" on public.spor_bildirimler;
create policy "bildirim_kendi" on public.spor_bildirimler
  for select to authenticated
  using (kullanici_id = auth.uid() and gorunur_zaman <= now());

-- ---------------------------------------------------------- yardımcılar
-- Sessiz saatteyse ertesi uygun ana (sessiz_bit) kaydırır. Saatler Türkiye saatiyle.
create or replace function public.spor_bildirim_zamani(p_an timestamptz default now())
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_yerel timestamp := p_an at time zone 'Europe/Istanbul';
  v_bas   time;
  v_bit   time;
  v_saat  time := v_yerel::time;
begin
  begin
    v_bas := public.spor_ayar('sessiz_bas', '22:00')::time;
    v_bit := public.spor_ayar('sessiz_bit', '08:30')::time;
  exception when others then
    v_bas := '22:00'; v_bit := '08:30';
  end;
  if v_bas = v_bit then return p_an; end if;

  if v_bas > v_bit then  -- gece yarısını aşan aralık (22:00–08:30)
    if v_saat >= v_bas then
      return ((v_yerel::date + 1) + v_bit) at time zone 'Europe/Istanbul';
    elsif v_saat < v_bit then
      return (v_yerel::date + v_bit) at time zone 'Europe/Istanbul';
    end if;
  elsif v_saat >= v_bas and v_saat < v_bit then
    return (v_yerel::date + v_bit) at time zone 'Europe/Istanbul';
  end if;
  return p_an;
end;
$$;

-- Tek kişiye bildirim yazar; anahtar tekrarsa sessizce geçer. Dönen: yazıldı mı?
create or replace function public.spor_bildirim_yaz(
  p_kullanici uuid, p_tur text, p_baslik text, p_govde text, p_yol text, p_anahtar text,
  p_an timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adet integer;
begin
  if p_kullanici is null then return false; end if;
  insert into public.spor_bildirimler (kullanici_id, tur, baslik, govde, yol, anahtar, gorunur_zaman, dis_gonderim)
  values (p_kullanici, p_tur, left(p_baslik, 140), left(p_govde, 600), p_yol, p_anahtar,
          p_an, public.spor_bildirim_zamani(p_an))
  on conflict (anahtar) do nothing;
  get diagnostics v_adet = row_count;
  return v_adet > 0;
end;
$$;

-- Kulüp yönetimine (yönetici + başkan) toplu bildirim
create or replace function public.spor_bildirim_yonetime(
  p_tur text, p_baslik text, p_govde text, p_yol text, p_anahtar text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_adet integer := 0;
begin
  for r in select id from public.spor_profiller where rol in ('yonetici', 'baskan') loop
    if public.spor_bildirim_yaz(r.id, p_tur, p_baslik, p_govde, p_yol, p_anahtar || ':' || r.id) then
      v_adet := v_adet + 1;
    end if;
  end loop;
  return v_adet;
end;
$$;

create or replace function public.spor_tl(p numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select '₺' || replace(replace(replace(to_char(coalesce(p, 0), 'FM999G999G990D00'), ',', '#'), '.', ','), '#', '.')
$$;

create or replace function public.spor_ay_adi(p_tarih date)
returns text
language sql
immutable
set search_path = public
as $$
  select (array['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'])
           [extract(month from p_tarih)::integer] || ' ' || extract(year from p_tarih)::integer
$$;

-- Okundu işareti: yalnızca kendi bildirimleri
create or replace function public.spor_bildirim_okundu(p_idler uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adet integer;
begin
  update public.spor_bildirimler
     set okundu = now()
   where kullanici_id = auth.uid()
     and okundu is null
     and gorunur_zaman <= now()
     and (p_idler is null or id = any (p_idler));
  get diagnostics v_adet = row_count;
  return v_adet;
end;
$$;

-- --------------------------------------------------- aidat hatırlatmaları
create or replace function public.spor_aidat_hatirlatmalari(p_bugun date default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bugun   date := coalesce(p_bugun, (now() at time zone 'Europe/Istanbul')::date);
  v_once    integer[];
  v_gecikme integer[];
  v_an      timestamptz := (v_bugun + time '10:00') at time zone 'Europe/Istanbul';
  r         record;
  v_fark    integer;
  v_tur     text;
  v_baslik  text;
  v_govde   text;
  v_adet    integer := 0;
begin
  if public.spor_ayar('hatirlatma', 'acik') = 'kapali' then
    return 0;
  end if;
  begin
    v_once := string_to_array(regexp_replace(public.spor_ayar('hatirlatma_once', '3'), '\s', '', 'g'), ',')::integer[];
  exception when others then v_once := array[3];
  end;
  begin
    v_gecikme := string_to_array(regexp_replace(public.spor_ayar('hatirlatma_gecikme', '3,10'), '\s', '', 'g'), ',')::integer[];
  exception when others then v_gecikme := array[3, 10];
  end;

  for r in
    select a.id, a.donem, a.tutar, a.son_odeme_tarihi, s.ad, s.veli_id,
           a.tutar - coalesce((select sum(o.tutar) from public.spor_odemeler o
                                where o.aidat_id = a.id and o.durum = 'onaylandi'), 0) as kalan
      from public.spor_aidatlar a
      join public.spor_sporcular s on s.id = a.sporcu_id
     where a.durum = 'bekliyor'
       and a.son_odeme_tarihi is not null
       and s.veli_id is not null
       and a.son_odeme_tarihi between v_bugun - 60 and v_bugun + 30
  loop
    if r.kalan <= 0 then continue; end if;
    v_fark := r.son_odeme_tarihi - v_bugun;
    v_tur := null;
    if v_fark > 0 and v_fark = any (v_once) then
      v_tur := 'aidat_yaklasiyor';
      v_baslik := public.spor_ay_adi(r.donem) || ' aidatı · ' || v_fark || ' gün kaldı';
      v_govde := r.ad || ' için ' || public.spor_tl(r.kalan) || ' ödenecek. Son ödeme: '
                 || to_char(r.son_odeme_tarihi, 'DD.MM.YYYY') || '.';
    elsif v_fark = 0 then
      v_tur := 'aidat_bugun';
      v_baslik := public.spor_ay_adi(r.donem) || ' aidatının son günü bugün';
      v_govde := r.ad || ' için ' || public.spor_tl(r.kalan) || ' ödenecek. Ödediyseniz dekontu yüklemeyi unutmayın.';
    elsif v_fark < 0 and (-v_fark) = any (v_gecikme) then
      v_tur := 'aidat_gecikti';
      v_baslik := public.spor_ay_adi(r.donem) || ' aidatı ' || (-v_fark) || ' gün gecikti';
      v_govde := r.ad || ' için ' || public.spor_tl(r.kalan) || ' bekleniyor. Bir sorun varsa kulüple konuşabilirsiniz.';
    end if;

    if v_tur is not null and public.spor_bildirim_yaz(
         r.veli_id, v_tur, v_baslik, v_govde, '/panel/aidat',
         'aidat:' || r.id || ':' || v_tur || ':' || v_fark, v_an) then
      v_adet := v_adet + 1;
    end if;
  end loop;
  return v_adet;
end;
$$;

-- Günlük iş: tahakkuk + hatırlatmalar (20261031'deki tanımın genişletilmiş hali)
create or replace function public.spor_gunluk_isler(p_bugun date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'tahakkuk',    public.spor_otomatik_tahakkuk(p_bugun),
    'hatirlatma',  public.spor_aidat_hatirlatmalari(p_bugun)
  );
end;
$$;

-- ---------------------------------------------------- olay tetikleyicileri
-- Yoklamada "gelmedi": veliye (yalnızca son 2 günün antrenmanları; geçmiş girişler sessiz)
create or replace function public.spor_bildirim_yoklama()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  if new.durum <> 'gelmedi' or (tg_op = 'UPDATE' and old.durum = 'gelmedi') then
    return new;
  end if;
  if public.spor_ayar('bildirim_gelmedi', 'acik') = 'kapali' then
    return new;
  end if;
  select s.ad, s.veli_id, a.tarih, a.baslik into v
    from public.spor_sporcular s, public.spor_antrenmanlar a
   where s.id = new.sporcu_id and a.id = new.antrenman_id;
  if v.veli_id is null or v.tarih < (now() at time zone 'Europe/Istanbul')::date - 1 then
    return new;
  end if;
  perform public.spor_bildirim_yaz(
    v.veli_id, 'yoklama_gelmedi',
    v.ad || ' antrenmana katılmadı',
    to_char(v.tarih, 'DD.MM.YYYY') || ' · ' || v.baslik || '. Bir yanlışlık varsa antrenörle konuşabilirsiniz.',
    '/panel/antrenman', 'gelmedi:' || new.id);
  return new;
end;
$$;

drop trigger if exists spor_bildirim_yoklama_trg on public.spor_yoklama;
create trigger spor_bildirim_yoklama_trg
  after insert or update of durum on public.spor_yoklama
  for each row execute function public.spor_bildirim_yoklama();

-- Ödeme: bildirilince yönetime, karar verilince bildirene
create or replace function public.spor_bildirim_odeme()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ad text;
begin
  select ad || ' ' || soyad into v_ad from public.spor_sporcular where id = new.sporcu_id;

  if tg_op = 'INSERT' and new.durum = 'beklemede' then
    perform public.spor_bildirim_yonetime(
      'yeni_odeme', 'Yeni ödeme bildirimi · ' || public.spor_tl(new.tutar),
      coalesce(v_ad, 'Sporcu') || ' için dekont onay bekliyor.', '/yonetim/odemeler', 'odeme:' || new.id);
  elsif tg_op = 'UPDATE' and new.durum is distinct from old.durum and new.bildiren_id is not null then
    if new.durum = 'onaylandi' then
      perform public.spor_bildirim_yaz(
        new.bildiren_id, 'odeme_onaylandi', 'Ödemeniz onaylandı · ' || public.spor_tl(new.tutar),
        coalesce(v_ad, 'Sporcu') || ' için ödemeniz kasaya işlendi. Teşekkürler.', '/panel/aidat',
        'odeme:' || new.id || ':onaylandi');
    elsif new.durum = 'reddedildi' then
      perform public.spor_bildirim_yaz(
        new.bildiren_id, 'odeme_reddedildi', 'Ödeme bildiriminiz onaylanmadı',
        coalesce(v_ad, 'Sporcu') || ' için ' || public.spor_tl(new.tutar) || ' tutarındaki bildirim onaylanmadı. '
          || coalesce('Not: ' || nullif(new.aciklama, ''), 'Ayrıntı için kulüple görüşün.'),
        '/panel/aidat', 'odeme:' || new.id || ':reddedildi');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists spor_bildirim_odeme_trg on public.spor_odemeler;
create trigger spor_bildirim_odeme_trg
  after insert or update of durum on public.spor_odemeler
  for each row execute function public.spor_bildirim_odeme();

-- Sporcu kaydı: başvuru yönetime, onay veliye
create or replace function public.spor_bildirim_sporcu()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.durum = 'onay_bekliyor' and (tg_op = 'INSERT' or old.durum is distinct from 'onay_bekliyor') then
    perform public.spor_bildirim_yonetime(
      'yeni_kayit', 'Yeni sporcu kaydı · ' || new.ad || ' ' || new.soyad,
      coalesce(new.yas_grubu || ' · ', '') || 'Veli başvurdu, onayınızı bekliyor.',
      '/yonetim/sporcular', 'kayit:' || new.id);
  elsif tg_op = 'UPDATE' and old.durum = 'onay_bekliyor' and new.durum = 'aktif' and new.veli_id is not null then
    perform public.spor_bildirim_yaz(
      new.veli_id, 'kayit_onaylandi', new.ad || ' kulübe kaydedildi',
      'Hoş geldiniz! Antrenman programı, yoklama ve gelişim takibi artık uygulamada.',
      '/panel/sporcu/' || new.id, 'kayit:' || new.id || ':onay');
  end if;
  return new;
end;
$$;

drop trigger if exists spor_bildirim_sporcu_trg on public.spor_sporcular;
create trigger spor_bildirim_sporcu_trg
  after insert or update of durum on public.spor_sporcular
  for each row execute function public.spor_bildirim_sporcu();

-- ------------------------------------------------------------ izinler
revoke execute on function public.spor_bildirim_zamani(timestamptz)                          from public, anon, authenticated;
revoke execute on function public.spor_bildirim_yaz(uuid, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.spor_bildirim_yonetime(text, text, text, text, text)       from public, anon, authenticated;
revoke execute on function public.spor_aidat_hatirlatmalari(date)                            from public, anon, authenticated;
revoke execute on function public.spor_gunluk_isler(date)                                    from public, anon, authenticated;
revoke execute on function public.spor_bildirim_yoklama()                                    from public, anon, authenticated;
revoke execute on function public.spor_bildirim_odeme()                                      from public, anon, authenticated;
revoke execute on function public.spor_bildirim_sporcu()                                     from public, anon, authenticated;
revoke execute on function public.spor_bildirim_okundu(uuid[])                               from public, anon;
grant  execute on function public.spor_bildirim_okundu(uuid[])                               to authenticated;
grant  execute on function public.spor_tl(numeric)                                           to authenticated;
grant  execute on function public.spor_ay_adi(date)                                          to authenticated;

notify pgrst, 'reload schema';

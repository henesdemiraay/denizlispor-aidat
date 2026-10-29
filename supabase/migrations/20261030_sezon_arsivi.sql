-- ============================================================================
-- 2026-10-30 · Sezon kapatma + Altyapı arşivi (Yuva)
--
-- Ne getirir
--   spor_sezonlar        Sezonun durumu (açık / mühürlü), kapanış notu ve mühürleme
--                        anındaki özet (maç, antrenman, devam, kadro istatistikleri).
--   spor_sezon_anilari   Sezon fotoğrafları ve anılar (kova: spor-arsiv).
--   spor_yukselenler     Altyapıdan üst takıma / millî takıma yükselenler.
--   Mühür koruması       Mühürlü sezona ait maç, kadro, antrenman ve yoklama
--                        kayıtları değiştirilemez ve silinemez.
--
-- KVKK notu: özet yalnızca sporcu kimliği (uuid) ve sayılar tutar; ad soyad
-- kopyalanmaz. Sporcu silinirse (silme hakkı) bağlı yoklama/katılım kayıtları
-- mühürlü sezonda da silinebilir; özetteki uuid artık hiçbir kişiye bağlanmaz.
--
-- Kural: RLS açık, yalnızca authenticated'a açık GRANT; anon'a hiçbir şey yok.
-- Tekrar çalıştırılabilir (if not exists / or replace / drop policy if exists).
-- Bağımlılık: spor_personel_mi(), spor_yonetici_mi(), spor_maclar,
--             spor_mac_katilim, spor_antrenmanlar, spor_yoklama, spor_sporcular
-- ============================================================================

-- ------------------------------------------------------------- yardımcılar
-- Sezon Eylül'de başlar: 2025–26 sezonu = 1 Eylül 2025 – 31 Ağustos 2026.
create or replace function public.spor_sezon_yili(p_tarih date)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
           when extract(month from p_tarih) >= 9 then extract(year from p_tarih)::integer
           else extract(year from p_tarih)::integer - 1
         end
$$;

create or replace function public.spor_sezon_adi(p_yil integer)
returns text
language sql
immutable
set search_path = public
as $$
  select p_yil::text || '–' || right((p_yil + 1)::text, 2)
$$;

-- ---------------------------------------------------------------- sezonlar
create table if not exists public.spor_sezonlar (
  yil              integer primary key check (yil between 2000 and 2100),
  durum            text not null default 'acik' check (durum in ('acik', 'muhurlu')),
  kapanis_notu     text check (char_length(kapanis_notu) <= 2000),
  ozet             jsonb not null default '{}'::jsonb,
  muhurleme_zamani timestamptz,
  muhurleyen_id    uuid references auth.users (id) on delete set null,
  -- mühürleme / mühür açma geçmişi: [{islem, zaman, kim, neden}]
  gecmis           jsonb not null default '[]'::jsonb,
  updated_at       timestamptz not null default now()
);

alter table public.spor_sezonlar enable row level security;
revoke all on public.spor_sezonlar from anon;
grant select on public.spor_sezonlar to authenticated;

drop policy if exists "sezon_okuma" on public.spor_sezonlar;
create policy "sezon_okuma" on public.spor_sezonlar
  for select to authenticated
  using (true);
-- Ekleme / değiştirme politikası bilerek YOK: yalnızca aşağıdaki fonksiyonlarla.

-- Bir tarih mühürlü bir sezona mı düşüyor?
create or replace function public.spor_sezon_muhurlu_mu(p_tarih date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_tarih is not null and exists (
    select 1 from public.spor_sezonlar
    where yil = public.spor_sezon_yili(p_tarih) and durum = 'muhurlu'
  )
$$;

-- --------------------------------------------------------------- sezon özeti
-- Mühürlemeden önce önizleme için de kullanılır. Çağıranın RLS yetkisiyle çalışır.
create or replace function public.spor_sezon_ozeti(p_yil integer)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_bas date := make_date(p_yil, 9, 1);
  v_bit date := make_date(p_yil + 1, 8, 31);
  v_sonuc jsonb;
begin
  if not public.spor_personel_mi() then
    raise exception 'Sezon özetini yalnızca kulüp personeli görebilir.';
  end if;

  with
  maclar as (
    select * from public.spor_maclar where tarih between v_bas and v_bit
  ),
  sonuclu as (
    select * from maclar where skor_biz is not null and skor_rakip is not null
  ),
  antrenmanlar as (
    select * from public.spor_antrenmanlar where tarih between v_bas and v_bit
  ),
  katilim as (
    select k.sporcu_id,
           count(*) filter (where k.dakika > 0 or k.ilk_onbir) as mac,
           coalesce(sum(k.dakika), 0)  as dakika,
           coalesce(sum(k.gol), 0)     as gol,
           coalesce(sum(k.asist), 0)   as asist
    from public.spor_mac_katilim k
    join maclar m on m.id = k.mac_id
    group by k.sporcu_id
  ),
  devam as (
    select y.sporcu_id,
           count(*) filter (where y.durum in ('geldi', 'gec')) as geldi,
           count(*) filter (where y.durum <> 'izinli')         as sayilan
    from public.spor_yoklama y
    join antrenmanlar a on a.id = y.antrenman_id
    group by y.sporcu_id
  ),
  kadro as (
    select coalesce(k.sporcu_id, d.sporcu_id) as sporcu_id,
           s.yas_grubu,
           s.forma_no,
           coalesce(k.mac, 0)    as mac,
           coalesce(k.dakika, 0) as dakika,
           coalesce(k.gol, 0)    as gol,
           coalesce(k.asist, 0)  as asist,
           coalesce(d.geldi, 0)  as antrenman_geldi,
           coalesce(d.sayilan, 0) as antrenman_sayilan
    from katilim k
    full join devam d on d.sporcu_id = k.sporcu_id
    left join public.spor_sporcular s on s.id = coalesce(k.sporcu_id, d.sporcu_id)
  ),
  yoklama_toplam as (
    select coalesce(sum(geldi), 0) as geldi, coalesce(sum(sayilan), 0) as sayilan from devam
  )
  select jsonb_build_object(
    'sezon',        p_yil,
    'ad',           public.spor_sezon_adi(p_yil),
    'bas',          v_bas,
    'bit',          v_bit,
    'mac',          (select count(*) from maclar),
    'galibiyet',    (select count(*) from sonuclu where skor_biz > skor_rakip),
    'beraberlik',   (select count(*) from sonuclu where skor_biz = skor_rakip),
    'maglubiyet',   (select count(*) from sonuclu where skor_biz < skor_rakip),
    'gol_atilan',   (select coalesce(sum(skor_biz), 0) from sonuclu),
    'gol_yenilen',  (select coalesce(sum(skor_rakip), 0) from sonuclu),
    'antrenman',    (select count(*) from antrenmanlar),
    'antrenman_dk', (select coalesce(sum(sure_dk), 0) from antrenmanlar),
    'devam_orani',  (select case when sayilan > 0 then round(100.0 * geldi / sayilan) end from yoklama_toplam),
    'yas_gruplari', coalesce((
                      select jsonb_agg(g order by g)
                      from (
                        select distinct yas_grubu as g from maclar where yas_grubu is not null
                        union
                        select distinct yas_grubu from antrenmanlar where yas_grubu is not null
                      ) t
                    ), '[]'::jsonb),
    'sporcu',       (select count(*) from kadro),
    'kadro',        coalesce((
                      select jsonb_agg(to_jsonb(k) order by k.gol desc, k.dakika desc)
                      from kadro k
                    ), '[]'::jsonb),
    'olusturma',    now()
  ) into v_sonuc;

  return v_sonuc;
end;
$$;

-- --------------------------------------------------------------- mühürleme
create or replace function public.spor_sezon_muhurle(p_yil integer, p_not text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bugun date := (now() at time zone 'Europe/Istanbul')::date;
  v_ozet  jsonb;
begin
  if not public.spor_yonetici_mi() then
    raise exception 'Sezonu yalnızca kulüp yönetimi mühürleyebilir.';
  end if;
  if make_date(p_yil + 1, 8, 31) >= v_bugun then
    raise exception '% sezonu henüz bitmedi; 31 Ağustos''tan sonra mühürlenebilir.',
      public.spor_sezon_adi(p_yil);
  end if;
  if exists (select 1 from public.spor_sezonlar where yil = p_yil and durum = 'muhurlu') then
    raise exception '% sezonu zaten mühürlü.', public.spor_sezon_adi(p_yil);
  end if;

  v_ozet := public.spor_sezon_ozeti(p_yil);

  insert into public.spor_sezonlar as s
    (yil, durum, kapanis_notu, ozet, muhurleme_zamani, muhurleyen_id, gecmis, updated_at)
  values
    (p_yil, 'muhurlu', nullif(trim(p_not), ''), v_ozet, now(), auth.uid(),
     jsonb_build_array(jsonb_build_object('islem', 'muhurle', 'zaman', now(), 'kim', auth.uid())),
     now())
  on conflict (yil) do update set
    durum            = 'muhurlu',
    kapanis_notu     = coalesce(nullif(trim(excluded.kapanis_notu), ''), s.kapanis_notu),
    ozet             = excluded.ozet,
    muhurleme_zamani = excluded.muhurleme_zamani,
    muhurleyen_id    = excluded.muhurleyen_id,
    gecmis           = s.gecmis || jsonb_build_object('islem', 'muhurle', 'zaman', now(), 'kim', auth.uid()),
    updated_at       = now();

  return v_ozet;
end;
$$;

-- Mührü açmak istisnadır: gerekçe zorunlu, geçmişe yazılır, özet saklanır.
create or replace function public.spor_sezon_muhur_ac(p_yil integer, p_neden text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.spor_yonetici_mi() then
    raise exception 'Mührü yalnızca kulüp yönetimi açabilir.';
  end if;
  if char_length(trim(coalesce(p_neden, ''))) < 5 then
    raise exception 'Mührü açmak için gerekçe yazın (en az 5 karakter).';
  end if;

  update public.spor_sezonlar
     set durum      = 'acik',
         gecmis     = gecmis || jsonb_build_object(
                        'islem', 'muhur_ac', 'zaman', now(), 'kim', auth.uid(), 'neden', trim(p_neden)),
         updated_at = now()
   where yil = p_yil and durum = 'muhurlu';

  if not found then
    raise exception '% sezonu mühürlü değil.', public.spor_sezon_adi(p_yil);
  end if;
end;
$$;

-- Kapanış notu mühürden bağımsız düzenlenebilir (ör. sezon sonu yazısı sonradan).
create or replace function public.spor_sezon_not_kaydet(p_yil integer, p_not text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.spor_yonetici_mi() then
    raise exception 'Kapanış notunu yalnızca kulüp yönetimi yazabilir.';
  end if;
  insert into public.spor_sezonlar as s (yil, kapanis_notu, updated_at)
  values (p_yil, nullif(trim(p_not), ''), now())
  on conflict (yil) do update set kapanis_notu = excluded.kapanis_notu, updated_at = now();
end;
$$;

-- ----------------------------------------------------------- mühür koruması
create or replace function public.spor_muhur_koruma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eski date;
  v_yeni date;
begin
  -- Sporcu silindiğinde (KVKK silme hakkı) zincirleme silinen alt kayıtlar engellenmez.
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  if tg_table_name in ('spor_maclar', 'spor_antrenmanlar') then
    if tg_op <> 'INSERT' then v_eski := old.tarih; end if;
    if tg_op <> 'DELETE' then v_yeni := new.tarih; end if;
  elsif tg_table_name = 'spor_mac_katilim' then
    if tg_op <> 'INSERT' then select tarih into v_eski from public.spor_maclar where id = old.mac_id; end if;
    if tg_op <> 'DELETE' then select tarih into v_yeni from public.spor_maclar where id = new.mac_id; end if;
  elsif tg_table_name = 'spor_yoklama' then
    if tg_op <> 'INSERT' then select tarih into v_eski from public.spor_antrenmanlar where id = old.antrenman_id; end if;
    if tg_op <> 'DELETE' then select tarih into v_yeni from public.spor_antrenmanlar where id = new.antrenman_id; end if;
  end if;

  if public.spor_sezon_muhurlu_mu(v_eski) or public.spor_sezon_muhurlu_mu(v_yeni) then
    raise exception '% sezonu mühürlendi; kayıtları değiştirilemez.',
      public.spor_sezon_adi(public.spor_sezon_yili(coalesce(v_eski, v_yeni)))
      using hint = 'Değişiklik gerekiyorsa kulüp yönetimi Sezonlar ekranından mührü gerekçe yazarak açabilir.',
            errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists spor_muhur_koruma on public.spor_maclar;
create trigger spor_muhur_koruma
  before insert or update or delete on public.spor_maclar
  for each row execute function public.spor_muhur_koruma();

drop trigger if exists spor_muhur_koruma on public.spor_mac_katilim;
create trigger spor_muhur_koruma
  before insert or update or delete on public.spor_mac_katilim
  for each row execute function public.spor_muhur_koruma();

drop trigger if exists spor_muhur_koruma on public.spor_antrenmanlar;
create trigger spor_muhur_koruma
  before insert or update or delete on public.spor_antrenmanlar
  for each row execute function public.spor_muhur_koruma();

drop trigger if exists spor_muhur_koruma on public.spor_yoklama;
create trigger spor_muhur_koruma
  before insert or update or delete on public.spor_yoklama
  for each row execute function public.spor_muhur_koruma();

-- ---------------------------------------------------------- sezon anıları
create table if not exists public.spor_sezon_anilari (
  id          uuid primary key default gen_random_uuid(),
  sezon_yil   integer not null check (sezon_yil between 2000 and 2100),
  baslik      text not null check (char_length(baslik) between 2 and 120),
  aciklama    text check (char_length(aciklama) <= 1000),
  foto_yolu   text,                          -- spor-arsiv kovasında
  tarih       date,
  yas_grubu   text,
  ekleyen_id  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists spor_sezon_anilari_sezon_idx
  on public.spor_sezon_anilari (sezon_yil, tarih desc nulls last, created_at desc);

alter table public.spor_sezon_anilari enable row level security;
revoke all on public.spor_sezon_anilari from anon;
grant select, insert, update, delete on public.spor_sezon_anilari to authenticated;

drop policy if exists "ani_okuma" on public.spor_sezon_anilari;
create policy "ani_okuma" on public.spor_sezon_anilari
  for select to authenticated using (true);

drop policy if exists "ani_ekleme" on public.spor_sezon_anilari;
create policy "ani_ekleme" on public.spor_sezon_anilari
  for insert to authenticated with check (public.spor_personel_mi());

drop policy if exists "ani_duzenleme" on public.spor_sezon_anilari;
create policy "ani_duzenleme" on public.spor_sezon_anilari
  for update to authenticated
  using (public.spor_personel_mi()) with check (public.spor_personel_mi());

-- Silme yalnızca yönetimde (arşiv kuralı)
drop policy if exists "ani_silme" on public.spor_sezon_anilari;
create policy "ani_silme" on public.spor_sezon_anilari
  for delete to authenticated using (public.spor_yonetici_mi());

-- ------------------------------------------------------------- yükselenler
create table if not exists public.spor_yukselenler (
  id          uuid primary key default gen_random_uuid(),
  sporcu_id   uuid references public.spor_sporcular (id) on delete set null,
  ad_soyad    text not null check (char_length(ad_soyad) between 2 and 80),
  sezon_yil   integer not null check (sezon_yil between 1950 and 2100),
  hedef       text not null check (char_length(hedef) between 2 and 80),  -- "A Takım", "U17 Millî Takım"
  mevki       text check (char_length(mevki) <= 40),
  aciklama    text check (char_length(aciklama) <= 500),
  foto_yolu   text,                          -- spor-arsiv kovasında
  ekleyen_id  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists spor_yukselenler_sezon_idx on public.spor_yukselenler (sezon_yil desc);

alter table public.spor_yukselenler enable row level security;
revoke all on public.spor_yukselenler from anon;
grant select, insert, update, delete on public.spor_yukselenler to authenticated;

drop policy if exists "yukselen_okuma" on public.spor_yukselenler;
create policy "yukselen_okuma" on public.spor_yukselenler
  for select to authenticated using (true);

drop policy if exists "yukselen_yazma" on public.spor_yukselenler;
create policy "yukselen_yazma" on public.spor_yukselenler
  for insert to authenticated with check (public.spor_yonetici_mi());

drop policy if exists "yukselen_duzenleme" on public.spor_yukselenler;
create policy "yukselen_duzenleme" on public.spor_yukselenler
  for update to authenticated
  using (public.spor_yonetici_mi()) with check (public.spor_yonetici_mi());

drop policy if exists "yukselen_silme" on public.spor_yukselenler;
create policy "yukselen_silme" on public.spor_yukselenler
  for delete to authenticated using (public.spor_yonetici_mi());

-- -------------------------------------------------------------- dosya kovası
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('spor-arsiv', 'spor-arsiv', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "spor_arsiv_okuma" on storage.objects;
create policy "spor_arsiv_okuma" on storage.objects
  for select to authenticated
  using (bucket_id = 'spor-arsiv');

drop policy if exists "spor_arsiv_yukleme" on storage.objects;
create policy "spor_arsiv_yukleme" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'spor-arsiv' and public.spor_personel_mi());

drop policy if exists "spor_arsiv_silme" on storage.objects;
create policy "spor_arsiv_silme" on storage.objects
  for delete to authenticated
  using (bucket_id = 'spor-arsiv' and public.spor_yonetici_mi());

-- ------------------------------------------------------------ fonksiyon izni
revoke execute on function public.spor_sezon_yili(date)                from public, anon;
revoke execute on function public.spor_sezon_adi(integer)              from public, anon;
revoke execute on function public.spor_sezon_muhurlu_mu(date)          from public, anon;
revoke execute on function public.spor_sezon_ozeti(integer)            from public, anon;
revoke execute on function public.spor_sezon_muhurle(integer, text)    from public, anon;
revoke execute on function public.spor_sezon_muhur_ac(integer, text)   from public, anon;
revoke execute on function public.spor_sezon_not_kaydet(integer, text) from public, anon;
revoke execute on function public.spor_muhur_koruma()                  from public, anon;

grant execute on function public.spor_sezon_yili(date)                to authenticated;
grant execute on function public.spor_sezon_adi(integer)              to authenticated;
grant execute on function public.spor_sezon_muhurlu_mu(date)          to authenticated;
grant execute on function public.spor_sezon_ozeti(integer)            to authenticated;
grant execute on function public.spor_sezon_muhurle(integer, text)    to authenticated;
grant execute on function public.spor_sezon_muhur_ac(integer, text)   to authenticated;
grant execute on function public.spor_sezon_not_kaydet(integer, text) to authenticated;

notify pgrst, 'reload schema';

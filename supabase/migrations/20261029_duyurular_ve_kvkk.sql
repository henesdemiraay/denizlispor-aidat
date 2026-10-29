-- ============================================================================
-- 2026-10-29 · Duyurular + KVKK açık rıza
-- Kural: RLS açık, yalnızca authenticated'a açık GRANT; anon'a hiçbir şey yok.
-- Tekrar çalıştırılabilir (if not exists / drop policy if exists).
-- Bağımlılık: spor_personel_mi(), spor_yonetici_mi()  (mevcut şemada var)
-- ============================================================================

-- ---------------------------------------------------------------- duyurular
create table if not exists public.spor_duyurular (
  id              uuid primary key default gen_random_uuid(),
  baslik          text not null check (char_length(baslik) between 2 and 120),
  icerik          text not null check (char_length(icerik) between 1 and 2000),
  hedef_rol       text not null default 'herkes'
                  check (hedef_rol in ('herkes', 'veli', 'sporcu', 'personel')),
  hedef_yas_grubu text,                       -- boş = tüm yaş grupları
  onemli          boolean not null default false,
  bitis_tarihi    date,                       -- boş = süresiz
  yazan_id        uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists spor_duyurular_created_idx on public.spor_duyurular (created_at desc);

alter table public.spor_duyurular enable row level security;
revoke all on public.spor_duyurular from anon;
grant select, insert, update, delete on public.spor_duyurular to authenticated;

drop policy if exists "duyuru_okuma" on public.spor_duyurular;
create policy "duyuru_okuma" on public.spor_duyurular
  for select to authenticated
  using (hedef_rol <> 'personel' or public.spor_personel_mi());

drop policy if exists "duyuru_ekleme" on public.spor_duyurular;
create policy "duyuru_ekleme" on public.spor_duyurular
  for insert to authenticated
  with check (public.spor_personel_mi());

drop policy if exists "duyuru_duzenleme" on public.spor_duyurular;
create policy "duyuru_duzenleme" on public.spor_duyurular
  for update to authenticated
  using (public.spor_personel_mi()) with check (public.spor_personel_mi());

-- Silme yalnızca yönetimde (arşiv kuralı)
drop policy if exists "duyuru_silme" on public.spor_duyurular;
create policy "duyuru_silme" on public.spor_duyurular
  for delete to authenticated
  using (public.spor_yonetici_mi());

-- ------------------------------------------------------- okundu bilgisi
create table if not exists public.spor_duyuru_okunma (
  duyuru_id    uuid not null references public.spor_duyurular (id) on delete cascade,
  kullanici_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  okunma       timestamptz not null default now(),
  primary key (duyuru_id, kullanici_id)
);

alter table public.spor_duyuru_okunma enable row level security;
revoke all on public.spor_duyuru_okunma from anon;
grant select, insert on public.spor_duyuru_okunma to authenticated;

drop policy if exists "okunma_kendi" on public.spor_duyuru_okunma;
create policy "okunma_kendi" on public.spor_duyuru_okunma
  for select to authenticated
  using (kullanici_id = auth.uid() or public.spor_personel_mi());

drop policy if exists "okunma_ekle" on public.spor_duyuru_okunma;
create policy "okunma_ekle" on public.spor_duyuru_okunma
  for insert to authenticated
  with check (kullanici_id = auth.uid());

-- ------------------------------------------------------------- KVKK rıza
-- Değiştirilemez kayıt: kişi hangi metin sürümünü ne zaman onayladı.
create table if not exists public.spor_rizalar (
  id           uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  metin_surumu text not null,
  aydinlatma   boolean not null default true,  -- aydınlatma metnini okudum
  acik_riza    boolean not null,               -- fotoğraf / gelişim verisi işlenmesine açık rıza
  iletisim     boolean not null default false, -- duyuru ve hatırlatma iletileri
  created_at   timestamptz not null default now()
);

create index if not exists spor_rizalar_kullanici_idx on public.spor_rizalar (kullanici_id, created_at desc);

alter table public.spor_rizalar enable row level security;
revoke all on public.spor_rizalar from anon;
grant select, insert on public.spor_rizalar to authenticated;

drop policy if exists "riza_okuma" on public.spor_rizalar;
create policy "riza_okuma" on public.spor_rizalar
  for select to authenticated
  using (kullanici_id = auth.uid() or public.spor_yonetici_mi());

drop policy if exists "riza_ekle" on public.spor_rizalar;
create policy "riza_ekle" on public.spor_rizalar
  for insert to authenticated
  with check (kullanici_id = auth.uid());

-- Güncelleme ve silme politikası bilerek YOK: rıza kaydı değiştirilemez.
-- Rıza geri alma / değiştirme = yeni satır; geçerli olan kişinin en son satırıdır.

notify pgrst, 'reload schema';

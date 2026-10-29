-- Zimmet: sporcuya verilen forma, eşofman, top, çanta… kayıtları.
-- Yönetim verir ve iade alır; personel görür; veli kendi çocuğununkini görür.
-- İade tarihi geçen eşyalar için veliye günlük işle hatırlatma gider (1. ve 7. gün).

create table if not exists public.spor_zimmetler (
  id           uuid primary key default gen_random_uuid(),
  sporcu_id    uuid not null references public.spor_sporcular(id) on delete cascade,
  esya         text not null check (char_length(btrim(esya)) between 1 and 80),
  beden        text check (beden is null or char_length(beden) <= 20),
  adet         integer not null default 1 check (adet between 1 and 99),
  verilis      date not null default ((now() at time zone 'Europe/Istanbul')::date),
  iade_beklenen date,
  iade_edildi  date,
  notlar       text check (notlar is null or char_length(notlar) <= 300),
  olusturan    uuid default auth.uid(),
  created_at   timestamptz not null default now(),
  check (iade_beklenen is null or iade_beklenen >= verilis),
  check (iade_edildi is null or iade_edildi >= verilis)
);
create index if not exists spor_zimmetler_sporcu_idx on public.spor_zimmetler (sporcu_id);
create index if not exists spor_zimmetler_acik_idx on public.spor_zimmetler (iade_beklenen) where iade_edildi is null;

alter table public.spor_zimmetler enable row level security;
drop policy if exists spor_zimmetler_select on public.spor_zimmetler;
create policy spor_zimmetler_select on public.spor_zimmetler for select to authenticated using (
  public.spor_personel_mi()
  or exists (select 1 from public.spor_sporcular s
              where s.id = sporcu_id and (s.veli_id = auth.uid() or s.sporcu_kullanici_id = auth.uid()))
);
drop policy if exists spor_zimmetler_yonetici_yaz on public.spor_zimmetler;
create policy spor_zimmetler_yonetici_yaz on public.spor_zimmetler for all to authenticated
  using (public.spor_yonetici_mi()) with check (public.spor_yonetici_mi());
grant select, insert, update, delete on public.spor_zimmetler to authenticated;

-- Bildirim türlerine zimmet iadesi
alter table public.spor_bildirimler drop constraint if exists spor_bildirimler_tur_check;
alter table public.spor_bildirimler add constraint spor_bildirimler_tur_check check (tur in (
  'aidat_yaklasiyor', 'aidat_bugun', 'aidat_gecikti',
  'yoklama_gelmedi', 'odeme_onaylandi', 'odeme_reddedildi',
  'kayit_onaylandi', 'yeni_odeme', 'yeni_kayit', 'deneme_dersi', 'zimmet_iade'));

-- İadesi geciken zimmetler için veliye hatırlatma (gecikmenin 1. ve 7. günü, 10:00)
create or replace function public.spor_zimmet_hatirlatmalari(p_bugun date default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bugun date := coalesce(p_bugun, (now() at time zone 'Europe/Istanbul')::date);
  v_an    timestamptz := (v_bugun + time '10:00') at time zone 'Europe/Istanbul';
  r       record;
  v_adet  integer := 0;
begin
  if public.spor_ayar('hatirlatma', 'acik') = 'kapali' then
    return 0;
  end if;
  for r in
    select z.id, z.esya, z.adet, z.iade_beklenen, s.id as sporcu_id, s.ad, s.veli_id, v_bugun - z.iade_beklenen as fark
      from public.spor_zimmetler z
      join public.spor_sporcular s on s.id = z.sporcu_id
     where z.iade_edildi is null
       and z.iade_beklenen is not null
       and s.veli_id is not null
       and v_bugun - z.iade_beklenen in (1, 7)
  loop
    if public.spor_bildirim_yaz(
         r.veli_id, 'zimmet_iade',
         r.ad || ': ' || case when r.adet > 1 then r.adet || ' adet ' else '' end || r.esya || ' iadesi gecikti',
         'İade tarihi ' || to_char(r.iade_beklenen, 'DD.MM.YYYY') || ' idi. Lütfen antrenmana getirin.',
         '/panel/sporcu/' || r.sporcu_id, 'zimmet:' || r.id || ':' || r.fark, v_an) then
      v_adet := v_adet + 1;
    end if;
  end loop;
  return v_adet;
end;
$$;

create or replace function public.spor_gunluk_isler(p_bugun date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'tahakkuk',    public.spor_otomatik_tahakkuk(p_bugun),
    'hatirlatma',  public.spor_aidat_hatirlatmalari(p_bugun),
    'zimmet',      public.spor_zimmet_hatirlatmalari(p_bugun)
  );
end;
$$;

revoke execute on function public.spor_zimmet_hatirlatmalari(date) from public, anon, authenticated;
revoke execute on function public.spor_gunluk_isler(date)          from public, anon, authenticated;

notify pgrst, 'reload schema';

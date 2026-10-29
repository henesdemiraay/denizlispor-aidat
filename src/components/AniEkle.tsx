"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fotografKucult } from "@/lib/gorsel";
import { ARSIV_KOVASI } from "@/lib/arsiv";
import { sezonAdi } from "@/lib/sezon";

/** Sezon arşivine fotoğraflı anı ekler (antrenör ve yönetim). */
export default function AniEkle({ yil }: { yil: number }) {
  const router = useRouter();
  const yol = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const [acik, setAcik] = useState(false);
  const [bekle, setBekle] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [onizleme, setOnizleme] = useState<string | null>(null);

  async function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const veri = new FormData(e.currentTarget);
    const baslik = String(veri.get("baslik") ?? "").trim();
    if (baslik.length < 2) {
      setHata("Kısa bir başlık yazın.");
      return;
    }
    setHata(null);
    setBekle(true);
    const supabase = createClient();

    let fotoYolu: string | null = null;
    const dosya = veri.get("foto");
    if (dosya instanceof File && dosya.size > 0) {
      const kucuk = await fotografKucult(dosya);
      const uzanti = kucuk.type === "image/png" ? "png" : kucuk.type === "image/webp" ? "webp" : "jpg";
      fotoYolu = `${yil}/${crypto.randomUUID()}.${uzanti}`;
      const { error } = await supabase.storage
        .from(ARSIV_KOVASI)
        .upload(fotoYolu, kucuk, { contentType: kucuk.type || "image/jpeg" });
      if (error) {
        setBekle(false);
        setHata("Fotoğraf yüklenemedi. JPEG ya da PNG, en fazla 5 MB olmalı.");
        return;
      }
    }

    const { error } = await supabase.from("spor_sezon_anilari").insert({
      sezon_yil: yil,
      baslik,
      aciklama: String(veri.get("aciklama") ?? "").trim() || null,
      tarih: String(veri.get("tarih") ?? "") || null,
      yas_grubu: String(veri.get("yas_grubu") ?? "").trim() || null,
      foto_yolu: fotoYolu,
    });
    setBekle(false);
    if (error) {
      setHata(`Kaydedilemedi: ${error.message}`);
      return;
    }
    form.current?.reset();
    setOnizleme(null);
    setAcik(false);
    router.replace(`${yol}?sezon=${yil}&kaydedildi=${encodeURIComponent("Anı arşive eklendi")}`, {
      scroll: false,
    });
    router.refresh();
  }

  if (!acik) {
    return (
      <button type="button" className="btn-ikincil w-full" onClick={() => setAcik(true)}>
        + {sezonAdi(yil)} arşivine anı / fotoğraf ekle
      </button>
    );
  }

  return (
    <form ref={form} onSubmit={gonder} className="kart space-y-3 px-4 py-4">
      <p className="text-sm font-bold text-neutral-900">Yeni anı · {sezonAdi(yil)}</p>

      <label className="block cursor-pointer">
        <span className="etiket">Fotoğraf</span>
        {onizleme ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={onizleme} alt="Seçilen fotoğraf" className="aspect-[4/3] w-full rounded-xl object-cover" />
        ) : (
          <span className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500">
            Fotoğraf seçmek için dokunun
          </span>
        )}
        <input
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setOnizleme(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>

      <div>
        <label className="etiket" htmlFor="ani-baslik">Başlık *</label>
        <input id="ani-baslik" name="baslik" className="alan" maxLength={120} required
          placeholder="Ör. Sezon sonu takım fotoğrafı" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiket" htmlFor="ani-tarih">Tarih</label>
          <input id="ani-tarih" name="tarih" type="date" className="alan" />
        </div>
        <div>
          <label className="etiket" htmlFor="ani-grup">Yaş grubu</label>
          <input id="ani-grup" name="yas_grubu" className="alan" placeholder="U12" />
        </div>
      </div>
      <div>
        <label className="etiket" htmlFor="ani-aciklama">Not</label>
        <textarea id="ani-aciklama" name="aciklama" rows={3} maxLength={1000} className="alan"
          placeholder="O gün ne oldu, kimler vardı…" />
      </div>
      <p className="text-xs leading-relaxed text-neutral-500">
        Fotoğrafta çocuklar varsa velilerinin açık rıza verdiğinden emin olun. Arşivi yalnızca
        kulübe kayıtlı hesaplar görür.
      </p>
      {hata ? <p className="text-sm text-red-600">{hata}</p> : null}
      <div className="flex gap-2">
        <button type="button" className="btn-ikincil flex-1" onClick={() => setAcik(false)} disabled={bekle}>
          Vazgeç
        </button>
        <button className="btn-birincil flex-1" disabled={bekle}>
          {bekle ? "Yükleniyor…" : "Arşive ekle"}
        </button>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SURUM_NOTLARI, rolNotlari, type SurumNotu } from "@/lib/surumNotlari";

const ANAHTAR = "dsp:son-gorulen-surum";

function oku(): string | null {
  try {
    return window.localStorage.getItem(ANAHTAR);
  } catch {
    return null;
  }
}

function yaz(deger: string) {
  try {
    window.localStorage.setItem(ANAHTAR, deger);
  } catch {
    /* gizli sekme vb. — bir sonraki açılışta yeniden gösterilir */
  }
}

/** Uygulama açılınca, kişinin henüz görmediği sürüm notlarını gösterir. */
export default function SurumNotlari({ rol }: { rol: string }) {
  const [notlar, setNotlar] = useState<SurumNotu[]>([]);
  const tamamRef = useRef<HTMLButtonElement>(null);
  const enYeni = SURUM_NOTLARI[0]?.surum;

  useEffect(() => {
    if (!enYeni) return;
    const gorulen = oku();
    if (gorulen === enYeni) return;

    // Hiç kayıt yoksa yalnızca en son notu göster; varsa o sürümden sonrakilerin tamamını.
    const sira = gorulen ? SURUM_NOTLARI.findIndex((n) => n.surum === gorulen) : -1;
    const yeniler = gorulen
      ? SURUM_NOTLARI.slice(0, sira === -1 ? SURUM_NOTLARI.length : sira)
      : SURUM_NOTLARI.slice(0, 1);
    const izinli = new Set(rolNotlari(rol).map((n) => n.surum));
    const gosterilecek = yeniler.filter((n) => izinli.has(n.surum));

    if (gosterilecek.length === 0) {
      yaz(enYeni);
      return;
    }
    const t = setTimeout(() => setNotlar(gosterilecek), 700);
    return () => clearTimeout(t);
  }, [enYeni, rol]);

  useEffect(() => {
    if (!notlar.length) return;
    tamamRef.current?.focus();
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notlar.length]);

  function kapat() {
    if (enYeni) yaz(enYeni);
    setNotlar([]);
  }

  if (!notlar.length) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center">
      <button aria-label="Kapat" className="absolute inset-0 cursor-default" onClick={kapat} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="surum-baslik"
        className="yazi-giris relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-yuzey px-5 ring-1 ring-white/10 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-[28px]"
      >
        <span aria-hidden className="mx-auto mb-4 block h-1 w-10 rounded-full bg-neutral-200 sm:hidden" />
        <p className="bolum-basligi">Yenilikler</p>

        <div className="mt-2 space-y-6">
          {notlar.map((n) => (
            <article key={n.surum}>
              <h2 id={n === notlar[0] ? "surum-baslik" : undefined} className="manset text-[30px] text-white">
                {n.baslik}
              </h2>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
                {n.tarih}
              </p>
              <ul className="mt-3 space-y-2.5">
                {n.maddeler.map((m) => (
                  <li key={m} className="flex gap-3 text-[15px] leading-snug text-neutral-800">
                    <span
                      aria-hidden
                      className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yesil-500 text-anametin"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button ref={tamamRef} type="button" onClick={kapat} className="btn-birincil w-full">
            Tamam
          </button>
          <Link href="/yenilikler" onClick={kapat} className="btn w-full text-neutral-600">
            Tüm yenilikler
          </Link>
        </div>
      </section>
    </div>
  );
}

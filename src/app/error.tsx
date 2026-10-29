"use client";

import { useEffect } from "react";

/** Bir ekran beklenmedik bir hata verdiğinde gösterilir; uygulamanın geri kalanı çalışmaya devam eder. */
export default function HataSayfasi({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ekran-hatasi]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-siyah px-6 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-yesil-500">BİR AKSAKLIK OLDU</p>
      <h1 className="manset mt-2 text-5xl text-white">Mola</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
        Bu ekran şu an açılamadı. Bağlantınızı kontrol edip yeniden deneyin; sorun sürerse kulübe
        bildirin.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-neutral-400">Kod: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
        <button onClick={reset} className="btn-birincil">
          Yeniden dene
        </button>
        <a href="/git" className="btn-ikincil">
          Ana ekrana dön
        </a>
      </div>
    </main>
  );
}

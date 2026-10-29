import Image from "next/image";
import { KULUP, KULUP_MANSET } from "@/kulup";

/**
 * Giriş / kayıt / şifre ekranlarının kabuğu.
 * Telefon: üstte arma, altta yukarı kayan form kartı.
 * Geniş ekran (≥1024 px): solda kulüp kimliği, sağda ortalanmış form.
 */
export default function AuthKabuk({
  baslik,
  altBaslik,
  children,
}: {
  baslik: string;
  altBaslik?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-siyah lg:flex-row">
      <div className="relative flex flex-col items-center overflow-hidden px-6 pb-8 pt-12 lg:w-[46%] lg:justify-center lg:pb-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 hidden h-[28rem] w-[28rem] rounded-full border border-yesil-500/15 lg:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 hidden h-[22rem] w-[22rem] rounded-full border border-yesil-500/10 lg:block"
        />
        <Image
          src={KULUP.arma}
          unoptimized={KULUP.arma.endsWith(".svg")}
          alt={`${KULUP.kisaAd} arması`}
          width={78}
          height={78}
          priority
          className="relative lg:h-[132px] lg:w-[132px]"
        />
        <h1 className="manset relative mt-4 text-4xl text-white lg:mt-6 lg:text-6xl">{KULUP_MANSET}</h1>
        <p className="relative mt-1.5 font-mono text-[11px] font-medium tracking-[0.18em] text-yesil-500 lg:text-xs">
          {KULUP.etiket.toLocaleUpperCase("tr-TR")}
        </p>
        <p className="relative mt-6 hidden max-w-sm text-center text-sm leading-relaxed text-neutral-500 lg:block">
          Antrenman, yoklama, gelişim, aidat ve sezon arşivi tek yerde. Veli görür, kulüp hesap verir.
        </p>
      </div>

      <div className="flex-1 rounded-t-3xl bg-yuzey px-5 pb-10 pt-7 lg:flex lg:items-center lg:rounded-none lg:px-12 lg:py-12">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="manset text-[34px] text-white">{baslik}</h2>
          {altBaslik ? (
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{altBaslik}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}

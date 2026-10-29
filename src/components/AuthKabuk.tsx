import Image from "next/image";
import { KULUP, KULUP_MANSET } from "@/kulup";

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
    <main className="flex min-h-dvh flex-col bg-siyah">
      <div className="flex flex-col items-center px-6 pb-8 pt-12">
        <Image src={KULUP.arma} unoptimized={KULUP.arma.endsWith(".svg")} alt={`${KULUP.kisaAd} arması`} width={78} height={78} priority />
        <h1 className="manset mt-4 text-4xl text-white">{KULUP_MANSET}</h1>
        <p className="mt-1.5 font-mono text-[11px] font-medium tracking-[0.18em] text-yesil-500">
          {KULUP.etiket.toLocaleUpperCase("tr-TR")}
        </p>
      </div>

      <div className="flex-1 rounded-t-3xl bg-yuzey px-5 pb-10 pt-7">
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

import Link from "next/link";
import Image from "next/image";
import { KULUP } from "@/kulup";

export default function BulunamadiSayfasi() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-siyah px-6 text-center">
      <Image
        src={KULUP.arma}
        unoptimized={KULUP.arma.endsWith(".svg")}
        alt={`${KULUP.kisaAd} arması`}
        width={72}
        height={72}
        className="opacity-80"
      />
      <p className="mt-6 font-mono text-[11px] tracking-[0.2em] text-yesil-500">HATA 404</p>
      <h1 className="manset mt-2 text-5xl text-white">Ofsayt</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
        Aradığınız sayfa burada değil. Bağlantı eskimiş ya da adres yanlış yazılmış olabilir.
      </p>
      <Link href="/git" className="btn-birincil mt-8 w-full max-w-xs">
        Ana ekrana dön
      </Link>
    </main>
  );
}

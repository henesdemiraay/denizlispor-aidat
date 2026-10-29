import Link from "next/link";
import AuthKabuk from "@/components/AuthKabuk";
import { aydinlatmaMetni, KVKK_SURUMU } from "@/lib/kvkk";

export const metadata = { title: "KVKK aydınlatma metni" };

export default function KvkkAydinlatma() {
  return (
    <AuthKabuk baslik="Kişisel veriler" altBaslik={`Aydınlatma metni · sürüm ${KVKK_SURUMU}`}>
      <div className="space-y-5">
        {aydinlatmaMetni().map((b) => (
          <section key={b.baslik}>
            <h3 className="bolum-basligi">{b.baslik}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">{b.metin}</p>
          </section>
        ))}
      </div>
      <Link href="/giris" className="btn-ikincil mt-8 w-full">
        Girişe dön
      </Link>
    </AuthKabuk>
  );
}

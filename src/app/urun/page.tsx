import Link from "next/link";
import KurulumSihirbazi from "@/components/urun/KurulumSihirbazi";
import { KULUP } from "@/kulup";

export const metadata = {
  title: "Yuva — futbol altyapıları için sporcu takip",
  description:
    "Antrenman, yoklama, gelişim, aidat ve şeffaf kasa tek uygulamada. Her kulübe kendi adı, arması ve renkleriyle, ayrı veritabanında kurulur.",
};

const ROLLER: { kim: string; ozet: string; neler: string[] }[] = [
  {
    kim: "Veli",
    ozet: "Çocuğunun kulüp hayatını cebinden izler.",
    neler: [
      "Sıradaki antrenman: gün, saat, yer",
      "Devam oranı ve antrenör notları",
      "Sporcu pasaportu, sezon kartı ve karnesi",
      "Aidat borcu, havale dekontu yükleme",
      "Kulübün kasası: toplanan, aktarılan, harcanan",
    ],
  },
  {
    kim: "Antrenör",
    ozet: "Saha kenarında, telefonla, bir dakikada.",
    neler: [
      "Antrenman günlüğü: ne çalışıldı, hedef ne",
      "İsme dokunarak yoklama",
      "Beş alanda dönem değerlendirmesi",
      "Boy, kilo, sprint ölçümleri ve eğrileri",
      "Velilere duyuru, okunma takibi",
    ],
  },
  {
    kim: "Yönetim",
    ozet: "Kulübün parası ve hafızası kayıt altında.",
    neler: [
      "Aylık aidat tahakkuku kendiliğinden",
      "Ödeme onayı, gecikenler, kasa hareketleri",
      "Yetki talepleri ve rol atama",
      "Değiştirilen her kaydın arşivi",
      "Excel'e dışa aktarım",
    ],
  },
];

const GUVENCE: { baslik: string; metin: string }[] = [
  {
    baslik: "Her kulübün kendi veritabanı",
    metin: "Çocuk verisi kulüpler arasında asla karışmaz. Kulüp ayrılırsa verisi tek parça teslim edilir.",
  },
  {
    baslik: "Satır düzeyinde yetki",
    metin: "Veli yalnızca kendi çocuğunu görür; sporcu hesabı para ekranlarını hiç görmez. Kural veritabanında, ekranda değil.",
  },
  {
    baslik: "Silinen bile kaybolmaz",
    metin: "Her değişiklik ve silme işleminin önceki hali arşive yazılır; silme yetkisi yalnızca yönetimde.",
  },
  {
    baslik: "KVKK akışı hazır",
    metin: "Aydınlatma metni, sürümlü açık rıza kaydı ve rızayı geri alma ekranı uygulamanın içinde.",
  },
];

const KURULUM = [
  "Kulübün adı, arması ve renkleri alınır (aşağıdaki sihirbazla aynı).",
  "Kulübe özel veritabanı açılır, şema ve erişim kuralları yüklenir.",
  "Uygulama kulübün adresinde yayına alınır.",
  "Yönetici hesabı açılır; IBAN, aidat ve yaş grupları girilir.",
  "Veliler davet edilir; ilk antrenman yoklamasıyla kulüp canlıdadır.",
];

export default function UrunVitrini() {
  return (
    <main className="min-h-dvh bg-zemin text-white">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <nav className="flex items-center justify-between py-6">
          <span className="manset text-2xl">Yuva</span>
          <Link href="/giris" className="text-sm font-semibold text-yesil-700 underline-offset-4 hover:underline">
            {KULUP.kisaAd} kurulumuna gir
          </Link>
        </nav>

        <header className="pb-10 pt-8 sm:pt-14">
          <h1 className="manset max-w-[16ch] text-[clamp(38px,10.5vw,88px)] leading-[0.9] [overflow-wrap:anywhere]">
            Her çocuğun kulüp hikâyesi, kulübünüzün renginde.
          </h1>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-neutral-600">
            Yuva, futbol altyapıları için sporcu takip uygulaması. Antrenman, yoklama, gelişim, aidat ve
            kasa tek yerde; veli telefonundan görür, kulüp hesap verir. Aşağıda kendi kulübünüzü deneyin.
          </p>
        </header>

        <section aria-labelledby="sihirbaz" className="border-t border-white/10 py-12">
          <h2 id="sihirbaz" className="manset text-4xl">Kendi kulübünüzle görün</h2>
          <p className="mt-2 max-w-[60ch] text-neutral-500">
            Adı yazın, renkleri seçin: uygulama anında o kulübe bürünür. Bu ekrandaki yapılandırma, gerçek
            kurulumda kullanılan dosyanın ta kendisi.
          </p>
          <div className="mt-8">
            <KurulumSihirbazi />
          </div>
        </section>

        <section aria-labelledby="roller" className="border-t border-white/10 py-12">
          <h2 id="roller" className="manset text-4xl">Üç ekran, tek kayıt</h2>
          <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/10">
            {ROLLER.map((r) => (
              <div key={r.kim} className="md:px-7 md:first:pl-0 md:last:pr-0">
                <h3 className="manset text-3xl text-yesil-500">{r.kim}</h3>
                <p className="mt-2 text-[15px] text-neutral-700">{r.ozet}</p>
                <ul className="mt-4 space-y-2 text-[15px] leading-snug text-neutral-600">
                  {r.neler.map((n) => (
                    <li key={n} className="flex gap-2.5">
                      <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-yesil-500" />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="guvence" className="border-t border-white/10 py-12">
          <h2 id="guvence" className="manset text-4xl">Çocuk verisi emanettir</h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {GUVENCE.map((g) => (
              <div key={g.baslik}>
                <dt className="text-lg font-bold">{g.baslik}</dt>
                <dd className="mt-1.5 max-w-[52ch] leading-relaxed text-neutral-600">{g.metin}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="kurulum" className="border-t border-white/10 py-12">
          <h2 id="kurulum" className="manset text-4xl">Kurulum beş adımda</h2>
          <ol className="mt-8 max-w-3xl space-y-5">
            {KURULUM.map((k, i) => (
              <li key={k} className="flex items-baseline gap-5">
                <span className="manset w-8 shrink-0 text-right text-4xl text-yesil-500">{i + 1}</span>
                <span className="text-[17px] leading-relaxed text-neutral-700">{k}</span>
              </li>
            ))}
          </ol>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 py-10 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Bu sayfa {KULUP.ad} kurulumunda çalışıyor. Kurulum ve lisans için kulüp yönetimiyle görüşün.
          </p>
          <Link href="/kvkk" className="underline underline-offset-4">
            Aydınlatma metni
          </Link>
        </footer>
      </div>
    </main>
  );
}

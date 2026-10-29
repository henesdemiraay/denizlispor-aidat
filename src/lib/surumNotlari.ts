import type { Rol } from "@/lib/roller";

/**
 * Sürüm notları — her güncellemede EN ÜSTE yeni bir kayıt eklenir.
 *
 * - `surum` benzersiz olmalı (tarih + gerekirse harf: "2026.10.29", "2026.10.29b").
 * - `roller` verilirse not yalnızca o rollere gösterilir (ör. kasa notunu sporcu görmez).
 *   Verilmezse herkese gösterilir.
 * - Uygulama açılınca kişi, en son gördüğü sürümden sonraki notları bir pencerede görür.
 * - Metinler veli diliyle, kısa yazılır; teknik ayrıntı yazılmaz.
 */
export type SurumNotu = {
  surum: string;
  tarih: string;
  baslik: string;
  maddeler: string[];
  roller?: Rol[];
};

export const SURUM_NOTLARI: SurumNotu[] = [
  {
    surum: "2026.10.29b",
    tarih: "29 Ekim 2026",
    baslik: "Sporcu Pasaportu ve Sezon Kartı",
    maddeler: [
      "Yeni koyu görünüm: kulübün siyahı üzerinde yeşil.",
      "Ana sayfada sıradaki antrenman en üstte: gün, saat, yer.",
      "Sporcu sayfası artık bir pasaport: ilk antrenmandan ilk gole kadar yolculuk tek bakışta.",
      "Sezon Kartı: antrenör değerlendirmesiyle oluşan, yazdırıp saklanabilecek bir kart.",
    ],
  },
  {
    surum: "2026.10.29",
    tarih: "29 Ekim 2026",
    baslik: "Yeni Denizlispor kimliği",
    maddeler: [
      "Uygulama artık kulübün resmî renkleriyle: yeşil, siyah ve beyaz.",
      "Yeni yazı stili: başlıklar stadyum tabelası gibi, metinler telefonda daha rahat okunuyor.",
      "Her güncellemeden sonra yenilikleri uygulamayı açtığınızda bu pencerede göreceksiniz.",
    ],
  },
];

export function rolNotlari(rol: string): SurumNotu[] {
  return SURUM_NOTLARI.filter((n) => !n.roller || n.roller.includes(rol as Rol));
}

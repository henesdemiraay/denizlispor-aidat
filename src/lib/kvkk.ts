import { KULUP } from "@/kulup";

/**
 * KVKK aydınlatma metni ve açık rıza.
 * Metin değişince SURUM artırılır; herkes bir sonraki girişte yeni metni onaylar.
 * NOT: Taslaktır — satış öncesi kulübün hukuk danışmanı onaylamalıdır.
 */
export const KVKK_SURUMU = "2026-10";

export function aydinlatmaMetni() {
  const k = KULUP;
  return [
    {
      baslik: "Veri sorumlusu",
      metin: `${k.resmiAd} (“Kulüp”), 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusudur. Bu uygulama yalnızca ${k.ad} için kurulmuştur; veriler başka bir kulüple paylaşılmaz ve aynı veritabanında tutulmaz.`,
    },
    {
      baslik: "İşlenen veriler",
      metin:
        "Veli ve sporcunun kimlik ve iletişim bilgileri; sporcunun yaş grubu, mevki, antrenman katılımı, antrenör değerlendirmeleri, fiziksel ölçümleri, maç istatistikleri, fotoğrafı ve kulübe yüklenen belgeler; aidat ve ödeme kayıtları.",
    },
    {
      baslik: "Amaç ve hukuki sebep",
      metin:
        "Sporcunun kulüp kaydının ve lisans işlemlerinin yürütülmesi, antrenman ve gelişimin takibi, aidatların izlenmesi ve velinin bilgilendirilmesi. Kayıt, yoklama ve aidat bilgileri sözleşmenin ifası ve kulübün meşru menfaati; fotoğraf ve gelişim verileri açık rızanız ile işlenir.",
    },
    {
      baslik: "Saklama ve aktarım",
      metin:
        "Veriler Avrupa Birliği'nde bulunan, şifreli bağlantıyla erişilen bir bulut veritabanında saklanır. Her kayda yalnızca yetkili kulüp personeli ve ilgili veli erişebilir; tüm değişiklikler arşivlenir. Kayıt sona erdiğinde veriler yasal saklama sürelerinin ardından silinir veya anonimleştirilir.",
    },
    {
      baslik: "Haklarınız",
      metin:
        "KVKK'nın 11. maddesi uyarınca verilerinize erişme, düzeltilmesini veya silinmesini isteme ve açık rızanızı her zaman geri alma hakkınız vardır. Başvurularınızı kulüp yönetimine iletebilirsiniz.",
    },
  ];
}

export type RizaKaydi = { acik_riza: boolean; iletisim: boolean; metin_surumu: string; created_at: string };

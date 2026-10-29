/**
 * Önümüzdeki `gun` gün içinde doğum günü olan sporcular (bugün dahil).
 * 29 Şubat doğumlular artık yılda 28 Şubat'ta kutlanır.
 */
export function yaklasanDogumGunleri<T extends { dogum_tarihi: string | null }>(
  sporcular: T[],
  bugun: string,
  gun = 7,
) {
  const [by, bm, bd] = bugun.split("-").map(Number);
  const bas = Date.UTC(by, bm - 1, bd);
  const sonuc: { sporcu: T; kalan: number; yas: number }[] = [];

  for (const s of sporcular) {
    if (!s.dogum_tarihi) continue;
    const [dy, dm, dd] = s.dogum_tarihi.slice(0, 10).split("-").map(Number);
    for (const yil of [by, by + 1]) {
      const artikDegil = dm === 2 && dd === 29 && !(yil % 4 === 0 && (yil % 100 !== 0 || yil % 400 === 0));
      const t = Date.UTC(yil, dm - 1, artikDegil ? 28 : dd);
      const kalan = Math.round((t - bas) / 86_400_000);
      if (kalan >= 0 && kalan < gun) {
        sonuc.push({ sporcu: s, kalan, yas: yil - dy });
        break;
      }
      if (kalan >= 0) break;
    }
  }
  return sonuc.sort((a, b) => a.kalan - b.kalan);
}

export function kalanGunMetni(kalan: number) {
  if (kalan === 0) return "Bugün";
  if (kalan === 1) return "Yarın";
  return `${kalan} gün sonra`;
}

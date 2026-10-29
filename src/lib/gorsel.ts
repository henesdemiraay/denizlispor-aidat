/**
 * Telefondan çekilen fotoğrafı yüklemeden önce küçültür (uzun kenar en fazla `enFazla`
 * piksel, JPEG). Böylece 6–10 MB'lık fotoğraflar ~300–600 KB'a iner, kova sınırı
 * (5 MB) aşılmaz ve arşiv sayfaları hızlı açılır. Tarayıcı çözemezse (ör. bazı HEIC)
 * dosya olduğu gibi döner.
 */
export async function fotografKucult(dosya: File, enFazla = 1600, kalite = 0.85): Promise<Blob> {
  try {
    const bit = await createImageBitmap(dosya, { imageOrientation: "from-image" });
    const oran = Math.min(1, enFazla / Math.max(bit.width, bit.height));
    const g = Math.round(bit.width * oran);
    const y = Math.round(bit.height * oran);
    const tuval = document.createElement("canvas");
    tuval.width = g;
    tuval.height = y;
    const ctx = tuval.getContext("2d");
    if (!ctx) return dosya;
    ctx.drawImage(bit, 0, 0, g, y);
    bit.close();
    const blob = await new Promise<Blob | null>((coz) => tuval.toBlob(coz, "image/jpeg", kalite));
    return blob && blob.size < dosya.size ? blob : dosya;
  } catch {
    return dosya;
  }
}

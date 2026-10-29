/**
 * Giriş / kayıt sonrası "devam" adresi yalnızca bu uygulamanın içindeki bir yol olabilir.
 * "//site.com" ve "/\site.com" gibi tarayıcının başka siteye götürdüğü biçimler reddedilir
 * (açık yönlendirme koruması).
 */
export function guvenliYol(devam: string | null | undefined, varsayilan = "/git") {
  if (!devam) return varsayilan;
  if (!devam.startsWith("/") || devam.startsWith("//") || devam.startsWith("/\\")) return varsayilan;
  if (/[\u0000-\u001f]/.test(devam)) return varsayilan;
  return devam;
}

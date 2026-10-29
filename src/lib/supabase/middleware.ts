import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { guvenliYol } from "@/lib/yonlendirme";

const KORUMASIZ = ["/giris", "/kayit", "/sifremi-unuttum", "/sifre-yenile"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getClaims: oturum jetonunu imzasından yerel olarak doğrular (yeni imza anahtarlarında
  // Auth sunucusuna gitmez); gerekiyorsa süresi dolan oturumu da tazeler. Her sayfa
  // geçişinde bir ağ çağrısı eksilir.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const yol = request.nextUrl.pathname;
  const korumasiz = KORUMASIZ.some((p) => yol.startsWith(p));

  const korumali =
    yol.startsWith("/panel") ||
    yol.startsWith("/yonetim") ||
    yol.startsWith("/antrenor") ||
    yol.startsWith("/git");

  if (!user && korumali) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("devam", yol);
    return NextResponse.redirect(url);
  }

  if (user && korumasiz) {
    const url = request.nextUrl.clone();
    const devam = request.nextUrl.searchParams.get("devam");
    url.pathname = "/git";
    url.search = "";
    // Ön kayıt gibi bağlantılarda girişli kişi gideceği yere götürülür
    if (devam && guvenliYol(devam, "") !== "") url.searchParams.set("devam", guvenliYol(devam));
    return NextResponse.redirect(url);
  }

  return response;
}

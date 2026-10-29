import { NextResponse } from "next/server";
import { KULUP } from "@/kulup";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { SURUM_NOTLARI } from "@/lib/surumNotlari";

export const dynamic = "force-dynamic";

/**
 * Sağlık ucu: çalışma süresi izleyicileri (UptimeRobot, Better Stack vb.) için.
 * Kişisel veri dönmez; yalnızca kulüp kodu, sürüm ve veritabanı erişilebilirliği.
 */
export async function GET() {
  const baslangic = Date.now();
  let veritabani: "ok" | "hata" = "hata";
  try {
    const yanit = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (yanit.ok) veritabani = "ok";
  } catch {
    veritabani = "hata";
  }
  const durum = veritabani === "ok" ? "ok" : "bozuk";
  return NextResponse.json(
    {
      durum,
      kulup: KULUP.kod,
      surum: SURUM_NOTLARI[0]?.surum ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      veritabani,
      sure_ms: Date.now() - baslangic,
      zaman: new Date().toISOString(),
    },
    { status: durum === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvOlustur } from "@/lib/csv";
import { DISA_AKTARIMLAR } from "@/lib/disaAktar";
import { yoneticiMi } from "@/lib/roller";
import { KULUP } from "@/kulup";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ tur: string }> }) {
  const { tur } = await params;
  const tanim = DISA_AKTARIMLAR[tur];
  if (!tanim) return NextResponse.json({ hata: "Bilinmeyen dışa aktarım" }, { status: 404 });

  const supabase = await createClient();
  const { data: profil } = await supabase.rpc("spor_profil");
  if (!profil || !yoneticiMi((profil as { rol: string }).rol)) {
    return NextResponse.json({ hata: "Bu işlem yalnızca kulüp yönetimine açık" }, { status: 403 });
  }

  const { data, error } = await tanim.getir(supabase);
  if (error) return NextResponse.json({ hata: error.message }, { status: 500 });

  const tarih = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const csv = csvOlustur(tanim.sutunlar, (data ?? []) as Record<string, unknown>[]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${KULUP.kod}-${tur}-${tarih}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

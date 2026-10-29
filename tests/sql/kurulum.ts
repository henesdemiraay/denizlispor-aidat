import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";

const kok = join(__dirname, "..", "..");
const gocKlasoru = join(kok, "supabase/migrations");

export const GOCLER = readdirSync(gocKlasoru).filter((d) => d.endsWith(".sql")).sort();

export function gocOku(ad: string) {
  // PGlite'ta PostgREST yok
  return readFileSync(join(gocKlasoru, ad), "utf8").replace(/notify pgrst,\s*'reload schema';/g, "");
}

export type Rol = "yonetici" | "baskan" | "antrenor" | "yardimci_antrenor" | "veli" | "sporcu";

/**
 * Boş bir Postgres'e Supabase platform taklidini ve depodaki tüm göçleri (tarih sırasıyla)
 * uygular — yeni bir kulübün kurulumuyla aynı sıra.
 */
export async function veritabaniKur() {
  const db = new PGlite();
  await db.exec(readFileSync(join(__dirname, "supabase-platform.sql"), "utf8"));
  for (const g of GOCLER) {
    try {
      await db.exec(gocOku(g));
    } catch (e) {
      throw new Error(`${g} uygulanamadı: ${(e as Error).message}`);
    }
  }
  return db;
}

/** Uygulamadan kayıt olmuş gibi kullanıcı açar (profil tetikleyiciyle oluşur), rolünü atar. */
export async function kullaniciAc(db: PGlite, eposta: string, rol: Rol) {
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data) values ($1, '{"uygulama":"spor"}') returning id`,
    [eposta],
  );
  const id = rows[0].id;
  await db.query(`update public.spor_profiller set rol = $2 where id = $1`, [id, rol]);
  return id;
}

/** Uygulamadaki gibi: authenticated rolüyle, verilen kullanıcının oturumunda çalıştırır. */
export async function oturumla<T = Record<string, unknown>>(
  db: PGlite,
  kullaniciId: string | null,
  sql: string,
  params: unknown[] = [],
  rol: "authenticated" | "anon" = "authenticated",
) {
  return db.transaction(async (tx: Transaction) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [kullaniciId ?? ""]);
    await tx.query(`set local role ${rol}`);
    return (await tx.query<T>(sql, params)).rows;
  });
}

export async function hataMesaji(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return (e as Error).message;
  }
  return null;
}

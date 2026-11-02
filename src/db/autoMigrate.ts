/**
 * src/db/autoMigrate.ts
 * Executa as migrações automaticamente se o banco for criado em /tmp (Vercel)
 */

import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./client";
import path from "path";

let migrado = false;

export async function garantirMigracaoPronta() {
  if (migrado) return;
  try {
    const migrationsFolder = path.join(process.cwd(), "src", "db", "migrations");
    await migrate(db, { migrationsFolder });
    migrado = true;
  } catch (err) {
    console.warn("Aviso na migração em runtime:", err);
  }
}

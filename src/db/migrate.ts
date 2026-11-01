/**
 * src/db/migrate.ts
 * Executa as migrações do banco de dados.
 * Uso: pnpm db:migrate
 */

import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./client";
import path from "path";

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

async function main() {
  console.info("🗄️  Executando migrações...");
  await migrate(db, { migrationsFolder });
  console.info("✅ Migrações concluídas.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});

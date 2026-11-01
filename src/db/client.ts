/**
 * src/db/client.ts
 * Cliente Drizzle ORM com @libsql/client (SQLite local via arquivo)
 */

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = process.env["DATABASE_URL"] ?? "data/dev.db";

// Garantir que o diretório data/ existe
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const client = createClient({
  url: `file:${DB_PATH}`,
});

export const db = drizzle(client, { schema });
export type Db = typeof db;

/**
 * src/db/client.ts
 * Cliente Drizzle ORM compatível com Vercel Serverless e ambiente Local
 */

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

function obterUrlBanco(): string {
  // 1. Se fornecida URL remota (Turso / LibSQL Cloud)
  if (process.env["DATABASE_URL"] && (process.env["DATABASE_URL"].startsWith("libsql://") || process.env["DATABASE_URL"].startsWith("https://"))) {
    return process.env["DATABASE_URL"];
  }

  // 2. Se estiver na Vercel (read-only filesystem), direciona para /tmp
  if (process.env["VERCEL"] || process.env["AWS_LAMBDA_FUNCTION_NAME"]) {
    const tmpPath = "/tmp/dev.db";
    return `file:${tmpPath}`;
  }

  // 3. Ambiente local padrão
  const dbRelPath = process.env["DATABASE_URL"] ?? "data/dev.db";
  const absPath = path.isAbsolute(dbRelPath) ? dbRelPath : path.join(process.cwd(), dbRelPath);
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return `file:${absPath}`;
}

const clientUrl = obterUrlBanco();
const clientAuthToken = process.env["DATABASE_AUTH_TOKEN"];

const client = createClient({
  url: clientUrl,
  ...(clientAuthToken ? { authToken: clientAuthToken } : {}),
});

export const db = drizzle(client, { schema });
export type Db = typeof db;

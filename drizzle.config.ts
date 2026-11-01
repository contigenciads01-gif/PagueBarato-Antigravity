import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: "file:./data/dev.db",
  },
} satisfies Config;

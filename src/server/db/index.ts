import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local se não estiver em ambiente Next.js
if (!process.env.DATABASE_URL && typeof window === "undefined") {
  config({ path: resolve(process.cwd(), ".env.local") });
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL, {
  max: 10,
});

export const db = drizzle(client, { schema });

export type Db = typeof db;


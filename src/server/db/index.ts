import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local se não estiver em ambiente Next.js
if (!process.env.DATABASE_URL && typeof window === "undefined") {
  config({ path: resolve(process.cwd(), ".env.local") });
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Durante o build do Next.js, usar uma URL placeholder temporária
    // Isso permite que o build complete sem erro
    const isBuildTime = process.env.NEXT_PHASE?.includes("build");
    if (isBuildTime) {
      return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
    }
    // Em runtime de produção, DATABASE_URL é obrigatório
    if (process.env.NODE_ENV === "production" && !isBuildTime) {
      throw new Error("DATABASE_URL is required in production");
    }
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const client = postgres(getDatabaseUrl(), {
  max: 10,
});

export const db = drizzle(client, { schema });

export type Db = typeof db;


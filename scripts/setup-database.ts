import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

// Carregar .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/server/db";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  try {
    console.log("Executando schema do banco de dados...");
    
    const schemaSQL = readFileSync(resolve(__dirname, "../sql/schema.sql"), "utf-8");
    
    // Remover comentários e dividir em comandos
    const commands = schemaSQL
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim().length > 0)
      .join("\n")
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0);

    for (const command of commands) {
      if (command.trim() && !command.trim().startsWith("--")) {
        try {
          await db.execute(sql.raw(command));
          console.log(`✓ Executado`);
        } catch (error: any) {
          // Ignorar erros de "already exists"
          if (
            error.message?.includes("already exists") ||
            error.code?.includes("42P07") ||
            error.code === "42710" ||
            error.message?.includes("duplicate")
          ) {
            console.log(`⊘ Já existe: ${command.substring(0, 40)}...`);
          } else {
            console.error(`✗ Erro:`, error.message || error.code);
          }
        }
      }
    }

    console.log("\n✓ Schema do banco de dados executado com sucesso!");
    console.log("\nAgora você pode criar o super admin executando:");
    console.log("npx tsx scripts/create-super-admin.ts admin@crivus.com Admin@123");
  } catch (error: any) {
    console.error("Erro ao configurar banco de dados:", error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setupDatabase();


import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/server/db";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
    console.log("Criando tabelas do banco de dados...\n");

    // Criar enums primeiro
    console.log("1. Criando enums...");
    try {
      await db.execute(sql.raw(`CREATE TYPE role AS ENUM ('super_admin', 'friend')`));
      console.log("   ✓ Enum 'role' criado");
    } catch (e: any) {
      if (e.code === "42710") console.log("   ⊘ Enum 'role' já existe");
      else throw e;
    }

    try {
      await db.execute(sql.raw(`CREATE TYPE member_role AS ENUM ('viewer')`));
      console.log("   ✓ Enum 'member_role' criado");
    } catch (e: any) {
      if (e.code === "42710") console.log("   ⊘ Enum 'member_role' já existe");
      else throw e;
    }

    // Criar tabela users
    console.log("\n2. Criando tabela 'users'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        pass_hash TEXT NOT NULL,
        role role NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )
    `));
    console.log("   ✓ Tabela 'users' criada");

    // Criar tabela invites
    console.log("\n3. Criando tabela 'invites'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        role role NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        one_time BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `));
    console.log("   ✓ Tabela 'invites' criada");

    // Criar tabela trackers
    console.log("\n4. Criando tabela 'trackers'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS trackers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tracker_id TEXT UNIQUE NOT NULL,
        owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        site_url TEXT NOT NULL,
        origins TEXT[] NOT NULL DEFAULT '{}',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        page_rules JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ
      )
    `));
    console.log("   ✓ Tabela 'trackers' criada");

    // Criar tabela tracker_members
    console.log("\n5. Criando tabela 'tracker_members'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS tracker_members (
        tracker_id TEXT NOT NULL REFERENCES trackers(tracker_id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role member_role NOT NULL DEFAULT 'viewer',
        PRIMARY KEY (tracker_id, user_id)
      )
    `));
    console.log("   ✓ Tabela 'tracker_members' criada");

    // Criar tabela events
    console.log("\n6. Criando tabela 'events'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        ts BIGINT NOT NULL,
        ev TEXT NOT NULL,
        sid TEXT NOT NULL,
        tracker_id TEXT NOT NULL REFERENCES trackers(tracker_id) ON DELETE CASCADE,
        page_url TEXT NOT NULL,
        path TEXT NOT NULL,
        ref TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_term TEXT,
        utm_content TEXT,
        sw INT,
        sh INT,
        quiz_id TEXT,
        question_id TEXT,
        answer_id TEXT,
        extra JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `));
    console.log("   ✓ Tabela 'events' criada");

    // Criar índices para events
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_events_tracker_ts ON events(tracker_id, ts)`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_events_tracker_path ON events(tracker_id, path)`));
    console.log("   ✓ Índices de 'events' criados");

    // Criar tabela leads
    console.log("\n7. Criando tabela 'leads'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS leads (
        id BIGSERIAL PRIMARY KEY,
        ts BIGINT NOT NULL,
        tracker_id TEXT NOT NULL REFERENCES trackers(tracker_id) ON DELETE CASCADE,
        sid TEXT NOT NULL,
        email TEXT,
        name TEXT,
        phone TEXT,
        extra JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `));
    console.log("   ✓ Tabela 'leads' criada");

    // Criar índice para leads
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_leads_tracker_ts ON leads(tracker_id, ts)`));
    console.log("   ✓ Índice de 'leads' criado");

    // Criar tabela policies
    console.log("\n8. Criando tabela 'policies'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS policies (
        id BOOLEAN PRIMARY KEY DEFAULT TRUE,
        max_trackers_per_user INT NOT NULL DEFAULT 10,
        max_collect_rps_per_origin INT NOT NULL DEFAULT 10,
        retention_days INT NOT NULL DEFAULT 365,
        allowed_origins TEXT[] NOT NULL DEFAULT '{}'
      )
    `));
    console.log("   ✓ Tabela 'policies' criada");

    // Inserir políticas padrão
    try {
      await db.execute(sql.raw(`
        INSERT INTO policies (id, max_trackers_per_user, max_collect_rps_per_origin, retention_days, allowed_origins)
        VALUES (true, 10, 10, 365, '{}')
      `));
      console.log("   ✓ Políticas padrão inseridas");
    } catch (e: any) {
      if (e.code === "23505") console.log("   ⊘ Políticas padrão já existem");
      else throw e;
    }

    // Criar tabela auth_attempts
    console.log("\n9. Criando tabela 'auth_attempts'...");
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS auth_attempts (
        id BIGSERIAL PRIMARY KEY,
        email TEXT,
        ip INET,
        success BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `));
    console.log("   ✓ Tabela 'auth_attempts' criada");

    // Criar índices para auth_attempts
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_created ON auth_attempts(email, created_at)`));
    await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_created ON auth_attempts(ip, created_at)`));
    console.log("   ✓ Índices de 'auth_attempts' criados");

    console.log("\n✅ Todas as tabelas foram criadas com sucesso!\n");
    console.log("Agora você pode criar o super admin executando:");
    console.log("npx tsx scripts/create-super-admin.ts admin@crivus.com Admin@123\n");
  } catch (error: any) {
    console.error("\n❌ Erro ao criar tabelas:", error.message);
    console.error("Código:", error.code);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createTables();


import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/server/db";
import { users } from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth";

async function createSuperAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-super-admin.ts <email> <password>");
    process.exit(1);
  }

  try {
    const passHash = await hashPassword(password);

    const result = await db
      .insert(users)
      .values({
        email,
        passHash,
        role: "super_admin",
      })
      .returning();

    console.log(`Super admin created: ${result[0].email}`);
    console.log(`User ID: ${result[0].id}`);
  } catch (error: any) {
    if (error.code === "23505") {
      console.error(`User with email ${email} already exists`);
    } else {
      console.error("Error creating super admin:", error);
    }
    process.exit(1);
  }
}

createSuperAdmin();


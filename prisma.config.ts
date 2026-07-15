// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  // Use DIRECT_URL (port 5432) for schema changes.
  // DATABASE_URL uses Supabase PgBouncer (port 6543) and hangs on db push/migrate.
  datasource: {
    url: process.env.DIRECT_URL,
  },
});

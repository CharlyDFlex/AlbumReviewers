import { defineConfig } from "prisma/config";

// Prisma config files don't auto-load .env files. This project keeps the
// database URL in prisma/.env (see prisma/.env.example) so it stays
// separate from the app's own .env.local.
try {
  process.loadEnvFile("prisma/.env");
} catch {
  // Missing locally is fine if DATABASE_URL is already set in the
  // environment (e.g. CI, or a hosting provider's env vars).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

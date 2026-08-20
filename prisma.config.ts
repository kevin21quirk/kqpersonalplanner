import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL = non-pooled connection for Prisma CLI (migrate, db push, generate)
// Falls back to DATABASE_URL if DIRECT_URL is not set
const datasourceUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});

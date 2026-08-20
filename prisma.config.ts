import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Use direct (non-pooled) connection for CLI operations
  datasource: {
    url: env("DIRECT_URL"),
  },
});

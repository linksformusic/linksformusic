import path from "node:path";

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: path.join(process.cwd(), "../../.env"), quiet: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:password@localhost:5432/projects",
  },
  strict: true,
  verbose: true,
});

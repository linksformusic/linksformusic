import path from "node:path";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load the monorepo-root .env so all apps share one source of truth.
loadEnvConfig(path.join(import.meta.dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@linksformusic/ui"],
};

export default nextConfig;

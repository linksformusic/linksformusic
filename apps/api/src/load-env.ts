import path from "node:path";

import { config } from "dotenv";

// Load the monorepo-root .env before any module that reads process.env at
// import time (e.g. the db client). Missing file is a no-op — on Vercel the
// platform injects env vars directly.
config({ path: path.join(import.meta.dirname, "../../../.env"), quiet: true });

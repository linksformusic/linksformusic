import "./load-env.js";

import { auth } from "@linksformusic/auth/server";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";

import { requireApiKey } from "./middleware/api-key.js";

const app: Express = express();
const port = Number(process.env.PORT ?? 3002);

const allowedOrigins = [
  process.env.WEB_URL ?? "http://localhost:3000",
  process.env.DASHBOARD_URL ?? "http://localhost:3001",
  process.env.API_URL ?? "http://localhost:3002",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth.handler));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

app.get("/v1/me", requireApiKey, (_req, res) => {
  res.json({
    ok: true,
    apiKey: {
      id: res.locals.apiKey.id,
      referenceId: res.locals.apiKey.referenceId,
    },
  });
});

export default app;

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`linksformusic api listening on :${port}`);
  });
}

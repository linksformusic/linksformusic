import { auth } from "@linksformusic/auth/server";
import type { NextFunction, Request, Response } from "express";

function readApiKey(req: Request) {
  const authorization = req.header("authorization");

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return req.header("x-api-key")?.trim() ?? null;
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = readApiKey(req);

  if (!key) {
    res.status(401).json({
      error: {
        code: "missing_api_key",
        message: "API key is required.",
      },
    });
    return;
  }

  const result = await auth.api.verifyApiKey({
    body: { key },
  });

  if (!result.valid || !result.key) {
    res.status(401).json({
      error: {
        code: "invalid_api_key",
        message: result.error?.message ?? "API key is invalid.",
      },
    });
    return;
  }

  res.locals.apiKey = result.key;
  next();
}

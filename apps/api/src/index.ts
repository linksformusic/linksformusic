import express, { type Express } from "express";

const app: Express = express();
const port = Number(process.env.PORT ?? 3002);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

export default app;

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`linksformusic api listening on :${port}`);
  });
}

# linksformusic

pnpm monorepo for Links For Music.

## Apps

- `apps/web` - `linksformusic.com`
- `apps/dashboard` - `dashboard.linksformusic.com`
- `apps/api` - `api.linksformusic.com`

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

## Vercel

This repo is configured as one Vercel Services project.

Import `/linksformusic` as the Vercel project root, then add these production
domains:

- `linksformusic.com` routes to `apps/web`
- `dashboard.linksformusic.com` routes to `apps/dashboard`
- `api.linksformusic.com` routes to `apps/api`

Run the Vercel Services setup locally with:

```bash
vercel dev -L
```

The API health check is available at:

```bash
curl https://api.linksformusic.com/health
```

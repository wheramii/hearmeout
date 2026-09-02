# HearMeOut

Rate albums, compare music taste with friends, and find what to listen to next. Built with Next.js (App Router) and Supabase.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Requires a `.env.local` with Supabase and Spotify credentials (see the `envVars` list in `render.yaml` for what's needed).

## Deployment

Deployed on [Render](https://render.com) as a free-tier web service, configured via `render.yaml` at the repo root (`rootDir: hearmeout`). Pushing to `main` triggers an auto-deploy.

`.github/workflows/keep-alive.yml` pings the live URL every 10 minutes so the free tier doesn't cold-start on a real visitor.

## Database

Schema and migrations live in `supabase/` at the repo root — `schema.sql` for the baseline, `migration_NNN_*.sql` files applied in order via the Supabase SQL editor.

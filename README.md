# GymFlow PWA

Mobile-first personal workout tracker built with Next.js App Router, `next-pwa`, and a serverless-friendly Postgres connection.

## Quick Start

```bash
npm install
copy .env.example .env.local
```

Set `DATABASE_URL` in `.env.local`, run the SQL in `database/schema.sql`, then start the app:

```bash
npm run dev
```

For PWA testing, use a production build:

```bash
npm run build
npm run start
```

## Suggested Stack

The app is wired for standard Postgres via `DATABASE_URL`, which works well with Vercel Postgres, Neon, or Supabase.

## Project Structure

- `app/page.tsx`: Daily workout logger
- `app/history/page.tsx`: History and calendar-style log browsing
- `app/api/workouts/route.ts`: Save workout
- `app/api/workouts/history/route.ts`: Workout list
- `app/api/workouts/[date]/route.ts`: Workout details by date
- `database/schema.sql`: Postgres schema


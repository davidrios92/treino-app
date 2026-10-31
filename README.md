# Treino — personal workout tracker

An installable, offline-first web app I built to follow my own 4-day gym program: mark sets as I go, time rests, log weights, and watch progress over time. It syncs across phones through Supabase.

**Live:** https://treino-app-five-theta.vercel.app

> I train in Brazil, so exercise names and technique notes are in Portuguese (what personal trainers there use), while the interface is in Spanish, my native language.

## Features

- **Today screen** — knows the next routine in the A → B → C → D sequence (not tied to weekdays, so a missed day never skips a workout).
- **Set tracking** — log weight and reps per set with one tap; each set is pre-filled from what I did last time ("Last time: 40×9 · 40×8 · 37.5×8 kg").
- **Rest timer** — starts automatically when a set is checked, with ±15 s controls. iPhone web apps can't vibrate, so it plays a distinctive chime scheduled on the Web Audio clock and keeps the screen awake with the Wake Lock API.
- **Progress** — weekly training frequency, plus per-exercise charts of top weight, estimated 1RM (Epley) and volume.
- **50-session cycles** — a counter that prompts me to re-evaluate the program with my trainer after 50 workouts, then starts a new cycle while keeping all history.
- **Exercise guide** — photos (start/end position), muscles worked, step-by-step cues and common mistakes, and a short (≤ 3 min) technique video for every exercise.
- **Editable program** — reorder routines, change sets/reps/rest, add alternatives ("lat pulldown *or* pull-ups", tracked separately), or create custom exercises with a YouTube link.
- **kg / lb** — everything is stored in kg and converted for display.
- **Works offline** — the gym has poor signal; every write lands locally first and syncs when the connection returns.

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4, lucide icons |
| Build / PWA | Vite, `vite-plugin-pwa` (Workbox precache, installable on iOS home screen) |
| Local data | Dexie (IndexedDB) with `useLiveQuery` for reactive views |
| Backend | Supabase — Postgres with row-level security, email/password auth |
| Charts | Recharts (lazy-loaded) |
| Hosting | Vercel |

## How sync works

The app is local-first: components only ever read from IndexedDB.

1. Every write goes through `save()` / `patch()` in [`src/lib/db.ts`](src/lib/db.ts), which stamps the row and marks it `dirty`.
2. [`src/lib/sync.ts`](src/lib/sync.ts) pushes dirty rows (`upsert`), then pulls anything with a server `updated_at` newer than the last pull, per table. It runs on startup, after edits (debounced), when the app regains focus or connectivity, and every minute.
3. A Postgres trigger stamps `updated_at` server-side, so pulls don't depend on phone clocks. Deletes are soft (`deleted = true`) so they propagate to other devices.
4. Conflicts resolve last-writer-wins; a pending local edit is never overwritten by a pull.
5. The starter program is seeded with deterministic UUIDs derived from the user id, so first-launch seeding on two devices at once converges instead of duplicating.

Workout history stores snapshots (routine and exercise names), so editing the program later never rewrites past sessions.

## Project structure

```
src/
  lib/
    db.ts        Dexie schema + write helpers
    sync.ts      push/pull engine
    seed.ts      starter program: 28 exercises, 4 routines (PT)
    logic.ts     hooks, next-routine, last performance, units
    timer.ts     rest timer, Web Audio chime, wake lock
  components/    Today, Workout, History, Progress, Routines, …
supabase/
  migrations/    database schema with RLS
public/ex/       exercise photos
```

## Running it yourself

```bash
npm install
```

1. Create a Supabase project and run [`supabase/migrations/0001_init_schema.sql`](supabase/migrations/0001_init_schema.sql).
2. Put your project URL and publishable key in `.env`:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_KEY=sb_publishable_...
   ```
3. In Supabase → Authentication → URL Configuration, set the Site URL to where the app is served.

```bash
npm run dev
```

The publishable key is safe to ship in the client: every table is protected by RLS (`user_id = auth.uid()`).

## Credits

- Exercise photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, Unlicense).
- Technique videos are embedded from YouTube and belong to their creators.
- The original 4-day program comes from a post I saw on social media; translation, cues and app are mine.

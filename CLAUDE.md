# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 3000 (host 0.0.0.0).
- `npm run build` — production build.
- `npm run lint` — type-check via `tsc --noEmit` (no ESLint configured).
- `npm test` — Vitest watch mode; `npm run test:run` for single run.
- Run a single test: `npx vitest run src/components/AboutTheSalve.test.tsx` (or `-t "test name"` to filter).

Vitest uses `happy-dom` with setup file `src/test/setup.ts`. Testing Library + jest-dom matchers.

## Environment

Required env vars (Vite `import.meta.env`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase client (`src/supabase.ts`).
- `GEMINI_API_KEY` — injected into `process.env` via `vite.config.ts` define.

The README mentions an AI Studio origin and `.env.local` for `GEMINI_API_KEY`. Note: HMR is disabled when `DISABLE_HMR=true` (AI Studio compatibility) — don't remove this.

Vite alias: `@` → project root (not `src`).

## Architecture

SPA for the "O SALVE é pra Jesus" Christian movement site (Campinas, BR). React 19 + React Router 7 + Tailwind v4 (via `@tailwindcss/vite`, no separate config file — uses `src/index.css`).

**Dual backend**: the app talks to both Supabase and Firebase.
- **Supabase** (`src/supabase.ts`) is the primary data store for app features: registrations, prayer requests, food donations, volunteers, team auth, and a `settings` table. `App.tsx` subscribes to realtime `postgres_changes` on `settings` to live-update site name / Google Fonts / font-family from the admin panel.
- **Firebase** (`src/firebase.ts`, config in `firebase-applet-config.json`) — Firestore/Auth/Storage initialized but secondary. Check before adding features: prefer Supabase unless the feature already uses Firebase.
- Supabase edge function in `supabase/functions/manage-team-auth/` handles team/admin auth server-side.
- Full DB schema / RLS in `supabase_setup.sql`; Firestore rules in `firestore.rules`.

**Routing** (all in `src/App.tsx`): `/`, `/cadastro`, `/ao-vivo`, `/oracao`, `/voluntarios`, `/quero-servir`, `/arrecadacao`, `/qrcode`, `/historia`, `/admin`. Route paths are Portuguese — keep this convention when adding pages. `ScrollToTopOnRouteChange` resets scroll on navigation.

**Components** live flat under `src/components/` (no nested structure). One component per page route plus shared `Navbar`, `VolunteerModal`. Styling uses Tailwind with custom theme tokens (`urban-black`, `urban-yellow`, `urban-gray`, `font-display`, `font-urban`) defined in `src/index.css`.

**Admin panel** (`AdminPanel.tsx`) is gated by Supabase auth and mutates the `settings` row whose changes broadcast to all clients via the realtime channel in `App.tsx`.

## Deployment

`vercel.json` present — deployed to Vercel. `firebase.json` + `firebase-blueprint.json` suggest Firebase Hosting was also configured at some point.

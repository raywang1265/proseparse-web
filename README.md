# ProseParse

A writing-analysis studio for novelists and editors. Drop in a chapter and
ProseParse sits beside your words, mapping tension, pacing, voice, exposition,
and sensory texture — visualized alongside the manuscript.

> **Status:** active development. The web app is functional locally with auth,
> persistence, and analysis wired up. Not deployed to production yet.

## Related repos

| Repo | Role |
| --- | --- |
| **proseparse-web** (this repo) | Next.js frontend, auth, database, and orchestration |
| [**proseparse-backend**](https://github.com/raywang1265/proseparse-backend) | FastAPI ML service (voice/passive detection, character similarity) deployed on Cloud Run |

## What's working

- **UI** — landing page, login, and the analysis studio (manuscript editor,
insight panels, session sidebar, folders).
- **Authentication** — Firebase email/password + Google sign-in, httpOnly session
  cookies, and route protection for `/studio`.
- **Database** — Neon Postgres via Drizzle ORM: users, sessions, folders, and
  analysis results. Autosave, staleness tracking, and re-analyze flow.
- **Analysis** — when `ANALYSIS_API_URL` is set, the app calls the
  [proseparse-backend](https://github.com/raywang1265/proseparse-backend) service
  for batched style analysis (`POST /analyze`), five-sense highlighting
  (`POST /sensory`), and character/voice similarity (`POST /voice`). Without it,
  a local heuristic fallback runs for style only. Style metrics, sensory cue
  spans/scores, and character voice profiles are persisted today.

## What's next

- **Deploy the web app** — Vercel (or similar) once env config is settled.
- **Expand ML coverage** — tension/pacing, exposition, and readability metrics
  (schema and UI tabs exist; results are not populated yet).
- **Production hardening** — error handling, observability, and cold-start UX
  for the analysis backend.

## Tech stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js (App Router) + React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Recharts, lucide-react |
| Authentication | Firebase Auth (web SDK client-side, Admin SDK server-side) |
| Database | Neon (serverless Postgres) + Drizzle ORM |
| ML analysis | [proseparse-backend](https://github.com/raywang1265/proseparse-backend) (FastAPI on Cloud Run) |

## Architecture

ProseParse keeps a strict line between what runs in the browser and what runs
on the server:

- **Client-side:** the Firebase **web** SDK only (sign-in, sign-up, ID tokens).
  Config values live in `NEXT_PUBLIC_*` env vars and are not secrets.
- **Server-side only** (server actions / API routes): **Neon**, the **analysis
  backend**, and the **Firebase Admin** SDK. Their credentials must never be
  prefixed with `NEXT_PUBLIC_` or reach the browser.

```
User ──sign in──▶ Firebase web SDK ──ID token──▶ POST /api/auth/session
  │
  ▼
middleware.ts gates /studio on the session cookie
  │
  ▼
Server actions ──▶ Neon (sessions, analysis results)
                ──▶ proseparse-backend (batched ML, when configured)
```

The TypeScript types in [`lib/analysis-data.ts`](./lib/analysis-data.ts) are
the contract between the UI and the analysis layer.

## Getting started

### Prerequisites

- **Node.js** 18.18+ (20 LTS recommended)
- **pnpm** — `corepack enable pnpm` or `npm install -g pnpm`
- A **Firebase** project (Email/Password and Google sign-in enabled)
- A **Neon** database
- (Optional) A running [**proseparse-backend**](https://github.com/raywang1265/proseparse-backend) instance

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
# Firebase (client — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Neon
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# Analysis backend (optional — omit to use local heuristic fallback)
ANALYSIS_API_URL=
ANALYSIS_API_KEY=
```

In the Firebase console, enable **Authentication → Sign-in method → Email/Password**
and **Google**, and add `localhost` to authorized domains.

### 3. Push the database schema

```bash
pnpm db:push
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint the project |
| `pnpm db:push` | Push Drizzle schema to Neon |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:generate` | Generate Drizzle migrations |

## Project structure

```
app/
  page.tsx               # landing page
  login/                 # auth screen
  studio/                # analysis studio (server actions)
  api/auth/session/      # session-cookie endpoint
components/
  landing/               # marketing + auth UI
  studio/                # workspace, editor, insights, user menu
  ui/                    # shadcn/ui component library
lib/
  firebase/              # client + admin SDK init
  auth/                  # context, server helpers, constants
  db/                    # Drizzle schema, queries, staleness
  analysis/              # local + remote analysis orchestration
  analysis-data.ts       # data types (UI/analysis contract)
middleware.ts            # route protection
```

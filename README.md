# ProseParse

A writing-analysis studio for novelists and editors. Drop in a chapter and
ProseParse sits beside your words, mapping their tension, pacing, voice,
exposition, and sensory texture with ML — visualized alongside the manuscript.

> **Status:** early development. The UI is built out; the backend is being
> wired up. See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the
> full roadmap and the current placeholder inventory.

## Tech stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js (App Router) + React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Recharts, lucide-react |
| Authentication | **Firebase Auth** (web SDK client-side, Admin SDK server-side) |
| Database | **Neon** (serverless Postgres) — users, sessions, manuscript text, analysis results |
| ML analysis | **Hugging Face** Inference API / Endpoints |

## Architecture & boundaries

ProseParse keeps a strict line between what runs in the browser and what runs
on the server. Respect it when adding code:

- **Client-side:** the Firebase **web** SDK only (sign-in, sign-up, ID tokens).
  Its config values live in `NEXT_PUBLIC_*` env vars and are not secrets.
- **Server-side only** (API routes / server actions): **Neon**, **Hugging
  Face**, and the **Firebase Admin** SDK. Their credentials must **never** be
  prefixed with `NEXT_PUBLIC_` and must never reach the browser.

### Authentication flow (implemented)

```
User ──sign in (email/pw or Google)──▶ Firebase web SDK ──ID token──▶
  POST /api/auth/session ──▶ Admin SDK verifies + mints httpOnly session cookie
  │
  ▼
middleware.ts gates /studio on the session cookie; getCurrentUser() verifies
it server-side. Sign-out clears the cookie (DELETE /api/auth/session).
```

Relevant files:

| File | Role |
| --- | --- |
| `lib/firebase/client.ts` | Web SDK init (`auth`, Google provider) |
| `lib/firebase/admin.ts` | Admin SDK init (server only) |
| `lib/auth/context.tsx` | `AuthProvider` + `useAuth()` (sign-in/up/out, Google, reset) |
| `lib/auth/server.ts` | `getCurrentUser()` — verify session cookie server-side |
| `lib/auth/constants.ts` | Shared cookie name / lifetime (Edge-safe) |
| `app/api/auth/session/route.ts` | Mint (POST) / clear (DELETE) the session cookie |
| `middleware.ts` | Route gate for `/studio` and `/login` |

The TypeScript types in [`lib/analysis-data.ts`](./lib/analysis-data.ts) are
the de-facto contract between the UI and the backend/ML layer. The server
should return data in those same shapes.

## Getting started

### Prerequisites

- **Node.js** 18.18+ (20 LTS recommended)
- **pnpm** (this repo uses a `pnpm-lock.yaml`) — `corepack enable pnpm` or `npm install -g pnpm`
- A **Firebase** project (Email/Password and Google sign-in enabled), a
  **Neon** database, and a **Hugging Face** access token.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

`.env.local` is gitignored. See [`.env.example`](./.env.example) for a
description of every variable. You'll need the Firebase web config
(`NEXT_PUBLIC_FIREBASE_*`), the Firebase service-account credentials
(`FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`),
the Neon connection strings (`DATABASE_URL` / `DATABASE_URL_UNPOOLED`), and a
`HUGGINGFACE_API_KEY`.

In the Firebase console, enable **Authentication → Sign-in method → Email/Password**
and **Google**, and add your dev domain (`localhost`) to the authorized domains.

### 3. Run the dev server

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

## Project structure

```
app/
  page.tsx               # landing page
  login/                 # auth screen
  studio/                # the analysis studio
  api/auth/session/      # session-cookie endpoint
components/
  landing/               # marketing + auth UI
  studio/                # workspace, editor, insights, user menu
  ui/                    # shadcn/ui component library
lib/
  firebase/              # client + admin SDK init
  auth/                  # context, server helpers, constants
  analysis-data.ts       # data types + mock data (UI/backend contract)
middleware.ts            # route protection
```

## Roadmap

Tracked in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md):

- **Phase 0 — Foundations:** env config, docs, server/client boundaries. ✅
- **Phase 1 — Authentication (Firebase):** email/password + Google, session cookies, route protection. ✅
- **Phase 2 — Database (Neon).**
- **Phase 3 — ML analysis (Hugging Face).**
- **Phase 4 — Polish & productionization.**

# ProseParse — Implementation Plan & Placeholder Inventory

> Status as of the current starter codebase. This document catalogs everything
> that is currently a **placeholder / mock** and outlines the work required to
> turn this UI shell into a working product.

## TL;DR

The repository is a **frontend-only Next.js (App Router) prototype** generated
with [v0](https://v0.app). The UI is complete and polished, but there is **no
backend of any kind**:

- **No authentication** — the sign-in form just redirects to `/studio`.
- **No database** — every session, manuscript, and metric is hardcoded in `lib/analysis-data.ts`.
- **No ML** — there is no inference, no API calls; all "analysis" is static mock data.
- **No API routes, no server actions, no environment configuration.**

The target architecture is:

| Concern | Technology | Current state |
| --- | --- | --- |
| Authentication | **Firebase Auth** | Not integrated. Form is a stub. |
| Database (users, sessions, manuscript text, analysis results) | **Neon (Postgres)** | Not integrated. Data is hardcoded. |
| ML analysis (tension, voice, sensory, pacing, etc.) | **Hugging Face APIs** | Not integrated. Output is mock. |

---

## 1. Current State (what actually exists)

### Routes (`app/`)
- `app/page.tsx` — Landing page (`SiteNav` + `Welcome`). Static.
- `app/login/page.tsx` — Login/signup screen. Renders `AuthForm`.
- `app/studio/page.tsx` — The studio. Renders `Workspace`. **Not protected** — anyone can navigate here directly.
- `app/layout.tsx` — Root layout, fonts, theme provider, Vercel Analytics.

### Studio UI (`components/studio/`)
A three-pane workspace, all driven by mock data:
- `workspace.tsx` — Top bar + sidebar + editor + insights panel. Holds shared `activeBlock` / `lens` UI state only.
- `session-sidebar.tsx` — Lists `SESSIONS` (mock). Search box and "New Analysis" button are non-functional.
- `manuscript-editor.tsx` — Renders `MANUSCRIPT` (mock) as **read-only** styled paragraphs with highlight "lenses". Not an editable text input.
- `insights-panel.tsx` — Tabs: Style / Pacing / Sensory / Voice.
  - `tabs/style-tab.tsx` — `VOICE_SPLIT`, `SENTENCE_LENGTHS`, `STYLE_METRICS`, `DIALOGUE_TAGS` (all mock).
  - `tabs/narrative-tab.tsx` — `TENSION`, `PACING`, `EXPOSITION` (all mock).
  - `tabs/sensory-tab.tsx` — `SENSORY` (mock) + a hardcoded advice blurb.
  - `tabs/character-tab.tsx` — `CHARACTERS`, `VOICE_MATRIX`, `DIALOGUE_ISSUES` (all mock).
- `sparkline.tsx`, `insight-card.tsx`, `theme-toggle.tsx` — Presentational, fine to keep.

### Shared data (`lib/analysis-data.ts`)
The single source of all mock content. Its own header says it best:

```3:3:lib/analysis-data.ts
// All copy is placeholder and meant to be replaced by real ML output.
```

This file defines the data **shapes** the UI expects (`Session`, `Paragraph`,
`Segment`, `ExpositionPoint`, `CharacterPair`, `DialogueIssue`, etc.). These
types are valuable — they are effectively the contract the backend/ML layer
must fulfill.

### UI kit (`components/ui/`)
Full shadcn/ui component library. Complete; no work needed.

---

## 2. Placeholder Inventory (with file references)

### 2.1 Authentication — entirely stubbed
- **Sign-in/up form does nothing real.** It just routes to the studio:

```15:19:components/landing/auth-form.tsx
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Template UI — wire up real authentication here.
    router.push('/studio')
  }
```

- **"Forgot?" password link** (`auth-form.tsx`) is a button with no handler.
- **No social / Google sign-in** option.
- **No session/user context** anywhere in the app.
- **`/studio` is unprotected** — there is no auth guard or middleware.
- **No sign-out** control in the studio.
- The login page brand panel quote and copy are placeholder marketing text.

### 2.2 Database / persistence — entirely mock
- **Sessions are hardcoded** (`SESSIONS` in `lib/analysis-data.ts`), rendered statically by `session-sidebar.tsx`.
- **Session search box is non-functional** (`session-sidebar.tsx`, the `Input` has no state/handler).
- **"New Analysis" button** (`session-sidebar.tsx`) and **"New" / sidebar create flow** have no handler.
- **Manuscript text is hardcoded** (`MANUSCRIPT`) — not loaded per-session, not editable, not saved.
- **No upload / paste flow** to bring a real manuscript into the app.
- **Top-bar breadcrumb is hardcoded** (`workspace.tsx`): `Saltwater / Ch. 12 — The Lighthouse`.
- **Editor header is hardcoded** (`manuscript-editor.tsx`): title, `1,840 words · analyzed just now`.
- **No persistence** of analysis results, settings, or user preferences.

### 2.3 ML analysis — entirely mock
- **"Re-analyze" button** (`workspace.tsx`) has no handler — it does not trigger anything.
- **All metrics are static** and tied to the fixed sample manuscript:
  - Highlight segments (`sensory` / `passive` / `dialogue` / `tag`) are pre-tagged by hand in `MANUSCRIPT`.
  - Tension (valence/arousal), pacing, exposition split — fixed arrays.
  - Style metrics, sentence-length distribution, dialogue-tag counts — fixed.
  - Sensory palette + advice text — fixed.
  - Character voice-similarity matrix and dialogue-clarity issues — fixed.
- **The "live" indicator** in the insights panel header is decorative only.

### 2.4 Project hygiene / config
- **`README.md`** is the default v0/Next.js boilerplate — no project-specific docs, no env setup, no architecture notes.
- **`next.config.mjs`** has `typescript.ignoreBuildErrors: true` and `images.unoptimized: true` — fine for a prototype, should be revisited before production.
- **No `.env` / `.env.example`** and no environment-variable handling.
- **No API layer** (`app/api/**` does not exist), no server actions.
- **No tests, no CI, no error/loading states** for async data.

---

## 3. What Needs To Be Done

Ordered roughly by dependency. Each item notes the infra it touches.

### Phase 0 — Foundations ✅
- [x] Add environment configuration: create `.env.local` + `.env.example` with placeholders for Firebase, Neon, and Hugging Face credentials.
- [x] Document setup in `README.md` (replace boilerplate): prerequisites, env vars, how to run, architecture overview.
- [x] Decide server vs. client boundaries: keep Neon and Hugging Face secrets **server-side only** (API routes / server actions). Firebase web SDK is client-side; verify tokens server-side with the Firebase Admin SDK. _(Documented in `.env.example` and the README "Architecture & boundaries" section.)_

### Phase 1 — Authentication (Firebase) ✅
- [x] Add Firebase web SDK + initialize a client app (`lib/firebase/client.ts`).
- [x] Add Firebase Admin SDK for server-side token verification (`lib/firebase/admin.ts`).
- [x] Implement real sign-in / sign-up / sign-out in `auth-form.tsx` (email+password **and** Google provider).
- [x] Wire the "Forgot password" flow (`sendPasswordResetEmail`).
- [x] Add an auth context/provider (`lib/auth/context.tsx`) and a session mechanism (Firebase ID token → httpOnly session cookie via `app/api/auth/session/route.ts`; server-side reads in `lib/auth/server.ts`).
- [x] Protect `/studio` (`middleware.ts`) and redirect unauthenticated users to `/login` (with a `next` param); signed-in users on `/login` are sent to `/studio`.
- [x] Add a user menu + sign-out control to the studio top bar (`components/studio/user-menu.tsx`).

### Phase 2 — Database (Neon / Postgres)
- [ ] Provision a Neon project; add a Postgres client/ORM (e.g. Drizzle or Prisma) with the Neon serverless driver.
- [ ] Design the schema. Suggested tables (mirroring the types in `lib/analysis-data.ts`):
  - `users` (keyed by Firebase UID).
  - `sessions` — id, user_id, title, created_at, word_count, status (`pending`/`analyzing`/`done`), the **full manuscript text**.
  - `paragraphs` / `analysis_results` — per-session structured output: segments+highlight kinds, valence/arousal, pacing, exposition, sensory, style metrics, character voice matrix, dialogue issues. (Could be normalized tables or JSONB columns.)
- [ ] Create API routes / server actions for: list sessions, create session (with text), get a session + its analysis, rename/delete session.
- [ ] Replace `SESSIONS` and `MANUSCRIPT` reads with real per-user data fetches.
- [ ] Implement the session **search** and **"New Analysis"** flows.
- [ ] Add a manuscript **input** surface (paste/upload) that creates a session and stores the text.
- [ ] Add loading / empty / error states throughout the studio.

### Phase 3 — ML analysis (Hugging Face)
- [ ] Define the analysis contract: a server function that takes manuscript text and returns the structures the UI already expects (keep `lib/analysis-data.ts` types as the interface).
- [ ] Implement server-side calls to Hugging Face Inference API / Endpoints. Likely models/tasks per feature:
  - **Tension** (valence/arousal): sentiment/emotion model per paragraph.
  - **Style**: passive-voice detection, sentence segmentation, adverb %, readability, dialogue-tag extraction (may mix HF models with light heuristics/NLP).
  - **Sensory palette**: classification of sensory language per sense.
  - **Pacing / exposition**: classify action vs. description vs. dialogue, showing vs. telling.
  - **Character voice similarity**: sentence/voice **embeddings** → cosine similarity matrix.
  - **Dialogue clarity**: coreference / speaker-attribution checks.
- [ ] Add a re-analysis pipeline triggered by the **"Re-analyze"** button: text → HF inference → persist results in Neon → return to UI.
- [ ] Handle long manuscripts (chunking, token limits, batching) and HF rate limits / cold starts.
- [ ] Consider async processing (job + status polling) so large analyses don't block the request; reflect `status` in the sidebar.
- [ ] Map raw model outputs into the existing UI shapes (highlight segments, chart series, issue list).

### Phase 4 — Polish & productionization
- [ ] Replace placeholder marketing copy (landing page, login quote).
- [ ] Re-enable TypeScript build checks in `next.config.mjs` once types are sound.
- [ ] Add error boundaries, toasts (sonner is already installed) for failures.
- [ ] Add tests for the analysis-mapping layer and API routes.
- [ ] Add rate limiting / cost controls around HF calls.
- [ ] Review data privacy (manuscripts are sensitive user content) — encryption at rest, deletion, retention.

---

## 4. Data Flow (target)

```
[ User ] ──login──▶ Firebase Auth ──ID token──▶ verified server-side (Admin SDK)
   │
   │ paste / upload manuscript
   ▼
[ Studio UI ] ──create session──▶ API route ──▶ Neon (store text + session row)
   │                                              │
   │ click "Re-analyze"                           │
   ▼                                              ▼
API route ──text──▶ Hugging Face (inference) ──results──▶ Neon (store analysis)
   │                                                          │
   └──────────────── analysis JSON ◀──────────────────────────┘
                          │
                          ▼
            [ Studio UI renders charts + highlights ]
```

## 5. Key Interface to Preserve

`lib/analysis-data.ts` is the de-facto API contract between the UI and the
future backend/ML layer. When wiring real data, **keep these exported types**
and have the server return data in the same shapes — that minimizes UI churn:
`Session`, `Paragraph`, `Segment`, `HighlightKind`, `ExpositionPoint`,
`CharacterPair`, `DialogueIssue`, plus the chart arrays (`VOICE_SPLIT`,
`SENTENCE_LENGTHS`, `STYLE_METRICS`, `DIALOGUE_TAGS`, `TENSION`, `PACING`,
`EXPOSITION`, `SENSORY`, `VOICE_MATRIX`, `HIGHLIGHT_LEGEND`).

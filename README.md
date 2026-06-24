# ProseParse

A writing-analysis studio for novelists and editors. Drop in a chapter and
ProseParse sits beside your words, mapping their tension, pacing, voice,
exposition, and sensory texture with ML — visualized alongside the manuscript.

## Tech stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js (App Router) + React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Recharts, lucide-react |
| Authentication | **Firebase Auth** (web SDK client-side, Admin SDK server-side) |
| Database | **Neon** (serverless Postgres) — users, sessions, manuscript text, analysis results |
| ML analysis | **Hugging Face** Inference API / Endpoints |

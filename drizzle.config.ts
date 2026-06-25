import { defineConfig } from 'drizzle-kit'

// Drizzle Kit doesn't read Next.js's `.env.local` automatically. Load it via
// Node's built-in env-file loader (Node 20.12+/22+) so migrations can see the
// Neon connection string. Falls back silently if the file is absent.
try {
  process.loadEnvFile('.env.local')
} catch {
  // no .env.local — rely on the ambient environment
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  // Use the direct (unpooled) connection for migrations — pgbouncer pooling
  // breaks Drizzle Kit's introspection queries.
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
})

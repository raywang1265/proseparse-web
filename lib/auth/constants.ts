// Shared auth constants. Kept free of server-only imports so the Edge
// middleware can use them too.

export const SESSION_COOKIE_NAME = 'session'

// Firebase session cookies can live up to 14 days. We mint them for that long
// and let Firebase enforce the upper bound.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

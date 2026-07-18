# px.ar — URL shortener

A minimal Next.js (App Router) + Supabase URL shortener. Takes a long URL,
checks its domain against `blacklist.txt`, stores a 5-char code, and
permanently (301) redirects `/​{code}` to the stored destination.

## Stack
- Next.js 14 (App Router) + TypeScript
- `@supabase/supabase-js`
- Single Supabase table `urls`

## Setup

### 1. Database
Run `schema.sql` in the Supabase SQL editor for your project. It creates the
`urls` table, an index on `url`, and an RLS policy allowing public reads.

### 2. Environment
Copy `.env.example` to `.env.local` and fill in the values:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_BASE_URL=https://px.ar
```

For local dev set `NEXT_PUBLIC_BASE_URL=http://localhost:3000` so the
returned short URL points at the local server.

### 3. Blacklist
Edit `blacklist.txt`. One domain per line, lowercase. Lines starting
with `#` and blank lines are ignored. Matching is suffix-based: an entry for
`example.com` also blocks `sub.example.com`. Changes require a dev-server
restart (or redeploy).

### 4. Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Behavior
- `POST /api/shorten` `{ url }` → `{ code, shortUrl, reused }`.
  - If the same long URL was shortened before, the existing code is returned
    (`reused: true`) instead of creating a duplicate.
  - 400 responses: `invalid_url`, `domain_blacklisted`.
- `GET /{code}` → `301 Moved Permanently` with `Location` to the stored URL,
  or `404` with plain-text body `URL not found` when no such code exists.

## Validation
```bash
npm run lint
npm run build
```

Manual smoke test:
- Submit `https://example.com` → get back `https://px.ar/xxxxx`, Copy works.
- Submit the same URL again → same code (`reused`).
- Add `example.com` to `blacklist.txt`, restart → both `example.com`
  and `sub.example.com` are rejected.
- `curl -i http://localhost:3000/{code}` → `301`, `Location: <stored url>`.
- `curl -i http://localhost:3000/badco` → `404`, body `URL not found`.

## Notes / out of scope
- The service role key bypasses RLS — keep it server-only (route handlers + `src/lib/`),
  never expose it to the client (don't prefix its env var with `NEXT_PUBLIC_`).
- No rate limiting, auth, analytics, custom aliases, expiration, or edit/delete paths.
- No live reload of `blacklist.txt`; restart / redeploy to pick up changes.

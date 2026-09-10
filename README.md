# Swachta Admin (deploy mirror)

Standalone copy of the Swachta operations dashboard used for Render deployment.

**Source of truth:** `apps/admin` in [Shoelee22/swachta](https://github.com/Shoelee22/swachta). Changes land there first; this mirror is synced on demand until Render's GitHub App access covers the private monorepo.

## Build

```bash
npm install
npm run build   # static export → out/
```

## Env (public, client-safe)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key)

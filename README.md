# nextjs-boilerplate (BHD-wired)

Minimal **Next.js App Router** starter already connected to [BHD Identity](https://id.bhd-om.com).

## What is included

- `app/layout.tsx` loads `https://id.bhd-om.com/bhd-identity.js`
- CSP in `next.config.ts` allows `id.bhd-om.com`
- Live catalog grid on `app/page.tsx` (`/api/bhd/catalog`)
- OAuth stubs: `app/api/auth/bhd/{start,callback,logout,rebind}/route.ts`
- Rebind-first browser client: `lib/identity/client.ts` (see `docs/BHD-ACCOUNT-ISOLATION.md`)
- Copied wire docs under `docs/`

## Setup

```bash
cp .env.example .env.local
# AUTH_SECRET=…  (random string — signs product session JWT)
# BHD_OAUTH_CLIENT_ID=…  from https://id.bhd-om.com/admin#connect
npm install
npm run dev
```

Register redirect URI: `{origin}/api/auth/bhd/callback`.

## TODO in your product

1. Implement `upsertUserFromIdentity()` in `lib/auth/session.ts` (database).
2. Align session max-age with `/api/bhd/runtime` from identity.
3. Add header/footer switcher using the same catalog helpers.

See **`docs/BHD-PRODUCT-WIRE.md`** and **`docs/BHD-CURSOR-PRODUCT-WIRE.md`**.

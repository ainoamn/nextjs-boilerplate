# عزل بيانات الحساب بعد التبديل (خصوصية — نموذج جوجل)

> **Issuer:** https://id.bhd-om.com  
> **تاريخ:** 29 أكتوبر 2026 — محاذاة مع BHD-HR-live.

---

## القاعدة

- `?au=<sub>` + `bhd_account_tokens` / `bhd_active_au` في `sessionStorage`.
- Silent reconcile: JSON `POST /api/auth/bhd/rebind` (`Accept: application/json`).
- Hard switch: blank veil (no text) + form rebind.
- `BhdSilentSso`: ~20s interval, `silent: true` only.

---

## ملفات هذا التطبيق

- `lib/identity/window-session.ts`
- `lib/identity/client.ts`
- `lib/identity/bhd-browser.ts`
- `components/bhd/BhdSilentSso.tsx`
- `components/bhd/BhdPrivacyGate.tsx`
- `components/bhd/BhdAccountIsolation.tsx`
- `app/api/auth/bhd/rebind/route.ts`
- `app/api/auth/me/route.ts`
- `app/layout.tsx`

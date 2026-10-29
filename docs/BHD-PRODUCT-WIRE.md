# ربط nextjs-boilerplate بهوية BHD الحية

> **تاريخ:** 29 أكتوبر 2026  
> **المستودع:** https://github.com/ainoamn/nextjs-boilerplate  
> **الهوية:** https://id.bhd-om.com

## مطبَّق في القالب

| البند | المسار |
|---|---|
| سكربت | `app/layout.tsx` |
| CSP | `next.config.ts` |
| كتالوج | `lib/bhd/catalog.ts` + `components/BhdCatalogGrid.tsx` |
| OAuth + rebind | `app/api/auth/bhd/*` |
| عزل Bearer | `lib/identity/client.ts` |

## env

- `AUTH_SECRET` — يوقّع JWT جلسة المنتج (**مطلوب** لـ callback/rebind)
- `BHD_OAUTH_CLIENT_ID` / `BHD_OAUTH_CLIENT_SECRET` — من `/admin#connect`

## مراجع

- `BHD-ACCOUNT-ISOLATION.md` — rebind أولاً (§93 في BHD-HR)
- `BHD-CURSOR-PRODUCT-WIRE.md` — قائمة تحقق كاملة

## تحديث §95 (29 أكتوبر 2026)

إصلاح جذر العزل على الهوية: `POST /api/auth/switch` يكتب `bhd_id` دائماً. هذا المنتج يعتمد `rebind` محلياً بعد التبديل. التفاصيل: `BHD-ACCOUNT-ISOLATION.md`.

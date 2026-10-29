import { DEFAULT_IDENTITY_ISSUER } from "@/lib/bhd/identity-public";
import { BHD_APPS_FALLBACK, type BhdApp, type BhdAppMode } from "@/lib/bhd/apps";

export const IDENTITY_CATALOG_URL = `${DEFAULT_IDENTITY_ISSUER}/api/bhd/catalog`;
export const BHD_CATALOG_EVENT = "bhd-catalog";

let cache: BhdApp[] | null = null;

function asMode(value: unknown): BhdAppMode {
  return value === "identity" || value === "browse" || value === "sso" ? value : "sso";
}

export function normalizeCatalogApps(raw: unknown): BhdApp[] {
  if (!Array.isArray(raw)) return [];
  const apps: BhdApp[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const origin = typeof item.origin === "string" ? item.origin.trim().replace(/\/$/, "") : "";
    if (!id || !origin) continue;
    const workspacePath =
      typeof item.workspacePath === "string" && item.workspacePath.startsWith("/")
        ? item.workspacePath
        : "/";
    const mode = asMode(item.mode);
    apps.push({
      id,
      nameAr: typeof item.nameAr === "string" ? item.nameAr : id,
      nameEn: typeof item.nameEn === "string" ? item.nameEn : id,
      origin,
      workspacePath,
      startUrl:
        typeof item.startUrl === "string" && item.startUrl.trim()
          ? item.startUrl.trim()
          : mode === "sso"
            ? `${origin}/api/auth/bhd/start?returnTo=${encodeURIComponent(workspacePath)}`
            : null,
      mode,
      enabled: item.enabled !== false,
      mark: typeof item.mark === "string" ? item.mark : id.slice(0, 2).toUpperCase(),
      accent: typeof item.accent === "string" ? item.accent : "#075c45",
      logoUrl: typeof item.logoUrl === "string" ? item.logoUrl : null,
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : apps.length,
    });
  }
  return apps.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getCachedCatalogApps(): BhdApp[] {
  return cache?.length ? cache : BHD_APPS_FALLBACK;
}

export function setCachedCatalogApps(apps: BhdApp[]) {
  if (apps.length) cache = apps;
}

export function applyCatalogPayload(payload: unknown): BhdApp[] {
  const apps = Array.isArray(payload)
    ? normalizeCatalogApps(payload)
    : normalizeCatalogApps((payload as { apps?: unknown } | null)?.apps);
  if (apps.length) setCachedCatalogApps(apps);
  return apps;
}

export async function fetchIdentityCatalog(): Promise<BhdApp[]> {
  try {
    const response = await fetch(IDENTITY_CATALOG_URL, { cache: "no-store", next: { revalidate: 30 } });
    if (!response.ok) throw new Error(String(response.status));
    const body = (await response.json()) as { apps?: unknown };
    const apps = applyCatalogPayload(body);
    return apps.length ? apps : getCachedCatalogApps();
  } catch {
    return getCachedCatalogApps();
  }
}

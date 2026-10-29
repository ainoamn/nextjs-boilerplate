export type BhdAppMode = "identity" | "sso" | "browse";

export type BhdApp = {
  id: string;
  nameAr: string;
  nameEn: string;
  origin: string;
  workspacePath: string;
  startUrl: string | null;
  mode: BhdAppMode;
  enabled: boolean;
  mark: string;
  accent: string;
  logoUrl?: string | null;
  sortOrder?: number;
};

export const BHD_APPS_FALLBACK: BhdApp[] = [
  {
    id: "account",
    nameAr: "الحساب",
    nameEn: "Account",
    origin: "https://id.bhd-om.com",
    workspacePath: "/",
    startUrl: null,
    mode: "identity",
    enabled: true,
    mark: "ID",
    accent: "#075c45",
    sortOrder: 0,
  },
];

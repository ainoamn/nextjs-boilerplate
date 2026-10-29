"use client";

import { useEffect, useState } from "react";
import type { BhdApp } from "@/lib/bhd/apps";
import { fetchIdentityCatalog } from "@/lib/bhd/catalog";
import { DEFAULT_IDENTITY_ISSUER } from "@/lib/bhd/identity-public";

function hrefFor(app: BhdApp): string {
  if (app.mode === "identity") return `${DEFAULT_IDENTITY_ISSUER}${app.workspacePath}`;
  return app.startUrl || app.origin;
}

export default function BhdCatalogGrid() {
  const [apps, setApps] = useState<BhdApp[]>([]);

  useEffect(() => {
    let alive = true;
    void fetchIdentityCatalog().then((list) => {
      if (alive) setApps(list.filter((a) => a.enabled));
    });
    const refresh = () => {
      void fetchIdentityCatalog().then((list) => {
        if (alive) setApps(list.filter((a) => a.enabled));
      });
    };
    window.addEventListener("bhd-catalog", refresh);
    return () => {
      alive = false;
      window.removeEventListener("bhd-catalog", refresh);
    };
  }, []);

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>كتالوج BHD الحي</h2>
      <ul
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.75rem",
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >
        {apps.map((app) => (
          <li key={app.id}>
            <a
              href={hrefFor(app)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "#fff",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "999px",
                  background: app.accent,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                {app.mark.slice(0, 2)}
              </span>
              <span style={{ fontSize: "0.85rem", textAlign: "center" }}>{app.nameAr}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

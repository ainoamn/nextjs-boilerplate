import type { Metadata } from "next";
import Script from "next/script";
import { BhdAccountIsolation } from "@/components/bhd/BhdAccountIsolation";
import "./globals.css";

export const metadata: Metadata = {
  title: "BHD Next.js Boilerplate",
  description: "App Router starter pre-wired to id.bhd-om.com",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="stylesheet" href="https://id.bhd-om.com/bhd-launcher.css" />
      </head>
      <body>
        <BhdAccountIsolation />
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div data-bhd-launcher data-locale="ar" />
        </header>
        {children}
        <Script src="https://id.bhd-om.com/bhd-identity.js" strategy="afterInteractive" />
        <Script src="https://id.bhd-om.com/bhd-launcher.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

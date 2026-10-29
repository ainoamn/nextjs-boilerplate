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
      <body>
        <BhdAccountIsolation />
        {children}
        <Script src="https://id.bhd-om.com/bhd-identity.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

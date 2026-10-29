import BhdCatalogGrid from "@/components/BhdCatalogGrid";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>BHD Next.js Boilerplate</h1>
      <p style={{ color: "#475569", lineHeight: 1.6 }}>
        قالب App Router مسبق الربط بـ{" "}
        <a href="https://id.bhd-om.com">id.bhd-om.com</a>. عيّن <code>AUTH_SECRET</code> و{" "}
        <code>BHD_OAUTH_*</code> ثم سجّل redirect في{" "}
        <a href="https://id.bhd-om.com/admin#connect">/admin#connect</a>.
      </p>
      <p style={{ marginTop: "1rem" }}>
        <a href="/api/auth/bhd/start?returnTo=/">دخول BHD SSO</a>
        {" · "}
        <a href="/api/auth/bhd/logout">خروج</a>
      </p>
      <BhdCatalogGrid />
    </main>
  );
}

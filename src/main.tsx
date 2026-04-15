import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { checkEnvVars } from "./lib/envCheck";
import App from "./App.tsx";
import "./index.css";

const { ok, missing } = checkEnvVars();

if (!ok && import.meta.env.PROD) {
  document.getElementById("root")!.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0F1E;color:#E2E8F0;font-family:Inter,sans-serif;padding:2rem;text-align:center">
      <div>
        <h1 style="font-size:1.5rem;margin-bottom:1rem">🔧 Maintenance</h1>
        <p style="color:#64748B">LaunchSim is temporarily unavailable. Please try again later.</p>
      </div>
    </div>`;
} else {
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}

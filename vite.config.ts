import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // bind 0.0.0.0 so proxied preview hosts can reach the server
    port: 8080,
    strictPort: true,
    hmr: {
      overlay: false,
    },
    // Vite 5.4.12+ rejects requests whose Host header isn't allowlisted, which
    // breaks proxied preview environments. Allow localhost plus the hosted
    // preview domains; never use "*" in production builds (this is dev-only).
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".e2b.app",
      ".lovable.app",
      ".lovableproject.com",
    ],
  },
  preview: {
    host: true,
    port: 8080,
    allowedHosts: [".e2b.app", ".lovable.app", "localhost"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    // Split the heavy, route-specific vendors out of the entry chunk. The entry
    // was 655 kB before code-splitting because jspdf + recharts were pulled in
    // eagerly.
    // Vite 8 / Rolldown require the function form of manualChunks; the object
    // form is no longer accepted. Keep the same three vendor buckets.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("jspdf") ||
            id.includes("html2canvas") ||
            id.includes("dompurify")
          ) {
            return "pdf";
          }
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (
            /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(
              id,
            )
          ) {
            return "react-vendor";
          }
          return;
        },
      },
    },
    // The pdf/charts chunks are legitimately large; keep the warning meaningful.
    chunkSizeWarningLimit: 700,
  },
}));

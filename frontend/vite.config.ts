import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.svg", "icon-512.svg"],
      manifest: {
        name: "Receipts — Visual Purchase Memory",
        short_name: "Receipts",
        description: "Scan receipts, track purchases, download QR",
        theme_color: "#7C3AED",
        background_color: "#FFFBF5",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg}"] }
    })
  ],
  server: { host: "0.0.0.0", port: 5173, proxy: { "/api": "http://localhost:3000" } }
});

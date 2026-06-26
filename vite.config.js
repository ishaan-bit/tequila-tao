import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    target: "es2018",
    // rolldown-vite uses its built-in minifier; `manualChunks` must be a function.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Firebase is ONLY reached via dynamic import (cloud backup/push, which
          // is opt-in). Give it its own chunk so it never rides along in the eager
          // `vendor` chunk (which @capacitor/core pulls in at launch) — non-sync
          // users must not download ~180 kB gzip of Firebase they'll never use.
          if (id.includes("firebase")) return "firebase-vendor";
          if (id.includes("framer-motion")) return "motion-vendor";
          if (id.includes("react-router")) return "router-vendor";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "react-vendor";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 900,
    cssCodeSplit: true,
    sourcemap: false,
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion"],
  },
});

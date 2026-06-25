import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Dedicated test config. We keep it separate from vite.config.js so the build
// pipeline and the test pipeline can evolve independently. jsdom gives the pure
// domain tests a `window`/`matchMedia` to lean on and lets the lightweight
// component tests (calendar grid, day detail) render without a browser.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx}"],
    css: false,
    restoreMocks: true,
    // Windows + OneDrive + worker threads can throw a low-level "UNKNOWN: read"
    // at module load. A single forked process sidesteps the worker-thread file
    // read path and runs reliably here.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
  },
});

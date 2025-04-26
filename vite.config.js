// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";
export default defineConfig({
  base: "/",
  build: {
    target: "esnext", // Allow top-level await and modern features
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        journal: resolve(__dirname, "journal.html"),
        privacy: resolve(__dirname, "privacy.html"),
        terms: resolve(__dirname, "terms.html"),
      },
    },
  },
});

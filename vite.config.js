// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    target: "esnext", // Allow top-level await and modern features
    rollupOptions: {
      input: {
        main: "index.html",
        journal: "public/journal.html",
      },
    },
  },
});

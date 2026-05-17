import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  plugins: [react()]
});

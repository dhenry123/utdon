/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 7852,
    open: false,
    proxy: {
      "/api": {
        //Vite default cors server option is : accept all
        target: "http://0.0.0.0:3015",
        secure: false,
      },
    },
  },
  build: {
    manifest: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    // scss/css imports are stubbed for components under test
    css: false,
  },
});

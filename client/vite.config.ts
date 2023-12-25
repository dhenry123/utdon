import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const filesNeedToExclude = ["/src/components/*.stories.tsx"];

const filesPathToExclude = filesNeedToExclude.map((src) => {
  return fileURLToPath(new URL(src, import.meta.url));
});

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
    rollupOptions: {
      external: [...filesPathToExclude],
    },
  },
});

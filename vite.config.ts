import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isCapacitor = process.env.CAPACITOR === "true";

export default defineConfig({
  cloudflare: !isCapacitor,
  tanstackStart: {
    ...(isCapacitor && {
      spa: {
        enabled: true,
        prerender: {
          outputPath: "index.html",
        },
      },
    }),
    server: {
      entry: "index",
    },
  },

  vite: {
    base: "./",

    build: {
      outDir: "dist",

      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
});
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      all: true,
      reporter: ["text", "json", "html"],
      include: ["src"],
    },
    threads: false,
  },
  resolve: {
    alias: [{ find: "src", replacement: resolve(__dirname, "./src") }],
  },
});

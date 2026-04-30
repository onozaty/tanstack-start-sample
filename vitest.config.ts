import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    env: loadEnv(mode, process.cwd(), ""),
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.ts",
        "src/routeTree.gen.ts",
        "src/components/ui/**",
      ],
    },
  },
  resolve: {
    alias: {
      "#": new URL("./src", import.meta.url).pathname,
    },
  },
}));

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // setupFiles removido: os testes não usam @testing-library/jest-dom
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.d.ts"],
      thresholds: {
        lines: 50,
        functions: 80,
        branches: 70,
        statements: 50,
      },
    },
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
  },
});

/**
 * End-to-end checks against a real running app. Not part of `verify:local` (that
 * gate is pure — no database, no browser); run by hand:
 *
 *   npm run db:migrate && npm run seed:locations      # once, against a LOCAL db
 *   $env:DATABASE_URL = "mysql://propia:propia@127.0.0.1:3306/propia"
 *   npm run test:e2e
 *
 * `tests/e2e/global-setup.ts` writes fixture listings, so it refuses any
 * DATABASE_URL that is not localhost.
 */
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: { PORT: String(PORT) },
  },
});

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    env: {
      // Run like Vercel does (UTC) so time-zone bugs show up here, not in prod
      TZ: "UTC",
      // supabase.ts needs these to load; route tests mock the DB, nothing hits the network
      NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
    },
  },
});

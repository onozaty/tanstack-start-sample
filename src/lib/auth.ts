import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db/client";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  emailAndPassword: {
    enabled: true,
    // Better Auth のデフォルトと同じ値だが、signup の <input minLength> と
    // 閾値を揃えるため明示する。
    minPasswordLength: 8,
  },
  advanced: {
    database: {
      generateId: "serial",
    },
  },
  plugins: [tanstackStartCookies()],
});

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getRequest } from "@tanstack/react-start/server";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db/client.server";

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

// Better Auth の generateId: "serial" 構成では DB の id は integer だが、
// TS 型上は string (例: "1") として返るため、サーバ側で number に変換する。
export async function requireUserId(): Promise<number> {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  const userId = Number(session.user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

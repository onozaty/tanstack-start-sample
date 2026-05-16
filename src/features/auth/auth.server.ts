import { drizzleAdapter } from "@better-auth/drizzle-adapter";
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
  // e2e は本番ビルドを起動するため rate limit が有効になり、
  // /sign-up と /sign-in は 10 秒で 3 回までに制限される。連続でサインアップ
  // するテストが 429 で落ちるのを避けるため、E2E=true のときだけ無効化する。
  rateLimit: {
    enabled: process.env.E2E !== "true",
  },
  // Better Auth 内部のログは抑止する。"Invalid password" など想定内の 4xx も
  // error レベルで吐かれるため、そのまま流すと本物の障害ログを埋もれさせる。
  // 本当の障害は throw されてリクエスト middleware の request.error で拾える。
  // ライブラリ自体のデバッグが必要なときは disabled を false に切り替える。
  logger: { disabled: true },
  plugins: [tanstackStartCookies()],
});

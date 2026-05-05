import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Playwright プロセス側 (resetDb など) も test DB を読むよう .env.test を上書きで適用
// (.env はベースとして既存の値を残し、DATABASE_URL のみ .env.test で差し替える)
dotenv.config();
dotenv.config({ path: ".env.test", override: true });

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
  ],
  // ビルド成果物 (.output/) を node で起動。
  // この config の冒頭で .env.test を override しているため、
  // process.env は test 用の DATABASE_URL + .env のベース値を持つ。
  // それをそのまま webServer 子プロセスへ渡し、PORT のみ追加する。
  webServer: {
    command: "pnpm build && pnpm start",
    url: BASE_URL,
    // 既存プロセスを再利用すると、スキーマ変更後など古い状態のサーバを掴んで
    // テストが正しい結果を返さない事故が起きる。常に新規起動する方針にし、
    // ポート競合は明示的に失敗させて気付けるようにする。
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...(process.env as Record<string, string>),
      PORT: String(PORT),
      // Better Auth の rate limit を e2e で無効化する。
      // - 本番ビルド起動 (NODE_ENV=production) のため rate limit がデフォルトで有効
      // - Playwright は x-forwarded-for を付けないので IP が取れず警告が出る
      // - TEST=true で 127.0.0.1 にフォールバックさせると今度は /sign-up の特別ルール
      //   (10 秒で 3 回まで) に引っかかる
      // 本番には影響を出さず、E2E=true 時のみ rateLimit.enabled を false にする。
      E2E: "true",
    },
  },
});

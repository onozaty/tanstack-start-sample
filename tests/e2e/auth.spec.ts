import { expect, test } from "@playwright/test";
import { resetDb } from "../helpers/db";

// /login (裸 or ?redirect=... 付き) を期待する Assert で使う。
// 先頭アンカーで /api/login など別ルートを誤マッチしないようにする。
const LOGIN_URL = /^http:\/\/[^/]+\/login($|\?)/;

test.beforeEach(async () => {
  await resetDb();
});

test("未ログインで / にアクセスすると /login にリダイレクトされる", async ({
  page,
}) => {
  // Arrange + Act
  await page.goto("/");

  // Assert
  await expect(page).toHaveURL(LOGIN_URL);
  await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
});

test("サインアップ → ホーム表示 → ログアウト → /login に戻る", async ({
  page,
}) => {
  // Arrange
  const email = "alice@example.test";
  const password = "password123";

  // Act: signup
  await page.goto("/signup");
  await page.getByLabel("名前").fill("Alice");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "アカウント作成" }).click();

  // Assert: ホームに遷移し、ユーザのメールが表示されている
  await expect(page).toHaveURL("/");
  await expect(page.getByText(email)).toBeVisible();

  // Act: logout
  await page.getByRole("button", { name: "ログアウト" }).click();

  // Assert: /login に戻る
  await expect(page).toHaveURL(LOGIN_URL);
});

test("サインアップ済みユーザで再ログインできる", async ({ page }) => {
  // Arrange: サインアップしてログアウト
  const email = "bob@example.test";
  const password = "password123";

  await page.goto("/signup");
  await page.getByLabel("名前").fill("Bob");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "アカウント作成" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(LOGIN_URL);

  // Act: 同じ資格情報で再ログイン
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();

  // Assert
  await expect(page).toHaveURL("/");
  await expect(page.getByText(email)).toBeVisible();
});

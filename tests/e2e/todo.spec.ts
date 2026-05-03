import { expect, type Page, test } from "@playwright/test";
import { resetDb } from "../helpers/db";

test.beforeEach(async () => {
  await resetDb();
});

async function signUp(page: Page, name: string): Promise<string> {
  const email = `${name.toLowerCase()}@example.test`;
  await page.goto("/signup");
  await page.getByLabel("名前").fill(name);
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "アカウント作成" }).click();
  await expect(page).toHaveURL("/");
  return email;
}

test("TODO の追加・完了切替・削除ができる", async ({ page }) => {
  // Arrange
  await signUp(page, "Alice");

  // Act: 追加
  await page.getByPlaceholder("やることを入力").fill("買い物に行く");
  await page.getByRole("button", { name: "追加" }).click();

  // Assert: 一覧に出る
  const item = page.getByRole("listitem").filter({ hasText: "買い物に行く" });
  await expect(item).toBeVisible();

  // Act: 完了切替 (shadcn Checkbox は role=checkbox の button で
  //   .check() の即時 aria-checked 検証に追従しないため click を使う)
  await item.getByRole("checkbox").click();

  // Assert: チェック済み
  await expect(item.getByRole("checkbox")).toBeChecked();

  // Act: 削除
  await item.getByRole("button", { name: "削除" }).click();

  // Assert: 一覧から消える
  await expect(page.getByText("まだ TODO はありません。")).toBeVisible();
});

test("他ユーザの TODO は見えない", async ({ browser }) => {
  // Arrange: A が TODO を作る
  const aliceContext = await browser.newContext();
  const alicePage = await aliceContext.newPage();
  await signUp(alicePage, "Alice");
  await alicePage.getByPlaceholder("やることを入力").fill("alice's secret");
  await alicePage.getByRole("button", { name: "追加" }).click();
  await expect(
    alicePage.getByRole("listitem").filter({ hasText: "alice's secret" }),
  ).toBeVisible();

  // Act: B が別ブラウザコンテキストでサインアップ → ホーム
  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await signUp(bobPage, "Bob");

  // Assert: B の画面に A の TODO が見えない
  await expect(bobPage.getByText("alice's secret")).not.toBeVisible();
  await expect(bobPage.getByText("まだ TODO はありません。")).toBeVisible();

  // Cleanup
  await aliceContext.close();
  await bobContext.close();
});

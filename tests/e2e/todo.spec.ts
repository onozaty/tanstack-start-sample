import { expect, type Page, test } from "@playwright/test";
import { resetDb } from "../helpers/db";

test.beforeEach(async () => {
  await resetDb();
});

async function signUp(page: Page, name: string): Promise<string> {
  const email = `${name.toLowerCase()}@example.test`;
  const password = "password123";
  await page.goto("/signup");
  await page.getByLabel("名前").fill(name);
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード", { exact: true }).fill(password);
  await page.getByLabel("パスワード (確認)").fill(password);
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

test("他タブで削除済みの TODO を削除しようとするとエラーバナーが表示される", async ({
  browser,
}) => {
  // Arrange: 1 ユーザでサインアップして TODO を 1 件作る。
  // 同じ context で 2 タブ開けば Cookie 共有で同じセッションになる。
  const context = await browser.newContext();
  const tabA = await context.newPage();
  await signUp(tabA, "Alice");
  await tabA.getByPlaceholder("やることを入力").fill("task");
  await tabA.getByRole("button", { name: "追加" }).click();
  const itemA = tabA.getByRole("listitem").filter({ hasText: "task" });
  await expect(itemA).toBeVisible();

  // Tab B でも同じ TODO が見える状態にしておく
  const tabB = await context.newPage();
  await tabB.goto("/");
  const itemB = tabB.getByRole("listitem").filter({ hasText: "task" });
  await expect(itemB).toBeVisible();

  // Act: Tab A で削除 → DB から消える
  await itemA.getByRole("button", { name: "削除" }).click();
  await expect(tabA.getByText("まだ TODO はありません。")).toBeVisible();

  // Tab B は古い state のまま削除を試みる → notFound() がサーバから返る
  await itemB.getByRole("button", { name: "削除" }).click();

  // Assert: Tab B にエラーバナー (isNotFound 文言分岐) が出る
  await expect(
    tabB.getByRole("alert").filter({ hasText: "対象の TODO が見つかりません" }),
  ).toBeVisible();

  // Cleanup
  await context.close();
});

test("空白だけ入力すると追加ボタンが disabled になりエラー文が出る", async ({
  page,
}) => {
  // Arrange: ログイン直後のホーム
  await signUp(page, "Alice");
  const submit = page.getByRole("button", { name: "追加" });

  // Act: スペースだけ入れる (dirty にして onChange validators を走らせる)
  await page.getByPlaceholder("やることを入力").fill("   ");

  // Assert: スペースだけでは Zod (trim().min(1)) で弾かれエラー文が出る
  await expect(page.getByText("1文字以上で入力してください")).toBeVisible();
  await expect(submit).toBeDisabled();
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

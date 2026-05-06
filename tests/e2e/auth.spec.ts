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
  // パスワードと「パスワード (確認)」の両方が getByLabel("パスワード") に
  // 一致するため、exact: true で前者だけを取る
  await page.getByLabel("パスワード", { exact: true }).fill(password);
  await page.getByLabel("パスワード (確認)").fill(password);
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
  await page.getByLabel("パスワード", { exact: true }).fill(password);
  await page.getByLabel("パスワード (確認)").fill(password);
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

test("サインアップ: メール形式が不正だとエラー文が出て遷移しない", async ({
  page,
}) => {
  // Arrange
  await page.goto("/signup");

  // Act
  await page.getByLabel("名前").fill("Alice");
  await page.getByLabel("メールアドレス").fill("not-an-email");
  await page.getByLabel("パスワード", { exact: true }).fill("password123");
  await page.getByLabel("パスワード (確認)").fill("password123");

  // Assert: クライアント側 Zod でメールの形式エラーが表示される
  await expect(
    page.getByText("メールアドレスの形式が正しくありません"),
  ).toBeVisible();

  // Act: そのまま送信してもサーバへ到達せず /signup に留まる
  // (submit 時にも Zod が再検証され、無効なら onSubmit ハンドラに到達しない)
  await page.getByRole("button", { name: "アカウント作成" }).click();

  // Assert
  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByText("メールアドレスの形式が正しくありません"),
  ).toBeVisible();
});

test("サインアップ: パスワード確認が一致しないとエラー文が出る", async ({
  page,
}) => {
  // Arrange
  await page.goto("/signup");

  // Act
  await page.getByLabel("名前").fill("Alice");
  await page.getByLabel("メールアドレス").fill("alice@example.test");
  await page.getByLabel("パスワード", { exact: true }).fill("password123");
  await page.getByLabel("パスワード (確認)").fill("different1");

  // Assert
  await expect(page.getByText("パスワードが一致しません")).toBeVisible();

  // Act: 送信しても /signup に留まる
  await page.getByRole("button", { name: "アカウント作成" }).click();

  // Assert
  await expect(page).toHaveURL(/\/signup$/);
});

test("サインアップ: 既存メールで登録するとメールフィールドにエラーが付く", async ({
  page,
}) => {
  // Arrange: 1 人目を作成 → ログアウト
  const email = "duplicate@example.test";
  await page.goto("/signup");
  await page.getByLabel("名前").fill("First");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード", { exact: true }).fill("password123");
  await page.getByLabel("パスワード (確認)").fill("password123");
  await page.getByRole("button", { name: "アカウント作成" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(LOGIN_URL);

  // Act: 同じメールで 2 人目を作ろうとする
  await page.goto("/signup");
  await page.getByLabel("名前").fill("Second");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード", { exact: true }).fill("password123");
  await page.getByLabel("パスワード (確認)").fill("password123");
  await page.getByRole("button", { name: "アカウント作成" }).click();

  // Assert: 重複エラーがメールフィールド側に表示される
  await expect(
    page.getByText("このメールアドレスは既に登録されています"),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("ログイン: 資格情報が不一致だとフォーム全体エラーが出る", async ({
  page,
}) => {
  // Arrange: ユーザを 1 人作って一旦ログアウト
  await page.goto("/signup");
  await page.getByLabel("名前").fill("Carol");
  await page.getByLabel("メールアドレス").fill("carol@example.test");
  await page.getByLabel("パスワード", { exact: true }).fill("password123");
  await page.getByLabel("パスワード (確認)").fill("password123");
  await page.getByRole("button", { name: "アカウント作成" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "ログアウト" }).click();

  // Act: 違うパスワードでログインを試みる
  await page.getByLabel("メールアドレス").fill("carol@example.test");
  await page.getByLabel("パスワード").fill("wrong-password");
  await page.getByRole("button", { name: "ログイン" }).click();

  // Assert: メール/パスワードどちらが間違いか出さず、まとめて 1 つのエラーで返る
  await expect(
    page.getByText("メールアドレスまたはパスワードが正しくありません"),
  ).toBeVisible();
  await expect(page).toHaveURL(LOGIN_URL);
});

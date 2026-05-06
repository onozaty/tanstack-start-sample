// Better Auth クライアントが返すエラーオブジェクト ({ code?, message? }) を、
// 「特定フィールドに紐付くエラー」と「フォーム全体のエラー」に振り分ける。
// 詳細なコードは BASE_ERROR_CODES (better-auth/core) を参照。

export type FieldErrorTarget = "email" | "name" | "password";

export type AuthErrorMapping =
  | { kind: "field"; field: FieldErrorTarget; message: string }
  | { kind: "form"; message: string };

type AuthClientError = { code?: string; message?: string };

export function mapSignUpError(error: AuthClientError): AuthErrorMapping {
  // 既存メールでの登録は email フィールドの問題なのでフィールドエラーに紐付ける
  if (
    error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
    error.code === "USER_ALREADY_EXISTS"
  ) {
    return {
      kind: "field",
      field: "email",
      message: "このメールアドレスは既に登録されています",
    };
  }
  // 想定外のコードは UI には出さず、デバッグのため console に流す。
  // error.message は英語のため UI フォールバックには使わない。
  console.error("Unhandled signUp error:", error);
  return { kind: "form", message: "サインアップに失敗しました" };
}

export function mapSignInError(error: AuthClientError): AuthErrorMapping {
  // メール/パスワードのどちらが間違いかは UI で出さない (列挙攻撃対策)。
  // フィールドではなくフォーム全体のエラーとして扱う。
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return {
      kind: "form",
      message: "メールアドレスまたはパスワードが正しくありません",
    };
  }
  console.error("Unhandled signIn error:", error);
  return { kind: "form", message: "ログインに失敗しました" };
}

import { describe, expect, it } from "vitest";
import { signInInput, signUpInput } from "./auth.schemas";

describe("signInInput", () => {
  it("メール形式が正しくパスワードが空でなければ通る", () => {
    // Arrange
    const input = { email: "alice@example.com", password: "x" };

    // Act
    const result = signInInput.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("メール形式が不正なら拒否する", () => {
    // Arrange
    const input = { email: "not-an-email", password: "anything" };

    // Act
    const result = signInInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("メールは小文字に正規化される", () => {
    // Arrange
    const input = { email: "  Alice@Example.COM  ", password: "x" };

    // Act
    const result = signInInput.parse(input);

    // Assert
    expect(result.email).toBe("alice@example.com");
  });

  it("パスワードが空文字列なら拒否する (長さ制限はサーバ側に任せる)", () => {
    // Arrange
    const input = { email: "alice@example.com", password: "" };

    // Act
    const result = signInInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("8 文字未満でもログインスキーマでは通る (古いユーザを締め出さないため)", () => {
    // Arrange
    const input = { email: "alice@example.com", password: "short" };

    // Act
    const result = signInInput.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("signUpInput", () => {
  const baseValid = {
    name: "Alice",
    email: "alice@example.com",
    password: "abcdefg1",
    passwordConfirm: "abcdefg1",
  };

  it("全フィールドが妥当なら通る", () => {
    // Arrange
    const input = baseValid;

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("名前が空なら拒否する", () => {
    // Arrange
    const input = { ...baseValid, name: "   " };

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("名前が 50 文字を超えたら拒否する", () => {
    // Arrange
    const input = { ...baseValid, name: "a".repeat(51) };

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("メール形式が不正なら拒否する", () => {
    // Arrange
    const input = { ...baseValid, email: "not-an-email" };

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("パスワードが 8 文字未満なら拒否する", () => {
    // Arrange
    const input = {
      ...baseValid,
      password: "abcd123",
      passwordConfirm: "abcd123",
    };

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("数字を含まないパスワードは拒否する", () => {
    // Arrange
    const input = {
      ...baseValid,
      password: "abcdefghi",
      passwordConfirm: "abcdefghi",
    };

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("英字を含まないパスワードは拒否する", () => {
    // Arrange
    const input = {
      ...baseValid,
      password: "12345678",
      passwordConfirm: "12345678",
    };

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("password と passwordConfirm が一致しないと passwordConfirm にエラーを付ける", () => {
    // Arrange
    const input = { ...baseValid, passwordConfirm: "different1" };

    // Act
    const result = signUpInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "passwordConfirm",
      );
      expect(issue?.message).toBe("パスワードが一致しません");
    }
  });
});

import { describe, expect, it } from "vitest";
import { createTodoInput } from "./todo.schemas";

describe("createTodoInput", () => {
  it("通常のタイトルを受け付ける", () => {
    // Arrange
    const input = { title: "買い物に行く" };

    // Act
    const result = createTodoInput.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("前後の空白は trim されて返る", () => {
    // Arrange
    const input = { title: "  hello  " };

    // Act
    const result = createTodoInput.parse(input);

    // Assert
    expect(result.title).toBe("hello");
  });

  it("空文字列は拒否する", () => {
    // Arrange
    const input = { title: "" };

    // Act
    const result = createTodoInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("空白のみの文字列も trim 後に空になるので拒否する", () => {
    // Arrange
    const input = { title: "   " };

    // Act
    const result = createTodoInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("200 文字ちょうどは受け付ける", () => {
    // Arrange
    const input = { title: "a".repeat(200) };

    // Act
    const result = createTodoInput.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("201 文字は拒否する", () => {
    // Arrange
    const input = { title: "a".repeat(201) };

    // Act
    const result = createTodoInput.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

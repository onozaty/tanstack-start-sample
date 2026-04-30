import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "../../../tests/helpers/db";
import { createTestUser } from "../../../tests/helpers/factory";
import {
  createTodoForUser,
  deleteTodoForUser,
  listTodosForUser,
  toggleTodoForUser,
} from "./operations";

beforeEach(async () => {
  await resetDb();
});

describe("listTodosForUser", () => {
  it("ユーザの TODO のみを作成日時の降順で返す", async () => {
    // Arrange
    const me = await createTestUser();
    const other = await createTestUser();
    const older = await createTodoForUser(me.id, "older");
    // 同タイミングだと order が安定しないので 1ms ずらす
    await new Promise((r) => setTimeout(r, 5));
    const newer = await createTodoForUser(me.id, "newer");
    await createTodoForUser(other.id, "other-user-todo");

    // Act
    const result = await listTodosForUser(me.id);

    // Assert
    expect(result.map((t) => t.id)).toEqual([newer.id, older.id]);
  });

  it("TODO が無いユーザには空配列を返す", async () => {
    // Arrange
    const me = await createTestUser();

    // Act
    const result = await listTodosForUser(me.id);

    // Assert
    expect(result).toEqual([]);
  });
});

describe("createTodoForUser", () => {
  it("指定したユーザに紐づく未完了の TODO を作成する", async () => {
    // Arrange
    const me = await createTestUser();

    // Act
    const created = await createTodoForUser(me.id, "buy milk");

    // Assert
    expect(created).toMatchObject({
      userId: me.id,
      title: "buy milk",
      done: false,
    });
  });
});

describe("toggleTodoForUser", () => {
  it("自分の TODO の done を反転して返す", async () => {
    // Arrange
    const me = await createTestUser();
    const todo = await createTodoForUser(me.id, "task");

    // Act
    const toggled = await toggleTodoForUser(me.id, todo.id);

    // Assert
    expect(toggled.done).toBe(true);
  });

  it("再度トグルすると元の状態に戻る", async () => {
    // Arrange
    const me = await createTestUser();
    const todo = await createTodoForUser(me.id, "task");
    await toggleTodoForUser(me.id, todo.id);

    // Act
    const toggledTwice = await toggleTodoForUser(me.id, todo.id);

    // Assert
    expect(toggledTwice.done).toBe(false);
  });

  it("他ユーザの TODO は見つからない扱いとして NOT_FOUND を投げる", async () => {
    // Arrange
    const owner = await createTestUser();
    const intruder = await createTestUser();
    const todo = await createTodoForUser(owner.id, "owner's task");

    // Act + Assert
    await expect(toggleTodoForUser(intruder.id, todo.id)).rejects.toThrow(
      "NOT_FOUND",
    );
  });

  it("他ユーザがトグルしようとしても元の TODO の状態は変わらない", async () => {
    // Arrange
    const owner = await createTestUser();
    const intruder = await createTestUser();
    const todo = await createTodoForUser(owner.id, "owner's task");

    // Act
    await expect(toggleTodoForUser(intruder.id, todo.id)).rejects.toThrow();

    // Assert
    const [stored] = await listTodosForUser(owner.id);
    expect(stored.done).toBe(false);
  });

  it("存在しない id を渡すと NOT_FOUND を投げる", async () => {
    // Arrange
    const me = await createTestUser();

    // Act + Assert
    await expect(
      toggleTodoForUser(me.id, "00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("NOT_FOUND");
  });
});

describe("deleteTodoForUser", () => {
  it("自分の TODO を削除して id を返す", async () => {
    // Arrange
    const me = await createTestUser();
    const todo = await createTodoForUser(me.id, "task");

    // Act
    const result = await deleteTodoForUser(me.id, todo.id);

    // Assert
    expect(result).toEqual({ id: todo.id });
  });

  it("削除後は一覧に含まれなくなる", async () => {
    // Arrange
    const me = await createTestUser();
    const todo = await createTodoForUser(me.id, "task");

    // Act
    await deleteTodoForUser(me.id, todo.id);

    // Assert
    const remaining = await listTodosForUser(me.id);
    expect(remaining).toEqual([]);
  });

  it("他ユーザの TODO は削除できず NOT_FOUND を投げる", async () => {
    // Arrange
    const owner = await createTestUser();
    const intruder = await createTestUser();
    const todo = await createTodoForUser(owner.id, "owner's task");

    // Act + Assert
    await expect(deleteTodoForUser(intruder.id, todo.id)).rejects.toThrow(
      "NOT_FOUND",
    );
  });

  it("他ユーザが削除しようとしても元の TODO は残る", async () => {
    // Arrange
    const owner = await createTestUser();
    const intruder = await createTestUser();
    const todo = await createTodoForUser(owner.id, "owner's task");

    // Act
    await expect(deleteTodoForUser(intruder.id, todo.id)).rejects.toThrow();

    // Assert
    const remaining = await listTodosForUser(owner.id);
    expect(remaining.map((t) => t.id)).toEqual([todo.id]);
  });

  it("存在しない id を渡すと NOT_FOUND を投げる", async () => {
    // Arrange
    const me = await createTestUser();

    // Act + Assert
    await expect(
      deleteTodoForUser(me.id, "00000000-0000-0000-0000-000000000000"),
    ).rejects.toThrow("NOT_FOUND");
  });
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "#/features/auth/auth.server";
import { getRequestLogger } from "#/lib/log-context.server";
import { createTodoInput } from "./todo.schemas";
import {
  createTodoForUser,
  deleteTodoForUser,
  listTodosForUser,
  setTodoDoneForUser,
} from "./todo.server";

const idSchema = z.number().int().positive();

export const listTodos = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const log = getRequestLogger().child({ feature: "todo", op: "list" });
  log.info("TODO 一覧の取得を開始します。");
  const todos = await listTodosForUser(userId);
  log.info({ count: todos.length }, "TODO 一覧の取得が完了しました。");
  return todos;
});

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator(createTodoInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const log = getRequestLogger().child({ feature: "todo", op: "create" });
    log.info({ titleLength: data.title.length }, "TODO の作成を開始します。");
    const created = await createTodoForUser(userId, data.title);
    log.info({ todoId: created.id }, "TODO の作成が完了しました。");
    return created;
  });

export const setTodoDone = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: idSchema, done: z.boolean() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const log = getRequestLogger().child({ feature: "todo", op: "setDone" });
    log.info(
      { todoId: data.id, done: data.done },
      "TODO の完了状態の更新を開始します。",
    );
    const updated = await setTodoDoneForUser(userId, data.id, data.done);
    log.info(
      { todoId: data.id, done: data.done },
      "TODO の完了状態の更新が完了しました。",
    );
    return updated;
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: idSchema }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const log = getRequestLogger().child({ feature: "todo", op: "delete" });
    log.info({ todoId: data.id }, "TODO の削除を開始します。");
    const result = await deleteTodoForUser(userId, data.id);
    log.info({ todoId: data.id }, "TODO の削除が完了しました。");
    return result;
  });

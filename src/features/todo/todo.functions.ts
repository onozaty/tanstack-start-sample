import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuthMiddleware } from "#/features/auth/auth.middleware";
import { getRequestLogger } from "#/lib/log-context.server";
import { createTodoInput } from "./todo.schemas";
import {
  createTodoForUser,
  deleteTodoForUser,
  listTodosForUser,
  setTodoDoneForUser,
} from "./todo.server";

const idSchema = z.number().int().positive();

export const listTodos = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const log = getRequestLogger().child({ feature: "todo", op: "list" });
    log.info("TODO 一覧の取得を開始します。");
    const todos = await listTodosForUser(context.userId);
    log.info({ count: todos.length }, "TODO 一覧の取得が完了しました。");
    return todos;
  });

export const createTodo = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(createTodoInput)
  .handler(async ({ context, data }) => {
    const log = getRequestLogger().child({ feature: "todo", op: "create" });
    log.info({ titleLength: data.title.length }, "TODO の作成を開始します。");
    const created = await createTodoForUser(context.userId, data.title);
    log.info({ todoId: created.id }, "TODO の作成が完了しました。");
    return created;
  });

export const setTodoDone = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: idSchema, done: z.boolean() }))
  .handler(async ({ context, data }) => {
    const log = getRequestLogger().child({ feature: "todo", op: "setDone" });
    log.info(
      { todoId: data.id, done: data.done },
      "TODO の完了状態の更新を開始します。",
    );
    const updated = await setTodoDoneForUser(
      context.userId,
      data.id,
      data.done,
    );
    log.info(
      { todoId: data.id, done: data.done },
      "TODO の完了状態の更新が完了しました。",
    );
    return updated;
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: idSchema }))
  .handler(async ({ context, data }) => {
    const log = getRequestLogger().child({ feature: "todo", op: "delete" });
    log.info({ todoId: data.id }, "TODO の削除を開始します。");
    const result = await deleteTodoForUser(context.userId, data.id);
    log.info({ todoId: data.id }, "TODO の削除が完了しました。");
    return result;
  });

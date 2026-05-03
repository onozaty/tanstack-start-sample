import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { auth } from "#/lib/auth";
import {
  createTodoForUser,
  deleteTodoForUser,
  listTodosForUser,
  setTodoDoneForUser,
} from "./operations";

// Better Auth の generateId: "serial" 構成では DB の id は integer だが、
// TS 型上は string (例: "1") として返るため、サーバ側で number に変換する。
async function requireUserId(): Promise<number> {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  const userId = Number(session.user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

const idSchema = z.number().int().positive();

export const listTodos = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  return listTodosForUser(userId);
});

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: z.string().trim().min(1).max(200) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return createTodoForUser(userId, data.title);
  });

export const setTodoDone = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: idSchema, done: z.boolean() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return setTodoDoneForUser(userId, data.id, data.done);
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: idSchema }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return deleteTodoForUser(userId, data.id);
  });

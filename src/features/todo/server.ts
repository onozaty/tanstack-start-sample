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

async function requireUserId(): Promise<string> {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}

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
  .inputValidator(z.object({ id: z.string().uuid(), done: z.boolean() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return setTodoDoneForUser(userId, data.id, data.done);
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return deleteTodoForUser(userId, data.id);
  });

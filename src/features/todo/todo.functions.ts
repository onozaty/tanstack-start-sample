import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "#/lib/auth.server";
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
  return listTodosForUser(userId);
});

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator(createTodoInput)
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

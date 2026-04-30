import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/client";
import { todos } from "#/db/schema/todo";
import { auth } from "#/lib/auth";

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
  return db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(desc(todos.createdAt));
});

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: z.string().trim().min(1).max(200) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const [created] = await db
      .insert(todos)
      .values({ userId, title: data.title })
      .returning();
    return created;
  });

export const toggleTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const [current] = await db
      .select({ done: todos.done })
      .from(todos)
      .where(and(eq(todos.id, data.id), eq(todos.userId, userId)));
    if (!current) {
      throw new Error("NOT_FOUND");
    }
    const [updated] = await db
      .update(todos)
      .set({ done: !current.done })
      .where(and(eq(todos.id, data.id), eq(todos.userId, userId)))
      .returning();
    return updated;
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const result = await db
      .delete(todos)
      .where(and(eq(todos.id, data.id), eq(todos.userId, userId)))
      .returning({ id: todos.id });
    if (result.length === 0) {
      throw new Error("NOT_FOUND");
    }
    return { id: data.id };
  });

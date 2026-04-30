import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db/client";
import { todos } from "#/db/schema/todo";

export type Todo = typeof todos.$inferSelect;

export async function listTodosForUser(userId: string): Promise<Todo[]> {
  return db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(desc(todos.createdAt));
}

export async function createTodoForUser(
  userId: string,
  title: string,
): Promise<Todo> {
  const [created] = await db
    .insert(todos)
    .values({ userId, title })
    .returning();
  return created;
}

export async function toggleTodoForUser(
  userId: string,
  id: string,
): Promise<Todo> {
  const [current] = await db
    .select({ done: todos.done })
    .from(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)));
  if (!current) {
    throw new Error("NOT_FOUND");
  }
  const [updated] = await db
    .update(todos)
    .set({ done: !current.done })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
  return updated;
}

export async function deleteTodoForUser(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const result = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning({ id: todos.id });
  if (result.length === 0) {
    throw new Error("NOT_FOUND");
  }
  return { id };
}

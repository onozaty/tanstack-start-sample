import { and, desc, eq } from "drizzle-orm";
import { db } from "#/db/client.server";
import { todos } from "#/db/schema/todo";

export type Todo = typeof todos.$inferSelect;

export async function listTodosForUser(userId: number): Promise<Todo[]> {
  // created_at が同 ms になっても順序が安定するよう id を tie-breaker に追加
  return db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(desc(todos.createdAt), desc(todos.id));
}

export async function createTodoForUser(
  userId: number,
  title: string,
): Promise<Todo> {
  const [created] = await db
    .insert(todos)
    .values({ userId, title })
    .returning();
  return created;
}

export async function setTodoDoneForUser(
  userId: number,
  id: number,
  done: boolean,
): Promise<Todo> {
  const [updated] = await db
    .update(todos)
    .set({ done })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();
  if (!updated) {
    throw new Error("NOT_FOUND");
  }
  return updated;
}

export async function deleteTodoForUser(
  userId: number,
  id: number,
): Promise<{ id: number }> {
  const result = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning({ id: todos.id });
  if (result.length === 0) {
    throw new Error("NOT_FOUND");
  }
  return { id };
}

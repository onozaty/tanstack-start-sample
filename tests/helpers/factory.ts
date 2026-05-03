import { randomUUID } from "node:crypto";
import { db } from "#/db/client";
import { users } from "#/db/schema/auth";

export async function createTestUser(overrides?: {
  email?: string;
  name?: string;
}): Promise<{ id: number; email: string; name: string }> {
  const email = overrides?.email ?? `${randomUUID()}@example.test`;
  const name = overrides?.name ?? "Test User";

  const [created] = await db
    .insert(users)
    .values({ email, name })
    .returning({ id: users.id });

  return { id: created.id, email, name };
}

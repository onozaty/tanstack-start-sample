import { randomUUID } from "node:crypto";
import { db } from "#/db/client";
import { users } from "#/db/schema/auth";

export async function createTestUser(overrides?: {
  id?: string;
  email?: string;
  name?: string;
}): Promise<{ id: string; email: string; name: string }> {
  const id = overrides?.id ?? randomUUID();
  const email = overrides?.email ?? `${id}@example.test`;
  const name = overrides?.name ?? "Test User";

  await db.insert(users).values({ id, email, name });

  return { id, email, name };
}

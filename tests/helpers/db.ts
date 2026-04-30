import { sql } from "drizzle-orm";
import { db } from "#/db/client";

export async function resetDb(): Promise<void> {
  const result = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  if (result.rows.length === 0) return;

  const tables = result.rows
    .map((row) => `"public"."${row.tablename}"`)
    .join(", ");

  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`),
  );
}

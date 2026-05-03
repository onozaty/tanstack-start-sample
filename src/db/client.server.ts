import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Vite の HMR でこのモジュールが再評価されるたびに新しい Pool が作られると
// 古いプールが解放されず接続がリークする。globalThis にキャッシュして
// プロセス内で一意なプールを使い回す。本番は HMR が無いためキャッシュ不要。
const globalForPool = globalThis as unknown as { pool?: Pool };

const pool =
  globalForPool.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pool = pool;
}

export const db = drizzle(pool, { schema });

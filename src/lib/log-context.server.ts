import { AsyncLocalStorage } from "node:async_hooks";
import { type Logger, logger } from "#/lib/logger.server";

// リクエストスコープで子 logger を共有する。request middleware が als.run で
// child logger を入れ、後段の handler / server fn は getRequestLogger() で
// 取り出して同じ requestId / userId を引き継ぐ。
type LogContext = {
  logger: Logger;
};

const als = new AsyncLocalStorage<LogContext>();

export function runWithLogger<T>(child: Logger, fn: () => T): T {
  return als.run({ logger: child }, fn);
}

// リクエスト外 (起動時の初期化など) で呼ばれた場合は root logger に落とす。
// テスト中も ALS が空なので素の root が返り、LOG_LEVEL=silent が効く。
export function getRequestLogger(): Logger {
  return als.getStore()?.logger ?? logger;
}

// requireUserId 後など、コンテキストに追加情報を載せたいときに使う。
// 戻り値の child を als にも反映させたいので、追加で run を入れ子にする
// のではなく、現在のストアの logger を差し替える形。
export function bindLogContext(fields: Record<string, unknown>): void {
  const store = als.getStore();
  if (!store) return;
  store.logger = store.logger.child(fields);
}

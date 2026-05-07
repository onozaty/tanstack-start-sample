import { hostname } from "node:os";
import { type Logger, pino, stdSerializers } from "pino";

// HMR で複数 logger が乱立しないよう globalThis にキャッシュする。
// db/client.server.ts と同じ手筋。
const globalForLogger = globalThis as unknown as { logger?: Logger };

function resolveLevel(): string {
  const explicit = process.env.LOG_LEVEL;
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "production") return "info";
  return "debug";
}

function buildLogger(): Logger {
  return pino({
    level: resolveLevel(),
    base: {
      service: "tanstack-start-sample",
      env: process.env.NODE_ENV ?? "development",
      hostname: hostname(),
      pid: process.pid,
    },
    // Datadog などで level を文字列として扱えるよう揃える
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: stdSerializers.err,
      req: stdSerializers.req,
      res: stdSerializers.res,
    },
  });
}

export const logger: Logger = globalForLogger.logger ?? buildLogger();
if (process.env.NODE_ENV !== "production") {
  globalForLogger.logger = logger;
}

// プロセス全体の未捕捉エラーを 1 度だけフックしてサーバ側で握る。
// HMR で複数回フックされると同一エラーで多重ログになるためフラグで防ぐ。
const globalForHooks = globalThis as unknown as {
  __loggerHooksInstalled?: boolean;
};
if (!globalForHooks.__loggerHooksInstalled) {
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "未処理の Promise 拒否が発生しました。");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "未捕捉の例外が発生しました。");
  });
  globalForHooks.__loggerHooksInstalled = true;
}

export type { Logger };

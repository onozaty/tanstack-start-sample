import { createMiddleware } from "@tanstack/react-start";
import { runWithLogger } from "#/lib/log-context.server";
import { logger } from "#/lib/logger.server";

// 静的アセットや HMR 通信などはアクセスログを出さない (S/N 比改善)
const SKIP_PATHNAME_PREFIXES = [
  "/_build/",
  "/__/",
  "/@vite/",
  "/@fs/",
  "/@id/",
  "/node_modules/",
];

function shouldSkip(pathname: string, method: string): boolean {
  if (method === "HEAD" || method === "OPTIONS") return true;
  return SKIP_PATHNAME_PREFIXES.some((p) => pathname.startsWith(p));
}

export const requestLoggerMiddleware = createMiddleware({
  type: "request",
}).server(async ({ request, pathname, next }) => {
  if (shouldSkip(pathname, request.method)) {
    return next();
  }

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const method = request.method;
  const url = request.url;
  const reqLogger = logger.child({ requestId, method, url });
  const start = performance.now();

  reqLogger.info("リクエストの処理を開始します。");

  return runWithLogger(reqLogger, async () => {
    try {
      const result = await next();
      reqLogger.info(
        {
          status: result.response.status,
          durationMs: Math.round(performance.now() - start),
        },
        "リクエストの処理が完了しました。",
      );
      return result;
    } catch (err) {
      reqLogger.error(
        {
          err,
          durationMs: Math.round(performance.now() - start),
        },
        "リクエストの処理中にエラーが発生しました。",
      );
      throw err;
    }
  });
});

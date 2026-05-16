import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/features/auth/auth.server";

// 未ログインでも呼べる必要があるため、requireAuthMiddleware は意図的に付けない。
// ルートの beforeLoad でセッション有無を判定するために、未ログイン時は null を
// 返すのが正しい挙動。
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    return auth.api.getSession({ headers: request.headers });
  },
);

import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/features/auth/auth.server";
import { bindLogContext } from "#/lib/log-context.server";

// 未認証は throw redirect で /login に飛ばす。素の Error だと TanStack Start の
// 共通エラー扱いになり 500 として記録されてしまうのと、UI 側で個別ハンドリングが
// 必要になるため、ルートガード (_authenticated.tsx) と同じ redirect パターンに揃える。
// Better Auth の generateId: "serial" 構成では DB の id は integer だが、
// TS 型上は string (例: "1") として返るため、サーバ側で number に変換する。
export const requireAuthMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw redirect({ to: "/login" });
  }
  const userId = Number(session.user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw redirect({ to: "/login" });
  }
  // 同一リクエスト内の以降のログに userId が自動で付与される
  bindLogContext({ userId });
  return next({ context: { userId } });
});

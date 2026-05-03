import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

// Better Auth の generateId: "serial" 構成では DB の id は integer だが、
// TS 型上は string (例: "1") として返るため、サーバ側で number に変換する。
export async function requireUserId(): Promise<number> {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  const userId = Number(session.user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

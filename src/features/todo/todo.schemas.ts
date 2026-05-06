import { z } from "zod";

// クライアント (TanStack Form の validators) とサーバ (createServerFn の
// inputValidator) の双方から import して使う。同じスキーマを共有することで、
// クライアントを通り抜けた入力がサーバ側 Zod でも矛盾なく検証されることを
// 静的に担保する。
export const createTodoInput = z.object({
  title: z
    .string()
    .trim()
    .min(1, "1文字以上で入力してください")
    .max(200, "200文字以内で入力してください"),
});

export type CreateTodoInput = z.infer<typeof createTodoInput>;

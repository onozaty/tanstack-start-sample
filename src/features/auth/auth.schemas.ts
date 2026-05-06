import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("メールアドレスの形式が正しくありません");

// ログイン時はサーバ側 (Better Auth) の最小長制約とは独立に「空でない」だけを
// 検証する。クライアントで 8 文字未満を弾いてしまうと、後でサーバ側の最小長を
// 緩めたときにログインできなくなる古いユーザを抱え込み得るし、「資格情報不一致」
// との切り分けが UI 上で曖昧になる。
export const signInInput = z.object({
  email: emailField,
  password: z.string().min(1, "パスワードを入力してください"),
});

export type SignInInput = z.infer<typeof signInInput>;

export const signUpInput = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "名前を入力してください")
      .max(50, "50文字以内で入力してください"),
    email: emailField,
    password: z
      .string()
      .min(8, "8文字以上で入力してください")
      .max(100, "100文字以内で入力してください")
      .regex(/[A-Za-z]/, "英字を含めてください")
      .regex(/[0-9]/, "数字を含めてください"),
    // クロスフィールド検証で password と一致するかを確認するため受け取る。
    // サーバへは送らない (Better Auth 呼び出し前に omit する)。
    passwordConfirm: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "パスワードが一致しません",
      });
    }
  });

export type SignUpInput = z.infer<typeof signUpInput>;

import { useForm, useStore } from "@tanstack/react-form";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { signUpInput } from "#/features/auth/auth.schemas";
import { mapSignUpError } from "#/features/auth/auth-errors";
import { AuthFieldRow } from "#/features/auth/auth-field-row";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/signup")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/" });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  // Better Auth から返ったフォーム全体エラー (重複以外)。
  // フィールドエラーは TanStack Form の form.setFieldMeta で各 Field に流し込む。
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", passwordConfirm: "" },
    // クライアント側 onChange で逐次検証し、submit 時にも全フィールドを再検証
    // するため onSubmit にも同じスキーマを渡す。サーバ側 inputValidator が
    // 同じスキーマを使う想定なので、UI とサーバで検証結果が一致する。
    validators: { onChange: signUpInput, onSubmit: signUpInput },
    onSubmit: async ({ value, formApi }) => {
      setFormError(null);
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });
      if (error) {
        const mapped = mapSignUpError(error);
        if (mapped.kind === "field") {
          formApi.setFieldMeta(mapped.field, (prev) => ({
            ...prev,
            errorMap: { ...prev.errorMap, onSubmit: mapped.message },
          }));
        } else {
          setFormError(mapped.message);
        }
        return;
      }
      // root の beforeLoad を再実行し context.session を最新化してから遷移
      // しないと、/_authenticated 側の beforeLoad が古い null セッションで
      // 評価され /login に弾き返されてしまう
      await router.invalidate();
      await router.navigate({ to: "/" });
    },
  });

  // 「触ったフィールドだけエラー表示」だと未入力のまま submit を試みた
  // ユーザに何も出ないため、submit 試行後は全フィールドにエラーを表示する。
  const submitAttempted = useStore(form.store, (s) => s.submissionAttempts) > 0;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>サインアップ</CardTitle>
          <CardDescription>新しいアカウントを作成します</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <CardContent className="space-y-4">
            <form.Field name="name">
              {(field) => (
                <AuthFieldRow
                  label="名前"
                  type="text"
                  field={field}
                  autoComplete="name"
                  showError={field.state.meta.isDirty || submitAttempted}
                />
              )}
            </form.Field>
            <form.Field
              name="email"
              listeners={{
                // 重複メールでサーバから受け取ったフィールドエラーは、ユーザが
                // 再入力した時点で stale。Zod (onChange) のエラーで上書きすれば
                // 自然にクリアされるが、メール形式が valid に戻った瞬間は残る
                // ため明示的に消す。
                onChange: ({ fieldApi }) => {
                  fieldApi.setMeta((prev) => ({
                    ...prev,
                    errorMap: { ...prev.errorMap, onSubmit: undefined },
                  }));
                },
              }}
            >
              {(field) => (
                <AuthFieldRow
                  label="メールアドレス"
                  type="email"
                  field={field}
                  autoComplete="email"
                  showError={field.state.meta.isDirty || submitAttempted}
                />
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <AuthFieldRow
                  label="パスワード"
                  type="password"
                  field={field}
                  autoComplete="new-password"
                  hint="英字と数字を含む 8 文字以上"
                  showError={field.state.meta.isDirty || submitAttempted}
                />
              )}
            </form.Field>
            <form.Field name="passwordConfirm">
              {(field) => (
                <AuthFieldRow
                  label="パスワード (確認)"
                  type="password"
                  field={field}
                  autoComplete="new-password"
                  showError={field.state.meta.isDirty || submitAttempted}
                />
              )}
            </form.Field>
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "作成中..." : "アカウント作成"}
                </Button>
              )}
            </form.Subscribe>
            <a
              href="/login"
              className="text-sm text-muted-foreground underline"
            >
              既にアカウントをお持ちの方
            </a>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

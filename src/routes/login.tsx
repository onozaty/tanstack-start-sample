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
import { signInInput } from "#/features/auth/auth.schemas";
import { mapSignInError } from "#/features/auth/auth-errors";
import { AuthFieldRow } from "#/features/auth/auth-field-row";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  // 資格情報不一致は email/password どちらが間違いか出さないため、
  // フォーム全体エラーとして扱う。
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: signInInput, onSubmit: signInInput },
    onSubmit: async ({ value }) => {
      setFormError(null);
      const { error } = await authClient.signIn.email(value);
      if (error) {
        setFormError(mapSignInError(error).message);
        return;
      }
      // root の beforeLoad を再実行し context.session を最新化してから遷移
      // しないと、/_authenticated 側の beforeLoad が古い null セッションで
      // 評価され /login に弾き返されてしまう
      await router.invalidate();
      await router.navigate({ to: "/" });
    },
  });

  const submitAttempted = useStore(form.store, (s) => s.submissionAttempts) > 0;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>
            メールアドレスとパスワードを入力してください
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <CardContent className="space-y-4">
            <form.Field name="email">
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
                  autoComplete="current-password"
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
                  {isSubmitting ? "ログイン中..." : "ログイン"}
                </Button>
              )}
            </form.Subscribe>
            <a
              href="/signup"
              className="text-sm text-muted-foreground underline"
            >
              アカウントを作成する
            </a>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

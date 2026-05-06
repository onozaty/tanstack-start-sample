import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, isNotFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import {
  createTodo,
  deleteTodo,
  listTodos,
  setTodoDone,
} from "#/features/todo/todo.functions";
import { createTodoInput } from "#/features/todo/todo.schemas";
import { authClient } from "#/lib/auth-client";
import { extractFirstErrorMessage } from "#/lib/form-utils";

export const Route = createFileRoute("/_authenticated/")({
  loader: () => listTodos(),
  component: Home,
});

const TITLE_MAX_LENGTH = 200;

function mutationErrorMessage(error: unknown): string {
  // notFound() は他タブ削除や stale な ID で起きるためメッセージを分岐する
  if (isNotFound(error)) {
    return "対象の TODO が見つかりません (他のタブで削除された可能性があります)";
  }
  return "操作に失敗しました";
}

function Home() {
  const { session } = Route.useRouteContext();
  const todos = Route.useLoaderData();
  const router = useRouter();

  // 直近に走った mutation を覚えておき、その error だけバナーに反映する。
  // 単純に 3 つの error を ?? で合体すると、過去のエラー (例: 削除失敗) が
  // 別の mutation 成功後もクリアされず残ってしまう。
  const [activeMutation, setActiveMutation] = useState<
    "create" | "setDone" | "delete" | null
  >(null);

  const createMutation = useMutation({
    mutationFn: (data: { title: string }) => createTodo({ data }),
    onMutate: () => setActiveMutation("create"),
    onSuccess: () => router.invalidate(),
  });

  const setDoneMutation = useMutation({
    mutationFn: (data: { id: number; done: boolean }) => setTodoDone({ data }),
    onMutate: () => setActiveMutation("setDone"),
    onSuccess: () => router.invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (data: { id: number }) => deleteTodo({ data }),
    onMutate: () => setActiveMutation("delete"),
    onSuccess: () => router.invalidate(),
  });

  const mutationError =
    activeMutation === "create"
      ? createMutation.error
      : activeMutation === "setDone"
        ? setDoneMutation.error
        : activeMutation === "delete"
          ? deleteMutation.error
          : null;

  const addForm = useForm({
    defaultValues: { title: "" },
    // サーバ側 inputValidator と同じ Zod スキーマで検証する
    validators: { onChange: createTodoInput },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync(value, {
        onSuccess: () => formApi.reset(),
      });
    },
  });

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      console.error("signOut failed:", error);
      return;
    }
    // root の beforeLoad を再実行し context.session を最新化してから遷移
    // しないと、/login の beforeLoad が古いセッションで評価されて
    // 「ログイン済みなので /」に弾き返されてしまう
    await router.invalidate();
    await router.navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">TODO</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session?.user.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            ログアウト
          </Button>
        </div>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void addForm.handleSubmit();
        }}
        className="mb-6"
      >
        <addForm.Field name="title">
          {(field) => {
            const errorMessage = field.state.meta.isDirty
              ? extractFirstErrorMessage(field.state.meta.errors)
              : undefined;
            const length = field.state.value.length;
            return (
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="やることを入力"
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={
                      errorMessage ? `${field.name}-error` : undefined
                    }
                  />
                  <addForm.Subscribe selector={(s) => s.canSubmit}>
                    {(canSubmit) => (
                      <Button type="submit" disabled={!canSubmit}>
                        追加
                      </Button>
                    )}
                  </addForm.Subscribe>
                </div>
                <div className="flex min-h-4 items-center justify-between text-xs">
                  {errorMessage ? (
                    <span
                      id={`${field.name}-error`}
                      className="text-destructive"
                      role="alert"
                    >
                      {errorMessage}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className={
                      length > TITLE_MAX_LENGTH
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {length} / {TITLE_MAX_LENGTH}
                  </span>
                </div>
              </div>
            );
          }}
        </addForm.Field>
      </form>

      {mutationError && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {mutationErrorMessage(mutationError)}
        </p>
      )}

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          まだ TODO はありません。
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-md border bg-card p-3"
            >
              <Checkbox
                checked={todo.done}
                // 完了切替は冪等なので連打しても安全。disabled で連打防止
                // すると mutation 完了時の数百 ms だけ cursor-not-allowed
                // が出てちらつくので外している。
                onCheckedChange={(checked) =>
                  setDoneMutation.mutate({
                    id: todo.id,
                    done: checked === true,
                  })
                }
                aria-label={
                  todo.done
                    ? `${todo.title} を未完了に戻す`
                    : `${todo.title} を完了にする`
                }
              />
              <span
                className={
                  todo.done
                    ? "flex-1 text-muted-foreground line-through"
                    : "flex-1"
                }
              >
                {todo.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate({ id: todo.id })}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

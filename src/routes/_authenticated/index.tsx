import { createFileRoute, useRouter } from "@tanstack/react-router";
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
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_authenticated/")({
  loader: () => listTodos(),
  component: Home,
});

function Home() {
  const { session } = Route.useRouteContext();
  const todos = Route.useLoaderData();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await createTodo({ data: { title: trimmed } });
      setTitle("");
      await router.invalidate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDone = async (id: number, done: boolean) => {
    await setTodoDone({ data: { id, done } });
    await router.invalidate();
  };

  const handleDelete = async (id: number) => {
    await deleteTodo({ data: { id } });
    await router.invalidate();
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

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="やることを入力"
          maxLength={200}
        />
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          追加
        </Button>
      </form>

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
                onCheckedChange={(checked) =>
                  handleSetDone(todo.id, checked === true)
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
                onClick={() => handleDelete(todo.id)}
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

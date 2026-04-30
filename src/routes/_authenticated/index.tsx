import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_authenticated/")({ component: Home });

function Home() {
  const { session } = Route.useRouteContext();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.invalidate();
          router.navigate({ to: "/login" });
        },
      },
    });
  };

  return (
    <div className="p-8">
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
      <p className="text-muted-foreground">
        ここに TODO 一覧と追加フォームが入ります。
      </p>
    </div>
  );
}

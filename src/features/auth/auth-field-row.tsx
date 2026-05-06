import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { extractFirstErrorMessage } from "#/lib/form-utils";

// signup / login で同じ見た目のフィールド行を使うためのローカル UI ヘルパ。
// useForm の TField generic に依存させずに使えるよう、必要最小限の構造だけ
// duck-typing で受け取る。

type AuthFormField = {
  name: string;
  state: { value: string; meta: { isDirty: boolean; errors: unknown[] } };
  handleChange: (value: string) => void;
  handleBlur: () => void;
};

export function AuthFieldRow({
  label,
  type,
  field,
  autoComplete,
  hint,
  showError,
}: {
  label: string;
  type: "text" | "email" | "password";
  field: AuthFormField;
  autoComplete?: string;
  hint?: string;
  // 「ユーザが触ったフィールドだけ」「submit 後は全フィールド」エラーを出したい
  // ため、表示可否はフォーム側で判定して渡す。
  showError: boolean;
}) {
  const errorMessage = showError
    ? extractFirstErrorMessage(field.state.meta.errors)
    : undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        autoComplete={autoComplete}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={
          hint || errorMessage ? `${field.name}-meta` : undefined
        }
      />
      {(hint || errorMessage) && (
        <p
          id={`${field.name}-meta`}
          className={
            errorMessage
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
          role={errorMessage ? "alert" : undefined}
        >
          {errorMessage ?? hint}
        </p>
      )}
    </div>
  );
}

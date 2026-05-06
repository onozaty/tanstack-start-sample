// TanStack Form の field.state.meta.errors に入ってくる要素を文字列化する。
// validators.onChange に Zod (Standard Schema) を渡した場合は { message } を持つ
// オブジェクト、setFieldMeta で文字列を直接書き込んだ場合は string で来るため
// 両対応する。学習用サンプルなので最小限の判定に留めている。
export function extractFirstErrorMessage(
  errors: unknown[],
): string | undefined {
  for (const err of errors) {
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
  }
  return undefined;
}

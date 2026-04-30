# TanStack Start サンプルアプリ 実装計画

TanStack Start を試すサンプルプロジェクト。シンプルな TODO アプリを題材にして、認証付きの最小構成を作る。

最終更新: 2026-04-30

---

## 1. ゴール

- TanStack Start でフルスタック (SSR + サーバ関数) のサンプルアプリを構築する。
- ユーザはメール+パスワードでサインアップ・ログインできる。
- ログイン中のユーザだけが自分の TODO を CRUD できる。
- DB は PostgreSQL 18 (Dev Container 同梱) を使う。
- 後から OAuth・メール認証・パスワードリセットなどを追加しやすい構成にする。

## 2. スコープ

### MVP に含めるもの

- メール + パスワードによるサインアップ / ログイン / ログアウト。
- パスワードはハッシュ化して別テーブルに保存 (Better Auth 管理の `account` テーブル)。
- セッション Cookie によるログイン状態維持 (Better Auth 既定)。
- TODO の一覧 / 追加 / 完了切替 / 削除。各 TODO は所有ユーザに紐づく。
- ルート保護: `/login`, `/signup` 以外の業務画面は未ログイン時にログイン画面へリダイレクト。

### 今回は含めない (将来拡張として置く)

- OAuth ソーシャルログイン (Google など)。
- メールアドレス検証 / パスワードリセット (SMTP / Resend 等の外部サービスが必要なため)。
- パスキー・2FA。
- 本番デプロイ手順 (Cloudflare / Vercel / Node アダプタの選定)。

## 3. 技術選定

| 領域 | 採用 | 理由 |
|---|---|---|
| メタフレームワーク | **TanStack Start (RC)** | 課題のテーマ。SSR + 型安全な Server Functions が魅力。RC だが API は安定し本番採用例も増えている。 |
| ランタイム / PM | **Node 24 + pnpm** | Dev Container ですでに準備済み。 |
| ビルド | **Vite** | TanStack Start 公式採用。 |
| ルータ | **TanStack Router** | TanStack Start に同梱。ファイルベース + 型安全。 |
| DB | **PostgreSQL 18** | Dev Container 同梱。`compose.yaml` の `db` サービス。 |
| ORM | **Drizzle ORM** | TypeScript-first・SQL に近く SSR/Edge にも強い。Better Auth が公式に Drizzle アダプタを提供しており、TanStack Start + Better Auth 構成のデファクト。 |
| DB ドライバ | **node-postgres (`pg`)** | Drizzle の `node-postgres` ドライバ経由で利用。Dev Container 内のローカル DB へ TCP 接続。 |
| 認証 | **Better Auth** | TanStack Start に公式統合 (`tanstackStartCookies` プラグインで Cookie 設定を自動化)。Drizzle アダプタあり (`usePlural: true` でテーブル名を複数形に揃える)。後から OAuth / メール検証 / パスキーをプラグインで追加可能。Lucia は 2025 年にメンテ終了、Auth.js は TanStack Start 周辺の事例が薄いため除外。 |
| パスワードハッシュ | Better Auth 内蔵 (scrypt) | 自前で bcrypt/argon2 を入れない。 |
| UI | **shadcn/ui + Tailwind CSS** | TanStack Start CLI のアドオン (`--add-ons shadcn`) で Tailwind 込みでセットアップされる。コピー&所有方式なのでバンドルが膨らまず、後からコンポーネントを足しやすい。 |
| Lint / Format | **Biome** | TanStack Start CLI のツールチェイン選択肢の一つ (`--toolchain biome`)。1 ツールで lint+format をカバーでき設定ファイルが `biome.json` のみで済む。Rust 製で高速。今回はカスタムルール要求が薄く、ESLint プラグイン依存もないため Biome に倒す。 |

### 検討した代替案 (採用しなかった理由)

- **Prisma**: 成熟しているがバンドルが大きく、TanStack Start + Better Auth の事例は Drizzle が圧倒的に多い。スキーマ管理の統一性で Drizzle に寄せる。
- **Auth.js (旧 NextAuth)**: 歴史は長いが TanStack Start 向け統合は Better Auth の方が完成度が高い。
- **自前認証 (Lucia 流)**: 学習にはよいが、本サンプルは「TanStack Start を試す」が主眼なので認証は枯れた選択肢に寄せる。
- **ESLint + Prettier**: TanStack Start CLI のもう一つの選択肢。プラグイン (Tailwind 並び順、a11y 等) が必要になったら乗り換える前提で、今回は設定ファイル数を抑えるため Biome を選択。

## 4. ディレクトリ構成 (案)

```
.
├── PLAN.md                    # 本ドキュメント
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts             # TanStack Start プラグイン設定
├── drizzle.config.ts          # Drizzle Kit 設定
├── biome.json                 # Lint/Format 設定 (CLI が生成)
├── components.json            # shadcn/ui 設定 (CLI が生成)
├── .env                       # DATABASE_URL, BETTER_AUTH_SECRET など (ローカル用としてコミットする)
├── drizzle/                   # マイグレーション SQL (drizzle-kit generate の出力)
└── src/
    ├── router.tsx             # ルータ生成
    ├── routeTree.gen.ts       # 自動生成 (gitignore)
    ├── styles/
    │   └── globals.css        # Tailwind + shadcn のベーススタイル
    ├── routes/
    │   ├── __root.tsx
    │   ├── index.tsx          # ログイン後 TOP (TODO 一覧) / 未ログインは /login へ
    │   ├── login.tsx
    │   ├── signup.tsx
    │   └── api/
    │       └── auth/
    │           └── $.ts       # Better Auth ハンドラ (GET/POST)
    ├── components/
    │   └── ui/                # shadcn/ui で追加した Button / Input / Card 等
    ├── lib/
    │   ├── utils.ts           # shadcn/ui が使う cn() ヘルパ
    │   ├── auth.ts            # betterAuth() インスタンス (サーバ側)
    │   ├── auth-client.ts     # createAuthClient (クライアント側)
    │   └── server/
    │       └── session.ts     # createServerFn でセッション取得
    ├── db/
    │   ├── client.ts          # drizzle(pgPool) のエクスポート
    │   └── schema/
    │       ├── auth.ts        # Better Auth が要求するテーブル
    │       └── todo.ts        # TODO テーブル
    └── features/
        └── todo/
            ├── server.ts      # createServerFn による CRUD
            └── components/    # 一覧・フォーム
```

> 実装着手時に TanStack Start CLI (`pnpm create @tanstack/start --add-ons shadcn --toolchain biome`) の出力に合わせて微調整する。

## 5. データモデル

Better Auth が要求するテーブル (CLI で自動生成) と、アプリ独自テーブルを分けて持つ。

**命名規則**: テーブル名は **複数形**、カラム名は単数形 + snake_case で統一する。Drizzle 公式サンプルも複数形 (`users` / `posts` / `comments`) を採用している。Better Auth はデフォルトが単数形 (`user` / `account` / ...) のため、`drizzleAdapter` に `usePlural: true` を渡して合わせる。

### 5.1 Better Auth 管理 (CLI 生成にお任せ)

| テーブル | 用途 |
|---|---|
| `users` | ユーザ基本情報 (id, email, name, emailVerified, createdAt, updatedAt) |
| `accounts` | 認証クレデンシャル。**メール+パスワードの場合は `providerId='credential'` で `password` カラムにハッシュが入る**。OAuth 追加時もここに行が増える |
| `sessions` | セッション (Cookie からの参照先) |
| `verifications` | メール検証・パスワードリセット等のトークン置き場 (今回は未使用だがテーブルは作る) |

→ ユーザ要望の「パスワードは別テーブル」は `accounts` テーブルで自動的に満たされる (`users` とは別テーブル)。

### 5.2 アプリ独自

```ts
// src/db/schema/todo.ts (イメージ)
export const todos = pgTable("todos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- `userId` で `user.id` を FK 参照。ユーザ削除時はカスケード。
- 一覧はログインユーザの行のみ返す。CRUD はサーバ関数側で必ず `userId` フィルタを掛ける (権限チェックを UI 側に依存しない)。

## 6. 主要パッケージ

ランタイム:

- `@tanstack/react-start`, `@tanstack/react-router`
- `react`, `react-dom`
- `better-auth`
- `@better-auth/drizzle-adapter` (※ 公式パッケージ。導入時に最新名を確認する)
- `drizzle-orm`
- `pg`
- `dotenv` (Drizzle Kit の設定読み込み用)
- shadcn/ui 関連: `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/*` (CLI とアドオンが必要分を入れる)

開発:

- `vite`, `@tanstack/start-vite-plugin` (CLI 雛形が入れる)
- `typescript`, `@types/react`, `@types/react-dom`, `@types/pg`
- `drizzle-kit`
- `tsx` (スクリプト実行)
- `@biomejs/biome` (CLI 雛形が `--toolchain biome` で入れる)
- `shadcn` CLI (コンポーネント追加用に `pnpm dlx shadcn@latest add ...` で利用)

## 7. 環境変数

ローカル動作確認用なので、`.env` を **そのままリポジトリにコミットする** 方針 (`.gitignore` に `.env` を入れない)。clone した直後に書き換え無しで `pnpm dev` できる状態を保つ。実装時に `BETTER_AUTH_SECRET` のランダム値を生成して埋める。

```
# Dev Container の compose.yaml と一致させる
DATABASE_URL=postgresql://db_user:db_password@localhost:5432/sample

# Better Auth セッション署名用 (32+ バイトのランダム値)
# 実装時に `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` で生成して埋める
BETTER_AUTH_SECRET=<実装時に生成して埋める>
BETTER_AUTH_URL=http://localhost:3000
```

> `compose.yaml` の `app` サービスは `network_mode: service:db` で `db` と同一ネットワーク名前空間にいるため、ホスト名は `localhost` で OK。

> 本番デプロイや OAuth キーなど **本物の秘密** を扱うフェーズに入ったら、その時点で `.env` を `.gitignore` に追加し `.env.example` を別途用意する運用に切り替える。

## 8. 実装ステップ

各ステップごとに動作確認できる粒度で進める。

1. **プロジェクト初期化**
   - `pnpm create @tanstack/start@latest . --add-ons shadcn --toolchain biome` で雛形生成 (TypeScript / pnpm 指定)。
     - `shadcn` アドオンで Tailwind CSS + shadcn 初期セット (`components.json`, `src/lib/utils.ts`, ベースコンポーネント) が入る。
     - `biome` ツールチェインで `biome.json` が入り、`pnpm lint` / `pnpm format` (or `check`) スクリプトが追加される。
   - `pnpm dev` でブランクページが出ることを確認。
   - `pnpm exec biome check .` が通ることを確認 (CI/pre-commit に組み込む足場)。
   - 雛形が生成した `README.md` は中身を破棄して空 (もしくはプロジェクト名のみ) にしておく。最終 README はステップ 7 で書き起こす。
   - ルートに `PLAN.md` (本書) を残す。`.env` を新規作成 (§7 の内容)。`BETTER_AUTH_SECRET` は `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` で生成した値を埋める。
   - 雛形が `.gitignore` に `.env` を入れていたら **その行を削除** してコミット対象にする。

2. **PostgreSQL 接続 (Drizzle)**
   - `drizzle-orm`, `pg`, `drizzle-kit`, `dotenv`, `@types/pg` を追加。
   - `drizzle.config.ts`, `src/db/client.ts` を作成。
   - 動作確認用に `src/db/schema/_ping.ts` で簡単な `pgTable` を 1 つ作り、`drizzle-kit push` でテーブルが作れることを確認 → 確認後削除。

3. **Better Auth セットアップ**
   - `better-auth`, `@better-auth/drizzle-adapter` を追加。
   - `src/lib/auth.ts` で以下を定義:
     ```ts
     betterAuth({
       database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
       emailAndPassword: { enabled: true },
       plugins: [tanstackStartCookies()],
     })
     ```
   - `npx @better-auth/cli generate` で `src/db/schema/auth.ts` を生成。**生成されたテーブル名が複数形 (`users` / `accounts` / `sessions` / `verifications`) になっているか確認し、単数形で出力された場合は手動で複数形にリネーム**してから次に進む。
   - `drizzle-kit generate` → `drizzle-kit migrate` で DB に反映。
   - `src/routes/api/auth/$.ts` にハンドラを作成。

4. **クライアント側の認証フック整備**
   - `src/lib/auth-client.ts` で `createAuthClient` を初期化。
   - shadcn の `Button` / `Input` / `Card` / `Label` を `pnpm dlx shadcn@latest add button input card label` で追加。
   - サインアップ / ログイン / ログアウト用の最小フォーム (`/signup`, `/login`) を shadcn コンポーネントで作る。
   - `createServerFn` でラップした `getSession` を作り、`__root.tsx` の `beforeLoad` で利用できるようにする。

5. **TODO 機能**
   - `src/db/schema/todo.ts` を作成 → `drizzle-kit generate` → `migrate`。
   - `createServerFn` でラップした `listTodos` / `createTodo` / `toggleTodo` / `deleteTodo` を作成。すべての関数で `getSession` を呼びユーザを必須化。
   - 必要な shadcn コンポーネント (`checkbox`, `dialog` 等) を都度 `shadcn add` で追加。
   - `/` ルートで TODO 一覧 + 追加フォームを表示。`beforeLoad` で未ログインなら `/login` にリダイレクト。

6. **動作確認**
   - 2 ユーザでサインアップ → それぞれ TODO を作り、相手の TODO が見えないことを確認。
   - ログアウト → `/` にアクセスで `/login` にリダイレクトされることを確認。
   - `pgadmin4` (`http://localhost:8080`) で `user` / `account` / `session` / `todos` テーブルが期待通りに作られていることを確認。
   - `pnpm exec biome check .` がエラーなく通ることを確認。

7. **仕上げ**
   - `package.json` に `dev` / `build` / `lint` / `format` / `db:generate` / `db:migrate` / `db:studio` / `auth:generate` のスクリプトを整理。
   - `.gitignore` に `drizzle/.snapshots/`, `routeTree.gen.ts` などを追加 (`.env` は含めない: §7 の方針通りローカル用としてコミットする)。
   - **README.md を本プロジェクトの最終ドキュメントとして書き起こす。** 構成案:
     1. プロジェクト概要 (TanStack Start を試すサンプル / 認証付き TODO)
     2. 技術スタック (PLAN §3 のテーブルを簡潔化して転記)
     3. 必要環境 (Dev Container / Node / pnpm / PostgreSQL のバージョン)
     4. セットアップ手順 (Dev Container 起動 → `pnpm install` → `.env` 作成 → マイグレーション → `pnpm dev`)
     5. 環境変数 (`.env.example` の各変数の意味)
     6. 開発コマンド (`pnpm dev` / `lint` / `format` / `db:*` / `auth:generate`)
     7. DB マイグレーションの流れ (スキーマ変更 → `db:generate` → `db:migrate`)
     8. shadcn/ui コンポーネントの追加方法 (`pnpm dlx shadcn@latest add ...`)
     9. プロジェクト構成 (PLAN §4 のディレクトリ図を最終形に合わせて転記)
   - **README が完成したら PLAN.md を削除する** (情報は README に集約済みになるため)。コミットは README 完成と PLAN.md 削除を分けると履歴が追いやすい。

## 9. 想定リスク・注意点

- **TanStack Start は RC**: 細かい API が動く可能性あり。`pnpm-lock.yaml` でバージョン固定する。
- **Better Auth CLI 出力スキーマ**: バージョンによってカラムが変わるため、生成後は必ず `drizzle-kit generate` の差分を目視レビューする。
- **Cookie の SameSite / Secure**: 開発は HTTP なので `Secure` を強制しない。デプロイ時に `BETTER_AUTH_URL` を本番 URL に切り替え HTTPS 前提にする。
- **Dev Container のネットワーク**: `app` と `db` を `network_mode: service:db` で共有しているため、`pgadmin4` から見るときのホスト名と、アプリから見るときのホスト名が異なる点に注意 (アプリ側は `localhost`)。
- **メール送信が必要な機能を増やすとき**: SMTP/Resend 等の外部サービスを追加する。今は意図的にスコープ外。

## 10. 次のアクション

このドキュメントで OK なら、ステップ 1 (`pnpm create @tanstack/start@latest . --add-ons shadcn --toolchain biome` での雛形生成) から着手する。

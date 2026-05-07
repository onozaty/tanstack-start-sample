# tanstack-start-sample

TanStack Start を試すためのサンプルアプリ。メール+パスワード認証付きの最小構成 TODO アプリで、ログインしたユーザが自分の TODO だけを CRUD できる。

## 技術スタック

| 領域 | 採用 |
|---|---|
| メタフレームワーク | TanStack Start (Vite + TanStack Router) |
| ランタイム / PM | Node 24 + pnpm |
| DB / ドライバ | PostgreSQL 18 / node-postgres (`pg`) |
| ORM / マイグレーション | Drizzle ORM + Drizzle Kit |
| 認証 | Better Auth (`@better-auth/drizzle-adapter`, `tanstackStartCookies`) |
| UI | shadcn/ui + Tailwind CSS v4 |
| フォーム / 検証 | TanStack Form + Zod (サーバ・クライアント共有スキーマ) |
| データ取得 | TanStack Query (`@tanstack/react-query` + SSR ブリッジ) |
| ロガー | Pino (構造化 JSON / 開発時は pino-pretty で整形) |
| Lint / Format | Biome |
| ユニットテスト | Vitest (実 DB に当てる方針) |
| E2E テスト | Playwright (chromium) |

## 必要環境

- Dev Container (推奨。VS Code + Dev Containers 拡張) でそのまま開ける
- Dev Container 内で利用するもの: Node 24 / pnpm / PostgreSQL 18 (`db` サービスとして同梱)
- Dev Container を使わない場合は、上記と同等の環境を各自で用意する

## セットアップ

Dev Container 起動後、リポジトリのルートで:

```bash
pnpm install
pnpm db:migrate          # 開発 DB (sample) にスキーマを反映
pnpm db:migrate:test     # テスト DB (sample_test) にスキーマを反映
pnpm dev                 # http://localhost:3000
```

`.env` / `.env.test` はリポジトリにコミットされている。clone 直後に追加設定なしで `pnpm dev` できる。

`/signup` でユーザを作ると `/` の TODO 一覧に遷移する。未ログインで `/` にアクセスすると `/login` にリダイレクトされる。

## 環境変数

ローカル開発用の値はリポジトリにコミットしている (`.gitignore` に `.env` を入れていない)。本番運用や OAuth キーなど本物の秘密情報を扱う段階で別運用に切り替える。

`.env` (アプリ用):

| 変数 | 用途 |
|---|---|
| `DATABASE_URL` | 開発 DB (`sample`) への接続文字列 |
| `BETTER_AUTH_SECRET` | Better Auth のセッション署名鍵。**本番では必ず再生成して上書き**する (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) |
| `BETTER_AUTH_URL` | Better Auth が返すリンクのベース URL (開発は `http://localhost:3000`) |
| `LOG_LEVEL` | Pino のログレベル (`trace` / `debug` / `info` / `warn` / `error` / `fatal` / `silent`)。未設定なら dev=`debug` / prod=`info` にフォールバック |

`.env.test` (テスト用):

| 変数 | 用途 |
|---|---|
| `DATABASE_URL` | テスト DB (`sample_test`) への接続文字列。`pnpm db:migrate:test` / Vitest / Playwright が参照 |
| `LOG_LEVEL` | Vitest 中はノイズを抑えるため `silent` を入れている。Playwright は `webServer.env` で `info` に上書きする |

## 開発コマンド

```bash
pnpm dev                  # 開発サーバ (port 3000)。stdout を pino-pretty にパイプして整形表示する
pnpm dev:raw              # 整形を介さない素の dev サーバ (JSON ログを直接見たいとき)
pnpm build                # 本番ビルド + 型チェック
pnpm preview              # ビルド成果物のプレビュー

pnpm check                # Biome (lint + format チェック)
pnpm lint                 # Biome lint のみ
pnpm format               # Biome format のみ
pnpm typecheck            # tsc --noEmit

pnpm db:generate          # スキーマ差分から SQL マイグレーションを生成
pnpm db:migrate           # 開発 DB (sample) に適用
pnpm db:migrate:test      # テスト DB (sample_test) に適用
pnpm db:push              # スキーマを直接反映 (生成なし。検証用途)
pnpm db:studio            # Drizzle Studio
pnpm auth:generate        # Better Auth スキーマを src/db/schema/auth.ts に再生成
```

## テスト

ユニット / E2E はどちらも **テスト DB (`sample_test`) を実 DB として使う** 方針。スキーマ変更後は `pnpm db:migrate:test` を流すこと。

```bash
pnpm test:unit            # Vitest (CRUD・権限分離・スキーマ検証など)
pnpm test:unit:watch
pnpm test:unit:coverage

pnpm test:e2e             # Playwright (chromium のみ)
pnpm test:e2e:ui          # Playwright UI モード

pnpm test                 # ユニット → E2E の順で全部 (CI 用)
```

E2E は `playwright.config.ts` の `webServer` が `pnpm dev` を `.env.test` 込みで起動する。**既に手元で `pnpm dev` を起動している場合はポート 3000 が衝突するので止めてから実行**する。

ユニットテストは対象ファイルと同じディレクトリに `*.test.ts` で共置 (co-location) する。例: [src/features/todo/todo.server.ts](src/features/todo/todo.server.ts) ↔ [src/features/todo/todo.server.test.ts](src/features/todo/todo.server.test.ts)。

## DB マイグレーションの流れ

1. `src/db/schema/*.ts` のスキーマを変更
2. `pnpm db:generate` で `drizzle/` 配下に SQL を生成 (差分を目視レビュー)
3. `pnpm db:migrate` で開発 DB に反映
4. `pnpm db:migrate:test` でテスト DB に反映 (忘れるとテストが落ちる)

Better Auth が要求するテーブル定義 ([src/db/schema/auth.ts](src/db/schema/auth.ts)) を更新したいときは `pnpm auth:generate` で再生成する (`usePlural: true` 前提)。

## ログ

サーバ側のログは [src/lib/logger.server.ts](src/lib/logger.server.ts) の Pino で集約する。

- **構造化ログ**: `{ level, time, service, env, requestId, userId, ... }` の JSON で出力。本番はそのまま、開発は `pnpm dev` が `pino-pretty` にパイプして人間可読に整形する。
- **リクエストスコープ**: [src/lib/request-logger.ts](src/lib/request-logger.ts) のリクエスト middleware が `requestId` 付き child logger を作り、[src/lib/log-context.server.ts](src/lib/log-context.server.ts) の `AsyncLocalStorage` で同一リクエストの後段に伝搬する。`requireUserId()` 経由で認証が成立すると、その後のログには `userId` が自動で付く。
- **使い方** (server fn 内など):
  ```ts
  import { getRequestLogger } from "#/lib/log-context.server";
  const log = getRequestLogger().child({ feature: "todo", op: "create" });
  log.info({ todoId }, "todo.create");
  ```
- **未捕捉エラー**: `unhandledRejection` / `uncaughtException` をプロセス全体でフックし logger に流す。
- **Better Auth のログは抑止**: `betterAuth({ logger: { disabled: true } })`。Better Auth は `Invalid password` など想定内の入力エラーも `error` レベルで吐くため、そのまま流すと本物の障害ログを埋もれさせる。本当の障害は throw されて request middleware の `request.error` で拾えるので困らない。ライブラリ自体のデバッグが必要になったら `disabled: false` に切り替える。
- **クライアント側**: 専用ロガーは作らない。`console.error` をそのまま使い、devtools / RUM SDK (将来導入する場合) が拾う前提にする。
- **ファイル分離**: `*.server.ts` 命名でクライアントバンドルへの混入を防いでいる。本番ビルド後 `.output/public/assets/` を grep しても `pino` は出てこない。

## shadcn/ui コンポーネントの追加

```bash
pnpm dlx shadcn@latest add <component>
```

追加されたコンポーネントは [src/components/ui/](src/components/ui/) に置かれ、コードは自分のものとして編集できる。

## プロジェクト構成

```
.
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts             # TanStack Start プラグイン設定
├── vitest.config.ts           # Vitest (Vite 設定を継承)
├── playwright.config.ts       # Playwright (webServer で pnpm dev を起動)
├── drizzle.config.ts          # Drizzle Kit
├── biome.json
├── components.json            # shadcn/ui
├── .env                       # 開発用 (リポジトリにコミット)
├── .env.test                  # テスト用 (リポジトリにコミット)
├── .devcontainer/
│   ├── compose.yaml           # app / db (PostgreSQL 18) / pgadmin4
│   ├── Dockerfile
│   └── db/docker-entrypoint-initdb.d/
│       └── create-test-database.sql   # sample_test DB を作る
├── drizzle/                   # 生成された SQL マイグレーション
├── tests/
│   ├── e2e/                   # Playwright シナリオ
│   │   ├── auth.spec.ts
│   │   └── todo.spec.ts
│   └── helpers/
│       ├── db.ts              # truncateAll など
│       └── factory.ts         # ユーザ・TODO ファクトリ
└── src/
    ├── router.tsx
    ├── start.ts                       # createStart() で request middleware を登録
    ├── routeTree.gen.ts               # 自動生成
    ├── styles.css                     # Tailwind v4 + shadcn
    ├── routes/
    │   ├── __root.tsx
    │   ├── login.tsx
    │   ├── signup.tsx
    │   ├── _authenticated.tsx         # 認証ガード (未ログインは /login へ)
    │   ├── _authenticated/
    │   │   └── index.tsx              # TODO 一覧 (ログイン後 TOP)
    │   └── api/auth/                  # Better Auth ハンドラ
    ├── components/ui/                 # shadcn/ui コンポーネント
    ├── lib/                           # ドメイン非依存のサーバ/ユーティリティ
    │   ├── logger.server.ts           # Pino root logger
    │   ├── log-context.server.ts      # AsyncLocalStorage で child logger を伝搬
    │   ├── request-logger.ts          # リクエストアクセスログ middleware
    │   ├── form-utils.ts              # TanStack Form のエラー抽出ヘルパ
    │   └── utils.ts                   # shadcn の cn()
    ├── db/
    │   ├── client.server.ts
    │   └── schema/
    │       ├── auth.ts                # Better Auth が要求するテーブル
    │       ├── todo.ts
    │       └── index.ts
    └── features/                      # 機能ドメインごとの塊
        ├── auth/
        │   ├── auth.server.ts         # betterAuth() インスタンス + requireUserId
        │   ├── auth-client.ts         # createAuthClient (クライアント)
        │   ├── auth.functions.ts      # createServerFn のセッション取得
        │   ├── auth.schemas.ts        # サインアップ・ログインの Zod スキーマ
        │   ├── auth.schemas.test.ts
        │   ├── auth-errors.ts         # Better Auth エラーコードのマッピング
        │   └── auth-field-row.tsx     # フォーム共通の Field 行 UI
        └── todo/
            ├── todo.server.ts         # CRUD (権限チェック込み)
            ├── todo.server.test.ts
            ├── todo.functions.ts      # createServerFn ラッパ
            ├── todo.schemas.ts        # Zod スキーマ (フォーム共有)
            └── todo.schemas.test.ts
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Glow Space is a beauty marketplace in an npm-workspaces + Turborepo monorepo:

- `apps/auth`: NestJS service (port 3001) for credentials, Google OAuth, and JWT plus refresh-token issuance. Its Postgres is `auth_db` on port 5442.
- `apps/user`: NestJS service (port 3002) for user profiles and cities. Its Postgres is `user_db` on port 5443.
- `apps/web`: Next.js 16 / React 19 frontend that uses server actions, SCSS modules and Tailwind 4.
- `apps/gateway`: NestJS scaffold.
- `packages/shared`: `@glow-space/shared`, which holds the types, enums (`Status`), response contracts, validators and utils shared by all apps.

`apps/web` has its own `CLAUDE.md`/`AGENTS.md`. The Next.js version there has breaking changes compared with what you may know, so read the relevant guide in `apps/web/node_modules/next/dist/docs/` before writing Next.js code.

## Commands

Infrastructure (Postgres ×2 and Kafka):

```
docker compose up -d
```

Setup:

- Copy each `.env.example` to `.env`: `apps/auth`, `apps/user`, `apps/web`. Google OAuth also needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` in both auth and web. Web also needs `USER_URL`.
- Build the shared package before running anything that imports it. Apps consume its compiled `dist/` output, so rebuild after every change to `packages/shared`:
  ```
  cd packages/shared && npm run build
  ```

Root (via turbo): `npm run dev`, `npm run build`, `npm run lint`.

Per NestJS service (`apps/auth`, `apps/user`, `apps/gateway`):

```
npm run start:dev                 # watch mode
npm run lint                      # eslint --fix
npm test                          # jest unit tests (*.spec.ts under src/)
npx jest src/controllers/auth.controller.spec.ts   # single test file
npx jest -t "test name"           # single test by name
npm run test:e2e
```

Web (`apps/web`): `npm run dev`, `npm run build`, `npm run lint`. It has no test runner.

Prisma (run inside `apps/auth` or `apps/user`):

```
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma db seed                # user service only (prisma/seed.ts)
```

Prisma 7 is configured through `prisma.config.ts`, which supplies the datasource URL from `.env`. The client is generated into `src/generated/prisma`, which is gitignored, and is imported as `src/generated/prisma`. `PrismaService` uses the `@prisma/adapter-pg` driver adapter.

## Architecture

- **Separate databases.** Auth and user each own a `User` row linked by the same `uuid`.
- **Web server actions orchestrate cross-service flows.** Registration (`apps/web/app/register/actions.ts`) creates the user in auth, then in user, and on failure compensates via auth `DELETE /register/:uuid`.
- **Auth tokens.** Auth issues a JWT access token plus a rotating refresh token (only its hash is stored) as cookies. Web calls auth server-side and re-sets those cookies on its own domain. The user service verifies the JWT itself (`JwtAuthGuard`), so `JWT_SECRET` must match in auth and user.

## Conventions

- NestJS services are layered as controller → service → repository (Prisma), and a "responder" class shapes API responses into the contracts from `@glow-space/shared`. In auth, `responders/` sits at the app root rather than under `src/`.
- Classes use default exports. Imports use the `src/*` path alias (e.g. `from 'src/dto/login.dto'`).
- DTOs are validated with `class-validator` through `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` on each route.
- Formatting: the Nest apps use single quotes. Web and shared use double quotes.

## Rules

- If the user writes exactly "ping", reply only with "glow-pong".
- Never edit existing Prisma migrations. Create a new one with `migrate dev`.
- Never edit `src/generated/prisma` or anything in `dist/`.
- Do not use `any`. Add types to `@glow-space/shared` if a type is shared between apps.
- When changing a response shape, update the contract in `@glow-space/shared` first, then the responder.
- For tasks touching more than one app, describe the plan first and wait for approval.
- Don't wrap Prisma calls in repositories with try/catch. Let errors propagate (they become 500).
  If a case must return 4xx, check it explicitly in the service (e.g. look up the record and throw `NotFoundException`).
  - Repository methods return the bare model. Add `include`/relation `select` only in a method whose caller uses the related data, and don't add it to existing methods. If the related record is already loaded (e.g. looked up for validation), reuse it instead of joining.
- `tools/mcp-db` reads `DATABASE_URL` from `apps/auth/.env` and `apps/user/.env`. If you rename that variable or move those files, update `tools/mcp-db/src/index.ts` too.

## Definition of done

- `npm run lint` passes in every app you changed. Run lint only in apps you changed
- Unit tests pass, and new service or controller logic has a `*.spec.ts`.
- If you changed `packages/shared`, rebuild it and check that dependent apps still compile.

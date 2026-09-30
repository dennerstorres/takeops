# Contributing to TakeOps

Thanks for your interest. TakeOps is a small project, so changes follow a simple rule: one task at a time, small enough to review.

## Before you start

- **Bugs:** open an issue using the bug template. Include steps to reproduce and the version (commit) you run.
- **Features:** open an issue first. The MVP scope is defined in [`SPEC.md`](SPEC.md) and planned in [`PLAN.md`](PLAN.md). Ideas outside that scope are welcome as discussion, but may wait for a later version.
- **Security issues:** don't open a public issue. See [`SECURITY.md`](SECURITY.md).

Project docs (spec, plan, decisions, history) are written in Portuguese. Issues and pull requests can be in English or Portuguese.

## Development setup

See [Development](README.md#development) in the README. In short:

```bash
npm install
cp .env.example .env        # point DATABASE_URL to a local PostgreSQL
npx prisma migrate deploy
npm run dev
```

## How work is organized

Read [`HARNESS.md`](HARNESS.md) and [`AGENTS.md`](AGENTS.md) before changing code. They apply to people and coding agents alike. The essentials:

- Each change maps to a task in `PLAN.md`. Update `PLAN.md`, `STATUS.md` and `HISTORY.md` in the same pull request.
- Every workspace-owned query filters by `workspaceId`, and authorization is enforced on the server.
- Schema changes need a new Prisma migration. Never edit a migration that has already been released.
- Durable architectural choices get an ADR in `DECISIONS.md`.
- No user-facing text hard-coded in components: add keys to both `messages/pt-BR.json` and `messages/en.json`.
- New dependencies need a license compatible with AGPL-3.0.

## Before opening a pull request

```bash
npm run verify
```

This runs lint, the contrast check, typecheck, tests and the production build. Integration tests run when `DATABASE_URL` points to PostgreSQL. Otherwise they are skipped.

Keep pull requests focused on one task, and fill in the template. Commits in this repository reference the task ID, e.g. `HARDEN-009: upcoming shoot reminder.`

## License

By contributing, you agree that your contributions are licensed under the [AGPL-3.0](LICENSE).

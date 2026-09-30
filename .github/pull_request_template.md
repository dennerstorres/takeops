## Task

<!-- Task ID from PLAN.md, e.g. HARDEN-009. One task per pull request. -->

## What changed

## How it was tested

- [ ] `npm run verify` passes
- [ ] Integration tests ran against PostgreSQL (or explain why not)

## Checklist

- [ ] Queries on workspace data filter by `workspaceId`; authorization is enforced on the server
- [ ] New UI text is in `messages/pt-BR.json` and `messages/en.json`
- [ ] New environment variables are in `.env.example`, `src/server/env.ts` and both READMEs
- [ ] Schema changes come with a new migration
- [ ] `PLAN.md`, `STATUS.md` and `HISTORY.md` updated; ADR in `DECISIONS.md` if the decision is durable

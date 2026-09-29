# HANDOFF — 2026-09-29

Sessão encerrada perto do limite de 5h. Nada ficou pela metade; cada tarefa tem commit próprio.

## Feito nesta sessão

RECORD-001..005, CONT-001, ASSET-001, EDIT-001..002, VERSION-001..003, REVIEW-001..004, APPROVAL-001..004, PUB-001..004, CAL-001..003, TEMPLATE-001..005 (005 criada nesta sessão), ACTIVITY-001..002, NOTIFY-001..003, SEED-001..002.

Detalhes: `HISTORY.md`. Decisões novas: ADR-030 (link externo só http(s), sem credencial), ADR-031 (número de versão por contador na produção), ADR-032 (leitor não comenta revisão), ADR-033 (quem decide aprovação), ADR-034 (produção por template recebe cópias).

## Estado atual

- Fase 20 — Hardening. Próxima: `HARDEN-001 — Auditoria de autorização`.
- `npm test` (135), `lint`, `typecheck` e `build` passando no último commit. Git limpo em `main`.
- `npm run db:seed` cria Acme Software + produção demo (idempotente).

## Pontos para o Hardening

- Kanban deixa membro mover a produção para "Aprovado" sem passar pela aprovação (ADR-033).
- "Um pedido de aprovação aberto por produção" é regra de serviço, sem índice parcial.
- `prisma dev` (PGlite) mistura transações paralelas: testes simultâneos (take, versão) só valem de verdade em Postgres real (`PG_CONCURRENCY=1`, ADR-031).
- Aviso de "gravação próxima" (spec §40) precisa de rotina agendada; não existe.
- Nenhuma tela foi clicada (login só Google): conferir no aparelho em 375/390/430px, principalmente Modo Gravação e calendário.

## Ambiente

- Banco local: `npx prisma dev start takeops`.
- Migration: `migrate dev --create-only`, renomear para o próximo carimbo (`20260928470000_...`), `migrate deploy`. Não rode `prisma format` (reformata o schema inteiro).
- Rode `prettier --write` só nos arquivos da tarefa.

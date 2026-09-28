# HANDOFF — 2026-09-28

Sessão encerrada por limite de contexto (regra: parar perto de 45–50%). Nada ficou pela metade.

## Feito nesta sessão (um commit por tarefa)

SCENE-005, SCRIPT-002, SHOT-001..004, SHOOT-001..002, EQUIP-001..002 (+ correção de permissão da EQUIP-001), CHECK-001..004, TAKE-001..003.

Detalhes de cada uma: `HISTORY.md`. Decisões novas: ADR-027 (Shot), ADR-028 (datas da gravação em UTC com fuso do workspace), ADR-029 (checklist recomendado sob pedido).

## Estado atual

- Fase 10 — Takes e Modo Gravação. Takes prontos; Modo Gravação não começou.
- `npm test` (93), `lint`, `typecheck` e `build` passando no último commit.
- Git limpo em `main`.

## Próximo passo

`RECORD-001 — Layout do Modo Gravação`, depois RECORD-002..005. Mobile-first (375/390/430px), sem hover.

Peças prontas para reaproveitar no Modo Gravação:

- `TakeList` (`src/components/takes/take-list.tsx`) e `take-actions.ts` aceitam `returnTo` dentro de `/producoes/`.
- `ShootChecklist` (`src/components/shoots/shoot-checklist.tsx`) já é a lista de toque com `useOptimistic`.
- `listShotsByScene` (`src/server/shot.ts`) traz os shots da produção numa consulta.
- `useFormAutosave` (`src/components/feedback/form-autosave.tsx`) para notas.

## Ambiente

- Banco local: `npx prisma dev start takeops` antes dos testes de integração (Docker não sobe nesta máquina).
- `prisma migrate dev` trava sem terminal interativo. Use `migrate dev --create-only`, renomeie a pasta para o próximo carimbo da sequência (`20260928330000_...`) e aplique com `prisma migrate deploy`.
- Rode `prettier --write` só nos arquivos alterados.
- Não houve navegador logado (login só Google). Nenhuma tela foi clicada; conferir no aparelho na HARDEN-005.

## Pendências conhecidas

- DASH-001 (Fase 2) continua TODO.
- STATUS marca Workspace como IN_PROGRESS, mas as tarefas dele estão DONE.

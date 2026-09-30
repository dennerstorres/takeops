# STATUS.md

> Snapshot curto do estado atual do projeto.  
> Atualizar ao início e ao fim de cada tarefa.

## Projeto

Video Production Manager

## Fase atual

```text
Fase 24 — MVP entregue: v0.1.0 publicada, repositório público
```

## Tarefa ativa

```text
Nenhuma
```

## Última tarefa concluída

```text
MVP-004 — Release MVP
```

## Próxima tarefa recomendada

```text
PERF-001 — Paginação de produções e ideias (P2, quando um workspace passar de algumas centenas de produções)
```

## Estado dos módulos

| Módulo | Status |
|---|---|
| Bootstrap | DONE |
| Auth | DONE |
| Workspace | IN_PROGRESS |
| Equipe | DONE |
| Ideias | DONE |
| Projetos | DONE |
| Kanban | DONE |
| Roteiro | DONE |
| Shots | DONE |
| Gravações | DONE |
| Checklist | DONE |
| Modo Gravação | DONE |
| Takes | DONE |
| Assets | DONE |
| Edição | DONE |
| Revisão | DONE |
| Aprovação | DONE |
| Publicação | DONE |
| Calendário | DONE |
| Templates | DONE |
| Notificações | DONE |
| Activity Log | DONE |

## Bloqueios

Nenhum.

## Ambiente esperado

```text
Node.js: 22+
Package manager: npm
Database: PostgreSQL
Framework: Next.js
Language: TypeScript
ORM: Prisma
Auth: Auth.js + Google OAuth
UI: Tailwind CSS + shadcn/ui
```

## Observações

Login Google protegido por sessão. Sem `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` o botão de entrar não aparece.

A página da produção é a visão geral: dados, progresso, links e participantes. Editar ficou em `/producoes/[id]/editar`. Todas as abas da produção abrem módulo. `npm run test:e2e` ainda não existe. `npm run db:seed` monta o workspace demo. Pontos para o Hardening estão em `HANDOFF.md`.

Rumo definido em 2026-09-29: produção na VPS do mantenedor via Coolify em `https://takeops.dennerstorres.dev`, imagem Docker (ADR-037); refactor de UI com PanelUI como referência visual (ADR-038); repositório público AGPL-3.0 (ADR-039); login Google + link por e-mail (ADR-040). Ordem sugerida: OSS-001 → OSS-002 → DEPLOY-001 (produção cedo) → OSS-005 → OSS-008 → UI-001..008 → OSS-003/004/006/007 → MVP. Idiomas: pt-BR e en (ADR-041, ADR-042). OSS-008 feita: shell e Avisos traduzidos, rótulos de enum pelo catálogo; o resto do texto das telas migra nas UI-002..007.

Mundo visual Quadro de tiras (ADR-045): regras em `DESIGN.md` (reescrito na UI-015 a partir do código), tokens em `src/app/globals.css`, sidecar em `.impeccable/design.json`. `npm run check:contrast` entra no `verify`.

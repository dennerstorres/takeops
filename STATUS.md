# STATUS.md

> Snapshot curto do estado atual do projeto.  
> Atualizar ao início e ao fim de cada tarefa.

## Projeto

Video Production Manager

## Fase atual

```text
Fase 20 — Hardening
```

## Tarefa ativa

```text
Nenhuma
```

## Última tarefa concluída

```text
SEED-002 — Projeto demo completo
```

## Próxima tarefa recomendada

```text
HARDEN-001 — Auditoria de autorização
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

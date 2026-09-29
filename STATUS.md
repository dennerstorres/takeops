# STATUS.md

> Snapshot curto do estado atual do projeto.  
> Atualizar ao início e ao fim de cada tarefa.

## Projeto

Video Production Manager

## Fase atual

```text
Fase 16 — Calendário
```

## Tarefa ativa

```text
Nenhuma
```

## Última tarefa concluída

```text
CAL-001 — Modelo de eventos derivados
```

## Próxima tarefa recomendada

```text
CAL-002 — Visualização mensal
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
| Calendário | IN_PROGRESS |
| Templates | NOT_STARTED |
| Notificações | NOT_STARTED |
| Activity Log | NOT_STARTED |

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

A página da produção é a visão geral: dados, progresso, links e participantes. Editar ficou em `/producoes/[id]/editar`. As outras abas ainda não abrem módulo. `npm run test:e2e` ainda não existe.

# STATUS.md

> Snapshot curto do estado atual do projeto.  
> Atualizar ao início e ao fim de cada tarefa.

## Projeto

Video Production Manager

## Fase atual

```text
Fase 1 — Autenticação, Workspace e Equipe
```

## Tarefa ativa

```text
Nenhuma
```

## Última tarefa concluída

```text
AUTH-001 — Auth.js + Google OAuth
```

## Próxima tarefa recomendada

```text
WORKSPACE-001 — Modelo de Workspace e Membership
```

## Estado dos módulos

| Módulo | Status |
|---|---|
| Bootstrap | DONE |
| Auth | DONE |
| Workspace | NOT_STARTED |
| Equipe | NOT_STARTED |
| Ideias | NOT_STARTED |
| Projetos | NOT_STARTED |
| Kanban | NOT_STARTED |
| Roteiro | NOT_STARTED |
| Shots | NOT_STARTED |
| Gravações | NOT_STARTED |
| Checklist | NOT_STARTED |
| Modo Gravação | NOT_STARTED |
| Takes | NOT_STARTED |
| Assets | NOT_STARTED |
| Edição | NOT_STARTED |
| Revisão | NOT_STARTED |
| Aprovação | NOT_STARTED |
| Publicação | NOT_STARTED |
| Calendário | NOT_STARTED |
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

Próxima: WORKSPACE-001. `npm run test:e2e` ainda não existe. As rotas além do Dashboard ficam na APP-001.

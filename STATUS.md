# STATUS.md

> Snapshot curto do estado atual do projeto.  
> Atualizar ao início e ao fim de cada tarefa.

## Projeto

Video Production Manager

## Fase atual

```text
Fase 0 — Bootstrap
```

## Tarefa ativa

```text
Nenhuma
```

## Última tarefa concluída

```text
BOOT-004 — Infraestrutura de validação e serviços
```

## Próxima tarefa recomendada

```text
AUTH-001 — Auth.js + Google OAuth
```

## Estado dos módulos

| Módulo | Status |
|---|---|
| Bootstrap | DONE |
| Auth | NOT_STARTED |
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

Fase 0 fechada. Validação com Zod e services em `src/server`. Testes unitários: `npm test`.

`npm run test:e2e` ainda não existe. Próxima: AUTH-001. As rotas além do Dashboard ficam na APP-001.

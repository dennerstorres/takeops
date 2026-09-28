# STATUS.md

> Snapshot curto do estado atual do projeto.  
> Atualizar ao início e ao fim de cada tarefa.

## Projeto

Video Production Manager

## Fase atual

```text
Fase 10 — Takes e Modo Gravação
```

## Tarefa ativa

```text
Nenhuma
```

## Última tarefa concluída

```text
TAKE-003 — Take preferido
```

## Próxima tarefa recomendada

```text
RECORD-001 — Layout do Modo Gravação
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
| Modo Gravação | NOT_STARTED |
| Takes | DONE |
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

A página da produção é a visão geral: dados, progresso, links e participantes. Editar ficou em `/producoes/[id]/editar`. As outras abas ainda não abrem módulo. `npm run test:e2e` ainda não existe.

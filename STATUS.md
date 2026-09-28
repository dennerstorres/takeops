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
TEAM-003 — Gerenciamento de papéis
```

## Próxima tarefa recomendada

```text
APP-001 — Navegação principal
```

## Estado dos módulos

| Módulo | Status |
|---|---|
| Bootstrap | DONE |
| Auth | DONE |
| Workspace | IN_PROGRESS |
| Equipe | DONE |
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

Quem não tem membership cai em `/comecar` ou entra por convite pendente do próprio e-mail. Em `/equipe`, dono e admin mudam os papéis permitidos. A propriedade não se transfere. `npm run test:e2e` ainda não existe. As outras rotas do menu ficam na APP-001.

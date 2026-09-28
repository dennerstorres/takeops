# HISTORY.md

Histórico append-only de implementação.

Objetivo: permitir que outro agente entenda **o que foi realmente feito**, por que foi feito e quais detalhes não estão evidentes apenas pelo código.

Não registrar planejamento hipotético aqui.

Registre apenas trabalho executado, tentativa importante, bloqueio ou mudança relevante.

---

# Formato obrigatório

```md
## YYYY-MM-DD — TASK-ID — Título

**Status:** DONE | PARTIAL | BLOCKED
**Agente:** Codex | Claude | Humano | Outro

### Resumo

...

### Implementação

- ...
- ...

### Arquivos principais

- `src/...`
- `prisma/...`

### Decisões tomadas

- ...

### Banco / migrations

- Nenhuma.
ou
- `20260928_add_workspace`

### Testes executados

```text
npm run lint
npm run typecheck
npm test
```

Resultado:

```text
PASS
```

### Critérios de aceite

- [x] ...
- [x] ...

### Pendências conhecidas

- Nenhuma.
ou
- ...

### Observações para próxima tarefa

...
```

---

# Histórico

## 2026-09-28 — BOOT-001 — Projeto Next.js e configuração base

**Status:** DONE
**Agente:** Grok

### Resumo

Projeto Next.js criado com TypeScript strict, Tailwind, ESLint, Prettier e a estrutura inicial de pastas do `SPEC.md`.

### Implementação

- App Router em `src/app`, alias `@/*`.
- Pastas vazias: `src/components`, `src/modules`, `src/lib`, `src/server`, `src/types`.
- Scripts `lint`, `typecheck` (`next typegen && tsc --noEmit`), `format` e `format:check`.
- Página inicial mínima, `lang="pt-BR"`.

### Arquivos principais

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `src/app/layout.tsx`
- `src/app/page.tsx`

### Decisões tomadas

- npm, registrado em ADR-011. O harness já usava comandos npm.
- `lang="pt-BR"` na raiz. O `SPEC.md` não fixa locale; a interface prevista está em português.
- O bloco de regras do Next.js 16 foi incluído no fim de `AGENTS.md` para o `next dev` não reescrever o arquivo depois.
- `npm test` e `npm run test:e2e` ficam para quando a stack de testes for escolhida. `TESTING.md` já diz para ajustar esses comandos nessa hora.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm run lint
npm run format:check
npm run typecheck
npm run build
```

Resultado:

```text
PASS
```

Dev server em `http://127.0.0.1:3000` respondeu 200 com o título Video Production Manager. Sem ferramenta de browser nesta sessão.

### Critérios de aceite

- [x] dev server inicia
- [x] lint passa
- [x] typecheck passa
- [x] build passa
- [x] estrutura respeita `AGENTS.md`

### Pendências conhecidas

- Repositório git ainda não inicializado.
- PostgreSQL e credencial Google continuam fora desta tarefa.

### Observações para próxima tarefa

BOOT-002 pode começar. shadcn/ui e o shell ficam nela.

---

## 2026-09-28 — BOOT-002 — UI base e design system

**Status:** DONE
**Agente:** Grok

### Resumo

Shell da aplicação, tokens do shadcn e os estados de interface pedidos na tarefa.

### Implementação

- shadcn/ui `base-nova`, Lucide e Sonner.
- Sidebar a partir de `md`. No mobile, header com drawer.
- Itens da navegação do `SPEC.md`. Só o Dashboard aponta para uma rota.
- `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmDialog` e toast.
- Tema do sistema, sem seletor manual.

### Arquivos principais

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/shell/app-shell.tsx`
- `src/components/feedback/confirm-dialog.tsx`
- `components.json`

### Decisões tomadas

- ADR-012: preset `base-nova`.
- `allowedDevOrigins` inclui `127.0.0.1` porque o dev server bloqueava o HMR nessa origem.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm run lint
npm run typecheck
npm run build
```

Resultado:

```text
PASS
```

No browser headless: sidebar no desktop; em 375, 390 e 430 o menu vira drawer, sem scroll horizontal. Drawer, toast e modal de confirmação abriram e o modal fechou.

### Critérios de aceite

- [x] desktop shell funcional
- [x] mobile shell funcional
- [x] componentes essenciais disponíveis

### Pendências conhecidas

- Rotas de Ideias, Produções, Calendário, Templates, Equipe e Configurações continuam na APP-001.
- Git ainda não inicializado.

### Observações para próxima tarefa

BOOT-003 pode começar. O shell não depende do banco.

---

## 2026-09-28 — BOOT-003 — Prisma e PostgreSQL

**Status:** DONE
**Agente:** Grok

### Resumo

Prisma 7.10 ligado a PostgreSQL, com migration inicial vazia de domínio e client único para o servidor.

### Implementação

- `prisma/schema.prisma` sem modelos. As tabelas entram na tarefa de cada módulo.
- Migration `20260928143000_init`.
- `src/server/db.ts` reutiliza o client em desenvolvimento.
- `.env.example` e comandos `db:migrate`, `db:deploy`, `db:check`.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma.config.ts`
- `prisma/migrations/20260928143000_init/migration.sql`
- `src/server/db.ts`
- `.env.example`

### Decisões tomadas

- ADR-013. A tag `latest` era release candidate, então a versão ficou em 7.10.0.
- O client gerado não entra no Git.

### Banco / migrations

- `20260928143000_init`
- Aplicada com `prisma migrate deploy` num Postgres local.
- `npm run db:check` executou `SELECT 1`.

### Testes executados

```text
npm run lint
npm run typecheck
npm run build
npm run db:check
npx prisma migrate deploy
```

Resultado:

```text
PASS
```

### Critérios de aceite

- [x] migration executa
- [x] conexão validada
- [x] comandos documentados

### Pendências conhecidas

- Docker Desktop não subiu nesta máquina. A validação usou `npx prisma dev --name takeops`.
- `npm test` e `npm run test:e2e` continuam sem stack.

### Observações para próxima tarefa

BOOT-004 pode começar. Zod e o padrão de services não dependem de tabelas novas.

---

## 2026-09-28 — BOOT-004 — Infraestrutura de validação e serviços

**Status:** DONE
**Agente:** Grok

### Resumo

Zod, erros de domínio e helpers para service, Server Action e Route Handler.

### Implementação

- `parseInput` traduz falha do Zod em `ValidationError`.
- `DomainError`, `NotFoundError` e `ForbiddenError`.
- `runService` registra o erro. `runAction` e `runHandler` escondem falha inesperada.
- `npm test` usa o test runner do Node, só para esses helpers. E2E continua sem stack.

### Arquivos principais

- `src/server/errors.ts`
- `src/server/validation.ts`
- `src/server/service.ts`
- `src/server/service.test.ts`

### Decisões tomadas

- ADR-014.
- Imports relativos dentro de `src/server` levam extensão `.ts` para o runner do Node executar o teste sem compilador extra. `allowImportingTsExtensions` ficou ligado.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado:

```text
PASS
```

### Critérios de aceite

- [x] Zod disponível
- [x] padrão de service
- [x] erros de domínio
- [x] helpers de action e handler

### Pendências conhecidas

- `npm run test:e2e` ainda não existe.

### Observações para próxima tarefa

AUTH-001 pode começar. O login deve usar `runAction` ou `runHandler` e não devolver token na resposta nem no log.

---

## 2026-09-28 — AUTH-001 — Auth.js + Google OAuth

**Status:** DONE
**Agente:** Grok

### Resumo

Login Google, sessão no banco, logout e bloqueio de quem não está autenticado.

### Implementação

- Modelos `User`, `Account`, `Session` e `VerificationToken`. Migration `20260928144850_auth_users`.
- `/login` público. O restante redireciona para lá sem cookie de sessão, e o layout autenticado confirma a sessão no banco.
- O id da sessão é o `User.id`.
- Logs passam por `redactForLog`. O debug do Auth.js fica desligado.

### Arquivos principais

- `src/server/auth.ts`
- `src/proxy.ts`
- `src/app/login/page.tsx`
- `src/app/(app)/layout.tsx`
- `prisma/migrations/20260928144850_auth_users/migration.sql`

### Decisões tomadas

- ADR-015. Pacote `next-auth@5.0.0-beta.32` porque a v4 estável não cobre o `proxy.ts`.

### Banco / migrations

- `20260928144850_auth_users`, aplicada no Postgres local.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado:

```text
PASS
```

`GET /` sem sessão respondeu 307 para `/login`. `/login` respondeu 200, sem scroll horizontal em 375 e 1280. O fluxo completo do Google não rodou: não há `AUTH_GOOGLE_ID` nem `AUTH_GOOGLE_SECRET` nesta máquina.

### Critérios de aceite

- [x] usuário não autenticado não acessa a aplicação
- [x] usuário autenticado recebe o id estável do banco
- [x] tokens não aparecem em logs

### Pendências conhecidas

- Credenciais Google ainda não configuradas. O botão de entrar aparece quando `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` existem.
- Primeiro acesso com Workspace fica na WORKSPACE-002.

### Observações para próxima tarefa

WORKSPACE-001 pode criar Workspace e Membership ligados a `User.id`.


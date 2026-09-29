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

---

## 2026-09-28 — WORKSPACE-001 — Modelo de Workspace e Membership

**Status:** DONE  
**Agente:** Grok

### Resumo

Workspace e membership existem no banco. O serviço só devolve workspace de quem participa. Leitura cruzada responde Forbidden.

### Implementação

- Modelos `Workspace` e `WorkspaceMember`, papel `OWNER | ADMIN | MEMBER | VIEWER`. Migration `20260928163000_workspace_membership`.
- `createWorkspace` grava o autor como OWNER. Slug único, fuso padrão `America/Cuiaba`, logo só com URL http(s).
- `getWorkspace`, `listWorkspaces`, `requireMembership` e `requireRole` exigem o par usuário + workspace.
- O repositório Prisma fica em `workspace-prisma.ts`. Os testes de regra usam repositório em memória. Um teste de integração cobre o banco.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928163000_workspace_membership/migration.sql`
- `src/server/workspace.ts`
- `src/server/workspace-prisma.ts`
- `src/server/workspace.test.ts`
- `src/server/workspace.integration.test.ts`

### Decisões tomadas

- ADR-016. Sem membership a resposta é Forbidden, sem distinguir workspace inexistente de workspace alheio.

### Banco / migrations

- `20260928163000_workspace_membership`, aplicada no Postgres local `takeops`.

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

O teste de integração criou dois usuários e confirmou que um não lê o workspace do outro. Não há tela nova.

### Critérios de aceite

- [x] usuário só acessa Workspace do qual participa
- [x] cross-workspace bloqueado

### Pendências conhecidas

- Primeiro acesso, convite e tela de equipe ficam em WORKSPACE-002 e TEAM-001.
- Activity log da criação do workspace espera o módulo de auditoria.

### Observações para próxima tarefa

WORKSPACE-002 deve chamar `createWorkspace` e `listWorkspaces` com o `User.id` da sessão. Não duplicar a regra de membership na UI.

---

## 2026-09-28 — WORKSPACE-002 — Primeiro acesso

**Status:** DONE  
**Agente:** Grok

### Resumo

Quem entra sem membership vai para `/comecar` e pode criar um workspace ou esperar convite. Quem já participa cai no workspace da membership mais antiga.

### Implementação

- `decideFirstAccess` usa a lista do próprio usuário. Sem linha, o estado é `setup`.
- O layout autenticado redireciona para `/comecar`. A página de criação volta para `/` quando já existe membership.
- A action lê o `User.id` da sessão e chama `createWorkspace`. O cliente não envia workspace nem papel.
- O shell mostra o nome do workspace aberto.

### Arquivos principais

- `src/server/workspace.ts`
- `src/server/workspace-actions.ts`
- `src/app/comecar/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/components/workspace/create-workspace-form.tsx`
- `src/components/shell/app-shell.tsx`

### Decisões tomadas

- ADR-017. Sem seletor, abre a membership mais antiga.
- Convite pendente não foi modelado aqui. O aceite continua em TEAM-002. A tela só avisa para aguardar.

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

Sem cookie, `/comecar` vai para `/login`. Com sessão e sem membership, a tela de criação aparece e o dashboard manda para `/comecar`. O envio do formulário criou o workspace com o autor OWNER e redirecionou para `/`. Com membership, `/comecar` volta para `/` e o shell mostra o nome.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] sem membership, a pessoa cria um workspace ou aguarda convite
- [x] com membership, entra no workspace existente
- [x] a criação usa o usuário da sessão e não aceita workspace escolhido pelo cliente

### Pendências conhecidas

- Aceite de convite fica na TEAM-002.
- Troca de workspace fica para quando existir mais de um caminho de entrada.
- Activity log da criação espera o módulo de auditoria.

### Observações para próxima tarefa

TEAM-001 lista a equipe do workspace aberto. A membership usada é a mais antiga do usuário da sessão.

---

## 2026-09-28 — TEAM-001 — Listagem de equipe

**Status:** DONE  
**Agente:** Grok

### Resumo

`/equipe` mostra nome, avatar, e-mail e papel de quem participa do workspace aberto. Outro workspace não entra na lista.

### Implementação

- `listTeam` exige membership e filtra por esse `workspaceId`. A página usa o workspace da membership mais antiga, não um id vindo do cliente.
- Papéis na tela: Dono, Admin, Membro, Leitor. Ordem segue essa sequência e depois o nome.
- Avatar só entra se a URL for http(s). Sem foto, aparecem as iniciais.
- O item Equipe do menu aponta para `/equipe`. Os outros itens continuam sem rota.

### Arquivos principais

- `src/server/team.ts`
- `src/server/workspace-repository.ts`
- `src/server/workspace-prisma.ts`
- `src/app/(app)/equipe/page.tsx`
- `src/components/shell/navigation.ts`
- `src/components/shell/shell-nav.tsx`

### Decisões tomadas

- Qualquer papel com membership pode ver a lista. Administrar a equipe continua na TEAM-003.
- Sem ADR. A escolha de rótulos em português fica no `roleLabel`.

### Banco / migrations

- Nenhuma. A consulta usa `WorkspaceMember` e `User`.

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

Sem cookie, `/equipe` vai para `/login`. Com sessão, a página mostrou dono e membro, e-mail, papel e avatar, e omitiu a pessoa do outro workspace. O link Equipe ficou marcado como página atual.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] a pessoa vê nome, avatar, e-mail e papel de quem está no workspace aberto
- [x] a lista de outro workspace não aparece

### Pendências conhecidas

- Convite fica na TEAM-002.
- Troca de papel fica na TEAM-003.

### Observações para próxima tarefa

TEAM-002 cria o convite. O aceite deve chamar a membership existente, sem gravar papel vindo do cliente.

---

## 2026-09-28 — TEAM-002 — Convites

**Status:** DONE  
**Agente:** Grok

### Resumo

Dono e admin geram um link de convite. A pessoa entra depois do login Google se o e-mail for o mesmo. O papel sai do convite, não do aceite.

### Implementação

- `WorkspaceInvite` guarda e-mail, papel, status e o hash do token. O link vale 7 dias e não é enviado por e-mail.
- Dono convida admin, membro ou leitor. Admin convida membro ou leitor. Membro e leitor não veem o formulário.
- `/convite/[token]` aceita. Login sem sessão volta para esse caminho. E-mail diferente não entra. Quem já participa não muda de papel.
- Sem membership, os convites pendentes daquele e-mail entram sozinhos. Com membership, só o link adiciona outro workspace.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928190000_workspace_invite/migration.sql`
- `src/server/invite.ts`
- `src/server/invite-prisma.ts`
- `src/server/access.ts`
- `src/app/(app)/equipe/page.tsx`
- `src/app/convite/[token]/page.tsx`
- `src/proxy.ts`

### Decisões tomadas

- ADR-018.

### Banco / migrations

- `20260928190000_workspace_invite`, aplicada no Postgres local.

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

`npm test` roda os arquivos em série. Em paralelo, o Postgres local do Prisma misturava prepared statements.

Sem cookie, `/convite/...` vai para o login e guarda o caminho. O dono cria o link na equipe. O membro não vê o formulário. O convidado aceita e entra como membro. Outro e-mail vê que o convite não é dele.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] dono ou admin gera um link para um e-mail, com papel definido no servidor
- [x] o aceite entra na equipe só se o Google for desse e-mail
- [x] membro e leitor não convidam
- [x] outro workspace não aceita nem lista o convite

### Pendências conhecidas

- Troca de papel fica na TEAM-003.
- O workspace aberto continua sendo a membership mais antiga.

### Observações para próxima tarefa

TEAM-003 altera papel de quem já participa. Não reaproveitar o aceite do convite para isso. Dono e admin já têm limites diferentes no convite.

---

## 2026-09-28 — TEAM-003 — Gerenciamento de papéis

**Status:** DONE  
**Agente:** Grok

### Resumo

Dono e admin alteram papéis na equipe, dentro dos limites de cada um. Membro e leitor não alteram. A propriedade não muda.

### Implementação

- `changeMemberRole` usa o workspace da sessão. O cliente informa a pessoa e o papel novo.
- Dono altera admin, membro e leitor. Admin altera só membro e leitor. Ninguém altera o próprio papel nem cria outro dono.
- A tela mostra o seletor só quando a pessoa pode mudar aquele papel.

### Arquivos principais

- `src/server/team.ts`
- `src/server/team-actions.ts`
- `src/server/workspace-repository.ts`
- `src/server/workspace-prisma.ts`
- `src/app/(app)/equipe/page.tsx`
- `src/components/team/member-role-form.tsx`

### Decisões tomadas

- ADR-019. Transferir a propriedade fica fora desta tarefa.

### Banco / migrations

- Nenhuma. O papel continua em `WorkspaceMember.role`.

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

No HTTP, o dono vê o seletor e o leitor não vê. O admin mudou um leitor para membro. O leitor não tirou o dono.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] OWNER altera papéis permitidos
- [x] ADMIN respeita restrições
- [x] MEMBER não administra equipe
- [x] VIEWER não administra equipe

### Pendências conhecidas

- Remover pessoa da equipe não tem tarefa.
- Transferir a propriedade não tem tarefa.

### Observações para próxima tarefa

APP-001 liga o restante do menu. Equipe já aponta para `/equipe`.

---

## 2026-09-28 — APP-001 — Navegação principal

**Status:** DONE  
**Agente:** Grok

### Resumo

Os sete itens do menu abrem uma página própria. O item da página atual fica marcado. Sem sessão, o login guarda o caminho.

### Implementação

- Rotas `/ideias`, `/producoes`, `/calendario`, `/templates` e `/configuracoes`, dentro do layout autenticado.
- Cada uma mostra só o título e uma frase. O conteúdo fica nas tarefas dos módulos.
- Dashboard continua em `/`. Equipe continua em `/equipe`.

### Arquivos principais

- `src/components/shell/navigation.ts`
- `src/components/shell/shell-nav.tsx`
- `src/components/shell/section-page.tsx`
- `src/app/(app)/ideias/page.tsx`
- `src/app/(app)/producoes/page.tsx`
- `src/app/(app)/calendario/page.tsx`
- `src/app/(app)/templates/page.tsx`
- `src/app/(app)/configuracoes/page.tsx`

### Decisões tomadas

- Sem ADR. As páginas novas não ganham regra de negócio.

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

Sem cookie, cada rota vai para `/login`. Com sessão e workspace, cada página responde 200, mostra o título e marca o item correspondente.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] cada item do menu abre a própria página
- [x] sem sessão, essas páginas vão para o login
- [x] o item da página atual fica marcado

### Pendências conhecidas

- DASH-001 depende de PROJECT-001.
- O conteúdo de ideias, produções, calendário, templates e configurações fica nas tarefas seguintes.

### Observações para próxima tarefa

IDEA-001 pode usar `/ideias`. A página hoje só reserva o lugar.

---

## 2026-09-28 — IDEA-001 — Modelo e CRUD

**Status:** DONE  
**Agente:** Grok

### Resumo

A equipe cria, lista, edita e esconde ideias. O autor é quem está logado. O status começa em Nova e não muda nesta tarefa.

### Implementação

- Modelo `Idea` com os campos da spec, formato, status e `deletedAt`. Migration `20260928200000_ideas`.
- Dono, admin e membro escrevem. Leitor só lê. Outro workspace não vê.
- `/ideias` lista. `/ideias/nova` cria. `/ideias/[id]` edita. Excluir pede confirmação e só preenche `deletedAt`.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928200000_ideas/migration.sql`
- `src/server/idea.ts`
- `src/server/idea-prisma.ts`
- `src/app/(app)/ideias/page.tsx`
- `src/app/(app)/ideias/nova/page.tsx`
- `src/app/(app)/ideias/[id]/page.tsx`
- `src/components/ideas/idea-form.tsx`

### Decisões tomadas

- ADR-020.

### Banco / migrations

- `20260928200000_ideas`, aplicada no Postgres local.

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

No HTTP, o autor criou, editou e tirou a ideia da lista. O registro continuou no banco com `deletedAt`. O leitor não viu o botão de criar.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] membro cria, edita e tira a ideia da lista
- [x] leitor só vê
- [x] ideia de outro workspace não aparece
- [x] a exclusão não apaga o registro

### Pendências conhecidas

- Mudar o status fica na IDEA-002.
- Captura rápida fica na IDEA-003.
- Converter em produção espera o projeto de vídeo.

### Observações para próxima tarefa

IDEA-002 muda o status por serviço, sem o cliente escolher um estado solto. `CONVERTED` continua reservado para a conversão.

---

## 2026-09-28 — IDEA-002 — Status de ideia

**Status:** DONE  
**Agente:** Grok

### Resumo

Quem escreve muda a ideia entre Nova, Em análise, Aprovada e Descartada. Leitor e quem está fora do workspace não mudam. Convertida não entra nessa escolha.

### Implementação

- `changeIdeaStatus` aceita só `NEW`, `UNDER_REVIEW`, `APPROVED` e `DISCARDED`.
- `CONVERTED` e qualquer outro nome são recusados. Uma ideia já convertida também não volta.
- A tela da ideia mostra o seletor para dono, admin e membro. O workspace vem da sessão.

### Arquivos principais

- `src/server/idea.ts`
- `src/server/idea-repository.ts`
- `src/server/idea-prisma.ts`
- `src/server/idea-actions.ts`
- `src/components/ideas/idea-status-form.tsx`
- `src/app/(app)/ideias/[id]/page.tsx`

### Decisões tomadas

- Sem ADR novo. ADR-020 já reserva `CONVERTED` para a conversão em produção.

### Banco / migrations

- Nenhuma. O status já existia em `Idea.status`.

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

No HTTP, o autor mudou a ideia para Aprovada. O leitor não viu o controle e o envio dele não alterou o status.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] quem escreve muda entre Nova, Em análise, Aprovada e Descartada
- [x] leitor não muda
- [x] outro workspace não muda
- [x] Convertida e um status desconhecido são recusados

### Pendências conhecidas

- Captura rápida fica na IDEA-003.
- Converter em produção continua sem tarefa de projeto.

### Observações para próxima tarefa

IDEA-003 reduz o atrito para registrar uma ideia. O cadastro completo em `/ideias/nova` permanece.

---

## 2026-09-28 — IDEA-003 — UX de captura rápida

**Status:** DONE  
**Agente:** Grok

### Resumo

Na lista, quem escreve anota uma ideia só com o título. O restante fica vazio e o status nasce Nova. O formulário completo continua em `/ideias/nova`.

### Implementação

- Campo e botão Anotar no topo de `/ideias`.
- A action chama `createIdea` só com o título e volta para a lista.
- Leitor não vê o campo.

### Arquivos principais

- `src/components/ideas/capture-idea-form.tsx`
- `src/server/idea-actions.ts`
- `src/app/(app)/ideias/page.tsx`
- `src/server/idea.test.ts`

### Decisões tomadas

- Sem ADR. A captura reusa o cadastro. Não cria um segundo modelo.

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

No HTTP, o título entrou na lista com status Nova, descrição vazia e o autor da sessão. O leitor não viu o campo.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] quem escreve anota só o título na lista
- [x] o restante nasce vazio e o status fica Nova
- [x] leitor não vê o campo

### Pendências conhecidas

- Converter ideia em produção espera o modelo de VideoProject.

### Observações para próxima tarefa

PROJECT-001 cria o projeto de vídeo. A conversão da ideia fica depois que esse modelo existir.

---

## 2026-09-28 — PROJECT-001 — Modelo de VideoProject

**Status:** DONE  
**Agente:** Grok

### Resumo

A produção existe no banco com os campos da spec. Quem escreve cria. Quem participa lê. A etapa inicial é sempre IDEA.

### Implementação

- Modelo `VideoProject`, status do pipeline, prioridade e proporção. Migration `20260928210000_video_project`.
- Formato reusa os valores da ideia. Proporção padrão `9:16`. Prioridade padrão `NORMAL`.
- `createdById` vem da sessão. Ideia de origem e responsável precisam ser do mesmo workspace.
- Data sem horário vira meia-noite UTC. `deletedAt` já está na tabela.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928210000_video_project/migration.sql`
- `src/server/project.ts`
- `src/server/project-prisma.ts`
- `src/server/project-repository.ts`
- `src/server/project.test.ts`
- `src/server/project.integration.test.ts`

### Decisões tomadas

- ADR-021. A troca de etapa fica no kanban. A tela de cadastro fica na PROJECT-002.

### Banco / migrations

- `20260928210000_video_project`, aplicada no Postgres local.

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

O teste de banco criou a produção ligada a uma ideia do mesmo workspace e recusou a ideia do outro. Não há tela nova.

### Critérios de aceite

- [x] a produção guarda os campos da spec no workspace
- [x] nasce em IDEA, prioridade normal e proporção 9:16
- [x] o cliente não escolhe a etapa
- [x] ideia de outro workspace não entra

### Pendências conhecidas

- CRUD da tela fica na PROJECT-002.
- Mudar a etapa fica no kanban.
- Converter a ideia em produção ainda não marca `CONVERTED`.

### Observações para próxima tarefa

PROJECT-002 usa `createProject`, `getProject` e `listProjects`. Não deixe o cliente enviar o status.

---

## 2026-09-28 — PROJECT-002 — CRUD de produções

**Status:** DONE  
**Agente:** Grok

### Resumo

`/producoes` cria, lista, edita e esconde produções. A etapa não muda neste cadastro. A exclusão só preenche `deletedAt`.

### Implementação

- `updateProject` preserva status e autor. `deleteProject` faz exclusão lógica.
- A tela traz os campos da spec. Responsável e ideia de origem vêm de quem está no workspace.
- Leitor vê e não edita. Dono, admin e membro editam.

### Arquivos principais

- `src/server/project.ts`
- `src/server/project-actions.ts`
- `src/app/(app)/producoes/page.tsx`
- `src/app/(app)/producoes/nova/page.tsx`
- `src/app/(app)/producoes/[id]/page.tsx`
- `src/components/projects/project-form.tsx`

### Decisões tomadas

- Sem ADR novo. ADR-021 continua valendo: a etapa não vem do cliente.

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

No HTTP, a produção foi criada na etapa Ideia, editada sem sair dessa etapa e sumiu da lista com `deletedAt` preenchido. O leitor não viu o botão de criar.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] quem escreve cria, edita e tira a produção da lista
- [x] leitor só vê
- [x] a etapa não muda neste cadastro
- [x] a exclusão não apaga o registro

### Pendências conhecidas

- Mudar a etapa fica no kanban.
- Converter a ideia fica na PROJECT-003.

### Observações para próxima tarefa

PROJECT-003 cria a produção a partir da ideia e marca a ideia como `CONVERTED`. Reuse `createProject` e não aceite status do cliente.

---

## 2026-09-28 — PROJECT-003 — Converter Idea em VideoProject

**Status:** DONE  
**Agente:** Grok

### Resumo

Converter em vídeo cria a produção e marca a ideia como convertida na mesma transação. A produção nasce na etapa Ideia. Uma segunda conversão não cria outra.

### Implementação

- Copia título, descrição, formato, objetivo, público e produto. Sem formato, usa Outro.
- A produção guarda `sourceIdeaId`. A etapa não vem do cliente.
- O botão fica na ideia para quem escreve. Depois, a ideia aponta para a produção.
- Leitor não converte.

### Arquivos principais

- `src/server/project-draft.ts`
- `src/server/project.ts`
- `src/server/project-prisma.ts`
- `src/server/project-actions.ts`
- `src/components/ideas/convert-idea-button.tsx`
- `src/app/(app)/ideias/[id]/page.tsx`

### Decisões tomadas

- Sem formato na ideia, a produção usa `OTHER`. A transação atualiza a ideia antes de criar a produção e desfaz as duas se uma falhar.

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

No HTTP, o autor converteu a ideia, a produção copiou os campos e ficou na etapa Ideia, e a ideia ficou convertida. O leitor não criou outra produção.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] a conversão cria a produção e marca a ideia como convertida na mesma transação
- [x] título, descrição, formato, objetivo, público e produto são copiados
- [x] uma segunda conversão não cria outra produção
- [x] leitor não converte

### Pendências conhecidas

- Notas e URL de referência da ideia não têm campo correspondente na produção.

### Observações para próxima tarefa

PROJECT-004 adiciona participantes e funções na produção já criada.

---

## 2026-09-28 — PROJECT-004 — Participantes e funções

**Status:** DONE  
**Agente:** Grok

### Resumo

Uma produção aceita várias funções na mesma pessoa. A função repetida não entra. Quem não está no workspace também não entra.

### Implementação

- `ProjectMember` liga produção, usuário e função. A chave única é a combinação dos três.
- Dono, admin e membro adicionam e removem. Leitor só vê.
- A tela da produção lista as funções e tem o formulário de adicionar.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928220000_project_members/migration.sql`
- `src/server/participant.ts`
- `src/server/participant-prisma.ts`
- `src/app/(app)/producoes/[id]/page.tsx`
- `src/components/projects/participant-form.tsx`

### Decisões tomadas

- Sem ADR. A função é da produção, não o papel do workspace.

### Banco / migrations

- `20260928220000_project_members`, aplicada no Postgres local.

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

No HTTP, a mesma pessoa ficou como Câmera e Editor. O leitor não viu o botão de adicionar e não criou outra função.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] a mesma pessoa pode ter mais de uma função na produção
- [x] a função repetida é recusada
- [x] só entra quem já está no workspace
- [x] leitor não adiciona nem remove

### Pendências conhecidas

- A visão geral da produção fica na PROJECT-005.

### Observações para próxima tarefa

PROJECT-005 mostra a produção com os participantes que esta tarefa gravou.

---

## 2026-09-28 — TEMPLATE-003 — Checklist no template

**Status:** DONE  
**Agente:** Claude

### Resumo

O template pode apontar um checklist de gravação do workspace. A produção criada pelo template recebe cópia dos itens (TEMPLATE-004).

### Implementação

- `ProductionTemplate.checklistTemplateId` (FK SET NULL): excluir o checklist tira a referência sem apagar o template.
- `setTemplateChecklist` (dono e admin): o checklist precisa ser do mesmo workspace (checado na transação); vazio tira.
- Página do template: seção "Checklist" (`#checklist`) mostra o ligado e, para quem mantém, um seletor só com checklists de gravação.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928430000_production_template_checklist/`
- `src/server/production-template.ts`, `production-template-repository.ts`, `production-template-prisma.ts`, `production-template-actions.ts`, `production-template.integration.test.ts`
- `src/components/templates/template-checklist-form.tsx`, `src/app/(app)/templates/[templateId]/page.tsx`

### Decisões tomadas

- Sem ADR nova. O template referencia o checklist do workspace (configuração); a produção nunca referencia, recebe cópia.

### Banco / migrations

- `20260928430000_production_template_checklist`: coluna `checklistTemplateId` + FK SET NULL. Rollback conceitual: dropar a coluna.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — TEMPLATE-002 — Cenas no template

**Status:** DONE  
**Agente:** Claude

### Resumo

O template guarda cenas-modelo em ordem (título, tipo de cena, orientação), com adicionar, subir, descer e remover.

### Implementação

- Modelo `ProductionTemplateScene` com único `(templateId, order)`.
- Repositório: toda operação em transação, devolve a lista renumerada; troca de ordem passa por números negativos para não bater no índice (mesmo padrão do checklist).
- Serviço: listar (qualquer membro); adicionar, mover, remover (dono e admin). Tipo validado contra `sceneTypes`.
- Página do template: seção "Cenas" (`#cenas`) com botões de 44px e formulário de nova cena.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928420000_production_template_scene/`
- `src/server/production-template.ts`, `production-template-repository.ts`, `production-template-prisma.ts`, `production-template-actions.ts`, `production-template.integration.test.ts`
- `src/components/templates/template-scene-form.tsx`, `src/app/(app)/templates/[templateId]/page.tsx`

### Decisões tomadas

- Sem ADR. Cena-modelo guarda só estrutura; fala, câmera e status nascem na produção.

### Banco / migrations

- `20260928420000_production_template_scene`: tabela, único `(templateId, order)`, FK cascade no template. Rollback conceitual: dropar a tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — TEMPLATE-001 — ProductionTemplate

**Status:** DONE  
**Agente:** Claude

### Resumo

Templates de produção do workspace (spec §35): nome, descrição, quem criou. Tela `/templates` com lista e criação; `/templates/[id]` edita e exclui.

### Implementação

- Modelo `ProductionTemplate` preso ao workspace.
- `production-template.ts`: listar e ler (qualquer membro); criar, editar, excluir (dono e admin — spec §7 "configurar/criar templates").
- Excluir o template não afeta produções já criadas (TEMPLATE-004 copia, não referencia). Excluir pede confirmação.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928410000_production_template/`
- `src/server/production-template.ts`, `production-template-repository.ts`, `production-template-prisma.ts`, `production-template-actions.ts`, `production-template.integration.test.ts`
- `src/components/templates/production-template-form.tsx`
- `src/app/(app)/templates/page.tsx`, `src/app/(app)/templates/[templateId]/page.tsx`

### Decisões tomadas

- Sem ADR. Mesmo papel do checklist: dono e admin mantêm.

### Banco / migrations

- `20260928410000_production_template`: tabela, índice `(workspaceId, name)`, FK cascade no workspace e SET NULL no autor. Rollback conceitual: dropar a tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — CAL-003 — Visualização semanal

**Status:** DONE  
**Agente:** Claude

### Resumo

O calendário ganhou a visão de semana (`/calendario?semana=AAAA-MM-DD`), de domingo a sábado, com a mesma origem de eventos do mês.

### Implementação

- `weekDays` e `parseDayParam` (dia real, anos 2000–2100) em `calendar-grid.ts`.
- A página decide a visão pela URL: `semana` válida abre a semana daquele dia; senão, o mês. Anterior/Hoje/Próximo andam 7 dias na semana e 1 mês no mês.
- "Ver semana" / "Ver mês" mantém o período (semana de hoje ou do dia 1º; mês da semana aberta).
- Semana usa colunas altas a partir de `md`; no celular, lista por dia como no mês.

### Arquivos principais

- `src/app/(app)/calendario/page.tsx`
- `src/lib/calendar-grid.ts`, `src/lib/calendar-grid.test.ts`

### Decisões tomadas

- Sem ADR. Visão de dia (opcional na spec) ficou de fora.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — CAL-002 — Visualização mensal

**Status:** DONE  
**Agente:** Claude

### Resumo

`/calendario` mostra o mês com gravações, publicações planejadas e publicações agendadas ou feitas, no fuso do workspace.

### Implementação

- `src/lib/calendar-grid.ts`: grade de 6 semanas começando no domingo, em dias de parede; mês da URL (`?mes=AAAA-MM`) validado; anterior/próximo.
- Limites da grade viram instantes UTC com `zonedLocalToUtc` e vão para `listCalendarEvents` (CAL-001).
- Tela: grade de 7 colunas a partir de `md`; no celular, lista por dia só com dias que têm evento (nada depende de hover). Cor por tipo com legenda, hora no fuso do workspace, cancelado riscado, hoje destacado. Cada evento leva à aba da produção.

### Arquivos principais

- `src/app/(app)/calendario/page.tsx`
- `src/lib/calendar-grid.ts`, `src/lib/calendar-grid.test.ts`

### Decisões tomadas

- Sem ADR. Semana começa no domingo (calendário brasileiro).

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — CAL-001 — Modelo de eventos derivados

**Status:** DONE  
**Agente:** Claude

### Resumo

Os eventos do calendário são derivados na leitura: gravações, datas planejadas de publicação e publicações agendadas ou feitas. Sem tabela `CalendarEvent`.

### Implementação

- `CalendarRepository` lê o workspace inteiro num intervalo `[from, to)`, só produções não excluídas; gravação excluída fica fora.
- `listCalendarEvents` (qualquer membro, inclusive leitor): intervalo válido de até 45 dias. `buildCalendarEvents` junta e ordena.
- Data planejada é dia inteiro (`day` AAAA-MM-DD, sem fuso): entra quando o dia cai entre o primeiro e o último dia do intervalo no fuso do workspace.
- Publicação publicada aparece no dia em que saiu; as outras, no agendamento. Cancelada vem marcada (`canceled`).

### Arquivos principais

- `src/server/calendar.ts`, `calendar-repository.ts`, `calendar-prisma.ts`, `calendar.integration.test.ts`

### Decisões tomadas

- Sem ADR: a PLAN só pede registro se houver persistência própria, e não há.

### Banco / migrations

- Nenhuma. Índices usados: `Shoot(videoProjectId, scheduledAt)`, `Publication(scheduledAt)`.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS.

---

## 2026-09-28 — PUB-004 — Marcar publicação realizada

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada destino registra o resultado: publicada (data e link), falhou ou cancelada.

### Implementação

- `recordPublicationOutcome` (dono, admin, membro): PUBLISHED guarda `publishedAt` (informado com fuso, ou a hora do servidor) e link opcional validado por `externalUrl` (ADR-030); FAILED e CANCELED limpam data e link.
- `recordOutcomeAction` converte o horário de parede do workspace (ADR-028).
- Aba Publicação: "Registrar resultado" em cada destino (aberto quando está agendado), com botões Marcar como publicada, Falhou e Cancelar.

### Arquivos principais

- `src/server/publication.ts`, `publication-actions.ts`, `publication.integration.test.ts`
- `src/components/publications/publication-outcome-form.tsx`
- `src/app/(app)/producoes/[id]/publicacao/page.tsx`

### Decisões tomadas

- Sem ADR. Resultado não muda o status da produção (a spec não define); mover para "Publicado" segue no kanban.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — PUB-003 — Agendamento manual

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada destino pode ser agendado, reagendado ou ter o agendamento tirado. É só registro: o sistema não publica (spec §33).

### Implementação

- `schedulePublication` (dono, admin, membro): instante ISO com fuso → `scheduledAt` em UTC e status SCHEDULED; vazio → PENDING sem horário. Publicação já PUBLISHED não se reagenda.
- `instant()` saiu de `shoot.ts` para `src/server/instant.ts` e serve aos dois.
- `schedulePublicationAction` converte o horário de parede do workspace para UTC (`zonedLocalToUtc`, ADR-028); botão "Tirar agendamento" manda `intent=clear`.
- Formulário com `datetime-local` preenchido no fuso do workspace, em cada destino ainda não publicado.

### Arquivos principais

- `src/server/publication.ts`, `publication-actions.ts`, `publication.integration.test.ts`, `instant.ts`, `shoot.ts`
- `src/components/publications/schedule-publication-form.tsx`
- `src/app/(app)/producoes/[id]/publicacao/page.tsx`

### Decisões tomadas

- Sem ADR. Agendar não muda o status da produção: a spec não define esse efeito.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — PUB-002 — CRUD de destinos

**Status:** DONE  
**Agente:** Claude

### Resumo

A aba Publicação lista os destinos da produção e permite criar, editar e excluir (plataforma, legenda, notas).

### Implementação

- `createPublication`, `updatePublication`, `deletePublication` (dono, admin, membro; leitor só vê). O destino só mexe em plataforma, legenda e notas: status, horário e link enviados junto são ignorados (fluxos da PUB-003/004).
- `/producoes/[id]/publicacao`; a aba "Publicação" virou link. Cada destino mostra status, agendamento e publicação no fuso do workspace, link e legenda.
- Excluir pede confirmação e avisa que nada muda na plataforma.

### Arquivos principais

- `src/server/publication.ts`, `publication-actions.ts`, `publication.integration.test.ts`
- `src/components/publications/publication-form.tsx`, `delete-publication-button.tsx`
- `src/app/(app)/producoes/[id]/publicacao/page.tsx`, `src/components/projects/production-tabs.tsx`

### Decisões tomadas

- Sem ADR. Excluir apaga o registro (spec não prevê lixeira para publicação).

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — PUB-001 — Modelo Publication

**Status:** DONE  
**Agente:** Claude

### Resumo

Destinos de publicação por produção (spec §33): plataforma, status, agendamento, publicação, link, legenda e notas.

### Implementação

- Enums `Platform` e `PublicationStatus` e modelo `Publication` (status nasce PENDING).
- Repositório com listar, achar, criar, atualizar (parcial) e remover, sempre pela produção visível no workspace.
- Serviço de leitura (`listPublications`, `getPublication`); escrita vem na PUB-002..004. Rótulos em `publication-labels.ts`.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928400000_publication/`
- `src/server/publication.ts`, `publication-repository.ts`, `publication-prisma.ts`, `publication-labels.ts`, `publication.integration.test.ts`

### Decisões tomadas

- Sem ADR. Mais de um destino na mesma plataforma é permitido (ex.: duas contas, "Outra").

### Banco / migrations

- `20260928400000_publication`: enums, tabela `Publication`, índices `(videoProjectId, status)` e `scheduledAt` (calendário), FK cascade na produção. Rollback conceitual: dropar tabela e enums.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS.

---

## 2026-09-28 — APPROVAL-004 — Permissões de aprovação

**Status:** DONE  
**Agente:** Claude

### Resumo

Quem decide aprovação: dono e admin em qualquer produção; membro só onde é APPROVER; leitor nunca (ADR-033).

### Implementação

- `canDecideApproval` lê papel de workspace e, para MEMBER, os participantes da produção (PROJECT-004). `requestChanges` e `approveVersion` chamam antes de validar a entrada.
- `ApprovalDeps` ganhou `participants`. A aba Revisão usa a mesma função para mostrar o formulário de decisão.

### Arquivos principais

- `src/server/approval.ts`, `approval-actions.ts`, `approval.integration.test.ts`
- `src/app/(app)/producoes/[id]/revisao/page.tsx`
- `DECISIONS.md` (ADR-033)

### Decisões tomadas

- ADR-033.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Teste cobre APPROVER membro aprovando, membro REVIEWER e leitor APPROVER barrados.

### Pendências conhecidas

- Kanban deixa membro mover para "Aprovado" sem passar pela aprovação (HARDEN-001).

---

## 2026-09-28 — APPROVAL-003 — Aprovar

**Status:** DONE  
**Agente:** Claude

### Resumo

Quem decide aprova o pedido pendente: a aprovação vira APPROVED e a produção APPROVED, na mesma transação.

### Implementação

- `approveVersion` usa o mesmo `decide` interno de `requestChanges` (APPROVAL-002); nota opcional.
- `decideApprovalAction` lê o botão clicado (`decision=approve`); qualquer outro valor cai em pedir alterações, que exige nota — nunca aprova por engano.
- Aba Revisão: "Aprovar versão" ao lado de "Solicitar alterações". Depois de aprovada, o botão de pedir aprovação some para essa versão.

### Arquivos principais

- `src/server/approval.ts`, `approval-actions.ts`, `approval.integration.test.ts`
- `src/components/review/approval-panel.tsx`

### Decisões tomadas

- Sem ADR. Pedido aprovado não volta a pendente; nova rodada exige nova versão.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — APPROVAL-002 — Solicitar alterações

**Status:** DONE  
**Agente:** Claude

### Resumo

Quem decide pode solicitar alterações num pedido pendente: a aprovação vira CHANGES_REQUESTED e a produção volta para EDITING, na mesma transação.

### Implementação

- `ApprovalRepository.decide`: só pedido PENDING da produção visível; `updateMany` filtrado por PENDING evita decisão dupla; muda `VideoProject.status` na mesma transação.
- `requestChanges` (dono e admin por enquanto; APPROVER entra na APPROVAL-004): notas obrigatórias, `reviewedById`/`reviewedAt` do servidor.
- Aba Revisão: formulário "O que precisa mudar" + "Solicitar alterações" no pedido pendente. Revalida o layout da produção (kanban e visão geral mudam de etapa).

### Arquivos principais

- `src/server/approval.ts`, `approval-repository.ts`, `approval-prisma.ts`, `approval-actions.ts`, `approval.integration.test.ts`
- `src/components/review/approval-panel.tsx`, `src/app/(app)/producoes/[id]/revisao/page.tsx`

### Decisões tomadas

- Sem ADR nova. Quem decide segue a spec (§7: dono e admin "aprovam vídeos"); a regra final fica na APPROVAL-004.
- Activity Log e Notification do fluxo da spec ficam para os módulos deles (NOT_STARTED).

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — APPROVAL-001 — Modelo e service

**Status:** DONE  
**Agente:** Claude

### Resumo

Pedido de aprovação por versão (spec §32): modelo `Approval`, pedir aprovação e ver o estado na aba Revisão.

### Implementação

- Enum `ApprovalStatus` (PENDING, CHANGES_REQUESTED, APPROVED) e modelo `Approval` (produção, versão, status, quem pediu, quem decidiu, notas, datas).
- `requestApproval` (dono, admin, membro): um pedido aberto por produção. Pedir de novo para a mesma versão devolve o pedido existente; para outra versão dá erro de campo até o aberto ser decidido. Tudo numa transação no repositório.
- `listApprovals` (todos) pela produção visível no workspace.
- Aba Revisão: seção "Aprovação" com o estado da versão, quem decidiu e quando, notas, aviso de outra versão pendente e botão "Pedir aprovação desta versão".

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928390000_approval/`
- `src/server/approval.ts`, `approval-repository.ts`, `approval-prisma.ts`, `approval-labels.ts`, `approval-actions.ts`, `approval.integration.test.ts`
- `src/components/review/approval-panel.tsx`, `src/app/(app)/producoes/[id]/revisao/page.tsx`

### Decisões tomadas

- Sem ADR. Pedir aprovação não muda o status da produção (a spec só define efeito na decisão).
- Sem índice parcial para "um PENDING por produção" (mesma linha da TAKE-003); dois pedidos no mesmo instante podem abrir dois. Revisar na HARDEN-002.

### Banco / migrations

- `20260928390000_approval`: enum e tabela `Approval`, índices `(videoProjectId, status)` e `(editVersionId, createdAt)`, FK cascade em produção e versão, SET NULL nos usuários. Rollback conceitual: dropar tabela e enum.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — REVIEW-004 — Tela de revisão

**Status:** DONE  
**Agente:** Claude

### Resumo

A aba Revisão mostra a versão (atual ou escolhida), link para o vídeo, comentários abertos e resolvidos com autor e tempo, e o histórico de versões.

### Implementação

- `/producoes/[id]/revisao?versao=<id>`; sem `versao` (ou com id de outra produção) abre a mais nova. A aba "Revisão" em `ProductionTabs` virou link.
- Comentário com tempo opcional ("00:18") e texto; erro de campo aparece no formulário. Exibe "00:18 — texto" como na spec.
- Abertos em lista; resolvidos recolhidos em `<details>`. Botão "Resolver"/"Reabrir" por comentário (dono, admin, membro).
- Histórico de versões troca a versão pela URL. Datas no fuso do workspace.
- Leitor vê tudo sem formulário nem botões (ADR-032).

### Arquivos principais

- `src/app/(app)/producoes/[id]/revisao/page.tsx`
- `src/components/review/review-comment-form.tsx`
- `src/server/review-actions.ts`
- `src/components/projects/production-tabs.tsx`

### Decisões tomadas

- Sem ADR. Vídeo abre no serviço externo em nova aba; a spec dispensa player sincronizado no MVP.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Regras em `review.integration.test.ts`. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — REVIEW-003 — Resolver comentário

**Status:** DONE  
**Agente:** Claude

### Resumo

Comentário de revisão pode ser resolvido e reaberto, guardando quem resolveu e quando.

### Implementação

- `setReviewCommentResolved` (dono, admin, membro): resolver grava `resolvedById` e `resolvedAt` (servidor, UTC); reabrir limpa os dois.
- `ReviewRepository.setResolved` filtra pelo comentário dentro da versão visível na produção do workspace.
- Aceita `resolved` como booleano ou "true"/"false"/"on".

### Arquivos principais

- `src/server/review.ts`, `review-repository.ts`, `review-prisma.ts`, `review.integration.test.ts`

### Decisões tomadas

- Sem ADR. Qualquer membro resolve, não só o autor: quem edita costuma fechar o que corrigiu.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS.

---

## 2026-09-28 — REVIEW-002 — Parser de timestamp

**Status:** DONE  
**Agente:** Claude

### Resumo

O comentário aceita o tempo como a equipe digita ("00:18", "1:04", "1:02:03" ou "18") e guarda segundos.

### Implementação

- `src/lib/timestamp.ts`: `parseTimestamp` (null para vazio, NaN para inválido) e `formatTimestamp` (MM:SS até uma hora, H:MM:SS depois). Sem dependência de servidor, serve à tela também.
- Regras: segundos sempre com 2 dígitos e ≤ 59; em H:MM:SS os minutos também; em MM:SS os minutos podem passar de 59 ("75:00").
- `createReviewComment` recebe `timestamp` (texto ou número); inválido vira erro de campo "Use o tempo como 01:04 ou 1:02:03."; teto 23:59:59.

### Arquivos principais

- `src/lib/timestamp.ts`, `src/lib/timestamp.test.ts`
- `src/server/review.ts`, `src/server/review.integration.test.ts`

### Decisões tomadas

- Sem ADR. HH:MM:SS entrou (a PLAN pedia avaliar): custo baixo e vídeo longo existe.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS.

---

## 2026-09-28 — REVIEW-001 — ReviewComment

**Status:** DONE  
**Agente:** Claude

### Resumo

Comentários de revisão por versão (spec §30): autor, tempo no vídeo em segundos, texto, resolvido, quem resolveu e quando.

### Implementação

- Modelo `ReviewComment`, índice `(editVersionId, resolved)`.
- `createReviewComment` (dono, admin, membro — ADR-032) e `listReviewComments` (todos), sempre pela versão visível na produção do workspace (`getEditVersion`).
- Tempo em segundos inteiros de 0 a 23:59:59; sem tempo é comentário geral. Lista ordena por tempo, gerais no fim.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928380000_review_comment/`
- `src/server/review.ts`, `review-repository.ts`, `review-prisma.ts`, `review.integration.test.ts`

### Decisões tomadas

- ADR-032 — leitor não comenta revisão no MVP.

### Banco / migrations

- `20260928380000_review_comment`: tabela `ReviewComment`, FK cascade na versão, SET NULL em autor e em quem resolveu. Rollback conceitual: dropar a tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Parser MM:SS na REVIEW-002; resolver na REVIEW-003.

---

## 2026-09-28 — VERSION-003 — Histórico de versões

**Status:** DONE  
**Agente:** Claude

### Resumo

A aba Edição mostra as versões da produção, da mais nova para a mais antiga, e permite enviar a próxima.

### Implementação

- Seção "Versões" (`#versoes`) em `/producoes/[id]/edicao`: V{n} · título, data no fuso do workspace, autor, "o que mudou", links de preview e arquivo em nova aba.
- "Nova versão" (dono, admin, membro) em `<details>`; o botão já diz o próximo número ("Enviar V3"). O número real vem do servidor (ADR-031).
- `createEditVersionAction` volta para `#versoes`.

### Arquivos principais

- `src/app/(app)/producoes/[id]/edicao/page.tsx`
- `src/components/editing/edit-version-form.tsx`
- `src/server/edit-version-actions.ts`

### Decisões tomadas

- Sem ADR. Versão não se edita nem se apaga: o histórico é o registro do que foi enviado.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Regras em `edit-version.integration.test.ts`. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — VERSION-002 — Numeração sequencial

**Status:** DONE  
**Agente:** Claude

### Resumo

O número da versão vem de um contador na produção, incrementado na mesma transação da criação (ADR-031).

### Implementação

- Coluna `VideoProject.lastEditVersionNumber` (default 0), com backfill pelo maior `versionNumber` existente.
- `prismaEditVersionRepository.create`: `update ... increment` na produção, depois cria a versão com o valor devolvido. Sem retry: o `UPDATE` serializa os envios.
- Tentativas descartadas no caminho: `SELECT ... FOR UPDATE` por `$queryRaw` e retry por P2002. As duas quebraram no banco local com envios paralelos.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928370000_edit_version_counter/`
- `src/server/edit-version-prisma.ts`, `edit-version.integration.test.ts`
- `DECISIONS.md` (ADR-031)

### Decisões tomadas

- ADR-031 — número de versão vem de contador na produção.

### Banco / migrations

- `20260928370000_edit_version_counter`: `ADD COLUMN "lastEditVersionNumber" INTEGER NOT NULL DEFAULT 0` + `UPDATE` de backfill. Rollback conceitual: dropar a coluna.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. O teste sequencial roda sempre; o simultâneo só com `PG_CONCURRENCY=1` em Postgres real.

### Observações

- O `prisma dev` (PGlite) roda numa sessão só: transações interativas em paralelo se misturam (erro `08P01` ou leitura vazia). O teste simultâneo de take (TAKE-002) passa nele por sorte de tempo; vale revisar na HARDEN-002 com Postgres real.

---

## 2026-09-28 — VERSION-001 — EditVersion

**Status:** DONE  
**Agente:** Claude

### Resumo

Versões de edição por produção (spec §29): número, título, link de preview, link do arquivo, notas, quem criou.

### Implementação

- Modelo `EditVersion` com único `(videoProjectId, versionNumber)`.
- `createEditVersion` (dono, admin, membro): o número vem do repositório (máximo + 1 por produção); o `versionNumber` enviado pelo cliente é ignorado.
- Exige pelo menos um link (preview ou arquivo); os dois passam por `externalUrl` (ADR-030).
- `listEditVersions` (mais nova primeiro) e `getEditVersion` pela produção visível no workspace. `versionLabel` monta "V1".

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928360000_edit_version/`
- `src/server/edit-version.ts`, `edit-version-repository.ts`, `edit-version-prisma.ts`, `edit-version.integration.test.ts`

### Decisões tomadas

- Sem ADR. "FINAL" da spec não virou número nem campo: a versão final sai da aprovação (Fase 14).
- Numeração concorrente fica para a VERSION-002 (o índice único já recusa duplicata).

### Banco / migrations

- `20260928360000_edit_version`: tabela `EditVersion`, único `(videoProjectId, versionNumber)`, FK cascade na produção e SET NULL no autor. Rollback conceitual: dropar a tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS.

---

## 2026-09-28 — EDIT-002 — Tela de edição

**Status:** DONE  
**Agente:** Claude

### Resumo

A aba Edição da produção abre o formulário de edição: editor, software, link do projeto, resolução, fps, proporção, legenda, música e notas.

### Implementação

- `/producoes/[id]/edicao`; a aba "Edição" em `ProductionTabs` passou a ser link.
- Editor escolhido entre as pessoas do workspace; quem é participante com papel EDITOR (PROJECT-004) aparece primeiro e marcado.
- `saveEditingAction` devolve `{ saved: true }` e a tela mostra "Salvo"; erro de campo aparece no topo do formulário.
- Leitor vê os dados em lista, com o link do projeto abrindo em nova aba.

### Arquivos principais

- `src/app/(app)/producoes/[id]/edicao/page.tsx`
- `src/components/editing/editing-form.tsx`
- `src/server/editing-actions.ts`
- `src/components/projects/production-tabs.tsx`

### Decisões tomadas

- Sem ADR. Salvar por botão, sem autosave: o formulário é curto e mexido poucas vezes.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Regras cobertas em `editing.integration.test.ts` (EDIT-001). Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — EDIT-001 — EditingInfo

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada produção pode ter um registro de edição (spec §28): editor, software, link do projeto, notas, resolução, fps, proporção, legenda e música.

### Implementação

- Modelo `EditingInfo` com `videoProjectId` único; `aspectRatio` reaproveita o enum da produção; `targetFps` é `Float` (23.976, 29.97).
- `getEditingInfo` (todos os papéis) devolve `null` antes do primeiro salvamento. `saveEditingInfo` (dono, admin, membro) faz upsert pela produção visível.
- Editor precisa ser do workspace; link do projeto passa por `externalUrl` (ADR-030); fps aceita vírgula, > 0, ≤ 240, até 3 casas.
- `externalUrl` saiu de `asset.ts` para `external-url.ts`, com o campo do erro como parâmetro.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928350000_editing_info/`
- `src/server/editing.ts`, `editing-repository.ts`, `editing-prisma.ts`, `editing.integration.test.ts`
- `src/server/external-url.ts`, `src/server/asset.ts`, `asset.integration.test.ts`

### Decisões tomadas

- Sem ADR. Salvar sempre envia o formulário inteiro: campo vazio limpa o valor.

### Banco / migrations

- `20260928350000_editing_info`: tabela `EditingInfo`, único em `videoProjectId`, índice `editorId`, FK cascade na produção e SET NULL no editor. Rollback conceitual: dropar a tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Tela fica na EDIT-002.

---

## 2026-09-28 — ASSET-001 — Referências externas

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada produção tem "Arquivos e referências": links externos com tipo, título e descrição. A mídia continua fora (ADR-006).

### Implementação

- Modelo `Asset` e enum `AssetType` da spec §27 (+ `updatedAt`). Excluir apaga só o link.
- `asset.ts`: listar (todos), criar/editar/excluir (dono, admin, membro), sempre pela produção visível no workspace.
- `externalUrl`: só http(s) com host, sem usuário/senha no link (ADR-030).
- Página `/producoes/[id]/arquivos`, aberta pelo botão na seção Links da Visão Geral. Link abre em nova aba com `noopener noreferrer`. Excluir pede confirmação.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928340000_asset/`
- `src/server/asset.ts`, `asset-labels.ts`, `asset-repository.ts`, `asset-prisma.ts`, `asset-actions.ts`, `asset.integration.test.ts`
- `src/components/assets/asset-form.tsx`, `delete-asset-button.tsx`
- `src/app/(app)/producoes/[id]/arquivos/page.tsx`, `src/app/(app)/producoes/[id]/page.tsx`

### Decisões tomadas

- ADR-030 — link externo só em http(s), sem credencial.

### Banco / migrations

- `20260928340000_asset`: enum `AssetType`, tabela `Asset`, índices `(videoProjectId, type)` e `(videoProjectId, createdAt)`, FK cascade na produção e SET NULL no autor. Rollback conceitual: dropar tabela e enum.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — CONT-001 — Notas de continuidade

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada produção tem uma página de continuidade com notas de texto (título, categoria opcional, descrição), agrupadas por categoria.

### Implementação

- Modelo `ContinuityNote` (spec §25): produção, categoria?, título, descrição, quem criou, datas. Excluir apaga de verdade (a spec não prevê lixeira).
- `continuity.ts`: listar (todos os papéis), criar/editar/excluir (dono, admin, membro). Tudo passa por `getProject` e o repositório filtra pela produção visível no workspace.
- `groupContinuityNotes`: categorias em ordem alfabética; sem categoria por último.
- Página `/producoes/[id]/continuidade`, aberta pelo botão "Continuidade" na aba Gravação. Categoria sugere as já usadas (`datalist`). Excluir pede confirmação.

### Arquivos principais

- `prisma/schema.prisma`, `prisma/migrations/20260928330000_continuity_note/`
- `src/server/continuity.ts`, `continuity-repository.ts`, `continuity-prisma.ts`, `continuity-actions.ts`, `continuity.integration.test.ts`
- `src/components/continuity/continuity-form.tsx`, `delete-continuity-button.tsx`
- `src/app/(app)/producoes/[id]/continuidade/page.tsx`, `src/app/(app)/producoes/[id]/gravacao/page.tsx`

### Decisões tomadas

- Sem ADR. Categoria é texto livre (o exemplo da spec agrupa por pessoa, objeto e câmera). Não virou aba: as abas seguem a lista da spec.

### Banco / migrations

- `20260928330000_continuity_note`: tabela `ContinuityNote`, índice `(videoProjectId, category)`, FK cascade na produção e SET NULL no autor. Rollback conceitual: dropar a tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

### Pendências conhecidas

- Mostrar a continuidade dentro do Modo Gravação não foi pedido; a cena já mostra suas notas de continuidade.

---

## 2026-09-28 — RECORD-005 — Progresso da sessão

**Status:** DONE  
**Agente:** Claude

### Resumo

O Modo Gravação mostra "X / N cenas concluídas", quantas estão para refazer e uma barra.

### Implementação

- `buildRecordView` devolve `done` (RECORDED) e `retakes` (NEEDS_RETAKE) entre as cenas não descartadas.
- Barra no padrão do checklist (`role="progressbar"`), no topo da cena.

### Arquivos principais

- `src/server/record-view.ts`, `record-view.test.ts`
- `src/app/(record)/producoes/[id]/gravacao/[shootId]/modo/page.tsx`

### Decisões tomadas

- Sem ADR. O progresso é das cenas da produção (a sessão não guarda recorte de cenas); cena para refazer não conta como concluída.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — RECORD-004 — Status de Scene durante gravação

**Status:** DONE  
**Agente:** Claude

### Resumo

No Modo Gravação a cena é marcada como gravada (e avança) ou como precisa refazer.

### Implementação

- `setSceneRecordingStatus` aceita só `RECORDED` e `NEEDS_RETAKE`; membro pode, leitor não. Troca só o status.
- `SceneRepository.update` passou a aceitar `Partial<SceneWrite>`: marcar no set não regrava o texto que outra pessoa pode estar editando.
- `recordSceneStatusAction`: "Cena concluída" vai para `?cena=próxima`; "Precisa refazer" fica na cena; se o servidor recusar, não avança. Revalida o modo e a lista de cenas.
- Botões de 48px no fim da cena, com `aria-pressed` no status atual. Na última cena o texto é só "Cena concluída".

### Arquivos principais

- `src/server/scene.ts`, `scene-repository.ts`, `scene-actions.ts`
- `src/server/scene.test.ts`, `scene.integration.test.ts`
- `src/app/(record)/producoes/[id]/gravacao/[shootId]/modo/page.tsx`

### Decisões tomadas

- Sem ADR. Só "concluída" avança; refazer fica para a equipe seguir gravando. Activity Log não existe ainda (módulo NOT_STARTED).

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — RECORD-003 — Takes dentro do Modo Gravação

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada shot da cena mostra os takes e registra OK/refazer, preferido, descarte e observação sem sair do Modo Gravação.

### Implementação

- A página reaproveita `TakeList` com `returnTo` = `.../modo?cena=N`; a ação volta para a mesma cena.
- `back()` em `take-actions.ts` revalida só o caminho, sem `?` nem `#`.
- `TakeList` ganhou campo opcional "Observação do próximo take" (vale também na página da cena). O serviço já aceitava `notes`.
- Cena sem shot mostra aviso: o take pertence ao shot.
- Leitor vê os takes sem botões.

### Arquivos principais

- `src/app/(record)/producoes/[id]/gravacao/[shootId]/modo/page.tsx`
- `src/components/takes/take-list.tsx`
- `src/server/take-actions.ts`

### Decisões tomadas

- Sem ADR. Takes lidos por shot da cena atual (poucos shots), pela mesma checagem de escopo da página da cena.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — RECORD-002 — Navegação entre cenas

**Status:** DONE  
**Agente:** Claude

### Resumo

Modo Gravação troca de cena por "Anterior" e "Próxima", fixos no rodapé.

### Implementação

- A cena atual vem de `?cena=N` (1-based). `clampPosition` leva valor inválido para a primeira cena e excesso para a última.
- Rodapé fixo com dois botões de 48px; some na primeira/última ponta e quando há uma cena só.
- Navegação por link: voltar do navegador volta à cena anterior e a URL pode ser compartilhada no set.

### Arquivos principais

- `src/app/(record)/producoes/[id]/gravacao/[shootId]/modo/page.tsx`
- `src/server/record-view.test.ts`

### Decisões tomadas

- Sem ADR. Posição na URL em vez de estado no cliente.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — RECORD-001 — Layout do Modo Gravação

**Status:** DONE  
**Agente:** Claude

### Resumo

Tela cheia do Modo Gravação por sessão, aberta pelo botão "Abrir Modo Gravação" em cada gravação.

### Implementação

- Grupo de rotas `(record)` com layout próprio (auth + workspace), sem AppShell: `/producoes/[id]/gravacao/[shootId]/modo`.
- `buildRecordView` monta a cena: "Cena X de N", quem fala, fala, ação, shots, câmera, edição e continuidade (em destaque). Cena DISCARDED não entra na contagem.
- `clampPosition` já prepara a posição vinda da URL (RECORD-002).
- Nesta tarefa a tela abre sempre na primeira cena.

### Arquivos principais

- `src/server/record-view.ts`, `record-view.test.ts`
- `src/app/(record)/layout.tsx`, `src/app/(record)/producoes/[id]/gravacao/[shootId]/modo/page.tsx`
- `src/app/(app)/producoes/[id]/gravacao/page.tsx`

### Decisões tomadas

- Sem ADR. O modo é por sessão (Shoot) porque o progresso da RECORD-005 é "da sessão"; as cenas são todas as da produção, fora as descartadas.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — TAKE-003 — Take preferido

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada shot pode ter um take preferido entre os OK.

### Implementação

- `setFavoriteTake` recebe o take ou `null`. O repositório confere que o take é OK e do shot, tira a marca dos outros e marca este numa transação.
- Take RETAKE ou DISCARDED não vira preferido (erro de campo). Descartar o preferido tira a marca (TAKE-002).
- `TakeList`: "★ Preferido" no take marcado, botões "Preferido" e "Tirar preferido" nos OK.

### Arquivos principais

- `src/server/take.ts`, `take-repository.ts`, `take-prisma.ts`, `take-actions.ts`
- `src/server/take.integration.test.ts`
- `src/components/takes/take-list.tsx`

### Decisões tomadas

- Sem ADR. A spec diz "destacar preferido" no singular; ficou um por shot.

### Banco / migrations

- Nenhuma. A regra de um preferido por shot é do serviço, não há índice parcial.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — TAKE-002 — Registrar take

**Status:** DONE  
**Agente:** Claude

### Resumo

Takes podem ser registrados e editados. Na página da cena, cada shot mostra os takes e tem "Take OK" e "Take para refazer".

### Implementação

- `registerTake` aceita só status e notas. Número (máximo + 1 por shot), `recordedById` e `recordedAt` são do servidor.
- Registro simultâneo: o índice único `(shotId, number)` recusa o repetido e o repositório tenta de novo, até 3 vezes. Teste com 3 registros em paralelo.
- `updateTake` troca status e notas; o número fica. Status diferente de OK zera o preferido.
- `take-actions.ts` aceita `returnTo` só dentro de `/producoes/`, para o Modo Gravação reaproveitar.
- `TakeList` mostra "x OK de y pedidos" (`requiredTakes`) e Descartar.

### Arquivos principais

- `src/server/take.ts`, `take-repository.ts`, `take-prisma.ts`, `take-actions.ts`
- `src/server/take.integration.test.ts`
- `src/components/takes/take-list.tsx`
- `src/components/shots/shot-section.tsx`
- `src/app/(app)/producoes/[id]/cenas/[sceneId]/page.tsx`

### Decisões tomadas

- Sem ADR.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — TAKE-001 — Modelo Take

**Status:** DONE  
**Agente:** Claude

### Resumo

O take existe no banco, preso ao shot. Esta tarefa lê; registrar é a TAKE-002.

### Implementação

- Tabela `Take` com os campos da spec, `TakeStatus` (`OK`, `RETAKE`, `DISCARDED`), número único por shot e índice `(shotId, status)`.
- `listTakes` e `getTake` passam por `getShot`, que já checa workspace, produção e cena.
- `TakeTarget` (produção, cena, shot) é o endereço do take nas próximas tarefas.
- O teste de integração tem um `setup()` com dois workspaces, duas cenas e um shot em cada, para as próximas tarefas reaproveitarem.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928320000_take/migration.sql`
- `src/server/take.ts`, `take-repository.ts`, `take-prisma.ts`
- `src/server/take.integration.test.ts`

### Decisões tomadas

- Sem ADR. Take não tem exclusão lógica: descartar é o status `DISCARDED`.

### Banco / migrations

- `20260928320000_take`: cria `TakeStatus` e `Take`, cascata a partir de `Shot`, `SET NULL` em quem gravou. Rollback conceitual: dropar a tabela e o enum.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
```

Resultado: PASS.

---

## 2026-09-28 — CHECK-004 — UI mobile de checklist

**Status:** DONE  
**Agente:** Claude

### Resumo

`/producoes/[id]/gravacao/[shootId]/checklist` é a tela de marcar o checklist no celular.

### Implementação

- Coluna única até `max-w-xl`. Cada item é um botão `role="checkbox"` da largura da tela, com 56px de altura.
- `useOptimistic` marca na hora. A action `toggleShootChecklistItemAction` não redireciona; revalida a página e devolve erro sem texto técnico.
- Barra de progresso e "x de y feitos" com `aria-live`. Item feito mostra quem marcou.
- A aba Gravação ganhou "Abrir checklist" quando a gravação tem itens.

### Arquivos principais

- `src/app/(app)/producoes/[id]/gravacao/[shootId]/checklist/page.tsx`
- `src/components/shoots/shoot-checklist.tsx`
- `src/server/shoot-actions.ts`
- `src/app/(app)/producoes/[id]/gravacao/page.tsx`

### Decisões tomadas

- Sem ADR.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. A regra de marcar já está coberta pelo teste de integração da CHECK-003.

### Pendências conhecidas

- Não houve navegador logado nesta sessão (login é só Google). Os breakpoints 375, 390 e 430px foram revistos pelo código, não na tela. Vale conferir no aparelho na HARDEN-005.

---

## 2026-09-28 — CHECK-003 — Instanciar checklist em Shoot

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada gravação pode usar um modelo de checklist. Os itens são copiados para a gravação e daí em diante vivem nela.

### Implementação

- Tabela `ShootChecklistItem` (`text`, `order`, `completed`, `completedById`, `completedAt`), ordem única por gravação.
- `instantiateShootChecklist` copia o texto dos itens numa transação, no fim da lista. Não guarda ligação com o modelo.
- `setShootChecklistItem` marca com o usuário da sessão e a hora do servidor; desmarcar limpa os dois. A tela de marcar é da CHECK-004.
- Membro instancia e marca (participa da gravação). Leitor só vê.
- Aba Gravação: resumo "x de y feitos" e escolha do modelo para usar.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928310000_shoot_checklist/migration.sql`
- `src/server/shoot-checklist.ts`, `shoot-checklist-repository.ts`, `shoot-checklist-prisma.ts`
- `src/server/shoot-checklist.integration.test.ts`
- `src/server/shoot-actions.ts`
- `src/components/shoots/instantiate-checklist-form.tsx`
- `src/app/(app)/producoes/[id]/gravacao/page.tsx`

### Decisões tomadas

- Sem ADR. A cópia por texto é o que a tarefa pede.

### Banco / migrations

- `20260928310000_shoot_checklist`: cria `ShootChecklistItem`, cascata a partir de `Shoot`, `SET NULL` em quem marcou. Rollback conceitual: dropar a tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — CHECK-002 — Checklist padrão de gravação

**Status:** DONE  
**Agente:** Claude

### Resumo

O checklist recomendado da spec pode ser criado com um botão em Configurações → Checklists.

### Implementação

- `recommendedShootChecklist` (`src/server/checklist-defaults.ts`) guarda nome, tipo e os 22 itens da seção 24, equipamentos antes da preparação.
- `createRecommendedChecklist` usa a mesma criação de modelo. Se já existe modelo com o mesmo nome e tipo, devolve ele.
- O botão aparece para dono e admin enquanto não há checklist de gravação.
- Não cria nada sozinho no cadastro do workspace. Ver ADR-029.

### Arquivos principais

- `src/server/checklist-defaults.ts`
- `src/server/checklist.ts`, `checklist-actions.ts`
- `src/server/checklist.integration.test.ts`
- `src/app/(app)/configuracoes/checklists/page.tsx`

### Decisões tomadas

- ADR-029.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — CHECK-001 — Templates de checklist

**Status:** DONE  
**Agente:** Claude

### Resumo

Configurações → Checklists guarda os modelos de checklist do workspace. Cada modelo tem itens em ordem.

### Implementação

- Tabelas `ChecklistTemplate` (`workspaceId`, `name`, `type`) e `ChecklistTemplateItem` (`order`, `text`), com ordem única por modelo.
- `ChecklistType` é `SHOOT` ou `OTHER`; a spec não lista valores.
- Reordenar e tirar item regravam a ordem 1..n numa transação, passando por ordem negativa.
- Só dono e admin mexem (spec: dono configura, admin cria templates). Membro e leitor veem.
- Excluir o modelo apaga modelo e itens. Checklist já copiado para gravação é outra tabela (CHECK-003).

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928300000_checklist_template/migration.sql`
- `src/server/checklist.ts`, `checklist-repository.ts`, `checklist-prisma.ts`, `checklist-actions.ts`
- `src/server/checklist.integration.test.ts`
- `src/components/checklists/checklist-forms.tsx`, `delete-template-button.tsx`
- `src/app/(app)/configuracoes/checklists/page.tsx`, `[templateId]/page.tsx`

### Decisões tomadas

- Sem ADR. Permissão segue a seção de papéis da spec.

### Banco / migrations

- `20260928300000_checklist_template`: cria `ChecklistType`, `ChecklistTemplate` e `ChecklistTemplateItem`, com cascata a partir do workspace. Rollback conceitual: dropar as tabelas e o enum.

### Correção de schema

- Na EQUIP-002 um `sed` trocou todos os `onDelete: Restrict` do `schema.prisma` por `Cascade`, inclusive `Idea.author` e `VideoProject.createdBy`. Nenhuma migration daquela tarefa levou isso, mas o diff desta pegou. O schema voltou para `Restrict` nas duas relações e a migration desta tarefa ficou só com o checklist. No banco local as duas FKs foram restauradas à mão. `prisma migrate diff` entre migrations e schema dá vazio.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — EQUIP-001 — Correção: catálogo só para dono e admin

**Status:** DONE  
**Agente:** Claude

### Resumo

A spec dá "editar configurações operacionais" ao ADMIN e não lista isso para MEMBER. A EQUIP-001 tinha liberado o catálogo para membro. Agora só dono e admin criam e editam itens; membro e leitor veem.

### Arquivos principais

- `src/server/equipment.ts`
- `src/server/equipment.test.ts`
- `src/app/(app)/configuracoes/equipamentos/page.tsx`

### Observações

Conferir e tirar equipamento de uma gravação (EQUIP-002) continua com membro: é participar da gravação.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
```

---

## 2026-09-28 — EQUIP-002 — Equipamentos por Shoot

**Status:** DONE  
**Agente:** Claude

### Resumo

Cada sessão da aba Gravação mostra os equipamentos planejados e quantos já foram conferidos.

### Implementação

- Tabela `ShootEquipment` (`required`, `checked`, `notes`), única por `(shootId, equipmentItemId)`.
- O repositório só liga item ativo do mesmo workspace e só acha a linha pela gravação visível da produção do workspace.
- Item repetido, de outro workspace ou fora de uso vira erro de campo, sem dizer qual caso foi.
- Tirar da gravação apaga só a ligação. O item do catálogo fica.
- Tela: Conferir/Desmarcar, Tirar e um formulário com os itens ainda não usados.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928290000_shoot_equipment/migration.sql`
- `src/server/shoot-equipment.ts`, `shoot-equipment-repository.ts`, `shoot-equipment-prisma.ts`
- `src/server/shoot-equipment.integration.test.ts`
- `src/server/shoot-actions.ts`
- `src/components/shoots/shoot-equipment.tsx`, `add-shoot-equipment-form.tsx`
- `src/app/(app)/producoes/[id]/gravacao/page.tsx`

### Decisões tomadas

- Sem ADR. A ligação é apagada de fato; histórico de conferência entra com Activity Log se for preciso.

### Banco / migrations

- `20260928290000_shoot_equipment`: cria `ShootEquipment`, FKs em cascata para `Shoot` e `EquipmentItem`. Itens do catálogo não são apagados pela aplicação; a cascata existe para a exclusão do workspace não travar. Rollback conceitual: dropar a tabela.
- No banco local a migration saiu com RESTRICT primeiro. Foi desfeita só ali (tabela e linha em `_prisma_migrations`) e reaplicada com CASCADE antes do commit.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — EQUIP-001 — Catálogo de equipamentos

**Status:** DONE  
**Agente:** Claude

### Resumo

O workspace tem um catálogo de equipamentos em Configurações → Equipamentos.

### Implementação

- Tabela `EquipmentItem` com `workspaceId`, categoria em enum e `active`.
- `createEquipment` sempre grava ativo. `updateEquipment` troca nome, categoria, notas e o ativo (checkbox).
- Não há exclusão: item fora de uso fica desativado para não quebrar gravações que já o usam (EQUIP-002).
- Consultas sempre com `workspaceId` da membership.
- Configurações ganhou o link para a página.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928280000_equipment/migration.sql`
- `src/server/equipment.ts`, `equipment-labels.ts`, `equipment-repository.ts`, `equipment-prisma.ts`, `equipment-actions.ts`
- `src/server/equipment.test.ts`, `equipment.integration.test.ts`
- `src/components/equipment/equipment-form.tsx`
- `src/app/(app)/configuracoes/equipamentos/page.tsx`
- `src/app/(app)/configuracoes/page.tsx`

### Decisões tomadas

- Sem ADR. Quem escreve (dono, admin, membro) mantém o catálogo.

### Banco / migrations

- `20260928280000_equipment`: cria `EquipmentCategory` e `EquipmentItem`, FK em cascata para `Workspace`. Rollback conceitual: dropar tabela e enum.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — SHOOT-002 — CRUD e agendamento

**Status:** DONE  
**Agente:** Claude

### Resumo

A aba Gravação da produção agenda, remarca, troca o status e exclui sessões de gravação.

### Implementação

- `updateShoot` valida como a criação; sem status no envio, fica o atual. `deleteShoot` é lógico.
- `/producoes/[id]/gravacao`: lista por data com dia, hora e fim no fuso do workspace; editar num `<details>`; excluir com confirmação; agendar no fim.
- As actions leem o `datetime-local` no `Workspace.timezone` e mandam ISO UTC ao service (ADR-028). O formulário mostra qual fuso vale.
- A aba Gravação virou link.

### Arquivos principais

- `src/server/shoot.ts`, `shoot-repository.ts`, `shoot-prisma.ts`
- `src/server/shoot-actions.ts`
- `src/components/shoots/shoot-form.tsx`, `delete-shoot-button.tsx`
- `src/app/(app)/producoes/[id]/gravacao/page.tsx`
- `src/components/projects/production-tabs.tsx`
- `src/server/shoot.test.ts`, `shoot.integration.test.ts`

### Decisões tomadas

- Sem ADR nova. Status livre entre os cinco da spec; efeitos de status entram com o Modo Gravação.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — SHOOT-001 — Modelo Shoot

**Status:** DONE  
**Agente:** Claude

### Resumo

A sessão de gravação é gravada na produção. Uma produção pode ter várias. Nasce planejada.

### Implementação

- Tabela `Shoot` com os campos da spec, `deletedAt` e índices `(videoProjectId, scheduledAt)` e `(videoProjectId, status)`.
- `createShoot`, `listShoots` e `getShoot` passam por `getProject`, que já isola o workspace.
- `scheduledAt` obrigatório; `endAt` opcional e não pode ser antes do início.
- `src/lib/zoned-time.ts` converte o horário de parede do workspace para UTC e volta. Ver ADR-028.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928270000_shoot/migration.sql`
- `src/server/shoot.ts`, `shoot-labels.ts`, `shoot-repository.ts`, `shoot-prisma.ts`
- `src/server/shoot.test.ts`, `shoot.integration.test.ts`
- `src/lib/zoned-time.ts`, `zoned-time.test.ts`

### Decisões tomadas

- ADR-028.

### Banco / migrations

- `20260928270000_shoot`: cria `ShootStatus` e `Shoot`, com FK em cascata para `VideoProject`. Rollback conceitual: dropar a tabela e o enum.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
```

Resultado: PASS.

---

## 2026-09-28 — SHOT-004 — UI integrada à Scene

**Status:** DONE  
**Agente:** Claude

### Resumo

Os shots aparecem dentro da cena. A lista de cenas mostra cada plano numa linha; a página da cena gerencia os planos.

### Implementação

- Lista de cenas: embaixo de cada cena, nome do shot (ou Shot A, B, C) e resumo com tipo, enquadramento, câmera e takes.
- `listShotsByScene` faz uma consulta para a produção inteira e agrupa por cena, em vez de uma por cena.
- Página da cena: seção `#shots` com Subir, Descer, Excluir (com confirmação) e Editar shot num `<details>`. Novo shot fica no fim da seção.
- As actions voltam para `/producoes/[id]/cenas/[sceneId]#shots`.
- Enquadramento usa `<datalist>` com as sugestões da spec e aceita texto livre.
- Botões com altura mínima de 44px e sem depender de hover.

### Arquivos principais

- `src/server/shot-actions.ts`
- `src/components/shots/shot-form.tsx`
- `src/components/shots/shot-section.tsx`
- `src/components/shots/delete-shot-button.tsx`
- `src/app/(app)/producoes/[id]/cenas/page.tsx`
- `src/app/(app)/producoes/[id]/cenas/[sceneId]/page.tsx`
- `src/server/shot.ts`, `src/server/shot-labels.ts`

### Decisões tomadas

- Sem ADR. O link da lista virou "Editar e shots".

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

---

## 2026-09-28 — SHOT-003 — Reordenação

**Status:** DONE  
**Agente:** Claude

### Resumo

Os shots de uma cena podem ser reordenados. A lista inteira é gravada numa transação.

### Implementação

- `reorderShots` recebe `shotIds` com todos os shots visíveis da cena. Faltando, repetido ou de outra cena, recusa.
- O repositório passa tudo por ordem negativa antes da final, por causa do índice único `(sceneId, order)`.
- Shots excluídos ficam no fim da numeração.
- Mesmo desenho de `reorderScenes`.

### Arquivos principais

- `src/server/shot.ts`
- `src/server/shot-repository.ts`
- `src/server/shot-prisma.ts`
- `src/server/shot.test.ts`
- `src/server/shot.integration.test.ts`

### Decisões tomadas

- Sem ADR.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
```

Resultado: PASS.

---

## 2026-09-28 — SHOT-002 — CRUD de Shots

**Status:** DONE  
**Agente:** Claude

### Resumo

O shot pode ser editado, ter o status trocado e ser excluído. A exclusão é lógica.

### Implementação

- `updateShot` valida os mesmos campos da criação. Sem status no envio, fica o atual. Ordem e cena não mudam.
- `deleteShot` grava `deletedAt`. A lista e a leitura ignoram o shot excluído.
- As duas passam por `getShot`, que só acha o shot na cena visível do workspace.
- As server actions e a tela entram na SHOT-004, junto da cena.

### Arquivos principais

- `src/server/shot.ts`
- `src/server/shot-repository.ts`
- `src/server/shot-prisma.ts`
- `src/server/shot.test.ts`
- `src/server/shot.integration.test.ts`

### Decisões tomadas

- Sem ADR. Segue ADR-027.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
```

Resultado: PASS.

---

## 2026-09-28 — SHOT-001 — Modelo Shot

**Status:** DONE  
**Agente:** Claude

### Resumo

O shot é gravado dentro da cena. Nasce planejado, na próxima ordem da cena.

### Implementação

- Tabela `Shot` com os campos da spec, `deletedAt` e ordem única por cena.
- `ShotType` e `ShotStatus` como enum. Status sem valores na spec: ver ADR-027.
- `createShot`, `listShots` e `getShot` passam antes por `getScene`, que já checa workspace e produção.
- O repositório recebe `ShotScope` (workspace, produção, cena) e filtra pela cena visível.
- `requiredTakes` de 1 a 99, padrão 1. Enquadramento aceita texto livre; as sugestões estão em `framingPresets`.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928260000_shot/migration.sql`
- `src/server/shot.ts`
- `src/server/shot-labels.ts`
- `src/server/shot-repository.ts`
- `src/server/shot-prisma.ts`
- `src/server/shot.test.ts`
- `src/server/shot.integration.test.ts`

### Decisões tomadas

- ADR-027.

### Banco / migrations

- `20260928260000_shot`: cria `ShotType`, `ShotStatus` e `Shot`, com FK em cascata para `Scene`. Rollback conceitual: dropar a tabela e os dois enums.
- As migrations anteriores usam carimbo à frente do relógio. A nova foi renomeada para ficar depois de `scene_soft_delete`.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS.

---

## 2026-09-28 — SCRIPT-002 — Tela de roteiro

**Status:** DONE  
**Agente:** Claude

### Resumo

A aba Roteiro da produção mostra os campos do roteiro e, abaixo, as cenas em ordem para ler o fluxo da história.

### Implementação

- `/producoes/[id]/roteiro`: gancho, mensagem principal, chamada e notas com autosave. Leitor vê o texto sem formulário.
- `buildScriptView` ordena as cenas, troca o id de quem fala pelo nome e soma a duração estimada. Cena sem duração é contada à parte.
- O autosave da SCENE-005 virou `useFormAutosave` em `src/components/feedback/form-autosave.tsx`, usado pela cena e pelo roteiro.
- O botão Salvar roteiro só adianta o autosave; a página não navega.
- A aba Roteiro virou link nas abas da produção.

### Arquivos principais

- `src/app/(app)/producoes/[id]/roteiro/page.tsx`
- `src/components/script/script-form.tsx`
- `src/components/feedback/form-autosave.tsx`
- `src/server/script-actions.ts`
- `src/server/script-view.ts`
- `src/server/script-view.test.ts`

### Decisões tomadas

- Sem ADR. As cenas são editadas na aba Cenas; o roteiro só lê.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Sem navegador logado; a tela não foi clicada.

### Observações para próxima tarefa

Rodar `prettier --write` só nos arquivos alterados. Na pasta inteira ele reformata arquivos de outras tarefas.

---

## 2026-09-28 — SCENE-005 — Autosave

**Status:** DONE  
**Agente:** Claude

### Resumo

A tela de editar cena grava sozinha 1 s depois da última alteração e mostra Salvando..., Salvo ou Erro ao salvar.

### Implementação

- `createAutosave` (`src/lib/autosave.ts`) faz o debounce e segura a próxima gravação enquanto uma está no ar. Só a última edição vai.
- `autosaveSceneAction` usa a mesma `updateScene`, sem redirecionar. Leitor continua recusado no servidor.
- Erro mostra a primeira mensagem de campo. O texto fica no formulário e sair da página com edição não gravada pede confirmação.
- O botão Salvar cena continua e cancela o autosave pendente.
- A criação de cena não tem autosave: não há registro até o primeiro envio.

### Arquivos principais

- `src/lib/autosave.ts`
- `src/lib/autosave.test.ts`
- `src/server/scene-actions.ts`
- `src/components/scenes/scene-form.tsx`

### Decisões tomadas

- Sem ADR. O mesmo `createAutosave` serve para o roteiro na SCRIPT-002.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

Resultado: PASS. Banco local por `npx prisma dev start takeops`.

Sem navegador logado nesta sessão (login é só Google). O comportamento de tela não foi clicado.

---

## 2026-09-28 — SCENE-004 — Duplicação

**Status:** DONE  
**Agente:** Grok

### Resumo

Duplicar a cena cria outra, com o mesmo conteúdo, no fim da lista. A cópia nasce planejada.

### Implementação

- `duplicateScene` lê a cena visível e grava uma nova pela mesma regra de criação.
- O status gravado volta para Planejada. A ordem é a próxima.
- Leitor não vê o botão e o servidor recusa.
- Autosave continua na SCENE-005.

### Arquivos principais

- `src/server/scene.ts`
- `src/server/scene-actions.ts`
- `src/app/(app)/producoes/[id]/cenas/page.tsx`
- `src/server/scene.test.ts`
- `src/server/scene.integration.test.ts`

### Decisões tomadas

- Sem ADR. A cópia não herda o status de gravada.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — SCENE-003 — Reordenação

**Status:** DONE  
**Agente:** Grok

### Resumo

Subir e descer a cena grava a ordem inteira numa transação. A lista visível passa a ser 1, 2, 3.

### Implementação

- `reorderScenes` exige todas as cenas visíveis, sem repetir e sem cena de fora.
- A transação tira a ordem do caminho, inclusive das excluídas, e regrava sem colisão.
- Leitor não vê os botões e o servidor recusa a troca.
- Duplicar continua na SCENE-004.

### Arquivos principais

- `src/server/scene.ts`
- `src/server/scene-prisma.ts`
- `src/server/scene-actions.ts`
- `src/app/(app)/producoes/[id]/cenas/page.tsx`
- `src/server/scene.test.ts`

### Decisões tomadas

- Sem ADR. A ordem sequencial já era a regra do MVP.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — SCENE-002 — CRUD de cenas

**Status:** DONE  
**Agente:** Grok

### Resumo

Dá para editar e excluir a cena em `/producoes/[id]/cenas`. A ordem não muda. Excluir esconde a cena e guarda o registro.

### Implementação

- `updateScene` troca título, tipo, status e os textos. A ordem fica.
- `deleteScene` preenche `deletedAt`. A lista e a leitura ignoram esse registro.
- Leitor vê a lista e não abre a edição.
- A aba Cenas passa a abrir. Reordenar continua na SCENE-003.

### Arquivos principais

- `src/server/scene.ts`
- `src/server/scene-actions.ts`
- `src/app/(app)/producoes/[id]/cenas/page.tsx`
- `src/app/(app)/producoes/[id]/cenas/[sceneId]/page.tsx`
- `prisma/migrations/20260928250000_scene_soft_delete/migration.sql`

### Decisões tomadas

- Sem ADR novo. Vale a ADR-026. Excluir segue o soft delete da spec.

### Banco / migrations

- `20260928250000_scene_soft_delete`

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — SCENE-001 — Modelo Scene

**Status:** DONE  
**Agente:** Grok

### Resumo

A produção guarda cenas com os campos da spec. Cada cena nasce planejada, na próxima ordem da produção.

### Implementação

- Tabela `Scene`, com tipo, status e ordem única por produção.
- `createScene` ignora status e ordem vindos do cliente.
- Quem fala tem de ser membro do workspace. Leitor só lista e lê.
- Cena de outra produção não aparece.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928240000_scene/migration.sql`
- `src/server/scene.ts`
- `src/server/scene-prisma.ts`
- `src/server/scene.test.ts`
- `src/server/scene.integration.test.ts`

### Decisões tomadas

- ADR-026.

### Banco / migrations

- `20260928240000_scene`

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — SCRIPT-001 — Modelo Script

**Status:** DONE  
**Agente:** Grok

### Resumo

A produção ganhou um roteiro próprio: gancho, mensagem principal, chamada e notas. Não é um texto único e ainda não tem tela.

### Implementação

- A tabela `Script` aponta para uma produção, com índice único.
- `saveScript` cria ou atualiza esse registro. Quem é leitor só lê.
- A consulta filtra pela produção do workspace da sessão.
- Campo que não veio no corpo fica como está. String vazia limpa o campo.

### Arquivos principais

- `prisma/schema.prisma`
- `prisma/migrations/20260928230000_script/migration.sql`
- `src/server/script.ts`
- `src/server/script-prisma.ts`
- `src/server/script.test.ts`
- `src/server/script.integration.test.ts`

### Decisões tomadas

- ADR-025.

### Banco / migrations

- `20260928230000_script`

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — KANBAN-004 — Alertas de incompletude

**Status:** DONE  
**Agente:** Grok

### Resumo

O card em Pronto para gravar avisa quando não há cena pronta. A troca de etapa não é bloqueada.

### Implementação

- `projectAlerts` devolve "Não há cenas prontas." só nessa etapa e só com contagem menor que 1.
- O quadro usa a contagem recebida. Sem o módulo de cenas, a contagem fica zerada.
- Ideia, edição e as outras etapas não mostram esse aviso.
- Arrastar para Pronto para gravar continua gravando a etapa.

### Arquivos principais

- `src/server/project-board.ts`
- `src/server/project-board.test.ts`
- `src/server/project-status.test.ts`
- `src/components/projects/production-board.tsx`

### Decisões tomadas

- Sem ADR. O exemplo do plano é a única regra. Checklist continua na fase própria.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — KANBAN-003 — Drag & Drop

**Status:** DONE  
**Agente:** Grok

### Resumo

Soltar o card numa coluna grava essa etapa. O quadro chama `submitBoardMove`, que usa o serviço de status e o workspace da sessão.

### Implementação

- Dono, admin e membro arrastam. Leitor vê o quadro sem alça de arraste.
- Um `workspaceId` enviado no formulário é ignorado.
- A mesma etapa não regrava. Erro de permissão volta para o quadro.
- Alerta de etapa incompleta continua na KANBAN-004.

### Arquivos principais

- `src/components/projects/production-board.tsx`
- `src/server/project-actions.ts`
- `src/server/project.ts`
- `src/app/(app)/producoes/page.tsx`
- `src/server/project-status.test.ts`

### Decisões tomadas

- Sem ADR novo. Vale a ADR-023.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — KANBAN-002 — Board

**Status:** DONE  
**Agente:** Grok

### Resumo

`/producoes` virou o quadro. As dez colunas da spec aparecem, e Arquivado fica no fim para a produção não sumir.

### Implementação

- `buildProjectBoard` agrupa o que `searchProjects` já filtrou no workspace da sessão.
- O card mostra thumbnail, título, responsável, participante, data de gravação e prioridade.
- Alerta, checklist e arrastar ficam nas tarefas seguintes.
- Os filtros da lista continuam no quadro.

### Arquivos principais

- `src/server/project-board.ts`
- `src/server/project-board.test.ts`
- `src/app/(app)/producoes/page.tsx`

### Decisões tomadas

- ADR-024.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — KANBAN-001 — Pipeline de status

**Status:** DONE  
**Agente:** Grok

### Resumo

A etapa da produção muda só em `changeVideoProjectStatus`. O cadastro continua nascendo em Ideia e a edição não aceita etapa vinda do cliente.

### Implementação

- O enum do pipeline já existia. O serviço grava qualquer valor dele.
- Pular etapa e arquivar são permitidos. A mesma etapa não regrava.
- Leitor e usuário de fora recebem proibido. Produção de outro workspace não é encontrada.
- Aviso de etapa incompleta fica na KANBAN-004.

### Arquivos principais

- `src/server/project.ts`
- `src/server/project-prisma.ts`
- `src/server/project-repository.ts`
- `src/server/project-status.test.ts`
- `src/server/project.integration.test.ts`

### Decisões tomadas

- ADR-023.

### Banco / migrations

- Nenhuma. O enum já estava na tabela.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — PROJECT-006 — Busca e filtros

**Status:** DONE  
**Agente:** Grok

### Resumo

A lista de produções filtra no servidor por título, status, responsável, participante, produto, prioridade e datas de gravação e publicação.

### Implementação

- `searchProjects` parte da lista do workspace da sessão e aplica `filterProjects`.
- Status ou prioridade fora do enum não devolve linha.
- O intervalo de data é o dia UTC, inclusive. Sem a data, a produção sai do resultado.
- O formulário em `/producoes` é GET. Limpar volta para a lista inteira.

### Arquivos principais

- `src/server/project-search.ts`
- `src/server/project-search.test.ts`
- `src/server/project.ts`
- `src/app/(app)/producoes/page.tsx`
- `src/server/participant-repository.ts`
- `src/server/participant-prisma.ts`

### Decisões tomadas

- ADR-022.

### Banco / migrations

- Nenhuma.

### Testes executados

```text
npm test
npm run lint
npm run typecheck
npm run build
```

---

## 2026-09-28 — PROJECT-005 — Página Visão Geral

**Status:** DONE  
**Agente:** Grok

### Resumo

A página da produção mostra a visão geral: dados, progresso da etapa, responsável, participantes e links. O formulário longo foi para a edição.

### Implementação

- `buildProjectOverview` monta os campos da spec. A data de calendário sai do dia UTC.
- O progresso é a posição no fluxo até Publicado. Arquivado fica fora da conta.
- As abas da spec aparecem. Só Visão Geral abre. Roteiro, cenas e o resto esperam as tarefas deles.
- Editar continua em `/producoes/[id]/editar`.

### Arquivos principais

- `src/server/project-overview.ts`
- `src/server/project-overview.test.ts`
- `src/app/(app)/producoes/[id]/page.tsx`
- `src/app/(app)/producoes/[id]/editar/page.tsx`
- `src/components/projects/production-tabs.tsx`

### Decisões tomadas

- Sem ADR. As abas sem módulo não ganham rota vazia.

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

No HTTP, a página mostrou título, objetivo, produto, público, formato, progresso 1 de 10, prioridade, data, responsável, thumbnail e o link de editar. Roteiro apareceu sem virar link.

Não há ferramenta de navegador nesta sessão. A checagem foi por HTTP no `next dev`.

### Critérios de aceite

- [x] a página mostra os dados da visão geral da spec
- [x] o progresso acompanha a etapa do pipeline
- [x] as outras abas aparecem sem abrir módulo que ainda não existe

### Pendências conhecidas

- Busca e filtros ficam na PROJECT-006.
- Roteiro, cenas, gravação, edição, revisão, publicação e atividade não têm página.

### Observações para próxima tarefa

PROJECT-006 filtra a lista de produções. A visão geral já lê o projeto isolado pelo workspace.


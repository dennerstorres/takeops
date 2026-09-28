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


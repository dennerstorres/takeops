# DECISIONS.md

Registro de decisões arquiteturais e de produto com impacto durável.

Não usar este arquivo para detalhes triviais de implementação.

---

# ADR-001 — PostgreSQL como banco principal

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A aplicação possui entidades relacionais, multi-tenancy, ordenação, workflows, permissões e histórico.

## Decisão

Usar PostgreSQL como banco principal.

## Consequências

- bom suporte relacional;
- migrations consistentes;
- transações disponíveis;
- índices e constraints podem proteger regras importantes.

---

# ADR-002 — Prisma como ORM inicial

**Status:** Accepted  
**Data:** 2026-09-28

## Decisão

Usar Prisma no MVP.

## Consequências

- schema versionado;
- migrations;
- tipagem TypeScript;
- produtividade adequada para o MVP.

A camada de negócio não deve depender diretamente de Prisma dentro de componentes React.

---

# ADR-003 — Google OAuth como autenticação inicial

**Status:** Accepted  
**Data:** 2026-09-28

## Decisão

Utilizar Auth.js com Google OAuth.

Não haverá senha local no MVP.

---

# ADR-004 — Isolamento obrigatório por Workspace

**Status:** Accepted  
**Data:** 2026-09-28

## Decisão

Toda entidade de negócio deve ser associada direta ou indiretamente a um Workspace.

Toda operação server-side deve confirmar membership antes de acessar dados.

## Consequências

ID de entidade sozinho nunca é autorização suficiente.

Testes de isolamento cross-workspace são obrigatórios nas áreas críticas.

---

# ADR-005 — Scene e Shot separados

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

Uma cena narrativa pode exigir múltiplas fontes de imagem.

## Decisão

`Scene` representa a unidade narrativa.

`Shot` representa o plano/captura necessária para realizar a cena.

## Consequência

Uma Scene pode possuir múltiplos Shots.

---

# ADR-006 — Mídia pesada permanece externa no MVP

**Status:** Accepted  
**Data:** 2026-09-28

## Decisão

Não implementar upload/streaming/transcoding de arquivos grandes no MVP.

O sistema armazena URLs em `Asset` e `EditVersion`.

## Consequências

Evita:

- custo elevado;
- pipeline de vídeo;
- processamento HDR;
- previews;
- storage complexo.

---

# ADR-007 — Aplicação gerencia edição, mas não edita vídeo

**Status:** Accepted  
**Data:** 2026-09-28

A edição permanece em ferramentas externas como Premiere Pro.

A plataforma gerencia:

- editor;
- links;
- versões;
- feedback;
- aprovação.

---

# ADR-008 — Publicação manual no MVP

**Status:** Accepted  
**Data:** 2026-09-28

A plataforma não publica diretamente em redes sociais.

Ela registra:

- plataforma;
- agendamento;
- status;
- URL final.

---

# ADR-009 — Datas em UTC, apresentação por Workspace

**Status:** Accepted  
**Data:** 2026-09-28

Persistência em UTC.

Transporte em ISO 8601.

Apresentação utilizando `Workspace.timezone`.

---

# ADR-010 — Server Actions / Route Handlers no MVP

**Status:** Accepted  
**Data:** 2026-09-28

## Decisão

Começar com backend dentro do Next.js.

Regras de negócio devem ficar em services reutilizáveis para permitir futura extração para backend dedicado.

---

# ADR-011 — npm como package manager

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

`STATUS.md` deixava o package manager para o BOOT-001. `TESTING.md` e o formato de `HISTORY.md` já documentam comandos `npm run`.

## Decisão

Usar npm no MVP.

Node.js permanece `>=22`, como no harness.

## Consequências

Scripts oficiais: `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`.

`npm test` e `npm run test:e2e` entram quando a stack de testes for definida.

---

# ADR-012 — shadcn/ui com Base UI

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

O CLI atual do shadcn inicializa o preset `base-nova`, sobre Base UI, no lugar do conjunto antigo com Radix.

## Decisão

Usar shadcn/ui `base-nova` e Lucide no MVP.

Tema claro e escuro segue a preferência do sistema, via `next-themes`. Não há seletor manual nesta tarefa. O `SPEC.md` trata dark mode como opcional.

## Consequências

Componentes novos devem entrar por `npx shadcn add`, não por cópia de exemplos Radix.

---

# ADR-013 — Prisma 7.10 com adapter PostgreSQL

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A tag `latest` do Prisma apontava para `8.0.0-rc.17`. O gerador `prisma-client-js` está deprecado no Prisma 7.

## Decisão

Fixar Prisma e `@prisma/client` em `7.10.0`.

O client é gerado em `src/generated/prisma`, fica fora do Git e nasce no `postinstall`. A conexão usa `@prisma/adapter-pg`. A URL fica em `prisma.config.ts`, lida de `DATABASE_URL`.

A migration inicial não cria tabelas de domínio. Cada módulo cria as suas.

## Consequências

`npm run db:migrate`, `npm run db:deploy` e `npm run db:check` são os comandos oficiais.

---

# ADR-014 — Resultado de action e erro de domínio

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

Server Actions não devem lançar erro cru para a interface. Route Handlers precisam do mesmo critério, com status HTTP.

## Decisão

Erros previstos são `DomainError`: validação, não encontrado e acesso negado.

`runAction` devolve `{ ok: true, data }` ou `{ ok: false, message, fields? }`.

`runHandler` devolve JSON com a mesma mensagem e o status do erro. Falha inesperada vira mensagem genérica e status 500. O detalhe fica no log, com `userId`, `workspaceId`, `entity`, `operation` e `stack`.

Entrada de serviço passa por `parseInput` com Zod.

## Consequências

Actions e route handlers novos usam esses helpers. A regra de negócio continua no service, não no componente.

---

# ADR-015 — Sessão Auth.js no banco

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A tag `latest` do `next-auth` ainda é a v4. O App Router e o `proxy.ts` do Next.js 16 seguem a API da v5, publicada como `5.0.0-beta.32`.

## Decisão

Usar Auth.js v5 com adapter Prisma e sessão `database`.

O `User.id` é UUID. A sessão guarda esse id, não o subject do Google.

O logger descarta `access_token`, `refresh_token`, `id_token` e `code`. O debug do Auth.js fica desligado porque ele imprime esses tokens.

## Consequências

`AUTH_SECRET`, `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` vêm do ambiente. Sem as credenciais Google o restante da proteção continua ativo.

---

# ADR-016 — Acesso ao Workspace exige membership

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

WORKSPACE-001 introduz `Workspace` e `WorkspaceMember`. A leitura não pode confirmar que um workspace existe para quem não participa dele.

## Decisão

`getWorkspace`, `listWorkspaces` e `requireMembership` filtram por `userId` e `workspaceId`. Sem membership o serviço responde Forbidden, esteja o workspace ausente ou apenas fora do alcance do usuário.

Criar workspace grava o autor como OWNER. O papel não vem do cliente. O slug é único. O fuso padrão é `America/Cuiaba`.

## Consequências

Convite, troca de papel e a tela de primeiro acesso ficam nas tarefas seguintes. Elas reutilizam este serviço.

---

# ADR-017 — Primeiro acesso abre a membership mais antiga

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

WORKSPACE-002 precisa decidir para onde vai quem acabou de entrar. Convite ainda não existe. Também não há seletor quando a pessoa participa de mais de um workspace.

## Decisão

`decideFirstAccess` olha só as memberships daquele `User.id`. Sem nenhuma, a rota autenticada manda para `/comecar`, onde a pessoa cria um workspace ou espera convite. Com uma ou mais, abre a membership mais antiga.

A tela de criação chama `createWorkspace` com o id da sessão. O cliente não escolhe o workspace nem o papel.

O aceite de convite continua em TEAM-002.

## Consequências

Trocar de workspace fica para uma tarefa futura. Até lá, quem tem mais de um membership sempre vê o mais antigo.

---

# ADR-018 — Convite é um link com papel gravado no servidor

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

TEAM-002 precisa convidar por e-mail sem obrigar envio automático. O aceite acontece depois do login Google. O papel não pode vir do cliente na hora de entrar.

## Decisão

O dono convida como admin, membro ou leitor. O admin convida só membro ou leitor. Membro e leitor não convidam.

O token fica só como hash. O link aparece uma vez, vale 7 dias e não é enviado por e-mail. O aceite compara o e-mail da conta com o e-mail do convite e grava o papel que já estava no convite. Se a pessoa já participa, o papel não muda.

Quem ainda não tem workspace entra pelos convites pendentes daquele e-mail. Quem já tem workspace só entra em outro pelo link.

## Consequências

O workspace aberto continua sendo a membership mais antiga. Entrar num segundo workspace pelo link não troca a tela atual.

---

# ADR-019 — Troca de papel não transfere a propriedade

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

TEAM-003 altera o papel de quem já está na equipe. O admin gerencia usuários comuns e não transfere a propriedade.

## Decisão

O dono muda admin, membro e leitor entre esses três papéis. O admin muda só membro e leitor. Membro e leitor não mudam papel.

Ninguém muda o próprio papel. Ninguém passa a ser dono por esta tela. O dono atual permanece dono.

O workspace vem da sessão. O id enviado pelo cliente só escolhe a pessoa dentro desse workspace.

## Consequências

Transferir a propriedade fica fora do MVP até existir uma tarefa própria.

---

# ADR-020 — Ideia nasce nova e a exclusão só esconde

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

IDEA-001 cadastra a ideia. IDEA-002 muda o status. A exclusão das entidades principais é lógica.

## Decisão

Criar ideia grava o autor da sessão e o status `NEW`. O cliente não escolhe autor, workspace nem status. Editar não muda esses três.

Dono, admin e membro criam, editam e excluem. Leitor só vê. Excluir preenche `deletedAt`. A lista e a leitura ignoram esse registro.

## Consequências

A troca de status fica na IDEA-002. Converter em produção continua numa tarefa posterior.

---

# ADR-021 — Produção nasce como ideia em 9:16

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

PROJECT-001 grava o modelo de `VideoProject`. O formato de conteúdo do produto começa em Reels, TikTok e Shorts. A troca de etapa do pipeline é outra tarefa.

## Decisão

O formato reusa os valores da ideia. A proporção padrão é `9:16`. A prioridade padrão é `NORMAL`. O status gravado na criação é sempre `IDEA`. O cliente não escolhe a etapa.

A data sem horário vira meia-noite UTC. `deletedAt` já existe na tabela. Apagar e editar a tela ficam na PROJECT-002. Mudar a etapa fica no kanban.

## Consequências

Uma ideia ligada à produção precisa ser do mesmo workspace. A conversão que marca a ideia como convertida continua fora desta tarefa.

---

# ADR-022 — Filtros da lista de produções

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A lista de produções precisa cruzar status, responsável, participante, produto, prioridade, datas e o título. O kanban vai precisar da mesma regra.

## Decisão

Os filtros se combinam todos. Um valor de status ou prioridade que não existe no enum não encontra nada. A data é o dia UTC, inclusive nos dois limites. Produção sem a data do filtro fica de fora quando esse intervalo está preenchido.

O workspace continua o da sessão. O cliente não envia `workspaceId`.

## Consequências

O kanban reusa `filterProjects`. A busca desta tarefa olha só o título. Produto tem o campo próprio.

---

# ADR-023 — Etapa da produção muda só no serviço de status

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

O formulário da produção não escolhe a etapa. O kanban ainda não existe, e o aviso de etapa incompleta é outra tarefa.

## Decisão

`changeVideoProjectStatus` é o único caminho que altera `VideoProject.status` depois da criação. Qualquer valor do enum vale, inclusive arquivo e pulo de etapa. Dono, admin e membro mudam. Leitor não.

O aviso de incompletude fica na KANBAN-004 e não bloqueia esta troca.

## Consequências

O quadro e o arrastar vão chamar o mesmo serviço. O log de atividade continua na fase própria.

---

# ADR-024 — Quadro inclui a coluna Arquivado

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A spec lista dez colunas, do Ideias ao Publicado. O status `ARCHIVED` existe e não entra nesse fluxo.

## Decisão

O quadro mostra as dez colunas da spec e, no fim, Arquivado. Arrastar fica na KANBAN-003. Alerta e checklist ficam nas tarefas deles. O card não inventa esses dois.

## Consequências

Uma produção arquivada continua visível. O filtro da lista vale para o quadro.

---

# ADR-025 — Um roteiro por produção

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A spec descreve `Script` ligado a `videoProjectId`, com gancho, mensagem, chamada e notas. As cenas são outra entidade. A tela do roteiro é a SCRIPT-002.

## Decisão

Cada produção tem no máximo um roteiro. Gravar de novo atualiza o mesmo registro. Campo omitido permanece. Campo vazio apaga. O workspace vem da sessão e da produção, não do corpo.

Gancho, mensagem e chamada aceitam até 2000 caracteres. Notas, até 4000.

## Consequências

A leitura some com a produção apagada em lógica, porque a consulta passa pela produção visível. A tela entra na SCRIPT-002.

---

# Template para novas decisões

```md
# ADR-XXX — Título

**Status:** Proposed | Accepted | Superseded | Rejected
**Data:** YYYY-MM-DD
**Supersedes:** ADR-XXX, se aplicável

## Contexto

...

## Opções consideradas

1. ...
2. ...

## Decisão

...

## Consequências

### Positivas

- ...

### Negativas

- ...

## Observações

...
```

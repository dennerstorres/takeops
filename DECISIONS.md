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

# ADR-026 — Cena nasce planejada e a ordem é do servidor

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A spec descreve `Scene` com ordem, tipo e status. Arrastar, duplicar e excluir são tarefas seguintes. O modelo precisa gravar sem a tela.

## Decisão

Criar cena grava status `PLANNED`. O cliente não escolhe status nem ordem. A ordem é o próximo inteiro da produção. Quem fala precisa ser membro do workspace. A consulta passa pela produção visível desse workspace.

## Consequências

Editar, apagar e reordenar ficam na SCENE-002 e na SCENE-003. A tela entra depois.

---

# ADR-027 — Shot pertence à cena e tem quatro status

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A spec lista `status` no Shot, mas não diz os valores. O Shot não tem `workspaceId`.

## Decisão

`ShotStatus` é `PLANNED`, `RECORDED`, `NEEDS_RETAKE` e `DISCARDED`. O shot nasce `PLANNED`, na próxima ordem da cena. `requiredTakes` vai de 1 a 99, padrão 1. Enquadramento é texto livre com sugestões da spec. Toda consulta chega ao shot pela cena visível e pela produção do workspace aberto. Cena excluída esconde os shots dela.

## Consequências

Editar e apagar ficam na SHOT-002, reordenar na SHOT-003 e a tela na SHOT-004. O Modo Gravação pode mudar o status depois.

---

# ADR-028 — Gravação guarda instante UTC; a tela converte pelo fuso do workspace

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

`Shoot.scheduledAt` tem hora. A regra é persistir UTC, trafegar ISO 8601 e mostrar no fuso do workspace. O input `datetime-local` manda horário sem fuso.

## Decisão

O service de gravação só aceita ISO 8601 com `Z` ou deslocamento. Horário sem fuso é recusado. A server action converte o `datetime-local` pelo `Workspace.timezone` com `zonedLocalToUtc` (`src/lib/zoned-time.ts`, só `Intl`) antes de chamar o service. A tela volta ao horário local com `utcToZonedLocal`. A gravação nasce `PLANNED`; o cliente não escolhe o status na criação. Exclusão é lógica, como cena e shot.

## Consequências

Nenhuma dependência de data nova. Toda tela futura com data e hora (publicação, calendário) usa o mesmo helper.

---

# ADR-029 — Checklist recomendado é criado sob pedido

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A CHECK-002 pede para "seedar" o checklist da spec. Criar sozinho no cadastro do workspace mexe na criação do workspace e gera modelo que a equipe pode não querer.

## Decisão

O checklist da spec fica numa constante (`checklist-defaults.ts`). Dono ou admin cria com um botão em Configurações → Checklists. A criação é idempotente por nome e tipo. O seed de demonstração (SEED-001/002) reaproveita a mesma função.

## Consequências

Workspace novo começa sem checklist. A oferta some quando já há um checklist de gravação.

---

# ADR-030 — Link externo só em http(s), sem credencial

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

Asset (e depois EditVersion) guarda links para Drive, Dropbox, NAS, Frame.io. O link vira `<a href>` para toda a equipe do workspace.

## Decisão

`externalUrl` (`src/server/external-url.ts`) aceita só `http:`/`https:` com host e recusa usuário/senha embutidos no link. `file://`, `smb://`, `ftp://` ficam de fora: NAS entra pelo link web de compartilhamento. O link abre em nova aba com `noopener noreferrer`.

## Consequências

Bloqueia `javascript:`/`data:` e evita senha exposta a quem só lê. Caminho de rede local (`\nas\pasta`) precisa virar link web ou ir na descrição.

---

# ADR-031 — Número de versão vem de contador na produção

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

VERSION-002 pede número sequencial sem duplicar em envios simultâneos. Ler o máximo das versões e somar 1 deixa dois envios com o mesmo número; o índice único recusaria um deles.

## Decisão

`VideoProject.lastEditVersionNumber` guarda o último número. A criação incrementa esse campo e usa o valor na mesma transação. O `UPDATE` trava a linha da produção até o commit, então o envio seguinte espera e recebe o próximo. O índice único `(videoProjectId, versionNumber)` fica como rede de segurança.

## Consequências

Criar versão atualiza `VideoProject.updatedAt` (nada lê esse campo hoje). Número nunca é reaproveitado. O teste simultâneo só roda com `PG_CONCURRENCY=1` em Postgres real: o `prisma dev` (PGlite) usa uma sessão só e mistura transações paralelas.

---

# ADR-032 — Leitor não comenta revisão no MVP

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A spec (§7, VIEWER) diz "comentar, se permitido pela configuração". Não existe essa configuração no workspace.

## Decisão

Comentário de revisão é de dono, admin e membro. Leitor vê versões e comentários, mas não comenta nem resolve.

## Consequências

Cliente externo que só revisa entra como membro. Quando a configuração existir, a regra muda em `review.ts` (`reviewers`) e ganha nova ADR.

---

# ADR-033 — Quem decide aprovação: dono, admin ou APPROVER da produção

**Status:** Accepted  
**Data:** 2026-09-28

## Contexto

A spec dá "aprovar vídeos" a OWNER e ADMIN (§7) e tem o papel de produção APPROVER (§17). A APPROVAL-004 pede combinar papel de workspace e de produção.

## Decisão

`canDecideApproval` (`src/server/approval.ts`): OWNER e ADMIN decidem em qualquer produção; MEMBER decide só onde é participante com papel APPROVER; VIEWER nunca, mesmo marcado como APPROVER. Pedir aprovação continua de dono, admin e membro.

## Consequências

A tela usa a mesma função para mostrar os botões. Aprovar externo (cliente) exige entrar como membro e ser APPROVER da produção. O kanban ainda deixa membro mover a produção para "Aprovado" à mão; fechar isso é tarefa da HARDEN-001.

---

# ADR-034 — Produção por template recebe cópias, inclusive do checklist

**Status:** Accepted  
**Data:** 2026-09-29

## Contexto

TEMPLATE-004: "duplicar estruturas, nunca compartilhar registros mutáveis". Cenas têm destino natural (`Scene`), mas a produção não tinha onde guardar checklist: checklist existe no catálogo (`ChecklistTemplate`) e por gravação (`ShootChecklistItem`).

## Decisão

Criar por template copia, numa transação, as cenas-modelo para `Scene` (PLANNED) e os itens do checklist ligado ao template para a nova tabela `ProjectChecklistItem`. A produção não guarda `templateId` nem aponta para o checklist do catálogo. O template é conferido antes de criar a produção.

## Consequências

Mudar ou excluir template e checklist depois não altera produções. A cópia aparece na aba Gravação; usar esses itens ao montar o checklist de uma gravação é a TEMPLATE-005. Criação e cópia são duas operações: se a cópia falhar depois de a produção existir, ela fica sem cenas (o template já foi validado antes, então só um apagamento simultâneo causa isso).

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

---

# ADR-035 — Papéis que só dono e admin exercem

**Status:** Accepted  
**Data:** 2026-09-29

## Contexto

A HARDEN-001 achou três caminhos em que MEMBER ia além da spec §7: excluir produção, mover para "Aprovado" no kanban e se marcar APPROVER na produção (o que dava poder de aprovar, ADR-033).

## Decisão

- Excluir produção: OWNER e ADMIN ("gerenciar produções").
- Mudar a etapa para APPROVED à mão: OWNER e ADMIN. Membro aprovador chega lá pela aprovação da versão.
- Adicionar ou remover o papel APPROVER na produção: OWNER e ADMIN. Os outros papéis continuam de membro.

## Consequências

A regra autoritativa está no serviço. Desde a HARDEN-004 a tela também esconde de membro o botão de excluir, a opção APPROVER e o destino "Aprovado" no kanban.

---

# ADR-036 — Env validado na subida do servidor

**Status:** Accepted  
**Data:** 2026-09-29

## Contexto

Cada módulo lia `process.env` solto. Produção com `AUTH_SECRET` do exemplo ou sem Google subia e falhava só no uso.

## Decisão

`src/server/env.ts` valida com Zod e `src/instrumentation.ts` chama na subida (runtime Node). Produção exige `DATABASE_URL` Postgres, `AUTH_SECRET` com 32+ caracteres e diferente do exemplo, `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`. Desenvolvimento exige só `DATABASE_URL`. A mensagem cita o nome da variável, nunca o valor.

## Consequências

Servidor com env inválido não sobe. Os módulos seguem lendo `process.env` direto; a validação é a porta de entrada. `npm run verify` roda lint, typecheck, testes e build.

---

# ADR-037 — Distribuição por imagem Docker; produção no Coolify

**Status:** Accepted  
**Data:** 2026-09-29

## Contexto

Produção do dono roda numa VPS com Coolify; o repositório também será público para self-host.

## Decisão

Um `Dockerfile` do repositório é a forma oficial de rodar. O Coolify constrói por ele (não Nixpacks) e o self-host usa `docker-compose.yml` com Postgres. Migrations rodam no start (`prisma migrate deploy`). Produção do dono: `https://takeops.dennerstorres.dev`, Postgres como recurso do Coolify, env só no painel.

## Consequências

Uma imagem, dois caminhos de instalação. Nada específico da VPS do dono entra no código; o domínio aparece só em docs de deploy e no PLAN.

---

# ADR-038 — PanelUI como referência visual

**Status:** Accepted  
**Data:** 2026-09-29

## Contexto

O dono quer refazer UI/UX inspirado em https://panelui.dev. PanelUI é biblioteca React Native/Expo; não roda no Next.js.

## Decisão

Usar só como referência de estilo (tokens, tipografia, densidade, padrões). Implementação segue Tailwind + shadcn/ui. Nenhum código, asset ou marca do PanelUI entra no repositório. App mobile nativo fica fora do MVP.

## Consequências

Fase 21 (UI-001..008). `DESIGN.md` vira a fonte dos tokens.

---

# ADR-039 — Licença AGPL-3.0

**Status:** Accepted  
**Data:** 2026-09-29

## Decisão

Repositório público sob AGPL-3.0: livre para usar e hospedar; quem oferecer versão modificada como serviço precisa publicar o código.

## Consequências

`LICENSE` na raiz e `license` no `package.json` (OSS-001). Dependências precisam ser compatíveis.

---

# ADR-040 — Login por Google e por link de e-mail

**Status:** Accepted  
**Data:** 2026-09-29

## Contexto

Só Google obriga cada self-hoster a criar app OAuth. Isso substitui a restrição "só Google no MVP" da spec §8.1.

## Decisão

Dois métodos, cada um liga se configurado: Google OAuth e link mágico por e-mail (SMTP). Produção exige ao menos um. Continua sem senha local.

## Consequências

OSS-005; validação de env (ADR-036) muda para "ao menos um provider". Tela de login mostra só os métodos ativos.

---

# ADR-041 — Interface em português e inglês

**Status:** Accepted  
**Data:** 2026-09-29

## Contexto

O repositório será público; a interface era só pt-BR.

## Decisão

`pt-BR` e `en` com `next-intl`. Idioma por usuário, com fallback para `Accept-Language` e depois `en`. Catálogos em `messages/`. Texto de interface sempre por chave; serviços devolvem código de erro traduzível. Fuso continua do workspace (spec §14).

## Consequências

OSS-008 vem antes do refactor de UI. Docs do projeto (harness) seguem em pt-BR; README público em inglês com versão pt-BR.

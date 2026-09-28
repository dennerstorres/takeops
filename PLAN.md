# PLAN.md — Plano de Implementação

> O plano é incremental.  
> IDs são estáveis e nunca devem ser renumerados.

## Legenda

- `[TODO]`
- `[READY]`
- `[IN_PROGRESS]`
- `[BLOCKED]`
- `[DONE]`
- `[CANCELED]`

---

# Fase 0 — Bootstrap

## BOOT-001 — Projeto Next.js e configuração base

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** nenhuma

### Objetivo

Criar o projeto base com TypeScript e estrutura inicial.

### Entregas

- Next.js;
- TypeScript strict;
- Tailwind;
- lint;
- formatter;
- aliases;
- estrutura inicial de pastas.

### Critérios de aceite

- [x] dev server inicia;
- [x] lint passa;
- [x] typecheck passa;
- [x] build passa;
- [x] estrutura respeita `AGENTS.md`.

---

## BOOT-002 — UI base e design system

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** BOOT-001

### Entregas

- shadcn/ui;
- Lucide;
- tokens básicos;
- layout shell;
- estados de loading/error/empty;
- toast;
- modal de confirmação.

### Critérios

- [x] desktop shell funcional;
- [x] mobile shell funcional;
- [x] componentes essenciais disponíveis.

---

## BOOT-003 — Prisma e PostgreSQL

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** BOOT-001

### Entregas

- Prisma;
- conexão PostgreSQL;
- schema inicial;
- migration;
- client singleton seguro para dev.

### Critérios

- [x] migration executa;
- [x] conexão validada;
- [x] comandos documentados.

---

## BOOT-004 — Infraestrutura de validação e serviços

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** BOOT-001

### Entregas

- Zod;
- padrão de services;
- padrão de erros de domínio;
- helpers de actions/handlers.

---

# Fase 1 — Autenticação, Workspace e Equipe

## AUTH-001 — Auth.js + Google OAuth

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** BOOT-003

### Entregas

- login Google;
- callback;
- sessão;
- logout;
- proteção de rotas.

### Critérios

- [x] usuário não autenticado não acessa aplicação;
- [x] usuário autenticado possui identidade consistente;
- [x] tokens não aparecem em logs.

---

## WORKSPACE-001 — Modelo de Workspace e Membership

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** AUTH-001

### Entregas

- Workspace;
- WorkspaceMember;
- roles OWNER/ADMIN/MEMBER/VIEWER;
- membership service.

### Critérios

- [x] usuário só acessa Workspace do qual participa;
- [x] cross-workspace bloqueado.

---

## WORKSPACE-002 — Primeiro acesso

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** WORKSPACE-001

### Fluxo

```text
Login
→ verificar memberships
→ abrir Workspace existente
ou
→ convite
ou
→ criar Workspace
```

### Critérios

- [x] sem membership, a pessoa cria um workspace ou aguarda convite;
- [x] com membership, entra no workspace existente;
- [x] a criação usa o usuário da sessão e não aceita workspace escolhido pelo cliente.

---

## TEAM-001 — Listagem de equipe

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** WORKSPACE-001

### Entregas

- tela Equipe;
- nome;
- avatar;
- e-mail;
- papel.

### Critérios

- [x] a pessoa vê nome, avatar, e-mail e papel de quem está no workspace aberto;
- [x] a lista de outro workspace não aparece.

---

## TEAM-002 — Convites

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** TEAM-001

### Entregas

- convite por e-mail;
- token;
- status;
- aceite após Google login.

Não é obrigatório enviar e-mail automaticamente no primeiro corte. Pode ser usado link de convite, desde que documentado.

### Critérios

- [x] dono ou admin gera um link para um e-mail, com papel definido no servidor;
- [x] o aceite entra na equipe só se o Google for desse e-mail;
- [x] membro e leitor não convidam;
- [x] outro workspace não aceita nem lista o convite.

---

## TEAM-003 — Gerenciamento de papéis

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** TEAM-001

### Critérios

- [x] OWNER altera papéis permitidos;
- [x] ADMIN respeita restrições;
- [x] MEMBER não administra equipe;
- [x] VIEWER não administra equipe.

---

# Fase 2 — Shell e Dashboard

## APP-001 — Navegação principal

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** BOOT-002, WORKSPACE-001

### Itens

- Dashboard;
- Ideias;
- Produções;
- Calendário;
- Templates;
- Equipe;
- Configurações.

### Critérios

- [x] cada item do menu abre a própria página;
- [x] sem sessão, essas páginas vão para o login;
- [x] o item da página atual fica marcado.

---

## DASH-001 — Dashboard inicial

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** APP-001, PROJECT-001

### Cards

- próximas gravações;
- produções em andamento;
- revisão;
- aprovação;
- ideias;
- indicadores simples.

Pode ser implementado parcialmente e enriquecido após módulos correspondentes.

---

# Fase 3 — Ideias

## IDEA-001 — Modelo e CRUD

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** WORKSPACE-001

### Entregas

- schema;
- service;
- listagem;
- criação;
- edição;
- exclusão lógica.

### Critérios

- [x] membro cria, edita e tira a ideia da lista;
- [x] leitor só vê;
- [x] ideia de outro workspace não aparece;
- [x] a exclusão não apaga o registro.

---

## IDEA-002 — Status de ideia

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** IDEA-001

Estados:

- NEW;
- UNDER_REVIEW;
- APPROVED;
- DISCARDED;
- CONVERTED.

### Critérios

- [x] quem escreve muda entre Nova, Em análise, Aprovada e Descartada;
- [x] leitor não muda;
- [x] outro workspace não muda;
- [x] Convertida e um status desconhecido são recusados.

---

## IDEA-003 — UX de captura rápida

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** IDEA-001

Objetivo: registrar uma ideia com o mínimo de atrito.

### Critérios

- [x] quem escreve anota só o título na lista;
- [x] o restante nasce vazio e o status fica Nova;
- [x] leitor não vê o campo.

---

# Fase 4 — Video Projects

## PROJECT-001 — Modelo de VideoProject

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** WORKSPACE-001

Implementar campos descritos no SPEC.

### Critérios

- [x] a produção guarda os campos da spec no workspace;
- [x] nasce em IDEA, prioridade normal e proporção 9:16;
- [x] o cliente não escolhe a etapa;
- [x] ideia de outro workspace não entra.

---

## PROJECT-002 — CRUD de produções

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-001

### Critérios

- [x] quem escreve cria, edita e tira a produção da lista;
- [x] leitor só vê;
- [x] a etapa não muda neste cadastro;
- [x] a exclusão não apaga o registro.

---

## PROJECT-003 — Converter Idea em VideoProject

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** IDEA-002, PROJECT-002

### Transação

```text
criar VideoProject
+
sourceIdeaId
+
copiar campos relevantes
+
Idea.status = CONVERTED
```

Tudo deve ocorrer atomicamente.

### Critérios

- [x] a conversão cria a produção e marca a ideia como convertida na mesma transação;
- [x] título, descrição, formato, objetivo, público e produto são copiados;
- [x] uma segunda conversão não cria outra produção;
- [x] leitor não converte.

---

## PROJECT-004 — Participantes e funções

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002, TEAM-001

Suportar múltiplas funções por usuário.

### Critérios

- [x] a mesma pessoa pode ter mais de uma função na produção;
- [x] a função repetida é recusada;
- [x] só entra quem já está no workspace;
- [x] leitor não adiciona nem remove.

---

## PROJECT-005 — Página Visão Geral

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002

### Critérios

- [x] a página mostra os dados da visão geral da spec;
- [x] o progresso acompanha a etapa do pipeline;
- [x] as outras abas aparecem sem abrir módulo que ainda não existe.

---

## PROJECT-006 — Busca e filtros

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** PROJECT-002

### Critérios

- [x] a lista filtra por status, responsável, participante, produto, prioridade e datas;
- [x] a busca por título combina com os filtros;
- [x] o workspace continua vindo da sessão.

Filtros:

- status;
- responsável;
- participante;
- produto;
- prioridade;
- datas.

---

# Fase 5 — Pipeline e Kanban

## KANBAN-001 — Pipeline de status

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002

### Critérios

- [x] a etapa só muda pelo serviço de status;
- [x] qualquer etapa do enum é aceita, inclusive pulo e arquivo;
- [x] leitor e quem está fora do workspace não mudam a etapa.

Implementar enum e serviço de alteração de status.

---

## KANBAN-002 — Board

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** KANBAN-001

### Critérios

- [x] `/producoes` mostra as colunas da spec;
- [x] o card fica na etapa e mostra título, responsável, data e prioridade;
- [x] os filtros da lista continuam valendo no quadro.

Colunas segundo SPEC.

---

## KANBAN-003 — Drag & Drop

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** KANBAN-002

### Critérios

- [x] soltar o card numa coluna grava essa etapa;
- [x] o workspace continua o da sessão;
- [x] leitor não arrasta e o servidor não aceita a troca.

Arrastar card altera status.

---

## KANBAN-004 — Alertas de incompletude

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** KANBAN-003

### Critérios

- [x] pronto para gravar sem cena pronta mostra aviso no card;
- [x] a troca de etapa continua permitida;
- [x] outra etapa não recebe esse aviso.

Exemplo:

mover para READY_TO_RECORD sem cenas prontas gera aviso, mas não precisa bloquear.

---

# Fase 6 — Roteiro e Cenas

## SCRIPT-001 — Modelo Script

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002

### Critérios

- [x] cada produção tem no máximo um roteiro, com gancho, mensagem, chamada e notas;
- [x] quem escreve grava; leitor só lê;
- [x] roteiro de outra produção ou outro workspace não entra.

---

## SCENE-001 — Modelo Scene

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002

### Critérios

- [x] a cena guarda os campos da spec na produção do workspace;
- [x] nasce planejada e a ordem é a próxima da produção;
- [x] leitor só vê; quem fala precisa ser do workspace.

---

## SCENE-002 — CRUD de cenas

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SCENE-001

### Critérios

- [x] quem escreve edita e tira a cena da lista;
- [x] a ordem não muda neste cadastro;
- [x] leitor só vê; a cena excluída permanece no banco.

---

## SCENE-003 — Reordenação

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SCENE-002

### Critérios

- [x] a nova ordem é gravada numa transação e fica 1, 2, 3;
- [x] a lista precisa conter todas as cenas visíveis;
- [x] leitor não reordena.

Reordenação transacional.

---

## SCENE-004 — Duplicação

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** SCENE-002

### Critérios

- [x] duplicar cria outra cena com o mesmo conteúdo;
- [x] a cópia nasce planejada no fim da lista;
- [x] leitor não duplica.

---

## SCENE-005 — Autosave

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** SCENE-002

Estados:

- saving;
- saved;
- error.

### Critérios

- [x] a edição grava sozinha 1 s depois da última alteração;
- [x] a tela mostra Salvando..., Salvo e Erro ao salvar;
- [x] só uma gravação por vez, e a última edição vence;
- [x] erro mantém o texto no formulário e sair pede confirmação.

---

## SCRIPT-002 — Tela de roteiro

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SCRIPT-001, SCENE-003

Deve privilegiar leitura rápida do fluxo narrativo.

### Critérios

- [x] a aba Roteiro abre gancho, mensagem, chamada e notas com autosave;
- [x] as cenas aparecem na ordem com quem fala, fala, ação e duração;
- [x] o total estimado soma as cenas e avisa as que estão sem duração;
- [x] leitor só lê.

---

# Fase 7 — Shots

## SHOT-001 — Modelo Shot

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SCENE-001

### Critérios

- [x] o shot nasce planejado na próxima ordem da cena;
- [x] tipo, enquadramento livre e takes necessários são validados no servidor;
- [x] leitor só vê; cena de outro workspace não abre.

---

## SHOT-002 — CRUD de Shots

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SHOT-001

### Critérios

- [x] quem escreve edita os campos e o status do shot;
- [x] editar não muda a ordem nem a cena;
- [x] excluir esconde o shot e mantém a linha no banco;
- [x] leitor não edita nem exclui; outra cena não alcança o shot.

---

## SHOT-003 — Reordenação

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SHOT-002

### Critérios

- [x] a nova ordem é gravada numa transação e fica 1, 2, 3 na cena;
- [x] a lista precisa conter todos os shots visíveis da cena, sem repetir;
- [x] shot excluído vai para o fim; leitor não reordena.

---

## SHOT-004 — UI integrada à Scene

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SHOT-002

Cada cena deve mostrar seus planos sem exigir navegação excessiva.

### Critérios

- [x] a lista de cenas mostra os shots de cada cena numa linha curta;
- [x] na cena, quem escreve cria, edita, sobe, desce e exclui shots sem sair da página;
- [x] enquadramento sugere os valores da spec e aceita texto livre;
- [x] leitor vê os shots na lista e não vê os botões.

---

# Fase 8 — Gravações

## SHOOT-001 — Modelo Shoot

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002

### Critérios

- [x] uma produção guarda várias sessões, listadas por data;
- [x] a sessão nasce planejada, com início obrigatório e fim depois do início;
- [x] data e hora chegam em ISO 8601 com fuso e ficam em UTC;
- [x] leitor só vê; outra produção ou workspace não alcança.

---

## SHOOT-002 — CRUD e agendamento

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SHOOT-001

### Critérios

- [x] a aba Gravação lista as sessões por data, no fuso do workspace;
- [x] quem escreve agenda, remarca, troca o status e exclui a sessão;
- [x] o horário digitado é lido no fuso do workspace e gravado em UTC;
- [x] leitor só vê.

---

## EQUIP-001 — Catálogo de equipamentos

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** WORKSPACE-001

### Critérios

- [x] o catálogo é do workspace, com nome, categoria da spec e notas;
- [x] item novo entra ativo; desativar tira de uso sem apagar;
- [x] leitor só vê; item de outro workspace não muda.

---

## EQUIP-002 — Equipamentos por Shoot

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** SHOOT-002, EQUIP-001

---

# Fase 9 — Checklists

## CHECK-001 — Templates de checklist

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** WORKSPACE-001

---

## CHECK-002 — Checklist padrão de gravação

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** CHECK-001

Seedar checklist recomendado pelo SPEC.

---

## CHECK-003 — Instanciar checklist em Shoot

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** CHECK-002, SHOOT-002

A alteração futura do template não deve retroativamente alterar checklist já instanciado.

---

## CHECK-004 — UI mobile de checklist

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** CHECK-003

---

# Fase 10 — Takes e Modo Gravação

## TAKE-001 — Modelo Take

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** SHOT-001

---

## TAKE-002 — Registrar take

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** TAKE-001

Número sequencial por Shot.

---

## TAKE-003 — Take preferido

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** TAKE-002

Permitir um ou mais Takes OK e destacar preferido.

---

## RECORD-001 — Layout do Modo Gravação

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** SCENE-002, SHOT-002, SHOOT-002

Mobile-first.

---

## RECORD-002 — Navegação entre cenas

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** RECORD-001

---

## RECORD-003 — Takes dentro do Modo Gravação

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** RECORD-002, TAKE-003

---

## RECORD-004 — Status de Scene durante gravação

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** RECORD-003

Suportar:

- RECORDED;
- NEEDS_RETAKE.

---

## RECORD-005 — Progresso da sessão

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** RECORD-004

Exemplo:

```text
7 / 11 cenas concluídas
```

---

# Fase 11 — Continuidade e Assets

## CONT-001 — Notas de continuidade

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** PROJECT-002

---

## ASSET-001 — Referências externas

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** PROJECT-002

Validar URLs.

---

# Fase 12 — Edição

## EDIT-001 — EditingInfo

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** PROJECT-002

---

## EDIT-002 — Tela de edição

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** EDIT-001, PROJECT-004

---

## VERSION-001 — EditVersion

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** EDIT-001

---

## VERSION-002 — Numeração sequencial

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** VERSION-001

Evitar duplicidade em criação concorrente.

---

## VERSION-003 — Histórico de versões

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** VERSION-002

---

# Fase 13 — Revisão

## REVIEW-001 — ReviewComment

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** VERSION-001

---

## REVIEW-002 — Parser de timestamp

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** REVIEW-001

No mínimo:

```text
MM:SS
```

Avaliar HH:MM:SS.

---

## REVIEW-003 — Resolver comentário

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** REVIEW-001

---

## REVIEW-004 — Tela de revisão

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** REVIEW-002, REVIEW-003, VERSION-003

---

# Fase 14 — Aprovação

## APPROVAL-001 — Modelo e service

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** VERSION-001

---

## APPROVAL-002 — Solicitar alterações

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** APPROVAL-001

Efeito:

```text
Approval = CHANGES_REQUESTED
VideoProject = EDITING
```

---

## APPROVAL-003 — Aprovar

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** APPROVAL-001

Efeito:

```text
Approval = APPROVED
VideoProject = APPROVED
```

---

## APPROVAL-004 — Permissões de aprovação

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** APPROVAL-003, PROJECT-004

Respeitar papéis de Workspace e/ou ProjectRole conforme implementação definida.

Qualquer decisão durável deve ser registrada em `DECISIONS.md`.

---

# Fase 15 — Publicação

## PUB-001 — Modelo Publication

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** PROJECT-002

---

## PUB-002 — CRUD de destinos

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** PUB-001

---

## PUB-003 — Agendamento manual

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** PUB-002

---

## PUB-004 — Marcar publicação realizada

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** PUB-002

Registrar:

- publishedAt;
- URL;
- status.

---

# Fase 16 — Calendário

## CAL-001 — Modelo de eventos derivados

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** SHOOT-002, PUB-003

Não necessariamente criar tabela CalendarEvent.

Pode derivar eventos de Shoot e Publication.

Registrar decisão se escolher persistência própria.

---

## CAL-002 — Visualização mensal

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** CAL-001

---

## CAL-003 — Visualização semanal

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** CAL-002

---

# Fase 17 — Templates de Produção

## TEMPLATE-001 — ProductionTemplate

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** SCENE-001, CHECK-001

---

## TEMPLATE-002 — Cenas no template

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** TEMPLATE-001

---

## TEMPLATE-003 — Checklist no template

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** TEMPLATE-001

---

## TEMPLATE-004 — Criar projeto por template

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** TEMPLATE-002, TEMPLATE-003, PROJECT-002

Operação deve duplicar estruturas, nunca compartilhar registros mutáveis.

---

# Fase 18 — Activity Log e Notificações

## ACTIVITY-001 — ActivityLog

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** WORKSPACE-001

---

## ACTIVITY-002 — Eventos essenciais

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** ACTIVITY-001

Cobrir:

- project created;
- status changed;
- version created;
- approval;
- changes requested;
- publication.

---

## NOTIFY-001 — Modelo Notification

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** WORKSPACE-001

---

## NOTIFY-002 — Inbox interna

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** NOTIFY-001

---

## NOTIFY-003 — Eventos essenciais

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** NOTIFY-002

---

# Fase 19 — Seed e Demo

## SEED-001 — Workspace e usuários demo

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** principais schemas concluídos

Criar:

- Supervisor;
- Dev 1;
- Dev 2;
- Dev 3.

---

## SEED-002 — Projeto demo completo

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** VERSION-001, REVIEW-001, PUB-001

Projeto:

```text
Conheça nosso novo Dashboard de Pedidos
```

Incluir:

- 5 cenas;
- múltiplos shots;
- duas câmeras;
- screen capture;
- checklist;
- participantes;
- três takes;
- V1;
- comentários;
- publicação pendente.

---

# Fase 20 — Hardening

## HARDEN-001 — Auditoria de autorização

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** todos os módulos P0

Revisar endpoint/action por endpoint/action.

---

## HARDEN-002 — Testes cross-workspace

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** HARDEN-001

---

## HARDEN-003 — Acessibilidade básica

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** UI principal pronta

---

## HARDEN-004 — Estados vazios e erros

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** UI principal pronta

---

## HARDEN-005 — Mobile QA

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** RECORD-005

Resoluções:

```text
375px
390px
430px
```

---

## HARDEN-006 — Performance básica

**Status:** TODO  
**Prioridade:** P1  
**Dependências:** aplicação funcional

Revisar:

- N+1;
- indexes;
- payloads;
- paginação;
- queries pesadas.

---

## HARDEN-007 — Build de produção

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** módulos P0 completos

- lint;
- typecheck;
- testes;
- build;
- migrations;
- env validation.

---

# Fase 21 — MVP Acceptance

## MVP-001 — Fluxo completo E2E

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** HARDEN-007

Executar:

```text
Idea
→ Project
→ Script
→ Scene
→ Shot
→ Shoot
→ Checklist
→ Recording
→ Take
→ Editing
→ Version
→ Review
→ Approval
→ Publication
```

---

## MVP-002 — Revisão contra SPEC

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** MVP-001

Revisar cada requisito P0 do SPEC.

---

## MVP-003 — Limpeza final

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** MVP-002

Remover:

- mocks esquecidos;
- logs;
- código morto;
- TODOs temporários;
- componentes não utilizados.

---

## MVP-004 — Release MVP

**Status:** TODO  
**Prioridade:** P0  
**Dependências:** MVP-003

Registrar release no `HISTORY.md`.

---

# Backlog pós-MVP

Não implementar sem decisão explícita.

## FUTURE-001 — Upload de arquivos
## FUTURE-002 — Preview de vídeo
## FUTURE-003 — Comentário sincronizado ao player
## FUTURE-004 — Google Calendar
## FUTURE-005 — Google Drive
## FUTURE-006 — OneDrive
## FUTURE-007 — Realtime
## FUTURE-008 — Menções
## FUTURE-009 — E-mail
## FUTURE-010 — Fotos de continuidade
## FUTURE-011 — Teleprompter
## FUTURE-012 — IA para roteiro
## FUTURE-013 — IA para shot list
## FUTURE-014 — Publicação automática
## FUTURE-015 — Analytics social
## FUTURE-016 — SaaS billing

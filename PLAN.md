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

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** SHOOT-002, EQUIP-001

### Critérios

- [x] cada gravação lista os equipamentos planejados, com obrigatório, conferido e notas;
- [x] só entra item ativo do catálogo do mesmo workspace, uma vez por gravação;
- [x] quem escreve confere, desmarca e tira; tirar não apaga o item do catálogo;
- [x] leitor só vê; outra gravação não alcança a linha.

---

# Fase 9 — Checklists

## CHECK-001 — Templates de checklist

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** WORKSPACE-001

### Critérios

- [x] o workspace guarda modelos de checklist com nome, tipo e itens em ordem;
- [x] dono e admin criam, renomeiam, excluem, adicionam, editam, reordenam e tiram itens;
- [x] a ordem fica 1, 2, 3 depois de reordenar ou tirar item;
- [x] membro e leitor só veem; outro workspace não acha o modelo.

---

## CHECK-002 — Checklist padrão de gravação

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** CHECK-001

Seedar checklist recomendado pelo SPEC.

### Critérios

- [x] o checklist recomendado da spec vira um modelo "Checklist de gravação" com os 22 itens na ordem;
- [x] criar de novo devolve o mesmo modelo, sem duplicar;
- [x] a oferta aparece para dono e admin enquanto o workspace não tem checklist de gravação.

---

## CHECK-003 — Instanciar checklist em Shoot

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** CHECK-002, SHOOT-002

A alteração futura do template não deve retroativamente alterar checklist já instanciado.

### Critérios

- [x] a gravação recebe uma cópia dos itens do modelo, no fim da lista dela;
- [x] mudar ou apagar o modelo depois não altera a cópia;
- [x] só entra modelo do mesmo workspace;
- [x] marcar grava quem e quando pela sessão e pelo servidor; desmarcar limpa os dois;
- [x] leitor só vê; outra gravação não alcança o item.

---

## CHECK-004 — UI mobile de checklist

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** CHECK-003

### Critérios

- [x] a tela do checklist da gravação abre pela aba Gravação e cabe em 375, 390 e 430px;
- [x] a linha inteira é o alvo do toque (56px), sem depender de hover;
- [x] a marca aparece na hora, com barra e contagem de feitos, e volta com aviso se o servidor recusar;
- [x] leitor vê a lista sem marcar.

---

# Fase 10 — Takes e Modo Gravação

## TAKE-001 — Modelo Take

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SHOT-001

### Critérios

- [x] o take pertence a um shot, com número, status, notas, preferido, quem gravou e quando;
- [x] o número é único por shot no banco;
- [x] a leitura passa por workspace, produção, cena e shot; outro shot não alcança o take.

---

## TAKE-002 — Registrar take

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** TAKE-001

Número sequencial por Shot.

### Critérios

- [x] o número do take é sequencial por shot e vem do servidor, mesmo em registros simultâneos;
- [x] quem gravou e quando vêm da sessão e do servidor;
- [x] editar troca status e notas sem mudar o número; take fora de OK deixa de ser preferido;
- [x] na cena, cada shot mostra os takes e registra OK ou refazer com um toque;
- [x] leitor não registra; outro shot não alcança o take.

---

## TAKE-003 — Take preferido

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** TAKE-002

Permitir um ou mais Takes OK e destacar preferido.

### Critérios

- [x] vários takes podem ficar OK no mesmo shot;
- [x] só um take OK é o preferido do shot; marcar outro troca na mesma transação;
- [x] take que deixa de ser OK perde o preferido;
- [x] na cena, o preferido aparece em destaque e tem botão para marcar e tirar;
- [x] leitor não marca; outro shot não alcança o take.

---

## RECORD-001 — Layout do Modo Gravação

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** SCENE-002, SHOT-002, SHOOT-002

Mobile-first.

### Critérios

- [x] a tela cheia abre por sessão de gravação, fora do menu, e cabe em 375, 390 e 430px;
- [x] mostra Cena X de N, quem fala, fala, ação, shots, câmera, edição e continuidade;
- [x] cena descartada não entra na contagem; produção sem cena mostra aviso;
- [x] leitura passa por workspace, produção e gravação.

---

## RECORD-002 — Navegação entre cenas

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** RECORD-001

### Critérios

- [x] Anterior e Próxima no rodapé fixo, com alvo de 48px e sem hover;
- [x] a cena fica na URL (?cena=N); valor inválido cai na primeira e excesso na última;
- [x] sem botão para além das pontas.

---

## RECORD-003 — Takes dentro do Modo Gravação

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** RECORD-002, TAKE-003

### Critérios

- [x] cada shot da cena mostra os takes e registra OK ou refazer com um toque, com observação opcional;
- [x] marcar e tirar preferido e descartar voltam para a mesma cena;
- [x] cena sem shot avisa que o take é por shot;
- [x] leitor vê os takes sem botões.

---

## RECORD-004 — Status de Scene durante gravação

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** RECORD-003

Suportar:

- RECORDED;
- NEEDS_RETAKE.

### Critérios

- [x] no Modo Gravação a cena vira Gravada ou Precisa refazer, trocando só o status;
- [x] cena concluída avança sozinha para a próxima; refazer fica na cena; recusa não avança;
- [x] outros status seguem na edição da cena; leitor não marca; outro workspace não alcança a cena.

---

## RECORD-005 — Progresso da sessão

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** RECORD-004

Exemplo:

```text
7 / 11 cenas concluídas
```

### Critérios

- [x] mostra X / N cenas concluídas e quantas estão para refazer, com barra;
- [x] descartada fica fora do total e refazer não conta como concluída.

---

# Fase 11 — Continuidade e Assets

## CONT-001 — Notas de continuidade

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** PROJECT-002

### Critérios

- [x] a produção tem página de continuidade, aberta pela aba Gravação;
- [x] nota com título, categoria opcional e descrição, agrupada por categoria;
- [x] membro cria, edita e exclui (com confirmação); leitor só vê;
- [x] outra produção ou outro workspace não alcança a nota.

---

## ASSET-001 — Referências externas

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** PROJECT-002

Validar URLs.

### Critérios

- [x] a produção guarda links externos com tipo da spec, título e descrição;
- [x] link só http(s), sem usuário e senha embutidos; javascript:, data: e file: são recusados;
- [x] membro cria, edita e exclui (com confirmação); leitor só vê;
- [x] outra produção ou outro workspace não alcança o link.

---

# Fase 12 — Edição

## EDIT-001 — EditingInfo

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002

### Critérios

- [x] um registro de edição por produção, com os campos da spec;
- [x] editor precisa ser do workspace; link do projeto só http(s); fps até 240 com três casas;
- [x] leitor lê; dono, admin e membro salvam; outra produção ou workspace não alcança.

---

## EDIT-002 — Tela de edição

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** EDIT-001, PROJECT-004

### Critérios

- [x] a aba Edição abre o formulário com editor, software, link do projeto, formato, legenda, música e notas;
- [x] editor da produção (participante EDITOR) aparece primeiro;
- [x] salvar mostra Salvo; erro de campo aparece sem perder o que foi digitado;
- [x] leitor vê os dados sem formulário.

---

## VERSION-001 — EditVersion

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** EDIT-001

### Critérios

- [x] versão da produção com número, título, preview, arquivo, notas e autor;
- [x] número vem do servidor e é único por produção; cliente não escolhe;
- [x] pelo menos um link, só http(s);
- [x] leitor lê; dono, admin e membro criam; outra produção ou workspace não alcança.

---

## VERSION-002 — Numeração sequencial

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** VERSION-001

Evitar duplicidade em criação concorrente.

### Critérios

- [x] o número sai de um contador na produção, incrementado na transação da criação;
- [x] envios simultâneos esperam a trava da linha e recebem números seguidos;
- [x] produção que já tinha versões continua do maior número (backfill);
- [x] teste simultâneo roda com PG_CONCURRENCY=1 em Postgres real.

---

## VERSION-003 — Histórico de versões

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** VERSION-002

### Critérios

- [x] a aba Edição lista as versões da mais nova para a mais antiga, com título, data no fuso do workspace, autor, notas e links;
- [x] dono, admin e membro enviam a próxima versão; leitor só vê;
- [x] versão enviada não se edita nem se apaga.

---

# Fase 13 — Revisão

## REVIEW-001 — ReviewComment

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** VERSION-001

### Critérios

- [x] comentário pertence à versão, com autor, tempo em segundos, texto e estado resolvido;
- [x] lista por tempo, comentários gerais no fim;
- [x] dono, admin e membro comentam; leitor só lê (ADR-032);
- [x] versão de outra produção ou workspace não é alcançada.

---

## REVIEW-002 — Parser de timestamp

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** REVIEW-001

No mínimo:

```text
MM:SS
```

Avaliar HH:MM:SS.

### Critérios

- [x] aceita MM:SS, H:MM:SS e segundos soltos e guarda segundos;
- [x] segundos acima de 59, formato torto e tempo acima de 23:59:59 são recusados com mensagem;
- [x] exibe MM:SS até uma hora e H:MM:SS depois.

---

## REVIEW-003 — Resolver comentário

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** REVIEW-001

### Critérios

- [x] resolver guarda quem e quando; reabrir limpa os dois;
- [x] dono, admin e membro resolvem; leitor não;
- [x] comentário só é alcançado pela própria versão, na produção do workspace.

---

## REVIEW-004 — Tela de revisão

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** REVIEW-002, REVIEW-003, VERSION-003

### Critérios

- [x] a aba Revisão mostra a versão atual ou escolhida, link do vídeo, comentários abertos e resolvidos, autor, tempo e histórico;
- [x] comentar com tempo MM:SS e resolver/reabrir sem sair da tela;
- [x] leitor vê sem formulário nem botões.

---

# Fase 14 — Aprovação

## APPROVAL-001 — Modelo e service

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** VERSION-001

### Critérios

- [x] aprovação pertence à versão e à produção, com status, quem pediu, quem decidiu, notas e datas;
- [x] um pedido aberto por produção; repetir para a mesma versão devolve o existente;
- [x] dono, admin e membro pedem; leitor vê; outra produção ou workspace não alcança;
- [x] aba Revisão mostra o estado e o botão de pedir.

---

## APPROVAL-002 — Solicitar alterações

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** APPROVAL-001

Efeito:

```text
Approval = CHANGES_REQUESTED
VideoProject = EDITING
```

### Critérios

- [x] pedido pendente vira CHANGES_REQUESTED e a produção vira EDITING na mesma transação;
- [x] notas obrigatórias; quem e quando vêm da sessão e do servidor;
- [x] pedido já decidido não se decide de novo; membro e leitor não decidem.

---

## APPROVAL-003 — Aprovar

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** APPROVAL-001

Efeito:

```text
Approval = APPROVED
VideoProject = APPROVED
```

### Critérios

- [x] pedido pendente vira APPROVED e a produção APPROVED na mesma transação;
- [x] nota opcional; quem e quando vêm da sessão e do servidor;
- [x] pedido decidido não se decide de novo; membro e leitor não aprovam.

---

## APPROVAL-004 — Permissões de aprovação

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** APPROVAL-003, PROJECT-004

Respeitar papéis de Workspace e/ou ProjectRole conforme implementação definida.

Qualquer decisão durável deve ser registrada em `DECISIONS.md`.

### Critérios

- [x] dono e admin decidem em qualquer produção; membro só como APPROVER da produção; leitor nunca;
- [x] a tela mostra os botões pela mesma regra do serviço;
- [x] decisão durável em ADR-033.

---

# Fase 15 — Publicação

## PUB-001 — Modelo Publication

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PROJECT-002

### Critérios

- [x] publicação com plataforma, status, agendamento, publicação, link, legenda e notas, presa à produção;
- [x] status nasce PENDING; plataformas e status da spec;
- [x] leitura pela produção visível no workspace; outra produção não alcança.

---

## PUB-002 — CRUD de destinos

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PUB-001

### Critérios

- [x] a aba Publicação cria, edita e exclui destinos com plataforma, legenda e notas;
- [x] status, horário e link não mudam por aqui;
- [x] membro escreve; leitor só vê; outra produção ou workspace não alcança.

---

## PUB-003 — Agendamento manual

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PUB-002

### Critérios

- [x] agendar guarda o instante em UTC e marca SCHEDULED; vazio volta para PENDING;
- [x] o formulário usa o fuso do workspace; horário sem fuso é recusado no serviço;
- [x] publicação já feita não se reagenda; leitor não agenda.

---

## PUB-004 — Marcar publicação realizada

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** PUB-002

Registrar:

- publishedAt;
- URL;
- status.

### Critérios

- [x] publicada guarda data (informada ou agora) e link validado;
- [x] falhou e cancelada limpam data e link;
- [x] horário do formulário no fuso do workspace; leitor não registra.

---

# Fase 16 — Calendário

## CAL-001 — Modelo de eventos derivados

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** SHOOT-002, PUB-003

Não necessariamente criar tabela CalendarEvent.

Pode derivar eventos de Shoot e Publication.

Registrar decisão se escolher persistência própria.

### Critérios

- [x] eventos derivados de Shoot, data planejada da produção e Publication, sem tabela nova;
- [x] data planejada é dia inteiro e respeita os dias do fuso do workspace;
- [x] só o workspace aberto; intervalo inválido ou maior que 45 dias é recusado.

---

## CAL-002 — Visualização mensal

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** CAL-001

### Critérios

- [x] mês com gravações, publicações planejadas e agendadas/feitas, no fuso do workspace;
- [x] anterior, hoje e próximo pela URL; mês inválido cai no atual;
- [x] grade a partir de md e lista por dia no celular, sem hover.

---

## CAL-003 — Visualização semanal

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** CAL-002

### Critérios

- [x] semana de domingo a sábado pela URL, com os mesmos eventos do mês;
- [x] anterior, hoje e próximo andam sete dias; troca entre mês e semana mantém o período;
- [x] no celular vira lista por dia.

---

# Fase 17 — Templates de Produção

## TEMPLATE-001 — ProductionTemplate

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** SCENE-001, CHECK-001

### Critérios

- [x] template de produção do workspace com nome, descrição e autor;
- [x] dono e admin criam, editam e excluem; membro e leitor só leem;
- [x] outro workspace não alcança; excluir não afeta produções já criadas.

---

## TEMPLATE-002 — Cenas no template

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** TEMPLATE-001

### Critérios

- [x] template guarda cenas-modelo em ordem com título, tipo e orientação;
- [x] adicionar, subir, descer e remover em transação, sem ordem repetida;
- [x] dono e admin mudam; membro e leitor veem; outro workspace não alcança.

---

## TEMPLATE-003 — Checklist no template

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** TEMPLATE-001

### Critérios

- [x] template aponta um checklist de gravação do mesmo workspace ou nenhum;
- [x] excluir o checklist tira a referência sem apagar o template;
- [x] dono e admin escolhem; os outros veem.

---

## TEMPLATE-004 — Criar projeto por template

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** TEMPLATE-002, TEMPLATE-003, PROJECT-002

Operação deve duplicar estruturas, nunca compartilhar registros mutáveis.

### Critérios

- [x] nova produção pode começar de um template do workspace;
- [x] cenas e itens do checklist são copiados numa transação; nada fica ligado ao template;
- [x] template de outro workspace não cria produção.

---

## TEMPLATE-005 — Usar checklist da produção na gravação

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** TEMPLATE-004, CHECK-003

Na aba Gravação, oferecer "Checklist da produção" como origem ao montar o checklist de uma gravação, copiando `ProjectChecklistItem` para `ShootChecklistItem` (mesma regra da CHECK-003).

### Critérios

- [x] a aba Gravação oferece o checklist da produção como origem, em primeiro;
- [x] copia os itens para a gravação na mesma transação e regra da CHECK-003;
- [x] produção sem checklist copiado dá erro de campo em vez de copiar nada.

---

# Fase 18 — Activity Log e Notificações

## ACTIVITY-001 — ActivityLog

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** WORKSPACE-001

### Critérios

- [x] atividade com workspace, produção, usuário, ação da lista fechada, entidade e metadata;
- [x] aba Atividade lista a da produção, mais nova primeiro, no fuso do workspace;
- [x] falha ao registrar não desfaz a operação; outro workspace não alcança.

---

## ACTIVITY-002 — Eventos essenciais

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** ACTIVITY-001

Cobrir:

- project created;
- status changed;
- version created;
- approval;
- changes requested;
- publication.

### Critérios

- [x] produção criada, etapa mudada, versão criada, aprovação, alterações solicitadas e publicação viram atividade;
- [x] registro depois da operação dar certo, sem desfazê-la se falhar;
- [x] a aba Atividade mostra as frases com versão, etapa e plataforma.

---

## NOTIFY-001 — Modelo Notification

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** WORKSPACE-001

### Critérios

- [x] aviso por pessoa com tipo da lista fechada, produção, autor e lido;
- [x] autor não recebe o próprio aviso; só membros do workspace recebem;
- [x] cada pessoa lista, conta e marca só os próprios avisos.

---

## NOTIFY-002 — Inbox interna

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** NOTIFY-001

### Critérios

- [x] menu mostra Avisos com contador de não lidos;
- [x] a página lista os avisos da pessoa, destaca não lidos, abre a produção e marca como lido;
- [x] marcar todos zera o contador; ninguém mexe no aviso de outra pessoa.

---

## NOTIFY-003 — Eventos essenciais

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** NOTIFY-002

### Critérios

- [x] adicionar participante, nova versão, comentário, alterações solicitadas e aprovação geram aviso;
- [x] recebem responsável e participantes (e quem pediu ou enviou, quando cabe), nunca o autor;
- [x] gravação próxima fica para quando houver rotina agendada.

---

# Fase 19 — Seed e Demo

## SEED-001 — Workspace e usuários demo

**Status:** DONE  
**Prioridade:** P1  
**Dependências:** principais schemas concluídos

Criar:

- Supervisor;
- Dev 1;
- Dev 2;
- Dev 3.

### Critérios

- [x] npm run db:seed cria Acme Software com Supervisor (dono) e Dev 1, 2 e 3 (membros);
- [x] inclui o checklist recomendado de gravação;
- [x] rodar de novo não duplica pessoas, workspace, membros nem checklist.

---

## SEED-002 — Projeto demo completo

**Status:** DONE  
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

### Critérios

- [x] produção demo com 5 cenas, shots em duas câmeras e tela, checklist, 2 participantes, 3 takes, V1, comentários e publicação pendente;
- [x] rodar o seed de novo não duplica a produção.

---

# Fase 20 — Hardening

## HARDEN-001 — Auditoria de autorização

**Status:** DONE  
**Prioridade:** P0  
**Dependências:** todos os módulos P0

Revisar endpoint/action por endpoint/action.

---

## HARDEN-002 — Testes cross-workspace

**Status:** DONE  
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

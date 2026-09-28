# Video Production Manager — Development Harness

Este diretório contém o harness de desenvolvimento e, desde o BOOT-001, o código da aplicação.

```bash
npm install
npm run dev
```

A ideia é que qualquer agente — Codex, Claude Code ou outro assistente — consiga entrar no repositório, entender o produto, descobrir o estado atual da implementação e executar uma tarefa sem depender do histórico de conversas externas.

## Ordem de leitura

Antes de alterar código:

1. `AGENTS.md`
2. `STATUS.md`
3. `SPEC.md`
4. `PLAN.md`
5. `DECISIONS.md`
6. `HISTORY.md` somente quando contexto histórico for necessário
7. `TESTING.md` antes de alterar ou criar testes

## Fonte de verdade

- Produto e requisitos: `SPEC.md`
- Regras para agentes: `AGENTS.md`
- Trabalho planejado: `PLAN.md`
- Estado atual: `STATUS.md`
- Decisões arquiteturais: `DECISIONS.md`
- Implementações realizadas: `HISTORY.md`
- Estratégia de testes: `TESTING.md`

Quando houver conflito:

1. decisões explícitas mais recentes em `DECISIONS.md`;
2. `SPEC.md`;
3. `AGENTS.md`;
4. `PLAN.md`;
5. documentação auxiliar.

Se uma decisão mudar um requisito funcional do produto, atualizar também `SPEC.md`.

## Regra principal

Nunca implementar uma grande quantidade de tarefas do `PLAN.md` em silêncio.

A unidade preferencial de trabalho é **uma tarefa por vez**, incluindo:

- implementação;
- testes;
- validação;
- atualização do `PLAN.md`;
- atualização do `STATUS.md`;
- entrada no `HISTORY.md`;
- decisão em `DECISIONS.md`, quando aplicável.

## Estrutura

```text
.
├── AGENTS.md
├── CLAUDE.md
├── SPEC.md
├── PLAN.md
├── STATUS.md
├── HISTORY.md
├── DECISIONS.md
├── TESTING.md
├── TASK_TEMPLATE.md
└── README.md
```

## Fluxo recomendado

```text
Escolher próxima tarefa READY
↓
Ler requisitos relacionados
↓
Inspecionar código existente
↓
Planejar alteração mínima
↓
Implementar
↓
Testar
↓
Revisar diff
↓
Atualizar documentação do harness
↓
Marcar tarefa DONE
```

## Status de tarefas

O `PLAN.md` usa:

- `TODO` — ainda não pronta para execução;
- `READY` — pode ser iniciada;
- `IN_PROGRESS` — tarefa atualmente em execução;
- `BLOCKED` — depende de decisão ou tarefa externa;
- `DONE` — implementada e validada;
- `CANCELED` — removida conscientemente do escopo.

Idealmente deve existir apenas uma tarefa `IN_PROGRESS` por agente/branch.

## Commits

Formato sugerido:

```text
feat(auth): implement Google login
fix(projects): enforce workspace isolation
test(shoots): cover recording-mode take flow
docs(harness): document architecture decision ADR-004
```

Commits pequenos e semanticamente coerentes são preferíveis.

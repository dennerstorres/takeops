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

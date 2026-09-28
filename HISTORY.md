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


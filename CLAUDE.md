# CLAUDE.md

As instruções principais deste repositório estão em:

```text
AGENTS.md
```

Leia `AGENTS.md` integralmente antes de alterar código.

Depois leia:

1. `STATUS.md`
2. seção relevante de `SPEC.md`
3. tarefa atual em `PLAN.md`
4. decisões relacionadas em `DECISIONS.md`

Não duplique regras deste arquivo em memória ou em arquivos adicionais.

## Regra de contexto

Evite carregar documentação inteira sem necessidade.

Use leitura progressiva:

```text
AGENTS.md
→ STATUS.md
→ tarefa atual do PLAN.md
→ seção relacionada do SPEC.md
→ código relacionado
→ HISTORY.md somente se necessário
```

Mantenha o contexto focado na tarefa atual.

Quando o contexto da sessão crescer demais, prefira:

1. concluir uma unidade coerente;
2. atualizar `STATUS.md`, `PLAN.md` e `HISTORY.md`;
3. iniciar nova sessão a partir desses arquivos.

O repositório deve conter contexto suficiente para retomada sem depender da conversa anterior.

# TESTING.md

## Objetivo

Testar comportamento de negócio e segurança sem criar uma suíte excessivamente acoplada à implementação.

---

# 1. Pirâmide

## Unit

Usar para:

- parsers;
- validações;
- funções puras;
- transições de status;
- regras de permissão;
- cálculo de ordenação;
- parsing de timestamp.

## Integration

Usar para:

- services;
- banco;
- autorização;
- isolamento de Workspace;
- criação e alteração de entidades;
- efeitos colaterais.

Rodam quando `DATABASE_URL` começa com `postgres`; sem isso ficam "sem Postgres". O `prisma dev` local (PGlite) serializa conexões e quebra com queries parametrizadas em paralelo fora de transação: teste de concorrência só vale no CI.

## CI

`.github/workflows/ci.yml` (OSS-007), em push na `main` e em pull request:

- `verify`: Postgres 17 real como serviço, `prisma migrate deploy`, lint, contraste, typecheck, `npm test` e build;
- `docker`: build da imagem pelo `Dockerfile`, sem publicar.

## E2E

Usar somente em fluxos críticos.

---

# 2. Fluxo E2E principal

```text
Login
↓
Criar ideia
↓
Converter em projeto
↓
Criar cenas
↓
Criar shots
↓
Criar gravação
↓
Completar checklist
↓
Registrar takes
↓
Adicionar V1
↓
Criar comentários
↓
Adicionar V2
↓
Aprovar
↓
Registrar publicação
```

---

# 3. Casos de segurança obrigatórios

Cada módulo multi-tenant relevante deve possuir pelo menos um teste garantindo:

```text
usuário do Workspace A
não consegue
ler/alterar/excluir entidade do Workspace B
```

Cobrir especialmente:

- projects;
- scenes;
- shots;
- shoots;
- takes;
- edit versions;
- approvals;
- publications;
- workspace members.

---

# 4. Permissões

Testar:

## OWNER

Acesso completo ao Workspace.

## ADMIN

Gerencia conteúdo e membros conforme SPEC.

## MEMBER

Colabora, sem poderes administrativos críticos.

## VIEWER

Não altera conteúdo operacional.

---

# 5. Status

Testar efeitos importantes.

Exemplo:

```text
Approval = APPROVED
→ VideoProject = APPROVED
```

```text
Approval = CHANGES_REQUESTED
→ VideoProject = EDITING
```

---

# 6. Timestamp de revisão

Casos:

```text
00:18 → 18
01:04 → 64
1:02:03 → 3723, se formato suportado
```

Inválidos devem retornar erro compreensível.

---

# 7. Reordenação

Testar:

- mover primeiro para último;
- último para primeiro;
- meio para meio;
- lista com um item;
- transação falhando;
- ausência de ordens duplicadas após operação.

---

# 8. Datas

Testar:

- persistência UTC;
- conversão para timezone do Workspace;
- mudança de dia causada por timezone;
- horário de verão quando aplicável ao timezone escolhido.

---

# 9. Mobile

Para `Recording Mode`, usar E2E ou testes visuais mínimos em:

```text
375x812
390x844
430x932
```

Verificar:

- sem scroll horizontal;
- botões utilizáveis;
- texto não cortado;
- navegação próxima/anterior;
- registro de take.

---

# 10. Comandos

Ajustar quando stack de testes for definida.

Esperado:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

---

# 11. Regra

Nunca remover teste válido somente para fazer uma alteração passar.

Se o comportamento esperado mudou de forma legítima:

1. atualizar requisito/decisão;
2. alterar implementação;
3. atualizar teste;
4. registrar no `HISTORY.md`.

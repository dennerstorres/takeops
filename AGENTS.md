# AGENTS.md

## 1. Missão

Você está trabalhando no **Video Production Manager**, uma aplicação colaborativa para organizar a produção de vídeos desde a ideia até publicação.

Seu objetivo não é somente produzir código que "funcione".

Cada alteração deve:

1. respeitar o domínio descrito em `SPEC.md`;
2. preservar isolamento por Workspace;
3. manter arquitetura compreensível;
4. evitar expansão desnecessária de escopo;
5. possuir validação adequada;
6. deixar o harness atualizado para o próximo agente.

---

# 2. Leitura obrigatória

Antes de modificar código, leia nesta ordem:

1. `STATUS.md`
2. seção relacionada de `SPEC.md`
3. tarefa atual no `PLAN.md`
4. entradas relevantes em `DECISIONS.md`
5. código existente da área afetada
6. `TESTING.md` se houver alteração testável

Não leia `HISTORY.md` inteiro por padrão.

Use-o apenas para recuperar contexto de implementações anteriores.

---

# 3. Fonte de verdade

## Requisitos

`SPEC.md`

## Planejamento

`PLAN.md`

## Estado atual

`STATUS.md`

## Decisões arquiteturais

`DECISIONS.md`

## Histórico

`HISTORY.md`

Nunca use uma conversa externa como única fonte de uma decisão importante.

Se uma informação for necessária para futuras implementações, registre no repositório.

---

# 4. Regra de escopo

Implemente somente:

- a tarefa solicitada;
- correções diretamente necessárias para concluí-la;
- pequenos refactors indispensáveis à segurança/correção.

Não aproveite uma tarefa para:

- reescrever módulos inteiros;
- trocar biblioteca;
- modificar arquitetura;
- adicionar features futuras;
- "melhorar" telas não relacionadas;
- antecipar V2/V3.

Se encontrar algo importante fora do escopo:

1. não implemente automaticamente;
2. registre como nova tarefa em `PLAN.md` se realmente necessário;
3. marque dependência quando aplicável.

---

# 5. Fluxo obrigatório por tarefa

Antes de começar:

1. localizar a tarefa no `PLAN.md`;
2. confirmar dependências;
3. mudar `READY` → `IN_PROGRESS`;
4. atualizar `STATUS.md`.

Durante:

5. analisar implementação existente;
6. implementar a menor solução correta;
7. adicionar/ajustar testes;
8. executar verificações relevantes.

Depois:

9. revisar o diff;
10. confirmar critérios de aceite;
11. mudar `IN_PROGRESS` → `DONE`;
12. adicionar entrada em `HISTORY.md`;
13. atualizar `STATUS.md`;
14. registrar decisão em `DECISIONS.md` se houver decisão durável;
15. criar um commit só com essa tarefa. Não misturar outra tarefa no mesmo commit.

Se não conseguir terminar:

- não marque `DONE`;
- use `BLOCKED` ou mantenha `IN_PROGRESS`;
- explique claramente o motivo em `STATUS.md`;
- registre detalhes úteis em `HISTORY.md`.

---

# 6. Definition of Done de uma tarefa

Uma tarefa só pode ser considerada `DONE` quando:

- [ ] comportamento solicitado foi implementado;
- [ ] critérios de aceite foram atendidos;
- [ ] autorização foi revisada;
- [ ] estados de erro relevantes foram tratados;
- [ ] testes necessários foram adicionados ou atualizados;
- [ ] testes relevantes passam;
- [ ] lint passa;
- [ ] typecheck passa;
- [ ] build passa quando aplicável;
- [ ] não existem `TODO` temporários silenciosos;
- [ ] `PLAN.md` foi atualizado;
- [ ] `STATUS.md` foi atualizado;
- [ ] `HISTORY.md` recebeu uma entrada;
- [ ] decisões duráveis foram documentadas;
- [ ] commit da tarefa foi criado, sem incluir outra tarefa.

---

# 7. Segurança e multi-tenancy

O isolamento por Workspace é uma regra estrutural.

Nunca confiar apenas em IDs fornecidos pelo cliente.

Para toda operação com entidade pertencente a Workspace:

```text
session user
↓
membership
↓
workspace autorizado
↓
consulta filtrada por workspaceId
↓
regra de permissão
↓
operação
```

Uma consulta como:

```ts
findUnique({ where: { id } })
```

não é suficiente para uma entidade multi-tenant quando o `workspaceId` não for validado separadamente.

Preferir consultas equivalentes a:

```ts
findFirst({
  where: {
    id,
    workspaceId,
  },
})
```

ou abstração de repository/service que garanta o mesmo comportamento.

Proteções obrigatórias:

- autenticação;
- autorização server-side;
- prevenção de IDOR;
- validação de input;
- validação de URL;
- não exposição de secrets;
- não logar tokens OAuth.

---

# 8. Camadas

A UI não deve conter regras de negócio importantes.

Estrutura conceitual:

```text
UI
↓
Action / Route Handler
↓
Service
↓
Repository / ORM
↓
Database
```

Validações podem existir em múltiplas camadas quando necessário, mas a regra autoritativa deve estar no servidor.

---

# 9. Regras de domínio

Não quebrar estas decisões:

1. `Scene` e `Shot` são entidades distintas.
2. `Take` pertence a um `Shot`.
3. um vídeo pode ter múltiplas sessões `Shoot`.
4. mídia pesada não é armazenada no MVP.
5. `Asset` referencia mídia externa.
6. o sistema gerencia edição, mas não edita vídeo.
7. publicação é registrada, mas não executada.
8. todas as datas persistidas usam UTC.
9. API trafega ISO 8601.
10. exibição de datas usa timezone do Workspace.
11. o Modo Gravação deve ser mobile-first.
12. alterações importantes devem gerar Activity Log quando previsto.

---

# 10. Banco de dados

Preferências:

- PostgreSQL;
- Prisma;
- UUID ou CUID2;
- migrations versionadas;
- índices explícitos para queries frequentes;
- constraints sempre que possível.

Nunca alterar migration já aplicada em produção.

Crie uma nova migration.

Ao criar tabela multi-tenant, avaliar índice composto incluindo `workspaceId`.

Exemplos:

```text
(workspaceId, status)
(workspaceId, createdAt)
(videoProjectId, order)
(sceneId, order)
```

---

# 11. Ordem e reordenação

Entidades ordenáveis:

- Scene;
- Shot;
- ChecklistTemplateItem;
- ShootChecklistItem.

Reordenação deve:

- ocorrer em transação quando múltiplos registros forem atualizados;
- evitar ordens duplicadas;
- possuir estratégia determinística.

No MVP, integers sequenciais são aceitáveis.

---

# 12. Status e transições

Evitar strings soltas.

Use enums ou tipos explícitos.

Mudanças de status devem ser centralizadas em serviços quando possuírem efeitos colaterais.

Exemplo:

```text
Approval APPROVED
→ VideoProject APPROVED
→ ActivityLog
→ Notification
```

Não espalhar esse comportamento por componentes React.

---

# 13. Validação

Preferir schemas compartilhados.

Exemplo:

```text
Zod
```

Validar:

- IDs;
- enums;
- strings;
- tamanho de texto;
- URLs;
- timestamps;
- datas;
- arrays;
- campos obrigatórios.

Não confiar na validação do formulário.

---

# 14. Datas e timezone

Persistência:

```text
UTC
```

Transporte:

```text
ISO 8601
```

Apresentação:

```text
Workspace.timezone
```

Nunca assumir timezone do servidor.

---

# 15. Frontend

Prioridades:

1. clareza;
2. rapidez;
3. baixa fricção;
4. responsividade;
5. acessibilidade.

Não criar abstrações de UI prematuras.

Preferir componentes pequenos e previsíveis.

Para estado de servidor, usar o mecanismo escolhido pelo projeto de forma consistente.

Evitar duplicar dados server-side em stores globais sem necessidade.

---

# 16. Mobile

Toda alteração relacionada a:

- gravação;
- checklist;
- takes;
- roteiro durante gravação;

deve ser revisada nos breakpoints:

```text
375px
390px
430px
```

Nenhuma dessas telas pode depender de hover.

---

# 17. Autosave

Quando implementar autosave:

- debounce;
- indicador visual;
- tratamento de erro;
- não perder edição silenciosamente;
- evitar múltiplas requests concorrentes desnecessárias.

Estados mínimos:

```text
idle
saving
saved
error
```

---

# 18. Erros

Não apresentar erro técnico bruto ao usuário.

UI:

```text
Não foi possível salvar a cena.
Tente novamente.
```

Log:

```text
error
userId
workspaceId
entity
operation
stack
```

---

# 19. Activity Log

Registrar somente ações relevantes.

Não transformar Activity Log em log técnico.

Bons exemplos:

- projeto criado;
- status alterado;
- versão criada;
- aprovação realizada;
- alterações solicitadas;
- publicação registrada.

Maus exemplos:

- usuário abriu modal;
- usuário digitou letra;
- usuário expandiu acordeão.

---

# 20. Testes

Prioridade:

1. autorização;
2. isolamento de Workspace;
3. regras de domínio;
4. efeitos de status;
5. fluxos críticos.

Um teste que somente replica detalhes internos da implementação possui menor valor.

Consulte `TESTING.md`.

---

# 21. Alterações de schema

Ao alterar schema:

1. atualizar Prisma schema;
2. gerar migration;
3. revisar SQL;
4. atualizar seed se necessário;
5. atualizar tipos;
6. atualizar testes;
7. verificar rollback conceitual;
8. documentar no `HISTORY.md`.

---

# 22. Novas dependências

Antes de adicionar uma dependência:

1. confirmar que funcionalidade não existe na stack atual;
2. justificar utilidade;
3. avaliar manutenção;
4. evitar dependência grande para problema pequeno.

Mudanças importantes devem gerar ADR em `DECISIONS.md`.

---

# 23. Proibições

Não:

- adicionar `any` para silenciar erro sem justificativa;
- desabilitar ESLint globalmente;
- ignorar TypeScript;
- remover testes para fazer pipeline passar;
- usar dados mockados em produção;
- hardcodar IDs de Workspace;
- armazenar secrets no repositório;
- adicionar feature pós-MVP sem tarefa explícita;
- alterar regra de negócio sem atualizar documentação;
- marcar tarefa DONE com teste quebrado conhecido sem registrar bloqueio.

---

# 24. Comentários no código

Comentários devem explicar **por quê**, não repetir **o quê**.

Ruim:

```ts
// Incrementa i
i++;
```

Bom:

```ts
// O número do take é sequencial por Shot para manter referência
// simples durante a gravação, mesmo quando takes anteriores são descartados.
```

---

# 25. HISTORY.md

O histórico é append-only.

Nunca reescrever entradas antigas para parecer que uma decisão sempre existiu.

Corrija com nova entrada.

Formato:

```text
## YYYY-MM-DD — TASK-ID — título

Status:
Arquivos:
Resumo:
Decisões:
Testes:
Pendências:
Observações:
```

---

# 26. DECISIONS.md

Adicionar decisão quando houver escolha que:

- afete múltiplas features;
- tenha impacto futuro;
- seja difícil de reverter;
- possa causar dúvida para outro agente.

Não criar ADR para detalhes triviais.

---

# 27. STATUS.md

Deve permanecer curto.

É o arquivo de onboarding rápido do próximo agente.

Não transformar em histórico.

Deve responder:

- qual fase atual;
- qual tarefa está ativa;
- o que está pronto;
- o que está bloqueado;
- qual é a próxima tarefa.

---

# 28. Plano

Tarefas possuem IDs estáveis.

Nunca renumerar tarefas antigas.

Novas tarefas devem receber novos IDs.

Exemplo:

```text
AUTH-001
AUTH-002
PROJECT-001
RECORD-003
```

---

# 29. Quando encontrar ambiguidade

Primeiro:

1. procurar `SPEC.md`;
2. procurar `DECISIONS.md`;
3. procurar implementação existente;
4. procurar `HISTORY.md`.

Se ainda houver ambiguidade:

- escolha a interpretação mais simples que respeite o MVP;
- documente a hipótese no `HISTORY.md`;
- se a escolha for durável, registre em `DECISIONS.md`.

Não inventar requisitos sofisticados.

---

# 30. Finalização da sessão

Antes de encerrar qualquer sessão de implementação, produzir um resumo contendo:

```text
Tarefa:
Status:
Alterações:
Testes executados:
Pendências:
Próxima tarefa recomendada:
```

E garantir que os mesmos fatos importantes estejam persistidos no harness.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

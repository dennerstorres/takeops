# HANDOFF — 2026-09-30 (sessão 3)

Sessão encerrada antes do redesign, pela regra de contexto. Nada ficou pela metade; cada tarefa tem commit próprio.

## Feito nesta sessão

HARDEN-006, 008, 009; OSS-003, 004, 006, 007; MVP-001, 002, 003; TEAM-004; WORKSPACE-003; PUB-005; REVIEW-005; UI-009; DEPLOY-003. ADR-043, 044, 045. Detalhes em `HISTORY.md`.

## Estado atual

- Produção no ar (`/api/health` ok) e CI verde (lint, typecheck, testes com Postgres real, build, imagem Docker).
- `npm test`: 164 passam. Localmente, `tsc` só acusa `LayoutProps` e o build não roda (SWC nativo falha neste Windows); o CI cobre os dois.
- Banco local: `npx prisma dev start takeops`; URL `postgres://postgres:postgres@localhost:51214/template1?sslmode=disable` (migrado em `template1`, então `migrate dev` falha no shadow; usar `migrate diff --from-config-datasource --to-schema` para gerar SQL).
- Release (MVP-004) **adiado** pelo dono até o redesign.

## Decisão em andamento: redesign

- Dono achou a UI genérica e pediu redesign total, mais condensado.
- `PRODUCT.md` criado (verdade do produto para o método impeccable).
- Rodada de direções feita; escolhido **Quadro de tiras** (ADR-045: thesis, own-world, first viewport e os três raises). Build code-led (sem geração de imagem nesta máquina).
- Plano: UI-010 (tokens, shell, componente `Strip`) → UI-011 produções → UI-012 dashboard → UI-013 produção/cenas → UI-014 Modo Gravação e demais telas → UI-015 revisão final e DESIGN.md novo.

## Atualização (sessão 4)

Redesign completo (UI-010 a UI-015, ver HISTORY.md), revisão final com veredito `ship` e DESIGN.md novo. Próxima: MVP-004 (release), depois das pendências do dono abaixo. Contrato de direção está no `src/app/layout.tsx`.

## Próximos passos exatos

1. Nova sessão: ler `AGENTS.md`, `STATUS.md`, `PRODUCT.md`, ADR-045.
2. Invocar a skill `impeccable` para a UI-010, retomando da seção 5 de `reference/new-work.md` (contrato de direção no layout raiz) e carregando `reference/craft-floor.md` antes de editar.
3. Uma tarefa UI por commit; ao fim da UI-015, finish reviewer e documenter do impeccable.

## Pendências do dono

- `CRON_SECRET` e Scheduled Task no Coolify (o aviso de gravação próxima não roda sem isso).
- Destino S3 para o backup do banco.
- Antes do release: ligar *Private vulnerability reporting* e deixar um contato público no perfil do GitHub.

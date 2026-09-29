# HANDOFF — 2026-09-29 (sessão 2)

Sessão encerrada por limite de contexto, antes de começar a OSS-008. Nada ficou pela metade; cada tarefa tem commit próprio e está no GitHub.

## Feito nesta sessão

HARDEN-001..005, HARDEN-007, DASH-001, OSS-001, OSS-002, OSS-005, DEPLOY-001, DEPLOY-002. Planejamento das fases 21–24 (UI/PanelUI, self-hosted, Coolify, i18n). ADR-035..041. Detalhes: `HISTORY.md`.

## Estado atual

- Produção no ar: `https://takeops.dennerstorres.dev` (Coolify, Dockerfile, deploy automático a cada push na `main`). Login por Google e por link de e-mail funcionando.
- Postgres `takeops-db` no Coolify com backup diário local (sem S3).
- Repositório `dennerstorres/takeops` ainda **privado**; histórico já sem e-mail pessoal; `LICENSE` AGPL-3.0.
- `npm test`: tudo passa exceto `take.integration.test.ts` (PGlite, ADR-031) — vai rodar em Postgres real na OSS-007 (CI).
- Git limpo em `main`, sincronizado com `origin`.

## Atualização

OSS-008 concluída em sessão seguinte (ver `HISTORY.md`). Próxima: UI-001.

## Próxima tarefa (original)

`OSS-008 — Idiomas pt-BR e en` (ADR-041): `next-intl`, catálogos em `messages/`, idioma por usuário → `Accept-Language` → `en`, erros de serviço por código, `*-labels.ts` pelo catálogo, teste de chaves faltando. Critério: shell + uma tela completa nos dois idiomas; o resto migra nas UI-002..007.

Ordem depois: UI-001..008 (PanelUI só referência visual, ADR-038) → OSS-003/004/006/007 → HARDEN-006/008/009 → MVP-001..004.

## Pendências do dono

- Trocar `AUTH_SECRET` no Coolify (o valor apareceu na leitura de tela do agente) e redeployar.
- Configurar destino S3 para o backup do banco.
- Abrir o Modo Gravação num celular real.

## Ambiente local

- Sem Bash funcional nesta máquina: usar PowerShell. Para escrever arquivos com acento, usar a ferramenta Write + `python` (PowerShell 5.1 corrompe UTF-8).
- Banco local: `npx prisma dev -n takeops -d`; URL direta `postgres://postgres:postgres@localhost:51214/template1?sslmode=disable` (defina `DATABASE_URL` no terminal; o `.env` do dono tem os segredos e não deve ser lido).
- `npm run verify` = lint + typecheck + test + build.
- Migrations: `migrate dev --create-only`, renomear para o próximo carimbo, `migrate deploy`. Não rodar `prisma format`.
- Rodar `prettier --write` só nos arquivos da tarefa (vários arquivos antigos acusariam diferença de fim de linha).
- Chrome via MCP `chrome-mcp-stdio` (o `claude-in-chrome` não conecta). Coolify em `https://coolify.dennerstorres.dev`.

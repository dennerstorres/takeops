# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipes pequenas internas (software house, marketing interno), de 3 a 8 pessoas, que produzem vídeos curtos (Reels, TikTok, YouTube Shorts). Todo mundo acumula função: quem escreve o roteiro também opera câmera, quem edita também revisa. Papéis no workspace: dono, admin, membro e leitor.

## Product Purpose

Organizar a produção de vídeo da ideia à publicação num lugar só, para que decisões não fiquem perdidas em conversa. Sucesso (SPEC §83, §88): a equipe faz o ciclo inteiro sem outra ferramenta de gestão, e qualquer pessoa descobre rápido o que está sendo produzido, quando grava, quem participa, o que já foi gravado, qual é a versão atual e se está aprovado.

## Positioning

Tudo num lugar só: ideias, roteiro, cenas e planos, gravação, takes, edição, versões, revisão, aprovação e publicação no mesmo fluxo, em vez de espalhados entre quadro de tarefas, documento, planilha e chat. O detalhe audiovisual (cena → plano → take, comentário por timestamp) existe para servir essa centralização.

## Operating Context

- Planejamento, roteiro, kanban, edição e revisão acontecem no desktop.
- Consulta, checklist, gravação, takes e comentários rápidos acontecem no celular (SPEC §43).
- Mídia fica fora: arquivos e versões são links externos (Drive, Vimeo, etc.). O app não edita vídeo nem publica nas redes; publicação é registrada.
- Self-hosted e de código aberto (AGPL-3.0), rodando por Docker; instância do mantenedor no Coolify.

## Capabilities and Constraints

- Funções do MVP descritas em `SPEC.md` e já implementadas; o redesign não remove função.
- Interface em pt-BR e en, todo texto pelo catálogo (`messages/`, ADR-041).
- Tema claro e escuro.
- Todo par texto/fundo passa contraste AA (`npm run check:contrast`).
- Modo Gravação mobile-first, usável em 375, 390 e 430 px sem scroll horizontal (SPEC §72, §86).
- Status sempre com texto além de cor.
- Stack: Next.js (App Router), React, Tailwind CSS, componentes base no estilo shadcn.

## Brand Commitments

Nome: TakeOps. Sem logo, paleta ou voz definidos como obrigatórios. A UI atual é considerada genérica ("cara de app feito por IA") pelo dono e não é referência a preservar.

## Evidence on Hand

Seed com workspace "Acme Software", produção demo "Conheça nosso novo Dashboard de Pedidos" e três produções de exemplo (`src/server/seed.ts`). Não há clientes, depoimentos ou métricas reais.

## Product Principles

1. Um lugar só: cada informação da produção tem uma casa, e a tela mostra onde está.
2. Densidade a serviço do trabalho: ver mais da produção de uma vez, sem esconder o essencial atrás de cliques.
3. Estado sempre legível: etapa, pendência e responsável reconhecíveis de relance.
4. O set é outro contexto: no celular, poucas ações grandes; no desktop, muita informação organizada.

## Accessibility & Inclusion

Contraste AA obrigatório, navegação por teclado, alvos de toque adequados e status que não dependem só de cor (SPEC §57).

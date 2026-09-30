---
name: TakeOps
description: Quadro de tiras para produção de vídeo — cada produção e cada cena é uma tira; a cor da tira é a etapa.
colors:
  primary: "oklch(0.45 0.12 255)"
  primary-foreground: "oklch(0.985 0.004 255)"
  background: "oklch(0.965 0.003 250)"
  foreground: "oklch(0.21 0.012 250)"
  card: "oklch(0.995 0.002 95)"
  muted: "oklch(0.93 0.004 250)"
  muted-foreground: "oklch(0.46 0.012 250)"
  accent: "oklch(0.91 0.012 250)"
  accent-foreground: "oklch(0.24 0.03 255)"
  border: "oklch(0.86 0.005 250)"
  input: "oklch(0.78 0.006 250)"
  ring: "oklch(0.55 0.14 255)"
  frame: "oklch(0.8 0.006 250)"
  frame-foreground: "oklch(0.2 0.012 250)"
  divider: "oklch(0.2 0.006 250)"
  divider-foreground: "oklch(0.96 0.004 95)"
  strip-plan: "oklch(0.99 0.004 95)"
  strip-set: "oklch(0.92 0.075 97)"
  strip-post: "oklch(0.89 0.045 235)"
  strip-done: "oklch(0.895 0.055 150)"
  strip-shelf: "oklch(0.86 0.004 250)"
  strip-ink: "oklch(0.2 0.01 250)"
  strip-ink-muted: "oklch(0.4 0.012 250)"
  destructive: "oklch(0.52 0.19 27)"
  destructive-muted: "oklch(0.95 0.03 27)"
  success: "oklch(0.48 0.11 150)"
  success-muted: "oklch(0.94 0.04 150)"
  warning: "oklch(0.5 0.11 65)"
  warning-muted: "oklch(0.95 0.05 85)"
  info: "oklch(0.48 0.12 245)"
  info-muted: "oklch(0.94 0.03 245)"
  record: "oklch(0.55 0.22 25)"
typography:
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  headline:
    fontFamily: "IBM Plex Sans Condensed, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  title:
    fontFamily: "IBM Plex Sans Condensed, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  strip-title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
  label:
    fontFamily: "IBM Plex Sans Condensed, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  column-head:
    fontFamily: "IBM Plex Sans Condensed, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  strip: "2px"
  md: "3.2px"
  lg: "4px"
spacing:
  strip-gap: "1px"
  strip-h: "28px"
  touch: "44px"
  frame-pad: "4px"
  column-gap: "10px"
components:
  strip:
    backgroundColor: "{colors.strip-plan}"
    textColor: "{colors.strip-ink}"
    rounded: "{rounded.strip}"
    height: "{spacing.strip-h}"
    padding: "0 6px 0 8px"
  strip-divider:
    backgroundColor: "{colors.divider}"
    textColor: "{colors.divider-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.strip}"
    height: "24px"
    padding: "0 8px"
  strip-board:
    backgroundColor: "{colors.frame}"
    textColor: "{colors.strip-ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.frame-pad}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch}"
    padding: "0 12px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch}"
    padding: "0 12px"
  tab-link:
    textColor: "{colors.frame-foreground}"
    typography: "{typography.title}"
    rounded: "{rounded.strip}"
    height: "{spacing.touch}"
    padding: "0 10px"
  tab-link-current:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch}"
    padding: "0 12px"
  status-badge:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.strip}"
    padding: "1px 6px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: TakeOps

## Overview

**Creative North Star: "O Quadro de Tiras"**

O TakeOps é um stripboard de set de filmagem na tela (ADR-045). Cada produção, cena, plano ou ideia é uma tira fina de cartolina; a cor da tira diz a etapa, a ponta direita diz o estado, e tiras pretas separam os grupos. Tudo mora dentro de uma moldura de alumínio com cabeçalho impresso em Plex Condensed caixa-alta. A equipe lê o quadro de relance e abre a tira para agir.

A densidade é de ferramenta de produção, não de vitrine: linhas de 28px no desktop, colunas fixas que nunca desalinham, zero decoração. O mundo recusa cards arredondados em colunas (kanban) e o arco-íris de status: onze etapas cabem em cinco cartolinas dessaturadas.

O tema escuro mantém o mesmo quadro: a moldura escurece, as tiras guardam o matiz. Valores do escuro estão em `src/app/globals.css` (`.dark`) e no sidecar.

Este registro descreve o build revisado: a revisão final fechou com disposição "ship" sobre as correções pontuadas (renders em `.impeccable/review/`, 1440 e 390, claro e escuro).

**Key Characteristics:**
- Tiras de 28px (44px abaixo de `sm`) com código de letra da fase à esquerda e ponta de estado à direita.
- Cinco cartolinas: branca (plan), amarela (set), azul (post), verde (done), cinza (shelf).
- Divisórias pretas como cabeçalho de grupo; moldura de alumínio em volta.
- Plex Condensed caixa-alta para tudo que é "impresso"; Plex Sans para conteúdo.
- Cantos quase retos (2px na tira, 3–4px em superfícies e controles).
- Plano, sem sombra estrutural; profundidade vem de moldura → tira.

## Colors

Neutros frios quase sem croma, cinco cartolinas dessaturadas que carregam a etapa, um azul de ação e uma luz vermelha reservada à gravação.

### Primary
- **Azul de Claquete** (primary): ação principal (Nova produção, Concluir e próxima, filtrar), cursor de texto e seleção. Um botão primário por barra.
- **Anel de Foco** (ring): contorno de foco de todos os controles e da tira inteira.

### Secondary
- **Cartolinas da tira** (strip-plan, strip-set, strip-post, strip-done, strip-shelf): fundo das tiras. Mapeamento fixo em `src/components/ui/strip-phase.ts` — produção: IDEA/PRE_PRODUCTION/SCRIPTING → plan; READY_TO_RECORD/RECORDING → set; EDITING/REVIEW → post; APPROVED/SCHEDULED/PUBLISHED → done; ARCHIVED → shelf. Cenas/planos: PLANNED → plan; READY/RECORDING/NEEDS_RETAKE → set; RECORDED → done; DISCARDED → shelf. Ideias: NEW → plan; UNDER_REVIEW → post; APPROVED/CONVERTED → done; DISCARDED → shelf. Nova entidade reusa esses mapas; não crie cartolina nova.
- **Tinta da tira** (strip-ink, strip-ink-muted): texto sobre qualquer cartolina; muted só para colunas de metadado (nº, dono, data, meta).

### Tertiary
- **Luz de Gravação** (record): só o ponto "gravando agora" do Modo Gravação. Nunca como cor de erro ou destaque.
- **Tons semânticos** (destructive, success, warning, info + `-muted`): StatusBadge, alertas e a nota de continuidade (warning-muted). Texto sempre em cima do `-muted` correspondente.

### Neutral
- **Alumínio** (frame / frame-foreground): moldura do quadro, barra do app, barra de filtros, trilho de abas, rodapé do Modo Gravação.
- **Divisória Preta** (divider / divider-foreground): cabeçalho de grupo, contadores (avisos, filtros ativos), iniciais da conta, borda de 2px sob a barra do quadro, preenchimento da barra de progresso.
- **Papel** (background, card, muted, accent, border, input): fundo da página, superfícies de formulário e listas, bordas de 1px.

### Named Rules
**A Regra da Cartolina.** A cor da tira é a etapa e nada mais. Estado vai na ponta, pendência vai em texto com ícone; nunca pinte uma tira para chamar atenção.

**A Regra do Texto ao Lado.** Cor nunca carrega status sozinha: a tira tem código de letra da fase (+ `sr-only` com a etapa), a ponta tem `title`/`sr-only` e a legenda impressa, o StatusBadge tem rótulo.

**A Regra do Par Conferido.** Todo par texto/fundo novo entra em `scripts/check-contrast.mjs` e passa `npm run check:contrast` (4.5:1 texto, 3:1 foco) nos dois temas antes de ser usado.

## Typography

**Display Font:** IBM Plex Sans (400/500/600, `--font-sans`)
**Label/Mono Font:** IBM Plex Sans Condensed (400/500/600, `--font-strip`, utilitário `font-condensed`)

**Character:** Plex Condensed é a letra impressa do quadro — estreita para caber a etiqueta inteira numa linha de 28px; Plex Sans é a letra escrita à mão na tira, legível em corpo.

### Hierarchy
- **Display** (600, 1.5rem, 1.25): título da cena no Modo Gravação. Único tamanho grande do sistema.
- **Headline** (Condensed 600, 1.125rem, caixa-alta, tracking-wider): título da página na barra de filtros ("PRODUÇÕES 8").
- **Title** (Condensed 600, 0.8125–0.875rem, caixa-alta, tracking-wider): navegação impressa, abas, CardTitle, títulos de seção e de EmptyState.
- **Body** (400, 0.875rem): conteúdo e descrições. No Modo Gravação o corpo sobe para 1rem e o diálogo para 1.25rem (leading-relaxed).
- **Strip title** (Sans 500, 0.875rem): título dentro da tira, truncado.
- **Label** (Condensed 600, 0.75rem, caixa-alta): código de fase, divisória, StatusBadge; metadados da tira em Condensed 400 0.75rem `tabular-nums`.
- **Column head** (Condensed 600, 0.6875rem, caixa-alta): cabeçalho impresso das colunas do quadro.

### Named Rules
**A Regra do Impresso.** Caixa-alta condensada é para o que é "impresso no quadro" (rótulos, cabeçalhos, códigos, navegação). Conteúdo escrito pelo usuário — títulos de produção, diálogo, notas — fica em Plex Sans, caixa normal.

**A Regra do Número Tabular.** Contagens, datas, prioridades e checklists usam `tabular-nums` para as colunas não dançarem.

## Layout

- **Barra do quadro:** fina (48px), sticky, alumínio com borda inferior preta de 2px: marca impressa, navegação impressa (desktop `lg+`; menu lateral abaixo), avisos, conta. Conteúdo com `px-3 py-4`, `md:px-5 md:py-5`, largura total.
- **Barra de filtros:** faixa de alumínio acima do quadro com título + contagem, busca sempre visível, "Filtros" em painel (`details`), ação primária empurrada à direita (`ml-auto`). No celular a busca desce para a segunda linha.
- **Grade da tira (`.strip-grid`):** colunas fixas compartilhadas entre cabeçalho impresso e tiras. Desktop (`≥40rem`): código 44px · nº 64px · título flexível · dono 144px · data 96px · meta 72px · [ação 136px] · ponta 8px, gap 10px. Celular: duas linhas de 44px — título em cima, dono/meta/data embaixo; nº some.
- **Ritmo:** tiras separadas por 1px (a moldura aparece entre elas); moldura com 4px de respiro.
- **Modo Gravação:** mobile-first 375–430px, coluna única `max-w-xl`, cabeçalho e rodapé sticky em alumínio com borda preta de 2px, rodapé respeita `safe-area-inset-bottom`, ações em largura total. Sem hover: tudo precisa funcionar só com toque.

### Named Rules
**A Regra da Coluna Fixa.** Toda tira usa `.strip-grid`; a mesma etiqueta fica no mesmo lugar e só os valores mudam. Se falta um dado, a célula fica vazia, não colapsa.

**A Regra dos 44px.** Todo alvo de toque tem 44px abaixo de `sm`: tiras sobem para 44px, botões `h-11`, ícones da tira `size-11`, abas `h-11`. Acima de `sm` a densidade volta (tira 28px, ícone 24px, abas 32px).

## Elevation & Depth

Plano. A profundidade é física de quadro: alumínio (frame) segura as tiras, as tiras ficam sobre ele separadas por 1px, as divisórias pretas cortam grupos. Sombra só aparece em duas funções.

### Shadow Vocabulary
- **Aba levantada** (`--elevation-sm`: `0 1px 2px oklch(0.2 0.012 250 / 8%)`): item atual da navegação e da aba, que vira "tira clara" sobre o trilho.
- **Flutuante** (`--elevation-md`: `0 6px 16px … / 12%, 0 1px 3px … / 8%`): popovers, painel de filtros, menu de ações da tira no celular.

### Named Rules
**A Regra do Quadro Plano.** Tira, moldura, card e lista não têm sombra em repouso. Hover da tira é brilho (`brightness 0.96`; escuro `1.25`), não elevação.

## Shapes

Cantos quase retos, como cartolina cortada: 2px na tira, divisória, badge, botões de ícone da tira, contador e item de navegação; 3.2px (`rounded-md`) em moldura, card, lista, popover e dialog; 4px (`rounded-lg`, `--radius`) em botões e inputs. A ponta de estado é um retângulo de 8×16px (legenda 6×14px). Vaga vazia e EmptyState usam borda tracejada em `frame-foreground`. A única forma redonda é a luz de gravação.

### Named Rules
**A Regra da Ponta.** Estado é traço, não cor: contínuo (`ok`, em dia), riscado 135° (`pending`, com pendência), vazado (`idle`, parado). Todo quadro exibe a legenda impressa das pontas (`StripLegend`).

## Components

### Buttons
- **Shape:** cantos de 4px.
- **Primary:** azul de claquete, `h-11`, `px-3`, texto 0.875rem 500. Nas barras densas desktop desce para `h-8` (`barControl`).
- **Outline:** fundo `background` (ou `card` sobre alumínio), borda `border`; ações secundárias e navegação anterior/próxima do Modo Gravação.
- **Ghost / Destructive / Link:** ghost para "Limpar"; destructive em `destructive/10` com texto destructive.
- **Hover / Focus:** hover escurece 20%; foco com borda `ring` + anel de 3px `ring/50`; `active` desce 1px.

### Chips
- **StatusBadge:** Condensed 600 0.75rem caixa-alta, 2px, `px-1.5`; fundo `*-muted` + texto do tom (tom primary usa accent). Sempre com rótulo.
- **Contador:** fundo divisória, texto claro, 2px, `tabular-nums` (avisos, filtros ativos).

### Cards / Containers
- **Corner Style:** 3.2px.
- **Background:** `card` com borda de 1px; `p-3`, `sm:p-4`. CardTitle é Condensed caixa-alta.
- **Shadow Strategy:** nenhuma (Quadro Plano).
- **Uso:** só para formulários e blocos de detalhe. Coleções de produções, cenas, planos ou ideias são quadro de tiras, nunca grade de cards. `ItemList` (lista com divisores, linhas de 44px) serve listas secundárias.

### Inputs / Fields
- **Style:** borda `input` de 1px, 4px, fundo transparente (ou `card` sobre alumínio), `min-h-11`; `text-base` no celular para evitar zoom do iOS, `md:text-sm`.
- **Focus:** borda `ring` + anel de 3px `ring/50`.
- **Error / Disabled:** `aria-invalid` pinta borda e anel destructive; disabled a 50%.

### Navigation
- **Barra (desktop `lg+`):** itens Condensed 600 0.8125rem caixa-alta em `frame-foreground`, `h-8`; atual vira tira clara (`card` + `elevation-sm`); hover `card/50`.
- **Menu lateral (celular):** Sheet em alumínio, itens Sans 500 0.875rem com ícone, `min-h-11`.
- **Abas (`TabNav`/`TabLink`):** trilho de alumínio com as mesmas regras da barra; `h-11`, `sm:h-8`.

### Quadro de tiras (assinatura)
- **StripBoard:** moldura de alumínio, cabeçalho impresso de colunas (desktop) e `StripLegend` no rodapé. Passe `columns.action` para abrir a coluna de ação.
- **StripGroup:** divisória preta de 24px com rótulo e contagem; é alvo de arraste quando a tela permite mover tiras (contorno `ring` ao passar por cima).
- **Strip:** cartolina da fase, código de letra com separador `strip-ink/15`, título como link que cobre a tira inteira (foco desenha na tira), `flag` de pendência (ícone + texto) ao lado do título no desktop e sob o dono no celular, ponta de estado. Controles em `action` ficam acima do link, nunca dentro dele.
- **StripActions:** ações inline no desktop a 60% de opacidade até hover/foco na tira; no celular recolhem num botão "mais" de 44px com popover.
- **StripEmpty:** vaga tracejada na altura de uma tira, com a próxima ação.
- **Mudar de etapa:** arrastar até outra divisória ou usar o seletor da tira (teclado e toque; no celular vira ícone de 44px).

### Modo Gravação
Cabeçalho alumínio com luz de gravação + "GRAVANDO"; progresso em barra de 8px (alumínio com preenchimento preto); cena atual num bloco da cartolina da fase com posição, status e ponta; planos como card com faixa da cartolina no topo; nota de continuidade em warning-muted com `role="note"`; rodapé sticky com "Refazer" (outline) e "Concluir e próxima" (primary) em largura total.

## Do's and Don'ts

### Do:
- **Do** tirar todo texto de UI dos catálogos `messages/` via next-intl (ADR-041), inclusive rótulos de coluna, códigos de fase (`strip.phase.*`) e legenda das pontas (`strip.tip.*`).
- **Do** mapear status para cartolina e ponta só pelas funções de `strip-phase.ts` (`stripPhase`, `scenePhase`, `sceneTip`, `ideaPhase`).
- **Do** colocar texto ao lado de toda cor de status: código de letra, rótulo, legenda ou `sr-only`.
- **Do** garantir 44px de alvo abaixo de `sm` e desenhar o Modo Gravação para 375–430px sem depender de hover.
- **Do** usar `font-condensed` caixa-alta com `tracking-wider` para rótulos impressos e Plex Sans para conteúdo.
- **Do** rodar `npm run check:contrast` ao mexer em qualquer token de cor.

### Don't:
- **Don't** montar coleções como cards arredondados em colunas (kanban); a coleção é um quadro de tiras.
- **Don't** criar cartolina nova nem pintar tira fora do mapa de fase; onze etapas cabem em cinco cores.
- **Don't** mostrar estado só pela cor da ponta ou do fundo.
- **Don't** usar `record` fora do "gravando agora".
- **Don't** pôr sombra em tira, moldura, card ou lista em repouso.
- **Don't** arredondar além de 4px em superfícies novas.
- **Don't** escrever texto de interface direto no JSX.

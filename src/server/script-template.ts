import type { Locale } from "../i18n/locale.ts";

// Modelo que quem escreve o roteiro baixa na aba Roteiro. Escrito à mão, e
// não gerado, para mostrar também o jeito livre de escrever (falas por
// personagem, texto solto como descrição) que a importação entende.
const templates: Record<Locale, string> = {
  "pt-BR": `<!--
Modelo de roteiro do takeops. Apague estes comentários à vontade.

- "# Título" na primeira linha é o nome da produção.
- Campos são linhas "**Campo:** valor". Valor longo continua nas linhas de
  baixo até uma linha em branco.
- "# Cena N — título" abre uma cena. "## Plano N.N — nome" abre um plano
  dentro dela.
- "**NOME:**" sozinho na linha, com o texto embaixo, é uma fala. Ela vai para
  o campo Fala da cena como "NOME: texto".
- Texto solto vira descrição do plano (ou da cena, se ainda não houver plano).
- Qualquer outro "# Título" (personagens, direção, estilo) vira nota do
  roteiro. Nada é descartado.
- Tipos de cena: Gancho, Apresentador, Diálogo, Tela, Apoio, Produto,
  Narração, Chamada, Outro.
- Tipos de plano: Câmera, Captura de tela, Apoio, Inserto, Só voz, Outro.
- Duração em segundos (15), em relógio (0:15) ou intervalo (0:00 – 0:15).
- Campos opcionais: todos, menos o título da cena.
-->

# Horta na varanda

**Formato:** Tutorial
**Proporção:** 9:16
**Duração:** 60
**Objetivo:** Mostrar que dá para plantar temperos em três vasos pequenos.
**Público:** Quem mora em apartamento
**Produto:** Kit de vasos

**Gancho:** Três vasos, uma varanda e tempero fresco o ano todo.
**Mensagem principal:** Sol, rega certa e vaso com furo resolvem quase tudo.
**Chamada para ação:** Salve o vídeo e comece pelo manjericão.
**Notas:**
Gravar de manhã, com luz natural.
Evitar vento forte nas folhas.

---

# Cena 1 — Três vasos

**Tipo:** Gancho
**Duração:** 0:00 – 0:15
**Propósito:** abertura
**Edição:** Texto na tela: HORTA EM 3 VASOS.

## Plano 1.1 — Apresentadora na varanda

**Tipo:** Câmera
**Enquadramento:** Plano médio
**Assunto:** Apresentadora

Apresentadora segura um vaso em cada mão.

**APRESENTADORA:**
Dá pra ter tempero fresco sem quintal.

## Plano 1.2 — Mudas

**Tipo:** Inserto
**Enquadramento:** Close nas folhas
**Assunto:** Mudas de manjericão
**Takes:** 2

---

# Cena 2 — A rega

**Tipo:** Narração
**Duração:** 20
**Câmera:** Câmera baixa, na altura dos vasos.

**NARRADORA (OFF):**
Regue quando a terra estiver seca ao toque, nunca todo dia.

## Plano 2.1 — Regando os vasos

**Tipo:** Apoio
**Enquadramento:** Plano fechado
**Assunto:** Regador e vasos
**Notas:** Gravar também a água escorrendo pelo furo do vaso.
`,
  en: `<!--
takeops script template. Feel free to delete these comments.

- "# Title" on the first line is the production name.
- Fields are "**Field:** value" lines. A long value continues on the lines
  below until a blank line.
- "# Scene N — title" starts a scene. "## Shot N.N — name" starts a shot
  inside it.
- "**NAME:**" alone on a line, with the text below, is a line of dialogue. It
  goes to the scene's Dialogue field as "NAME: text".
- Loose text becomes the shot description (or the scene's, before any shot).
- Any other "# Title" (characters, direction, style) becomes a script note.
  Nothing is dropped.
- Scene types: Hook, Talking head, Dialogue, Screen, B-roll, Product,
  Voice-over, Call to action, Other.
- Shot types: Camera, Screen capture, B-roll, Insert, Voice only, Other.
- Duration in seconds (15), as a clock (0:15) or a range (0:00 – 0:15).
- Every field is optional except the scene title.
-->

# Balcony herb garden

**Format:** Tutorial
**Aspect ratio:** 9:16
**Duration:** 60
**Objective:** Show that three small pots are enough to grow herbs.
**Audience:** People living in apartments
**Product:** Pot kit

**Hook:** Three pots, one balcony, fresh herbs all year.
**Main message:** Sun, the right watering and pots with holes solve almost everything.
**Call to action:** Save this video and start with basil.
**Notes:**
Shoot in the morning, with natural light.
Avoid strong wind on the leaves.

---

# Scene 1 — Three pots

**Type:** Hook
**Duration:** 0:00 – 0:15
**Purpose:** opening
**Editing:** On-screen text: HERB GARDEN IN 3 POTS.

## Shot 1.1 — Host on the balcony

**Type:** Camera
**Framing:** Medium shot
**Subject:** Host

The host holds a pot in each hand.

**HOST:**
You can grow fresh herbs without a backyard.

## Shot 1.2 — Seedlings

**Type:** Insert
**Framing:** Close on the leaves
**Subject:** Basil seedlings
**Takes:** 2

---

# Scene 2 — Watering

**Type:** Voice-over
**Duration:** 20
**Camera:** Low camera, at pot height.

**NARRATOR (VO):**
Water when the soil feels dry, never every day.

## Shot 2.1 — Watering the pots

**Type:** B-roll
**Framing:** Tight shot
**Subject:** Watering can and pots
**Notes:** Also record the water draining through the pot hole.
`,
};

export function scriptTemplate(locale: Locale) {
  return templates[locale];
}

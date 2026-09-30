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

# Cadê o supervisor?

**Formato:** Esquete
**Proporção:** 9:16
**Duração:** 150
**Objetivo:** Mostrar que a autorização chega no celular do supervisor, sem parar o atendimento.
**Público:** Gestores de comércio
**Produto:** Supervisor

**Gancho:** A tela pede autorização e o funcionário precisa achar o supervisor.
**Mensagem principal:** A autorização chega em tempo real, onde o supervisor estiver.
**Chamada para ação:** Fale com a nossa equipe.
**Notas:**
Cliente é a câmera.
Não exagerar na atuação do começo.

---

# Cena 1 — Uma venda normal

**Tipo:** Gancho
**Duração:** 0:00 – 0:15
**Propósito:** problema
**Edição:** Texto na tela: AUTORIZAÇÃO NECESSÁRIA.

## Plano 1.1 — Funcionário atendendo

**Tipo:** Câmera
**Enquadramento:** Plano médio
**Assunto:** Funcionário

Funcionário atende normalmente, digitando.

**FUNCIONÁRIO:**
Beleza... já vou finalizar pra você.

## Plano 1.2 — Autorização necessária

**Tipo:** Inserto
**Enquadramento:** Close na tela
**Assunto:** Monitor do caixa
**Takes:** 2

---

# Cena 2 — Aprovação no celular

**Tipo:** Tela
**Duração:** 20
**Câmera:** Close no celular, tela legível.

**NARRADOR (OFF):**
O supervisor recebe a solicitação em tempo real, direto no celular.

## Plano 2.1 — Push no celular

**Tipo:** Captura de tela
**Enquadramento:** Tela cheia
**Assunto:** App no celular
**Notas:** Gravar também o botão Reprovar para outros vídeos.
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

# Where is the supervisor?

**Format:** Sketch
**Aspect ratio:** 9:16
**Duration:** 150
**Objective:** Show that the approval reaches the supervisor's phone without stopping the sale.
**Audience:** Retail managers
**Product:** Supervisor

**Hook:** The screen asks for approval and the clerk has to find the supervisor.
**Main message:** Approvals arrive in real time, wherever the supervisor is.
**Call to action:** Talk to our team.
**Notes:**
The customer is the camera.
Keep the acting natural at the start.

---

# Scene 1 — A normal sale

**Type:** Hook
**Duration:** 0:00 – 0:15
**Purpose:** problem
**Editing:** On-screen text: APPROVAL REQUIRED.

## Shot 1.1 — Clerk at the counter

**Type:** Camera
**Framing:** Medium shot
**Subject:** Clerk

The clerk is typing, serving the customer.

**CLERK:**
Alright... let me finish this for you.

## Shot 1.2 — Approval required

**Type:** Insert
**Framing:** Close on the screen
**Subject:** Register screen
**Takes:** 2

---

# Scene 2 — Approval on the phone

**Type:** Screen
**Duration:** 20
**Camera:** Close on the phone, readable screen.

**NARRATOR (VO):**
The supervisor gets the request in real time, right on the phone.

## Shot 2.1 — Push notification

**Type:** Screen capture
**Framing:** Full screen
**Subject:** App on the phone
**Notes:** Also record the Reject button for future videos.
`,
};

export function scriptTemplate(locale: Locale) {
  return templates[locale];
}

# DESIGN.md

Fonte dos tokens visuais (ADR-038). Valores em `src/app/globals.css`; este arquivo diz **quando** usar cada um.

Referência de estilo: PanelUI (tokens semânticos, temas claro/escuro, densidade confortável). Nenhum código, asset ou marca dele entra aqui.

## Princípios

1. Ferramenta de trabalho: calma, legível, pouca cor. Cor comunica estado, não decora.
2. Mobile-first nas telas de gravação (spec §16): toque de 44px, sem hover obrigatório.
3. Status sempre com **texto + cor**, nunca só cor.
4. Todo par texto/fundo passa AA (`npm run check:contrast`).

## Cor

Neutros levemente frios (matiz 265). Primária índigo (275). Valores em OKLCH.

| Token | Uso |
|---|---|
| `background` / `foreground` | fundo da página e texto principal |
| `card`, `popover` | superfícies elevadas |
| `muted` / `muted-foreground` | fundo discreto; texto secundário, datas, dicas |
| `primary` / `primary-foreground` | ação principal (um por área), link, item ativo |
| `secondary` | botão secundário |
| `accent` / `accent-foreground` | hover e seleção em listas e menus |
| `border`, `input`, `ring` | divisória, borda de campo, anel de foco |
| `destructive` | excluir, erro |
| `success` | aprovado, gravado, concluído |
| `warning` | pendente, refazer, atenção |
| `info` | agendado, em andamento, avisos neutros |
| `record` | **só** o indicador "gravando agora" do Modo Gravação |
| `chart-1..5` | gráficos, na ordem |

Cada estado tem três formas:

- sólido: `bg-success text-success-foreground` (botão, ponto forte);
- suave: `bg-success-muted text-success` (badge de status, faixa de aviso);
- texto: `text-success` sobre `background`/`card`.

Não usar cores cruas do Tailwind (`text-red-600`, `bg-green-100`) em tela nova; as antigas migram nas UI-003..006.

### Mapa de status

| Estado de domínio | Token |
|---|---|
| Ideia, planejado, rascunho | neutro (`muted`) |
| Roteiro, pré-produção, pronto, agendado, em revisão | `info` |
| Gravando, editando | `primary` |
| Refazer, alterações solicitadas, aguardando | `warning` |
| Aprovado, gravado, publicado, concluído | `success` |
| Descartado, falhou, cancelado | `destructive` (cancelado pode ser neutro) |
| Arquivado | neutro |

## Tema escuro

Completo: todo token tem valor em `.dark`. Superfícies sobem de claridade com a elevação (`background` 0.17 → `card` 0.21 → `popover` 0.23) em vez de depender de sombra. Cores de estado ficam mais claras e com texto escuro por cima.

Troca por `next-themes` (claro, escuro, sistema).

## Tipografia

Fonte: Geist (`--font-sans`). Escala do Tailwind:

| Papel | Classe |
|---|---|
| Título de página | `text-2xl font-medium tracking-tight` |
| Título de seção/card | `text-lg font-medium` |
| Corpo | `text-sm` (desktop) / `text-base` em campos no mobile, para o iOS não dar zoom |
| Secundário, meta | `text-sm text-muted-foreground` |
| Legenda, contador | `text-xs text-muted-foreground` |
| Números alinhados | `tabular-nums` |

Pesos só `font-normal` e `font-medium`; `font-semibold` para destaque raro.

## Forma

- Raio base `--radius: 0.75rem` (`rounded-lg`). Campos e botões `rounded-lg`, cards `rounded-xl`, badges `rounded-full`.
- Sombra: `shadow-sm` em card, `shadow-md` em popover/diálogo. No escuro a separação vem da superfície.
- Bordas de 1px com `border`.

## Espaço e densidade

- Grade de 4px (escala do Tailwind).
- Página: `px-4 py-6`, `md:px-8`; conteúdo em `max-w-3xl` (leitura) ou `max-w-6xl` (listas/kanban).
- Entre blocos `gap-6`; dentro de card `p-4`, itens `gap-2`/`gap-3`.
- Alvo de toque mínimo `min-h-11` (44px) em tudo clicável.
- Densidade confortável; tabelas podem ser compactas no desktop, nunca no Modo Gravação.

## Ícones

`lucide-react`, traço padrão, `size-4` em texto e botões, `size-5` na navegação. Herdam `currentColor`. Ícone sozinho exige `aria-label`; decorativo recebe `aria-hidden`.

## Estados

| Estado | Padrão |
|---|---|
| Foco | `focus-visible:ring-3 ring-ring/50`, nunca remover sem substituto |
| Hover | `bg-accent`; nada importante só no hover |
| Desabilitado | `opacity-50` + `cursor-not-allowed` + `disabled` real |
| Carregando | skeleton em `bg-muted` ou botão com texto de progresso |
| Vazio | `EmptyState` com título e próxima ação |
| Erro | texto em `destructive` + faixa `destructive-muted`; mensagem humana (AGENTS §18) |
| Salvando (autosave) | `idle/saving/saved/error` em `text-xs text-muted-foreground` |

## Componentes

Em `src/components/ui`: `Button` (altura 44px no tamanho padrão), `Input`, `Textarea`, `Select`, `Checkbox`, `Field`, `Card`, `StatusBadge` (tom por `statusTone`), `ItemList`, `TabNav`/`TabLink`, `Dialog`. Vazio, erro (`RouteError`) e carregando (`LoadingState`, usado nos `loading.tsx`) ficam em `src/components/feedback`. Toast é o Sonner do layout.

## Movimento

Transições curtas (150–200ms) de cor e opacidade. Respeitar `prefers-reduced-motion`.

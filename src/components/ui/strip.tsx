import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { StripPhase, StripTip } from "@/components/ui/strip-phase";

const stripPhaseClass: Record<StripPhase, string> = {
  plan: "bg-strip-plan",
  set: "bg-strip-set",
  post: "bg-strip-post",
  done: "bg-strip-done",
  shelf: "bg-strip-shelf",
};

// A ponta muda de traço, não só de cor, para o estado ser legível em tela
// monocromática e por quem não distingue as cartolinas.
const stripTipClass: Record<StripTip, string> = {
  ok: "bg-strip-ink",
  pending:
    "bg-[repeating-linear-gradient(135deg,var(--strip-ink)_0_2px,transparent_2px_5px)] ring-1 ring-strip-ink ring-inset",
  idle: "ring-2 ring-strip-ink ring-inset",
};

const stripIconButton =
  "inline-flex size-11 items-center justify-center rounded-[2px] text-strip-ink transition-colors duration-150 hover:bg-strip-ink/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-35 sm:size-6 [&_svg]:size-4 sm:[&_svg]:size-3.5";

const cellMeta =
  "min-w-0 truncate font-condensed text-xs text-strip-ink-muted tabular-nums";

export type StripColumns = {
  number: string;
  title: string;
  owner: string;
  date: string;
  meta: string;
  // Presente quando as tiras têm controle próprio (coluna `act`).
  action?: string;
};

// Moldura do quadro. O cabeçalho impresso usa a mesma grade das tiras,
// então as colunas nunca desalinham.
function StripBoard({
  label,
  columns,
  className,
  children,
}: {
  label: string;
  columns?: StripColumns;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="strip-board"
      data-act={columns?.action !== undefined ? "" : undefined}
      className={cn("rounded-md bg-frame p-1 text-strip-ink", className)}
    >
      {columns ? (
        <div
          aria-hidden="true"
          className="strip-grid hidden px-2 font-condensed text-[0.6875rem] font-semibold tracking-wider text-frame-foreground uppercase sm:grid"
        >
          <span />
          <span className="[grid-area:num]">{columns.number}</span>
          <span className="[grid-area:title]">{columns.title}</span>
          <span className="[grid-area:owner]">{columns.owner}</span>
          <span className="[grid-area:date]">{columns.date}</span>
          <span className="[grid-area:meta]">{columns.meta}</span>
          {columns.action !== undefined ? (
            <span className="[grid-area:act]">{columns.action}</span>
          ) : null}
        </div>
      ) : null}
      <ul aria-label={label} className="flex flex-col gap-px">
        {children}
      </ul>
      <StripLegend />
    </div>
  );
}

// Legenda impressa das pontas: o estado também em texto, não só no traço.
function StripLegend() {
  const t = useTranslations("strip");
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-1.5 pb-0.5 font-condensed text-xs text-frame-foreground">
      {(["ok", "pending", "idle"] as const).map((tip) => (
        <span key={tip} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("h-3.5 w-1.5", stripTipClass[tip])}
            style={{ ["--strip-ink" as string]: "var(--frame-foreground)" }}
          />
          {t(`tip.${tip}`)}
        </span>
      ))}
    </p>
  );
}

// Grupo do quadro: a tira preta de cima é a divisória, como a de fim de
// dia no stripboard, e recebe arraste quando a tela permite mover tiras.
function StripGroup({
  label,
  count,
  children,
  className,
  ...props
}: Omit<ComponentProps<"li">, "children"> & {
  label: string;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <li
      data-slot="strip-group"
      className={cn("flex flex-col gap-px", className)}
      {...props}
    >
      <h2 className="flex h-6 items-center justify-between gap-3 rounded-[2px] bg-divider px-2 font-condensed text-xs font-semibold tracking-wider text-divider-foreground uppercase">
        <span className="truncate">{label}</span>
        {count !== undefined ? (
          <span className="tabular-nums">{count}</span>
        ) : null}
      </h2>
      <ul aria-label={label} className="flex flex-col gap-px">
        {children}
      </ul>
    </li>
  );
}

// Uma tira: etiqueta fixa (fase, nº, título, dono, data, meta) e ponta de
// estado. O link cobre a tira toda; `action` fica por cima dele, então um
// controle (como mudar a etapa) não quebra a grade nem aninha em <a>.
function Strip({
  phase,
  stageLabel,
  number,
  title,
  owner,
  date,
  meta,
  tip,
  href,
  linkProps,
  action,
  flag,
}: {
  phase: StripPhase;
  stageLabel: string;
  number?: ReactNode;
  title: ReactNode;
  owner?: ReactNode;
  date?: ReactNode;
  meta?: ReactNode;
  tip: StripTip;
  href?: string;
  linkProps?: Omit<ComponentProps<typeof Link>, "href" | "className">;
  action?: ReactNode;
  // Pendência ao lado do título; nunca é cortada, o título encolhe antes.
  flag?: ReactNode;
}) {
  const t = useTranslations("strip");
  const titleClass =
    "flex min-w-0 items-center gap-2 text-sm font-medium [grid-area:title]";
  const titleBody = (
    <>
      <span className="min-w-0 truncate">{title}</span>
      {flag ? <span className="hidden shrink-0 sm:inline">{flag}</span> : null}
    </>
  );

  return (
    <li
      data-slot="strip"
      data-phase={phase}
      data-tip={tip}
      className={cn(
        "strip-grid group relative rounded-[2px] py-1 pr-1.5 pl-2 sm:py-0",
        stripPhaseClass[phase],
        href &&
          "transition-[filter] duration-150 hover:brightness-[0.96] dark:hover:brightness-125",
      )}
    >
      <span
        title={stageLabel}
        className="flex items-center self-stretch border-r border-strip-ink/15 font-condensed text-xs font-semibold tracking-wider uppercase [grid-area:code]"
      >
        <span aria-hidden="true">{t(`phase.${phase}`)}</span>
        <span className="sr-only">{stageLabel}</span>
      </span>
      <span className={cn(cellMeta, "hidden [grid-area:num] sm:block")}>
        {number}
      </span>
      {href ? (
        <Link
          href={href}
          {...linkProps}
          className={cn(
            titleClass,
            "outline-none after:absolute after:inset-0 after:rounded-[2px] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring",
          )}
        >
          {titleBody}
        </Link>
      ) : (
        <span className={titleClass}>{titleBody}</span>
      )}
      <span
        className={cn(
          cellMeta,
          "flex items-center gap-2 [grid-area:owner] sm:block",
        )}
      >
        {/* No celular a pendência desce para a linha de baixo, depois do
            dono; o dono só corta se o nome não couber, e da pendência só
            corta o texto, nunca o ícone. No desktop ela vem ao lado do título. */}
        <span
          className={cn(
            "min-w-0 truncate",
            flag && "max-w-[65%] shrink-0 sm:max-w-none",
          )}
        >
          {owner}
        </span>
        {flag ? (
          <span className="flex min-w-0 items-center sm:hidden">{flag}</span>
        ) : null}
      </span>
      <span className={cn(cellMeta, "[grid-area:date]")}>{date}</span>
      <span className={cn(cellMeta, "[grid-area:meta]")}>{meta}</span>
      {action ? (
        <span className="relative z-10 [grid-area:act]">{action}</span>
      ) : null}
      <span
        title={t(`tip.${tip}`)}
        className={cn(
          "h-4 w-2 justify-self-end [grid-area:tip]",
          stripTipClass[tip],
        )}
      >
        <span className="sr-only">{t(`tip.${tip}`)}</span>
      </span>
    </li>
  );
}

// Vaga vazia no grupo: tracejada, na altura de uma tira, com a próxima
// ação quando houver.
function StripEmpty({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <li
      data-slot="strip-empty"
      className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[2px] border border-dashed border-frame-foreground/40 px-2 py-1 text-sm text-frame-foreground sm:min-h-strip"
    >
      <span>{children}</span>
      {action}
    </li>
  );
}

export {
  Strip,
  StripBoard,
  StripEmpty,
  StripGroup,
  stripIconButton,
  stripPhaseClass,
  stripTipClass,
};

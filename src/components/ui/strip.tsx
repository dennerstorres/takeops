import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { StripPhase, StripTip } from "@/components/ui/strip-phase";

const phaseClass: Record<StripPhase, string> = {
  plan: "bg-strip-plan",
  set: "bg-strip-set",
  post: "bg-strip-post",
  done: "bg-strip-done",
  shelf: "bg-strip-shelf",
};

// A ponta muda de traço, não só de cor, para o estado ser legível em tela
// monocromática e por quem não distingue as cartolinas.
const tipClass: Record<StripTip, string> = {
  ok: "bg-strip-ink",
  pending:
    "bg-[repeating-linear-gradient(135deg,var(--strip-ink)_0_2px,transparent_2px_5px)] ring-1 ring-strip-ink ring-inset",
  idle: "ring-2 ring-strip-ink ring-inset",
};

const cellMeta =
  "min-w-0 truncate font-condensed text-xs text-strip-ink-muted tabular-nums";

export type StripColumns = {
  number: string;
  title: string;
  owner: string;
  date: string;
  meta: string;
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
        </div>
      ) : null}
      <ul aria-label={label} className="flex flex-col gap-px">
        {children}
      </ul>
    </div>
  );
}

// Tira preta entre grupos, como a divisória de fim de dia no stripboard.
function StripDivider({
  children,
  count,
}: {
  children: ReactNode;
  count?: number;
}) {
  return (
    <li
      data-slot="strip-divider"
      className="flex h-6 items-center justify-between gap-3 rounded-[2px] bg-divider px-2 font-condensed text-xs font-semibold tracking-wider text-divider-foreground uppercase"
    >
      <span className="truncate">{children}</span>
      {count !== undefined ? (
        <span className="tabular-nums">{count}</span>
      ) : null}
    </li>
  );
}

// Uma tira: etiqueta fixa (fase, nº, título, dono, data, meta) e ponta de
// estado. Sem `href` é só leitura.
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
}) {
  const t = useTranslations("strip");
  const body = (
    <>
      <span
        title={stageLabel}
        className="self-stretch border-r border-strip-ink/15 font-condensed text-xs flex items-center font-semibold tracking-wider uppercase [grid-area:code]"
      >
        <span aria-hidden="true">{t(`phase.${phase}`)}</span>
        <span className="sr-only">{stageLabel}</span>
      </span>
      <span className={cn(cellMeta, "hidden [grid-area:num] sm:block")}>
        {number}
      </span>
      <span className="min-w-0 truncate text-sm font-medium [grid-area:title]">
        {title}
      </span>
      <span className={cn(cellMeta, "[grid-area:owner]")}>{owner}</span>
      <span className={cn(cellMeta, "[grid-area:date]")}>{date}</span>
      <span className={cn(cellMeta, "[grid-area:meta]")}>{meta}</span>
      <span
        className={cn(
          "h-4 w-2 justify-self-end [grid-area:tip]",
          tipClass[tip],
        )}
      >
        <span className="sr-only">{t(`tip.${tip}`)}</span>
      </span>
    </>
  );
  const rowClass = cn(
    "strip-grid rounded-[2px] py-1 pr-1.5 pl-2 sm:py-0",
    phaseClass[phase],
  );

  return (
    <li data-slot="strip" data-phase={phase} data-tip={tip}>
      {href ? (
        <Link
          href={href}
          className={cn(
            rowClass,
            "transition-[filter] duration-150 hover:brightness-[0.96] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring dark:hover:brightness-125",
          )}
        >
          {body}
        </Link>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  );
}

export { Strip, StripBoard, StripDivider };

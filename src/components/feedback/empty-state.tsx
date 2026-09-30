export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-frame-foreground/30 p-4">
      <h2 className="font-condensed text-sm font-semibold tracking-wider uppercase">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function SectionPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="flex flex-col gap-0.5 rounded-md bg-frame px-3 py-2 text-frame-foreground">
      <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
        {title}
      </h1>
      <p className="text-sm text-frame-foreground/80">{description}</p>
    </header>
  );
}

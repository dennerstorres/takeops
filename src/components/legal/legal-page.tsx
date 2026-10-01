import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { surfaceClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { legalContact } from "@/server/legal";

type Document = {
  title: string;
  updated: string;
  intro: string;
  sections: Record<string, { title: string; body: string[] }>;
};

// Página pública e estática; o texto vem inteiro do catálogo do idioma.
export async function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const t = await getTranslations("legal");
  const content = t.raw(doc) as Document;
  const contact = legalContact(process.env);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <article className={cn(surfaceClass, "flex flex-col gap-6 p-6")}>
        <header className="space-y-1">
          <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
            {content.title}
          </h1>
          <p className="text-sm text-muted-foreground">{content.updated}</p>
        </header>
        <p className="text-sm">{content.intro}</p>
        {Object.entries(content.sections).map(([key, section]) => (
          <section key={key} className="space-y-2">
            <h2 className="text-base font-semibold">{section.title}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index} className="text-sm">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("contactTitle")}</h2>
          <p className="text-sm">
            {contact ? (
              <>
                {t("contactEmail")}{" "}
                <a
                  href={`mailto:${contact}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {contact}
                </a>
              </>
            ) : (
              t("contactFallback")
            )}
          </p>
        </section>
        <nav className="flex flex-wrap gap-x-6 text-sm">
          <Link
            href={doc === "privacy" ? "/termos" : "/privacidade"}
            className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
          >
            {doc === "privacy" ? t("terms.title") : t("privacy.title")}
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("back")}
          </Link>
        </nav>
      </article>
    </main>
  );
}

export async function LegalLinks({ className }: { className?: string }) {
  const t = await getTranslations("legal");
  const link =
    "inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline";
  return (
    <nav
      className={cn(
        "flex justify-center gap-6 text-xs text-muted-foreground",
        className,
      )}
    >
      <Link href="/privacidade" className={link}>
        {t("privacy.title")}
      </Link>
      <Link href="/termos" className={link}>
        {t("terms.title")}
      </Link>
    </nav>
  );
}

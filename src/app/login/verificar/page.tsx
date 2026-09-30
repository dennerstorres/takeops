import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { surfaceClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function VerifyRequestPage() {
  const t = await getTranslations();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <section className={cn(surfaceClass, "flex flex-col gap-3 p-6")}>
        <h1 className="text-2xl font-medium tracking-tight">
          {t("verify.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("verify.description")}
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("verify.back")}
        </Link>
      </section>
    </main>
  );
}

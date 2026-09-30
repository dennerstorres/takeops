import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { IdeaForm } from "@/components/ideas/idea-form";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";

const empty = {
  title: "",
  description: "",
  format: "",
  objective: "",
  product: "",
  audience: "",
  referenceUrl: "",
  notes: "",
};

export default async function NewIdeaPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  if (access.workspace.membership.role === "VIEWER") redirect("/ideias");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-0.5 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
          {t("ideas.newTitle")}
        </h1>
        <p className="text-sm text-frame-foreground/80">
          {t("ideas.newDescription")}
        </p>
      </header>
      <IdeaForm values={empty} canEdit />
    </div>
  );
}

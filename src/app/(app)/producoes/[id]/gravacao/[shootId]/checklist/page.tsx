import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ShootChecklist } from "@/components/shoots/shoot-checklist";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { prismaProjectRepository } from "@/server/project-prisma";
import { getShoot } from "@/server/shoot";
import { listShootChecklist } from "@/server/shoot-checklist";
import { prismaShootChecklistRepository } from "@/server/shoot-checklist-prisma";
import { prismaShootRepository } from "@/server/shoot-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function ShootChecklistPage({
  params,
}: {
  params: Promise<{ id: string; shootId: string }>;
}) {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const { id, shootId } = await params;
  const workspaceId = access.workspace.workspace.id;
  const canEdit = access.workspace.membership.role !== "VIEWER";
  const deps = {
    workspaces: prismaWorkspaceRepository,
    projects: prismaProjectRepository,
    shoots: prismaShootRepository,
    shootChecklist: prismaShootChecklistRepository,
  };

  let shoot;
  let items;
  try {
    shoot = await getShoot(session.user.id, workspaceId, id, shootId, deps);
    items = await listShootChecklist(
      session.user.id,
      workspaceId,
      id,
      shoot.id,
      deps,
    );
  } catch (error) {
    if (error instanceof NotFoundError) redirect(`/producoes/${id}/gravacao`);
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Link
        href={`/producoes/${id}/gravacao`}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("record.back")}
      </Link>
      <header className="flex flex-col gap-0.5 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
          {t("record.checklist")}
        </h1>
        <p className="text-sm text-frame-foreground/80">
          {shoot.title || t("record.session")}
        </p>
      </header>
      {items.length === 0 ? (
        <EmptyState
          title={t("record.noChecklistTitle")}
          description={t("record.pickTemplate")}
        />
      ) : (
        <ShootChecklist
          projectId={id}
          shootId={shoot.id}
          canEdit={canEdit}
          items={items.map((item) => ({
            id: item.id,
            text: item.text,
            completed: item.completed,
            completedByName: item.completedByName,
          }))}
        />
      )}
    </div>
  );
}

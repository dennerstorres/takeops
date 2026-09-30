import { getLocale } from "next-intl/server";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import { prismaProjectRepository } from "@/server/project-prisma";
import { prismaSceneRepository } from "@/server/scene-prisma";
import { exportScriptFile, scriptFileName } from "@/server/script-file";
import { formatScriptMarkdown } from "@/server/script-markdown";
import { prismaScriptRepository } from "@/server/script-prisma";
import { prismaShotRepository } from "@/server/shot-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";
import { isLocale } from "@/i18n/locale";
import { markdownDownload } from "@/lib/markdown-download";

export const dynamic = "force-dynamic";

// Roteiro da produção no mesmo formato que a importação lê (SPEC §18.1).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") return new Response(null, { status: 403 });
  const { id } = await params;

  try {
    const { project, file } = await exportScriptFile(
      session.user.id,
      access.workspace.workspace.id,
      id,
      {
        workspaces: prismaWorkspaceRepository,
        projects: prismaProjectRepository,
        scenes: prismaSceneRepository,
        shots: prismaShotRepository,
        scripts: prismaScriptRepository,
      },
    );
    const locale = await getLocale();
    return markdownDownload(
      formatScriptMarkdown(file, isLocale(locale) ? locale : "en"),
      scriptFileName(project),
    );
  } catch (error) {
    if (error instanceof NotFoundError)
      return new Response(null, { status: 404 });
    if (error instanceof ForbiddenError)
      return new Response(null, { status: 403 });
    throw error;
  }
}

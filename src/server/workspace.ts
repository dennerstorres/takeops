import { z } from "zod";
import { ForbiddenError, ValidationError } from "./errors.ts";
import { parseInput } from "./validation.ts";
import {
  DuplicateSlugError,
  type WorkspaceRepository,
  type WorkspaceRole,
  type WorkspaceWithMembership,
} from "./workspace-repository.ts";

const defaultTimezone = "America/Cuiaba";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(80, "Use no máximo 80 caracteres."),
  slug: z
    .string()
    .trim()
    .min(1, "Informe o identificador.")
    .max(60, "Use no máximo 60 caracteres.")
    .regex(slugPattern, "Use letras minúsculas, números e hífen.")
    .optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  logoUrl: z
    .string()
    .trim()
    .max(500, "A URL passou de 500 caracteres.")
    .nullable()
    .optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isTimeZone(value: string) {
  try {
    Intl.DateTimeFormat("pt-BR", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function slugifyWorkspaceName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  return slugPattern.test(slug) ? slug : "";
}

function readLogoUrl(value: string | null | undefined) {
  if (value == null || value === "") return null;
  if (!isHttpUrl(value)) {
    throw new ValidationError({ logoUrl: "Informe uma URL http(s) válida." });
  }
  return value;
}

export async function createWorkspace(
  userId: string,
  input: unknown,
  repository: WorkspaceRepository,
): Promise<WorkspaceWithMembership> {
  const data = parseInput(createWorkspaceSchema, input);
  const timezone = data.timezone ?? defaultTimezone;
  if (!isTimeZone(timezone)) {
    throw new ValidationError({ timezone: "Informe um fuso horário válido." });
  }

  const slug = data.slug ?? slugifyWorkspaceName(data.name);
  if (!slugPattern.test(slug)) {
    throw new ValidationError({
      slug: "O nome não gerou um identificador válido.",
    });
  }

  try {
    const created = await repository.createWorkspaceWithOwner({
      name: data.name,
      slug,
      logoUrl: readLogoUrl(data.logoUrl),
      timezone,
      userId,
    });

    if (
      created.membership.userId !== userId ||
      created.membership.role !== "OWNER" ||
      created.membership.workspaceId !== created.workspace.id
    ) {
      throw new ForbiddenError();
    }

    return created;
  } catch (error) {
    if (error instanceof DuplicateSlugError) {
      throw new ValidationError({
        slug: "Este identificador já está em uso.",
      });
    }
    throw error;
  }
}

export async function requireMembership(
  userId: string,
  workspaceId: string,
  repository: WorkspaceRepository,
) {
  const membership = await repository.findMembership(userId, workspaceId);
  if (
    !membership ||
    membership.userId !== userId ||
    membership.workspaceId !== workspaceId
  ) {
    throw new ForbiddenError();
  }
  return membership;
}

export async function requireRole(
  userId: string,
  workspaceId: string,
  allowed: readonly WorkspaceRole[],
  repository: WorkspaceRepository,
) {
  const membership = await requireMembership(userId, workspaceId, repository);
  if (!allowed.includes(membership.role)) {
    throw new ForbiddenError("Você não pode fazer isso neste workspace.");
  }
  return membership;
}

export async function getWorkspace(
  userId: string,
  workspaceId: string,
  repository: WorkspaceRepository,
) {
  const membership = await requireMembership(userId, workspaceId, repository);
  const workspace = await repository.findWorkspace(membership.workspaceId);
  if (!workspace || workspace.id !== membership.workspaceId) {
    throw new ForbiddenError();
  }
  return { workspace, membership };
}

export async function listWorkspaces(
  userId: string,
  repository: WorkspaceRepository,
) {
  const rows = await repository.listForUser(userId);
  return rows.filter(
    (row) =>
      row.membership.userId === userId &&
      row.workspace.id === row.membership.workspaceId,
  );
}

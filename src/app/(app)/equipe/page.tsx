import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { InviteForm } from "@/components/team/invite-form";
import { MemberRoleForm } from "@/components/team/member-role-form";
import { RemoveMemberButton } from "@/components/team/remove-member-button";
import { RevokeInviteButton } from "@/components/team/revoke-invite-button";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { ForbiddenError } from "@/server/errors";
import { invitableRoles, listInvites } from "@/server/invite";
import { prismaInviteRepository } from "@/server/invite-prisma";
import { listTeam, manageableRoles } from "@/server/team";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

function displayName(
  name: string | null,
  email: string | null,
  fallback: string,
) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  if (email) return email;
  return fallback;
}

function initials(label: string) {
  const letters = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return letters || "?";
}

export default async function TeamPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");

  const workspaceId = access.workspace.workspace.id;
  const roles = invitableRoles(access.workspace.membership.role);
  let members;
  let invites: Awaited<ReturnType<typeof listInvites>> = [];
  try {
    members = await listTeam(
      session.user.id,
      workspaceId,
      prismaWorkspaceRepository,
    );
    if (roles.length > 0) {
      invites = await listInvites(
        session.user.id,
        workspaceId,
        prismaWorkspaceRepository,
        prismaInviteRepository,
      );
    }
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/comecar");
    throw error;
  }

  const timezone = access.workspace.workspace.timezone;
  const expires = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeZone: timezone,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-0.5 rounded-md bg-frame px-3 py-2 text-frame-foreground">
        <h1 className="font-condensed text-xl font-semibold tracking-wider uppercase">
          {t("team.title")}
        </h1>
        <p className="text-sm text-frame-foreground/80">
          {t("team.description", {
            workspace: access.workspace.workspace.name,
          })}
        </p>
      </header>
      <ItemList>
        {members.map((member) => {
          const name = displayName(
            member.name,
            member.email,
            t("common.noName"),
          );
          const options = manageableRoles(
            access.workspace.membership.role,
            member.role,
          );
          return (
            <ItemListRow key={member.userId} className="flex-wrap">
              {member.image ? (
                // URL externa do Google. next/image exigiria allowlist.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.image}
                  alt=""
                  className="size-11 shrink-0 rounded-[2px] object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-divider font-condensed text-sm font-semibold text-divider-foreground"
                >
                  {initials(name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {member.email ?? t("team.emailMissing")}
                </p>
              </div>
              {options.length > 0 && member.userId !== session.user.id ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <MemberRoleForm
                    userId={member.userId}
                    role={member.role}
                    roles={options}
                  />
                  <RemoveMemberButton userId={member.userId} name={name} />
                </div>
              ) : (
                <p className="shrink-0 text-sm">
                  {t(`team.roles.${member.role}`)}
                </p>
              )}
            </ItemListRow>
          );
        })}
      </ItemList>
      {roles.length > 0 ? (
        <section className="flex flex-col gap-4">
          <header className="space-y-1">
            <h2 className="text-base font-medium">{t("team.invite")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("team.inviteHelp")}
            </p>
          </header>
          <InviteForm roles={roles} />
          {invites.length > 0 ? (
            <ItemList>
              {invites.map((invite) => (
                <ItemListRow key={invite.id} className="flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {invite.email}
                    </p>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {t(`team.roles.${invite.role}`)}
                      <StatusBadge status={invite.status}>
                        {t("team.inviteStatus", { status: invite.status })}
                      </StatusBadge>
                      {t("team.until", {
                        date: expires.format(invite.expiresAt),
                      })}
                    </p>
                  </div>
                  <RevokeInviteButton inviteId={invite.id} />
                </ItemListRow>
              ))}
            </ItemList>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

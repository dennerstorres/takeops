import type { Translate } from "../i18n/translate.ts";

export const projectRoles = [
  "PRODUCER",
  "DIRECTOR",
  "SCRIPT_WRITER",
  "PRESENTER",
  "CAMERA",
  "EDITOR",
  "REVIEWER",
  "APPROVER",
  "OTHER",
] as const;

export type ProjectRole = (typeof projectRoles)[number];

export function projectRoleLabel(t: Translate, role: ProjectRole) {
  return t(`enums.projectRole.${role}`);
}

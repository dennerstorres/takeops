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

const labels: Record<ProjectRole, string> = {
  PRODUCER: "Produtor",
  DIRECTOR: "Diretor",
  SCRIPT_WRITER: "Roteirista",
  PRESENTER: "Apresentador",
  CAMERA: "Câmera",
  EDITOR: "Editor",
  REVIEWER: "Revisor",
  APPROVER: "Aprovador",
  OTHER: "Outro",
};

export function projectRoleLabel(role: ProjectRole) {
  return labels[role];
}

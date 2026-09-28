import type { ProjectRole } from "./participant-labels.ts";

export type ParticipantRecord = {
  id: string;
  videoProjectId: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: ProjectRole;
  createdAt: Date;
};

export type ParticipantRepository = {
  list(projectId: string): Promise<ParticipantRecord[]>;
  add(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<ParticipantRecord>;
  remove(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<boolean>;
};

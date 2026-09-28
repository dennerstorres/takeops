export const aspectRatios = [
  "NINE_SIXTEEN",
  "SIXTEEN_NINE",
  "ONE_ONE",
  "FOUR_FIVE",
] as const;

export const projectPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const videoProjectStatuses = [
  "IDEA",
  "PRE_PRODUCTION",
  "SCRIPTING",
  "READY_TO_RECORD",
  "RECORDING",
  "EDITING",
  "REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export type AspectRatio = (typeof aspectRatios)[number];
export type ProjectPriority = (typeof projectPriorities)[number];
export type VideoProjectStatus = (typeof videoProjectStatuses)[number];

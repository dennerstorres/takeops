import type { Translate } from "../i18n/translate.ts";
import type { ApprovalStatus } from "./approval-repository.ts";

export function approvalStatusLabel(t: Translate, value: ApprovalStatus) {
  return t(`enums.approvalStatus.${value}`);
}

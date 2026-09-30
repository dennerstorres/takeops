import { getTranslations } from "next-intl/server";
import { revokeTeamInvite } from "@/server/invite-actions";
import { Button } from "@/components/ui/button";

export async function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const t = await getTranslations();
  return (
    <form action={revokeTeamInvite}>
      <input type="hidden" name="inviteId" value={inviteId} />
      <Button type="submit" variant="outline" className="min-h-11">
        {t("team.revoke")}
      </Button>
    </form>
  );
}

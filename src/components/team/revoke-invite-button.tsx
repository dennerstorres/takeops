import { revokeTeamInvite } from "@/server/invite-actions";
import { Button } from "@/components/ui/button";

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  return (
    <form action={revokeTeamInvite}>
      <input type="hidden" name="inviteId" value={inviteId} />
      <Button type="submit" variant="outline" className="min-h-11">
        Revogar
      </Button>
    </form>
  );
}

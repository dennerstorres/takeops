import { convertIdeaAction } from "@/server/project-actions";
import { Button } from "@/components/ui/button";

export function ConvertIdeaButton({ ideaId }: { ideaId: string }) {
  return (
    <form action={convertIdeaAction}>
      <input type="hidden" name="ideaId" value={ideaId} />
      <Button type="submit" className="min-h-11">
        Converter em vídeo
      </Button>
    </form>
  );
}

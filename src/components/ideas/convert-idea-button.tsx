import { getTranslations } from "next-intl/server";
import { convertIdeaAction } from "@/server/project-actions";
import { Button } from "@/components/ui/button";

export async function ConvertIdeaButton({ ideaId }: { ideaId: string }) {
  const t = await getTranslations();
  return (
    <form action={convertIdeaAction}>
      <input type="hidden" name="ideaId" value={ideaId} />
      <Button type="submit" className="min-h-11">
        {t("ideas.convert")}
      </Button>
    </form>
  );
}

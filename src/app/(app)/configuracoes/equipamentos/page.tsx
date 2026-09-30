import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { EmptyState } from "@/components/feedback/empty-state";
import { ItemList, ItemListRow } from "@/components/ui/item-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { openWorkspace } from "@/server/access";
import { auth } from "@/server/auth";
import { listEquipment } from "@/server/equipment";
import { equipmentCategoryLabel } from "@/server/equipment-labels";
import { prismaEquipmentRepository } from "@/server/equipment-prisma";
import { prismaWorkspaceRepository } from "@/server/workspace-prisma";

export default async function EquipmentPage() {
  const t = await getTranslations();
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const access = await openWorkspace(session.user.id);
  if (access.kind === "setup") redirect("/comecar");
  const role = access.workspace.membership.role;
  const canEdit = role === "OWNER" || role === "ADMIN";
  const items = await listEquipment(
    session.user.id,
    access.workspace.workspace.id,
    prismaWorkspaceRepository,
    prismaEquipmentRepository,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/configuracoes"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        Voltar às configurações
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Equipamentos</h1>
        <p className="text-sm text-muted-foreground">
          O que a equipe tem para usar nas gravações.
        </p>
      </header>
      {items.length === 0 ? (
        <EmptyState
          title="Nenhum equipamento"
          description="Câmeras, microfones e o resto do kit aparecem aqui."
        />
      ) : (
        <ItemList>
          {items.map((item) => (
            <ItemListRow key={item.id} className="flex-col items-stretch">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {equipmentCategoryLabel(t, item.category)}
                {item.active ? null : (
                  <>
                    {" · "}
                    <StatusBadge tone="muted">Fora de uso</StatusBadge>
                  </>
                )}
                {item.notes ? ` · ${item.notes}` : null}
              </p>
              {canEdit ? (
                <details className="mt-2">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
                    Editar
                  </summary>
                  <div className="pt-3">
                    <EquipmentForm
                      values={{
                        itemId: item.id,
                        name: item.name,
                        category: item.category,
                        notes: item.notes ?? "",
                        active: item.active,
                      }}
                    />
                  </div>
                </details>
              ) : null}
            </ItemListRow>
          ))}
        </ItemList>
      )}
      {canEdit ? (
        <section className="space-y-3">
          <h2 className="text-base font-medium">Novo equipamento</h2>
          <EquipmentForm
            values={{ name: "", category: "CAMERA", notes: "", active: true }}
          />
        </section>
      ) : null}
    </div>
  );
}

import { redirect } from "next/navigation";
import { loginWithGoogle } from "@/server/auth-actions";
import { safeNextPath } from "@/server/auth-routes";
import { auth } from "@/server/auth";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const nextPath = safeNextPath(raw);
  const session = await auth();
  if (session?.user?.id) redirect(nextPath ?? "/");

  const googleReady = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Use a conta Google da equipe para acessar a produção.
        </p>
      </div>
      {googleReady ? (
        <form action={loginWithGoogle}>
          {nextPath ? (
            <input type="hidden" name="callbackUrl" value={nextPath} />
          ) : null}
          <Button type="submit" className="min-h-11 w-full">
            Continuar com Google
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          O login Google ainda não está configurado.
        </p>
      )}
    </main>
  );
}

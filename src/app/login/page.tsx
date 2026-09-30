import { redirect } from "next/navigation";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { loginWithGoogle } from "@/server/auth-actions";
import { safeNextPath } from "@/server/auth-routes";
import { auth } from "@/server/auth";
import { loginMethods } from "@/server/env";
import { Button } from "@/components/ui/button";
import { surfaceClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const methods = loginMethods(process.env);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <section className={cn(surfaceClass, "flex flex-col gap-6 p-6")}>
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Entre com a sua conta para acessar a produção.
          </p>
        </div>
        {methods.google ? (
          <form action={loginWithGoogle}>
            {nextPath ? (
              <input type="hidden" name="callbackUrl" value={nextPath} />
            ) : null}
            <Button type="submit" className="w-full">
              Continuar com Google
            </Button>
          </form>
        ) : null}
        {methods.google && methods.email ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}
        {methods.email ? (
          <EmailLoginForm callbackUrl={nextPath ?? undefined} />
        ) : null}
        {!methods.google && !methods.email ? (
          <p className="text-sm text-muted-foreground">
            Nenhum método de login está configurado.
          </p>
        ) : null}
      </section>
    </main>
  );
}

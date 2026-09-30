import Link from "next/link";
import { surfaceClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function VerifyRequestPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <section className={cn(surfaceClass, "flex flex-col gap-3 p-6")}>
        <h1 className="text-2xl font-medium tracking-tight">
          Confira seu e-mail
        </h1>
        <p className="text-sm text-muted-foreground">
          Enviamos um link para entrar. Ele vale por 24 horas e só pode ser
          usado uma vez. Se não chegar em alguns minutos, olhe o spam.
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}

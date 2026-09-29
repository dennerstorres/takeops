import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-3 px-4">
      <h1 className="text-2xl font-medium tracking-tight">
        Página não encontrada
      </h1>
      <p className="text-sm text-muted-foreground">
        O endereço não existe ou você não tem acesso a ele.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline"
      >
        Ir para o início
      </Link>
    </main>
  );
}

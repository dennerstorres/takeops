import { LoadingState } from "@/components/feedback/loading-state";

// Modo Gravação: retorno imediato ao abrir a tela no celular.
export default function RecordLoading() {
  return (
    <div className="mx-auto w-full max-w-md p-4">
      <LoadingState />
    </div>
  );
}

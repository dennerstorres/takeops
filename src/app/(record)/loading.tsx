import { LoadingState } from "@/components/feedback/loading-state";

// Modo Gravação: retorno imediato ao abrir a tela no celular.
export default function RecordLoading() {
  return (
    <div className="w-full p-4">
      <LoadingState />
    </div>
  );
}

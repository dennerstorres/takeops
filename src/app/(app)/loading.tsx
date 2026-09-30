import { LoadingState } from "@/components/feedback/loading-state";

// Retorno imediato ao navegar enquanto a página busca no servidor (spec §56).
export default function AppLoading() {
  return (
    <div className="w-full">
      <LoadingState />
    </div>
  );
}

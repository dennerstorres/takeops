// Forma mínima do `t` do next-intl. Serviços e rótulos recebem o tradutor
// por parâmetro para continuarem testáveis fora do Next.
export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

import { EntradaCustos, ResultadoCustos } from "./schema";
import { TaxConfig, AppConfig } from "../../config";
import { calcularCustos, ContextoCalculoCustos } from "./engine";

export interface CenárioQuantidadeItem {
  quantidade: number;
  precoUnitarioFob?: string;
}

export function compararCenarios(
  cenarios: CenárioQuantidadeItem[],
  entradaBase: Omit<EntradaCustos, "quantidade" | "precoUnitarioFob">,
  taxConfig: TaxConfig,
  appConfig: AppConfig,
  contexto: ContextoCalculoCustos = {}
): ResultadoCustos[] {
  return cenarios.map((c) => {
    const entrada: EntradaCustos = {
      ...entradaBase,
      quantidade: c.quantidade,
      precoUnitarioFob: c.precoUnitarioFob,
    };
    return calcularCustos(entrada, taxConfig, appConfig, contexto);
  });
}

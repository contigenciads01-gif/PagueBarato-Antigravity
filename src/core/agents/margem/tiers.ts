import { FeesConfig } from "../../config";
import { fromString, Money } from "../../money";

export interface CustosFaixaMl {
  tarifaFixa: Money;
  freteVendedor: Money;
  descricaoFaixa: string;
}

export function resolverCustosFaixa(
  precoVendaCandidato: Money,
  pesoCobradoKg: string,
  logistica: string,
  feesConfig: FeesConfig,
  overrides: Record<string, string> = {}
): CustosFaixaMl {
  let tarifaFixa = fromString(overrides["tarifa_fixa"] || "0");
  let freteVendedor = fromString(overrides["frete_vendedor"] || "0");
  let descricaoFaixa = "Sem faixa definida";

  // Busca na tabela de tarifa fixa
  if (!overrides["tarifa_fixa"]) {
    for (const item of feesConfig.tarifa_fixa.itens) {
      const de = fromString(item.de);
      const ate = fromString(item.ate);
      if (
        precoVendaCandidato.greaterThanOrEqualTo(de) &&
        precoVendaCandidato.lessThanOrEqualTo(ate)
      ) {
        if (item.valor.valor !== null) {
          tarifaFixa = fromString(String(item.valor.valor));
          descricaoFaixa = `Preço entre R$ ${item.de} e R$ ${item.ate}`;
        }
        break;
      }
    }
  }

  // Busca na tabela de frete
  if (!overrides["frete_vendedor"]) {
    const peso = fromString(pesoCobradoKg);
    for (const item of feesConfig.frete_vendedor.itens) {
      if (item.logistica !== logistica) continue;
      const pMin = fromString(item.faixa_peso_min_kg);
      const pMax = fromString(item.faixa_peso_max_kg);
      const prMin = fromString(item.faixa_preco_min);
      const prMax = fromString(item.faixa_preco_max);

      if (
        peso.greaterThanOrEqualTo(pMin) &&
        peso.lessThanOrEqualTo(pMax) &&
        precoVendaCandidato.greaterThanOrEqualTo(prMin) &&
        precoVendaCandidato.lessThanOrEqualTo(prMax)
      ) {
        if (item.valor.valor !== null) {
          freteVendedor = fromString(String(item.valor.valor));
        }
        break;
      }
    }
  }

  return { tarifaFixa, freteVendedor, descricaoFaixa };
}

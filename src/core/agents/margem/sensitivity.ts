import { EntradaMargem } from "./schema";
import { FeesConfig, TaxConfig, AppConfig } from "../../config";
import { calcularMargem } from "./engine";
import { fromString, add, sub, toStorageString } from "../../money";

export interface ItemSensibilidade {
  fator: string;
  variacao: string;
  impactoMargemPct: string;
  novaMargemPct: string;
}

export function analisarSensibilidade(
  entradaBase: EntradaMargem,
  passoPct: string,
  feesConfig: FeesConfig,
  taxConfig: TaxConfig,
  appConfig: AppConfig
): ItemSensibilidade[] {
  const base = calcularMargem(entradaBase, feesConfig, taxConfig, appConfig);
  if (!base.margemPercentual) return [];

  const margemBase = fromString(base.margemPercentual);
  const passo = fromString(passoPct);
  const itens: ItemSensibilidade[] = [];

  // Variação de Custo de Formação de Preço
  const custoMais = toStorageString(add(fromString(entradaBase.custoUnitarioFormacaoPrecoBrl), passo));
  const resCustoMais = calcularMargem(
    { ...entradaBase, custoUnitarioFormacaoPrecoBrl: custoMais, modo: "B_MARGEM_DO_PRECO", precoInformadoBrl: base.precoVenda },
    feesConfig,
    taxConfig,
    appConfig
  );
  if (resCustoMais.margemPercentual) {
    const diff = sub(fromString(resCustoMais.margemPercentual), margemBase);
    itens.push({
      fator: "Custo Unitário",
      variacao: `+R$ ${passoPct}`,
      impactoMargemPct: toStorageString(diff),
      novaMargemPct: resCustoMais.margemPercentual,
    });
  }

  // Variação de Marketing
  const mktMais = toStorageString(add(fromString(entradaBase.marketingValor), passo));
  const resMktMais = calcularMargem(
    { ...entradaBase, marketingValor: mktMais, modo: "B_MARGEM_DO_PRECO", precoInformadoBrl: base.precoVenda },
    feesConfig,
    taxConfig,
    appConfig
  );
  if (resMktMais.margemPercentual) {
    const diff = sub(fromString(resMktMais.margemPercentual), margemBase);
    itens.push({
      fator: "Marketing",
      variacao: `+${passoPct}%`,
      impactoMargemPct: toStorageString(diff),
      novaMargemPct: resMktMais.margemPercentual,
    });
  }

  // Ordenar por maior impacto absoluto
  return itens.sort((a, b) =>
    fromString(b.impactoMargemPct).abs().comparedTo(fromString(a.impactoMargemPct).abs())
  );
}

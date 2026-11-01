import {
  EntradaMargemInput,
  ResultadoMargem,
  LinhaMargem,
  EntradaMargemSchema,
} from "./schema";
import { FeesConfig, TaxConfig, AppConfig } from "../../config";
import {
  fromString,
  add,
  sub,
  mul,
  div,
  pct,
  roundCeil,
  roundHalfUp,
  toStorageString,
  ZERO,
  Money,
} from "../../money";
import Decimal from "decimal.js";
import { resolverCustosFaixa } from "./tiers";
import { calcularResumoConcorrentes } from "../../../core/produtos/derived";

export const VERSAO_MOTOR_MARGEM = "1.0.0";

export function calcularMargem(
  entradaRaw: EntradaMargemInput,
  feesConfig: FeesConfig,
  taxConfig: TaxConfig,
  appConfig: AppConfig,
  precosReferenciaConcorrentes: Array<{ valor: string; dataColeta?: string }> = []
): ResultadoMargem {
  const entrada = EntradaMargemSchema.parse(entradaRaw);
  const alertas: string[] = [];
  const pendencias: string[] = [];
  const statusOrigem = entrada.statusCustoOrigem || "CONFIRMADO";
  let statusGeral: "CONFIRMADO" | "SIMULACAO" | "CONFIG_PENDENTE" = statusOrigem;

  const overrides = entrada.overridesConfig || {};
  if (Object.keys(overrides).length > 0) {
    statusGeral = "SIMULACAO";
  }

  // 1. Obter comissão do Mercado Livre
  let comissaoPctStr = overrides["comissao_ml"] || null;
  if (!comissaoPctStr) {
    const itemComissao = feesConfig.comissao_ml.itens.find(
      (i) =>
        i.categoria === entrada.categoriaMl &&
        i.tipo_anuncio === entrada.tipoAnuncio
    );
    if (!itemComissao || itemComissao.percentual.valor === null) {
      pendencias.push(
        `fees_config.comissao_ml (${entrada.categoriaMl} / ${entrada.tipoAnuncio}) não preenchida`
      );
    } else {
      comissaoPctStr = String(itemComissao.percentual.valor);
      if (itemComissao.percentual.status !== "CONFIRMADO") {
        statusGeral = "SIMULACAO";
      }
    }
  }

  // 2. Imposto sobre a venda
  let impostoVendaPctStr = overrides["imposto_venda"] || null;
  if (!impostoVendaPctStr) {
    const itemImposto = taxConfig.venda.imposto_sobre_venda_percentual_efetivo;
    if (itemImposto.valor === null || itemImposto.valor === undefined) {
      pendencias.push("tax_config.venda.imposto_sobre_venda não configurado");
    } else {
      impostoVendaPctStr = String(itemImposto.valor);
      if (itemImposto.status !== "CONFIRMADO") {
        statusGeral = "SIMULACAO";
      }
    }
  }

  if (pendencias.length > 0) {
    return {
      status: "CONFIG_PENDENTE",
      modo: entrada.modo,
      precoVenda: null,
      lucroUnitario: null,
      margemPercentual: null,
      markupPercentual: null,
      precoMinimoEquilibrio: null,
      linhas: [],
      faixaAplicada: null,
      comparacaoConcorrentes: null,
      alertas,
      pendencias,
      versaoMotor: VERSAO_MOTOR_MARGEM,
      configSnapshot: { feesConfig, taxConfig, appConfig },
      calculoCustosId: entrada.calculoCustosId,
    };
  }

  const custoUnitario = fromString(entrada.custoUnitarioFormacaoPrecoBrl || "0");
  const embalagem = fromString(entrada.embalagemUnitariaBrl || "0");
  const custosFixos = fromString(entrada.custosFixosRateadosBrl || "0");
  const comissaoPct = fromString(comissaoPctStr!);
  const impostoPct = fromString(impostoVendaPctStr!);
  const perdasPct = fromString(entrada.perdasDevolucoesPct || "0");

  let marketingPct = ZERO;
  let marketingFixo = ZERO;
  if (entrada.marketingModo === "percentual_preco") {
    marketingPct = fromString(entrada.marketingValor || "0");
  } else {
    marketingFixo = fromString(entrada.marketingValor || "0");
  }

  function calcularPrecoPorIteracao(
    margemPctAlvo: Money,
    lucroFixoAlvo: Money,
    precoTentativa = custoUnitario
  ): { preco: Money; tarifaFixa: Money; frete: Money; faixa: string } {
    let tarifaFixa = ZERO;
    let frete = ZERO;
    let faixa = "";

    // Iteração para convergir faixa de preço ML
    let pAtual = precoTentativa;
    for (let iter = 0; iter < 4; iter++) {
      const resFaixa = resolverCustosFaixa(
        pAtual,
        entrada.pesoCobradoKg,
        entrada.logistica,
        feesConfig,
        overrides
      );
      tarifaFixa = resFaixa.tarifaFixa;
      frete = resFaixa.freteVendedor;
      faixa = resFaixa.descricaoFaixa;

      // Numerador: Custos fixos absolutos
      const numerador = add(
        add(add(custoUnitario, embalagem), custosFixos),
        add(add(tarifaFixa, frete), add(marketingFixo, lucroFixoAlvo))
      );

      // Denominador: 1 - Soma dos percentuais
      const somaPct = add(add(add(comissaoPct, impostoPct), marketingPct), add(perdasPct, margemPctAlvo));
      const somaPctDecimal = div(somaPct, new Decimal(100));

      if (somaPctDecimal.greaterThanOrEqualTo(new Decimal(1))) {
        throw new Error("Soma dos percentuais de taxas, impostos e margem ultrapassa 100%");
      }

      const divisor = sub(new Decimal(1), somaPctDecimal);
      const novoPreco = roundCeil(div(numerador, divisor));

      if (novoPreco.equals(pAtual)) break;
      pAtual = novoPreco;
    }

    return { preco: pAtual, tarifaFixa, frete, faixa };
  }

  let precoFinal = ZERO;
  let lucroFinal = ZERO;
  let margemFinal = ZERO;
  let markupFinal = ZERO;
  let tarifaFixaFinal = ZERO;
  let freteFinal = ZERO;
  let faixaDesc = "";

  // Resolução dos Modos
  if (entrada.modo === "B_MARGEM_DO_PRECO") {
    if (!entrada.precoInformadoBrl) {
      throw new Error("Modo B exige campo precoInformadoBrl");
    }
    precoFinal = fromString(entrada.precoInformadoBrl);
    const resFaixa = resolverCustosFaixa(
      precoFinal,
      entrada.pesoCobradoKg,
      entrada.logistica,
      feesConfig,
      overrides
    );
    tarifaFixaFinal = resFaixa.tarifaFixa;
    freteFinal = resFaixa.freteVendedor;
    faixaDesc = resFaixa.descricaoFaixa;

    const comissaoVal = pct(precoFinal, comissaoPct);
    const impostoVal = pct(precoFinal, impostoPct);
    const marketingVal = entrada.marketingModo === "percentual_preco" ? pct(precoFinal, marketingPct) : marketingFixo;
    const perdasVal = pct(precoFinal, perdasPct);

    const totalCustosDeducoes = add(
      add(add(custoUnitario, embalagem), custosFixos),
      add(add(tarifaFixaFinal, freteFinal), add(add(comissaoVal, impostoVal), add(marketingVal, perdasVal)))
    );

    lucroFinal = sub(precoFinal, totalCustosDeducoes);
    margemFinal = roundHalfUp(mul(div(lucroFinal, precoFinal), new Decimal(100)));
    markupFinal = roundHalfUp(mul(div(lucroFinal, custoUnitario), new Decimal(100)));
  } else if (entrada.modo === "C_PONTO_EQUILIBRIO") {
    const res = calcularPrecoPorIteracao(ZERO, ZERO);
    precoFinal = res.preco;
    tarifaFixaFinal = res.tarifaFixa;
    freteFinal = res.frete;
    faixaDesc = res.faixa;
    lucroFinal = ZERO;
    margemFinal = ZERO;
    markupFinal = ZERO;
  } else {
    // Modo A: Preço Alvo
    let margemPctAlvo = ZERO;
    let lucroFixoAlvo = ZERO;

    if (entrada.alvoTipo === "MARGEM_PCT") {
      margemPctAlvo = fromString(entrada.alvoValor);
    } else if (entrada.alvoTipo === "LUCRO_BRL") {
      lucroFixoAlvo = fromString(entrada.alvoValor);
    } else if (entrada.alvoTipo === "MARKUP_PCT") {
      const markupAlvo = fromString(entrada.alvoValor);
      lucroFixoAlvo = pct(custoUnitario, markupAlvo);
    }

    const res = calcularPrecoPorIteracao(margemPctAlvo, lucroFixoAlvo);
    precoFinal = res.preco;
    tarifaFixaFinal = res.tarifaFixa;
    freteFinal = res.frete;
    faixaDesc = res.faixa;

    // Recalcular métricas reais sobre o preço arredondado
    const comissaoVal = pct(precoFinal, comissaoPct);
    const impostoVal = pct(precoFinal, impostoPct);
    const marketingVal = entrada.marketingModo === "percentual_preco" ? pct(precoFinal, marketingPct) : marketingFixo;
    const perdasVal = pct(precoFinal, perdasPct);

    const totalCustos = add(
      add(add(custoUnitario, embalagem), custosFixos),
      add(add(tarifaFixaFinal, freteFinal), add(add(comissaoVal, impostoVal), add(marketingVal, perdasVal)))
    );

    lucroFinal = sub(precoFinal, totalCustos);
    margemFinal = roundHalfUp(mul(div(lucroFinal, precoFinal), new Decimal(100)));
    markupFinal = roundHalfUp(mul(div(lucroFinal, custoUnitario), new Decimal(100)));
  }

  // Preço de equilíbrio mínimo
  const eq = calcularPrecoPorIteracao(ZERO, ZERO);
  const precoMinimoEquilibrio = eq.preco;

  // Linhas da memória de cálculo
  const linhas: LinhaMargem[] = [
    {
      codigo: "CUSTO_IMPORTACAO",
      rotulo: "Custo de Formação de Preço",
      formulaTexto: "Custo unitário apurado na importação",
      base: toStorageString(custoUnitario),
      percentual: null,
      valor: toStorageString(custoUnitario),
      origemConfig: "Motor Custos P3",
      statusItem: entrada.statusCustoOrigem,
    },
    {
      codigo: "COMISSAO_ML",
      rotulo: "Comissão Mercado Livre",
      formulaTexto: `${toStorageString(precoFinal)} × ${toStorageString(comissaoPct)}%`,
      base: toStorageString(precoFinal),
      percentual: toStorageString(comissaoPct),
      valor: toStorageString(pct(precoFinal, comissaoPct)),
      origemConfig: "fees_config.comissao_ml",
      statusItem: overrides["comissao_ml"] ? "SIMULACAO" : "CONFIRMADO",
    },
    {
      codigo: "TARIFA_FIXA_ML",
      rotulo: "Tarifa Fixa Mercado Livre",
      formulaTexto: `Faixa de preço: ${faixaDesc}`,
      base: toStorageString(precoFinal),
      percentual: null,
      valor: toStorageString(tarifaFixaFinal),
      origemConfig: "fees_config.tarifa_fixa",
      statusItem: overrides["tarifa_fixa"] ? "SIMULACAO" : "CONFIRMADO",
    },
    {
      codigo: "FRETE_VENDEDOR_ML",
      rotulo: "Frete a Cargo do Vendedor",
      formulaTexto: `Logística ${entrada.logistica}`,
      base: entrada.pesoCobradoKg,
      percentual: null,
      valor: toStorageString(freteFinal),
      origemConfig: "fees_config.frete_vendedor",
      statusItem: overrides["frete_vendedor"] ? "SIMULACAO" : "CONFIRMADO",
    },
    {
      codigo: "IMPOSTO_VENDA",
      rotulo: "Imposto sobre a Venda",
      formulaTexto: `${toStorageString(precoFinal)} × ${toStorageString(impostoPct)}%`,
      base: toStorageString(precoFinal),
      percentual: toStorageString(impostoPct),
      valor: toStorageString(pct(precoFinal, impostoPct)),
      origemConfig: "tax_config.venda.imposto_sobre_venda",
      statusItem: overrides["imposto_venda"] ? "SIMULACAO" : "CONFIRMADO",
    },
  ];

  // Comparação com concorrentes
  let comparacaoConcorrentes = null;
  if (precosReferenciaConcorrentes.length > 0) {
    const resumo = calcularResumoConcorrentes(precosReferenciaConcorrentes);
    if (resumo.mediana) {
      const difBrl = sub(precoFinal, resumo.mediana);
      const difPct = mul(div(difBrl, resumo.mediana), new Decimal(100));

      let posicao = "NA_MEDIANA";
      if (precoFinal.lessThan(resumo.mediana)) posicao = "ABAIXO_MEDIANA";
      else if (precoFinal.greaterThan(resumo.mediana)) posicao = "ACIMA_MEDIANA";

      comparacaoConcorrentes = {
        menor: resumo.menor ? toStorageString(resumo.menor) : null,
        mediana: toStorageString(resumo.mediana),
        maior: resumo.maior ? toStorageString(resumo.maior) : null,
        posicao,
        diferencaParaMedianaBrl: toStorageString(difBrl),
        diferencaParaMedianaPct: toStorageString(roundHalfUp(difPct)),
        aviso: resumo.quantidade < 3 ? "Menos de 3 concorrentes cadastrados" : null,
      };
    }
  }

  return {
    status: statusGeral,
    modo: entrada.modo,
    precoVenda: toStorageString(precoFinal),
    lucroUnitario: toStorageString(lucroFinal),
    margemPercentual: toStorageString(margemFinal),
    markupPercentual: toStorageString(markupFinal),
    precoMinimoEquilibrio: toStorageString(precoMinimoEquilibrio),
    linhas,
    faixaAplicada: faixaDesc,
    comparacaoConcorrentes,
    alertas,
    pendencias,
    versaoMotor: VERSAO_MOTOR_MARGEM,
    configSnapshot: { feesConfig, taxConfig, appConfig },
    calculoCustosId: entrada.calculoCustosId,
  };
}

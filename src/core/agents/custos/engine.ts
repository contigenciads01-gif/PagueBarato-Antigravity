import {
  EntradaCustos,
  ResultadoCustos,
  LinhaCusto,
  PendenciaConfig,
} from "./schema";
import { TaxConfig, AppConfig } from "../../config";
import {
  fromString,
  add,
  sub,
  mul,
  div,
  pct,
  roundHalfUp,
  toStorageString,
  ZERO,
  Money,
} from "../../money";
import Decimal from "decimal.js";
import { obterPipelineTributos } from "./pipeline";

export const VERSAO_MOTOR_CUSTOS = "1.0.0";

export interface ContextoCalculoCustos {
  pesoCobradoKg?: string;
  volumeM3?: string;
}

export function calcularCustos(
  entrada: EntradaCustos,
  taxConfig: TaxConfig,
  appConfig: AppConfig,
  contexto: ContextoCalculoCustos = {}
): ResultadoCustos {
  const alertas: string[] = [];
  const pendencias: PendenciaConfig[] = [];
  let isSimulacao = false;

  const overrides = entrada.overridesConfig || {};
  if (Object.keys(overrides).length > 0 || entrada.cambioOverride) {
    isSimulacao = true;
  }

  // 1. Câmbio
  let cambioStr: string | null = entrada.cambioOverride || null;
  let cambioStatus = "CONFIRMADO";

  if (!cambioStr) {
    const configItem =
      entrada.moeda === "USD"
        ? appConfig.cambio_usd_brl
        : appConfig.cambio_cny_brl;

    if (configItem.valor === null || configItem.valor === undefined) {
      pendencias.push({
        caminho: `app_config.cambio_${entrada.moeda.toLowerCase()}_brl`,
        rotulo: `Câmbio ${entrada.moeda}→BRL`,
        oQueFazer: "Preencher a cotação oficial do câmbio em app_config.json",
      });
    } else {
      cambioStr = String(configItem.valor);
      cambioStatus = configItem.status;
      if (cambioStatus !== "CONFIRMADO") {
        isSimulacao = true;
      }
    }
  }

  // Se câmbio ainda for null, paramos cedo e devolvemos CONFIG_PENDENTE
  if (!cambioStr) {
    return {
      status: "CONFIG_PENDENTE",
      regime: entrada.regime,
      quantidade: entrada.quantidade,
      fobTotalBrl: null,
      valorAduaneiroBrl: null,
      totalTributosBrl: null,
      totalDespesasBrl: null,
      custoTotalDesembolsadoBrl: null,
      custoTotalFormacaoPrecoBrl: null,
      custoUnitarioDesembolsadoBrl: null,
      custoUnitarioFormacaoPrecoBrl: null,
      linhas: [],
      alertas,
      pendencias,
      versaoMotor: VERSAO_MOTOR_CUSTOS,
      configSnapshot: { taxConfig, appConfig },
    };
  }

  const cambio = fromString(cambioStr);
  const precoFobMoedaOrigem = fromString(entrada.precoUnitarioFob || "0");
  const precoFobBrl = mul(precoFobMoedaOrigem, cambio);
  const qtd = new Decimal(entrada.quantidade);
  const fobTotalBrl = mul(precoFobBrl, qtd);

  // 2. Frete internacional
  let freteIntBrl = ZERO;
  if (entrada.freteInternacional.modo === "total") {
    freteIntBrl = fromString(entrada.freteInternacional.valor);
  } else if (entrada.freteInternacional.modo === "por_kg") {
    const peso = fromString(contexto.pesoCobradoKg || "0");
    const taxaKg = fromString(entrada.freteInternacional.valor);
    freteIntBrl = mul(mul(peso, taxaKg), qtd);
  } else if (entrada.freteInternacional.modo === "por_m3") {
    const vol = fromString(contexto.volumeM3 || "0");
    const taxaM3 = fromString(entrada.freteInternacional.valor);
    freteIntBrl = mul(mul(vol, taxaM3), qtd);
  }

  // 3. Seguro internacional
  let seguroIntBrl = ZERO;
  if (entrada.seguroInternacional.modo === "total") {
    seguroIntBrl = fromString(entrada.seguroInternacional.valor);
  } else if (entrada.seguroInternacional.modo === "percentual_fob") {
    seguroIntBrl = pct(fobTotalBrl, fromString(entrada.seguroInternacional.valor));
  }

  // Frete interno China
  let freteChinaBrl = ZERO;
  if (entrada.freteInternoChina) {
    freteChinaBrl = mul(fromString(entrada.freteInternoChina), cambio);
  }

  const valorAduaneiroBrl = add(add(add(fobTotalBrl, freteIntBrl), seguroIntBrl), freteChinaBrl);

  const linhas: LinhaCusto[] = [];
  const mapaBases: Record<string, Money> = {
    valor_aduaneiro: valorAduaneiroBrl,
    frete_internacional: freteIntBrl,
    despesas_aduaneiras: ZERO,
  };

  let totalTributos = ZERO;
  let totalCreditosRecuperaveis = ZERO;

  // 4. Regime de importação
  if (entrada.regime === "REMESSA_PF") {
    alertas.push("Cenário de pessoa física. Não usar para revenda sem validação do contador.");

    const cfgPf = taxConfig.regimes.REMESSA_PF;
    const aliquotaII = overrides["remessa_pf.ii"] || (cfgPf.aliquota_ii_ate_limite.valor !== null ? String(cfgPf.aliquota_ii_ate_limite.valor) : null);
    const aliquotaICMS = overrides["remessa_pf.icms"] || (cfgPf.aliquota_icms.valor !== null ? String(cfgPf.aliquota_icms.valor) : null);

    if (!aliquotaII) {
      pendencias.push({
        caminho: "tax_config.regimes.REMESSA_PF.aliquota_ii_ate_limite",
        rotulo: "Alíquota II (Remessa PF)",
        oQueFazer: "Informar alíquota vigente da Remessa Conforme",
      });
    }
    if (!aliquotaICMS) {
      pendencias.push({
        caminho: "tax_config.regimes.REMESSA_PF.aliquota_icms",
        rotulo: "Alíquota ICMS (Remessa PF)",
        oQueFazer: "Informar alíquota de ICMS para remessa postal",
      });
    }

    if (pendencias.length > 0) {
      return {
        status: "CONFIG_PENDENTE",
        regime: entrada.regime,
        quantidade: entrada.quantidade,
        fobTotalBrl: null,
        valorAduaneiroBrl: null,
        totalTributosBrl: null,
        totalDespesasBrl: null,
        custoTotalDesembolsadoBrl: null,
        custoTotalFormacaoPrecoBrl: null,
        custoUnitarioDesembolsadoBrl: null,
        custoUnitarioFormacaoPrecoBrl: null,
        linhas: [],
        alertas,
        pendencias,
        versaoMotor: VERSAO_MOTOR_CUSTOS,
        configSnapshot: { taxConfig, appConfig },
      };
    }

    const valorII = roundHalfUp(pct(valorAduaneiroBrl, fromString(aliquotaII!)));
    // ICMS Remessa por dentro: Base = (Valor Aduaneiro + II) / (1 - aliq)
    const baseIcms = div(add(valorAduaneiroBrl, valorII), sub(new Decimal(1), div(fromString(aliquotaICMS!), new Decimal(100))));
    const valorICMS = roundHalfUp(pct(baseIcms, fromString(aliquotaICMS!)));

    totalTributos = add(valorII, valorICMS);

    linhas.push({
      codigo: "II_PF",
      rotulo: "Imposto de Importação (Remessa PF)",
      formulaTexto: `Valor Aduaneiro (${toStorageString(valorAduaneiroBrl)}) × ${aliquotaII}%`,
      base: toStorageString(valorAduaneiroBrl),
      aliquota: `${aliquotaII}%`,
      valor: toStorageString(valorII),
      origemConfig: "REMESSA_PF.aliquota_ii",
      statusItem: overrides["remessa_pf.ii"] ? "SIMULACAO" : "CONFIRMADO",
      creditoRecuperavel: false,
    });

    linhas.push({
      codigo: "ICMS_PF",
      rotulo: "ICMS (Remessa PF - por dentro)",
      formulaTexto: `(Valor Aduaneiro + II) / (1 - ${aliquotaICMS}%) × ${aliquotaICMS}%`,
      base: toStorageString(baseIcms),
      aliquota: `${aliquotaICMS}%`,
      valor: toStorageString(valorICMS),
      origemConfig: "REMESSA_PF.aliquota_icms",
      statusItem: overrides["remessa_pf.icms"] ? "SIMULACAO" : "CONFIRMADO",
      creditoRecuperavel: false,
    });
  } else {
    // IMPORTACAO_PJ_DESPACHO
    const pipeline = obterPipelineTributos(taxConfig.regimes.IMPORTACAO_PJ_DESPACHO.tributos);

    for (const trib of pipeline) {
      if (trib.apenas_via && trib.apenas_via !== entrada.via) {
        continue;
      }

      const overrideAliq = overrides[`tributo.${trib.codigo}`];
      let aliqStr: string | null = overrideAliq || null;
      let statusItem: "CONFIRMADO" | "SIMULACAO" | "A_CONFIRMAR" = "CONFIRMADO";

      if (overrideAliq) {
        statusItem = "SIMULACAO";
      } else if (trib.aliquota) {
        if (trib.aliquota.valor === null || trib.aliquota.valor === undefined) {
          pendencias.push({
            caminho: `tax_config.tributos.${trib.codigo}.aliquota`,
            rotulo: trib.rotulo,
            oQueFazer: `Informar alíquota vigente para ${trib.rotulo}`,
          });
        } else {
          aliqStr = String(trib.aliquota.valor);
          statusItem = trib.aliquota.status as "CONFIRMADO" | "A_CONFIRMAR";
          if (statusItem !== "CONFIRMADO") isSimulacao = true;
        }
      } else if (trib.valor_fixo) {
        if (trib.valor_fixo.valor === null || trib.valor_fixo.valor === undefined) {
          pendencias.push({
            caminho: `tax_config.tributos.${trib.codigo}.valor_fixo`,
            rotulo: trib.rotulo,
            oQueFazer: `Informar valor fixo de ${trib.rotulo}`,
          });
        } else {
          aliqStr = String(trib.valor_fixo.valor);
          statusItem = trib.valor_fixo.status as "CONFIRMADO" | "A_CONFIRMAR";
          if (statusItem !== "CONFIRMADO") isSimulacao = true;
        }
      }

      if (!aliqStr) continue;

      let baseCalculada = ZERO;
      for (const comp of trib.base) {
        baseCalculada = add(baseCalculada, mapaBases[comp] || ZERO);
      }

      let valorTributo = ZERO;
      let formulaTexto = "";

      if (trib.por_dentro) {
        // base = soma / (1 - aliquota)
        const aliqDec = div(fromString(aliqStr), new Decimal(100));
        const divisor = sub(new Decimal(1), aliqDec);
        const basePorDentro = div(baseCalculada, divisor);
        valorTributo = roundHalfUp(mul(basePorDentro, aliqDec));
        formulaTexto = `(${trib.base.join(" + ")}) ÷ (1 - ${aliqStr}%) × ${aliqStr}%`;
        mapaBases[trib.codigo.toLowerCase()] = valorTributo;
      } else if (trib.por_registro) {
        valorTributo = roundHalfUp(fromString(aliqStr));
        formulaTexto = `Valor fixo por registro: ${aliqStr}`;
        mapaBases[trib.codigo.toLowerCase()] = valorTributo;
      } else {
        valorTributo = roundHalfUp(pct(baseCalculada, fromString(aliqStr)));
        formulaTexto = `Base (${trib.base.join(" + ")}) × ${aliqStr}%`;
        mapaBases[trib.codigo.toLowerCase()] = valorTributo;
      }

      totalTributos = add(totalTributos, valorTributo);

      const podeCreditar =
        trib.credito_recuperavel.sim_nao === true &&
        taxConfig.venda.regime_tributario.status === "CONFIRMADO";

      if (podeCreditar) {
        totalCreditosRecuperaveis = add(totalCreditosRecuperaveis, valorTributo);
      }

      linhas.push({
        codigo: trib.codigo,
        rotulo: trib.rotulo,
        formulaTexto,
        base: toStorageString(baseCalculada),
        aliquota: trib.por_registro ? "Fixo" : `${aliqStr}%`,
        valor: toStorageString(valorTributo),
        origemConfig: `tax_config.${trib.codigo}`,
        statusItem,
        creditoRecuperavel: podeCreditar,
      });
    }
  }

  if (pendencias.length > 0) {
    return {
      status: "CONFIG_PENDENTE",
      regime: entrada.regime,
      quantidade: entrada.quantidade,
      fobTotalBrl: null,
      valorAduaneiroBrl: null,
      totalTributosBrl: null,
      totalDespesasBrl: null,
      custoTotalDesembolsadoBrl: null,
      custoTotalFormacaoPrecoBrl: null,
      custoUnitarioDesembolsadoBrl: null,
      custoUnitarioFormacaoPrecoBrl: null,
      linhas: [],
      alertas,
      pendencias,
      versaoMotor: VERSAO_MOTOR_CUSTOS,
      configSnapshot: { taxConfig, appConfig },
    };
  }

  // 5. Despesas Nacionais e Adicionais
  let totalDespesas = ZERO;
  for (const desp of entrada.despesasNacionais) {
    const val = fromString(desp.valor);
    totalDespesas = add(totalDespesas, val);
  }

  // Comissão do agente na China
  if (entrada.comissaoAgentePercentual) {
    const comissaoAgente = roundHalfUp(pct(fobTotalBrl, fromString(entrada.comissaoAgentePercentual)));
    totalDespesas = add(totalDespesas, comissaoAgente);
  }

  // 6. Totais e custos unitários
  const custoTotalDesembolsado = add(add(valorAduaneiroBrl, totalTributos), totalDespesas);
  const custoTotalFormacaoPreco = sub(custoTotalDesembolsado, totalCreditosRecuperaveis);

  const custoUnitarioDesembolsado = div(custoTotalDesembolsado, qtd);
  const custoUnitarioFormacaoPreco = div(custoTotalFormacaoPreco, qtd);

  if (totalCreditosRecuperaveis.isZero() && entrada.regime === "IMPORTACAO_PJ_DESPACHO") {
    alertas.push("Créditos tributários não foram deduzidos (regime fiscal A_CONFIRMAR ou tributos não creditáveis).");
  }

  return {
    status: isSimulacao ? "SIMULACAO" : "CONFIRMADO",
    regime: entrada.regime,
    quantidade: entrada.quantidade,
    fobTotalBrl: toStorageString(fobTotalBrl),
    valorAduaneiroBrl: toStorageString(valorAduaneiroBrl),
    totalTributosBrl: toStorageString(totalTributos),
    totalDespesasBrl: toStorageString(totalDespesas),
    custoTotalDesembolsadoBrl: toStorageString(custoTotalDesembolsado),
    custoTotalFormacaoPrecoBrl: toStorageString(custoTotalFormacaoPreco),
    custoUnitarioDesembolsadoBrl: toStorageString(custoUnitarioDesembolsado),
    custoUnitarioFormacaoPrecoBrl: toStorageString(custoUnitarioFormacaoPreco),
    linhas,
    alertas,
    pendencias,
    versaoMotor: VERSAO_MOTOR_CUSTOS,
    configSnapshot: { taxConfig, appConfig },
  };
}

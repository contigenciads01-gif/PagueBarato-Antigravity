import { db } from "../../../db/client";
import { calculos } from "../../../db/schema";
import { obterProdutoPorId } from "../../produtos/service";
import { encontrarFaixaAplicada } from "../../produtos/derived";
import { loadTaxConfig, loadAppConfig } from "../../config";
import { EntradaCustos, EntradaCustosSchema, ResultadoCustos } from "./schema";
import { calcularCustos, VERSAO_MOTOR_CUSTOS } from "./engine";

export async function executarCalculoCustos(
  entradaParcial: Partial<EntradaCustos> & { produtoId: number }
): Promise<ResultadoCustos> {
  const produto = await obterProdutoPorId(entradaParcial.produtoId);
  if (!produto) {
    throw new Error(`Produto #${entradaParcial.produtoId} não encontrado`);
  }

  const quantidade = entradaParcial.quantidade || produto.quantidadePlanejada || 1;
  const faixa = encontrarFaixaAplicada(
    quantidade,
    produto.faixasPreco.map((f) => ({
      quantidadeMinima: f.quantidadeMinima,
      precoUnitario: f.precoUnitario,
    }))
  );

  const precoUnitarioFob =
    entradaParcial.precoUnitarioFob ||
    faixa?.precoUnitario ||
    produto.faixasPreco[0]?.precoUnitario ||
    "0";

  const entradaCompleta = EntradaCustosSchema.parse({
    produtoId: produto.id,
    quantidade,
    precoUnitarioFob,
    moeda: entradaParcial.moeda || produto.moedaFornecedor || "CNY",
    via: entradaParcial.via || "aerea",
    freteInternacional: entradaParcial.freteInternacional || {
      modo: "total",
      valor: "0",
    },
    seguroInternacional: entradaParcial.seguroInternacional || {
      modo: "total",
      valor: "0",
    },
    freteInternoChina: entradaParcial.freteInternoChina,
    comissaoAgentePercentual: entradaParcial.comissaoAgentePercentual,
    despesasNacionais: entradaParcial.despesasNacionais || [],
    cambioOverride: entradaParcial.cambioOverride,
    overridesConfig: entradaParcial.overridesConfig,
    regime: entradaParcial.regime || "IMPORTACAO_PJ_DESPACHO",
  });

  const taxConfig = loadTaxConfig();
  const appConfig = loadAppConfig();

  const resultado = calcularCustos(entradaCompleta, taxConfig, appConfig, {
    pesoCobradoKg: produto.pesoKg || "0",
  });

  await db.insert(calculos).values({
    produtoId: produto.id,
    tipo: "custos",
    entradaJson: JSON.stringify(entradaCompleta),
    saidaJson: JSON.stringify(resultado),
    configSnapshotJson: JSON.stringify({ taxConfig, appConfig }),
    versaoMotor: VERSAO_MOTOR_CUSTOS,
  });

  return resultado;
}

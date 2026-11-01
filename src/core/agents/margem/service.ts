import { db } from "../../../db/client";
import { calculos } from "../../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { loadFeesConfig, loadTaxConfig, loadAppConfig } from "../../config";
import { EntradaMargem, EntradaMargemSchema, ResultadoMargem } from "./schema";
import { calcularMargem, VERSAO_MOTOR_MARGEM } from "./engine";
import { obterProdutoPorId } from "../../produtos/service";

export async function executarCalculoMargem(
  entradaParcial: Partial<EntradaMargem> & { produtoId: number }
): Promise<ResultadoMargem> {
  const produto = await obterProdutoPorId(entradaParcial.produtoId);
  if (!produto) {
    throw new Error(`Produto #${entradaParcial.produtoId} não encontrado`);
  }

  // Buscar último cálculo de custos se não fornecido
  let custoFormacao = entradaParcial.custoUnitarioFormacaoPrecoBrl;
  let statusOrigem = entradaParcial.statusCustoOrigem || "CONFIRMADO";
  let calculoCustosId = entradaParcial.calculoCustosId;

  if (!custoFormacao) {
    const [ultimoCalculoCustos] = await db
      .select()
      .from(calculos)
      .where(
        and(
          eq(calculos.produtoId, produto.id),
          eq(calculos.tipo, "custos")
        )
      )
      .orderBy(desc(calculos.criadoEm))
      .limit(1);

    if (ultimoCalculoCustos) {
      const saida = JSON.parse(ultimoCalculoCustos.saidaJson);
      custoFormacao = saida.custoUnitarioFormacaoPrecoBrl || "0";
      statusOrigem = saida.status;
      calculoCustosId = ultimoCalculoCustos.id;
    } else {
      custoFormacao = "0";
      statusOrigem = "CONFIG_PENDENTE";
    }
  }

  const feesConfig = loadFeesConfig();
  const taxConfig = loadTaxConfig();
  const appConfig = loadAppConfig();

  const entradaCompleta = EntradaMargemSchema.parse({
    produtoId: produto.id,
    calculoCustosId,
    custoUnitarioFormacaoPrecoBrl: custoFormacao,
    custoUnitarioDesembolsadoBrl: entradaParcial.custoUnitarioDesembolsadoBrl,
    statusCustoOrigem: statusOrigem,
    tipoAnuncio: entradaParcial.tipoAnuncio || "Clássico",
    categoriaMl: entradaParcial.categoriaMl || produto.categoria || "Geral",
    logistica: entradaParcial.logistica || "envio_vendedor",
    pesoCobradoKg: entradaParcial.pesoCobradoKg || produto.pesoKg || "0.5",
    embalagemUnitariaBrl: entradaParcial.embalagemUnitariaBrl || "0",
    perdasDevolucoesPct: entradaParcial.perdasDevolucoesPct || "0",
    marketingValor: entradaParcial.marketingValor || "0",
    marketingModo: entradaParcial.marketingModo || "percentual_preco",
    custosFixosRateadosBrl: entradaParcial.custosFixosRateadosBrl || "0",
    modo: entradaParcial.modo || "A_PRECO_ALVO",
    alvoTipo: entradaParcial.alvoTipo || "MARGEM_PCT",
    alvoValor: entradaParcial.alvoValor || "20",
    precoInformadoBrl: entradaParcial.precoInformadoBrl,
    overridesConfig: entradaParcial.overridesConfig,
  });

  const concorrentes = produto.precosReferencia.map((p) => ({
    valor: p.valor,
    dataColeta: p.dataColeta,
  }));

  const resultado = calcularMargem(
    entradaCompleta,
    feesConfig,
    taxConfig,
    appConfig,
    concorrentes
  );

  await db.insert(calculos).values({
    produtoId: produto.id,
    tipo: "margem",
    entradaJson: JSON.stringify(entradaCompleta),
    saidaJson: JSON.stringify(resultado),
    configSnapshotJson: JSON.stringify({ feesConfig, taxConfig, appConfig }),
    versaoMotor: VERSAO_MOTOR_MARGEM,
    calculoCustosId,
    precoAdotado: 0,
  });

  return resultado;
}

export async function marcarPrecoAdotado(calculoId: number) {
  const [calc] = await db
    .select()
    .from(calculos)
    .where(eq(calculos.id, calculoId));

  if (!calc) throw new Error("Cálculo não encontrado");

  // Desmarcar anteriores do mesmo produto
  if (calc.produtoId) {
    await db
      .update(calculos)
      .set({ precoAdotado: 0 })
      .where(eq(calculos.produtoId, calc.produtoId));
  }

  // Marcar este como adotado
  await db
    .update(calculos)
    .set({ precoAdotado: 1 })
    .where(eq(calculos.id, calculoId));

  return true;
}

export async function obterPrecoSugerido(produtoId: number) {
  const [calc] = await db
    .select()
    .from(calculos)
    .where(
      and(
        eq(calculos.produtoId, produtoId),
        eq(calculos.tipo, "margem"),
        eq(calculos.precoAdotado, 1)
      )
    )
    .orderBy(desc(calculos.criadoEm))
    .limit(1);

  if (!calc) return null;

  const saida = JSON.parse(calc.saidaJson);
  return {
    preco: saida.precoVenda,
    margem: saida.margemPercentual,
    lucro: saida.lucroUnitario,
    status: saida.status,
    calculoId: calc.id,
    data: calc.criadoEm,
  };
}

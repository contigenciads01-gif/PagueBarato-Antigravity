import { db } from "../../db/client";
import { execucoesAgente, calculos, produtos } from "../../db/schema";
import { desc, count } from "drizzle-orm";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "../config";
import { listarTodasPendencias } from "../config/service";
import { garantirMigracaoPronta } from "../../db/autoMigrate";

export async function obterDadosVisaoGeral() {
  await garantirMigracaoPronta();
  const tax = loadTaxConfig();
  const fees = loadFeesConfig();
  const app = loadAppConfig();

  const pendencias = listarTodasPendencias(tax, fees, app);

  // Execuções reais
  const ultimasExecucoes = await db
    .select()
    .from(execucoesAgente)
    .orderBy(desc(execucoesAgente.inicio))
    .limit(10);

  // Totalizadores
  const [totalProdutos] = await db.select({ value: count() }).from(produtos);
  const [totalCalculos] = await db.select({ value: count() }).from(calculos);

  // Últimos produtos cadastrados
  const ultimosProdutos = await db
    .select({
      id: produtos.id,
      nome: produtos.nome,
      categoria: produtos.categoria,
      ncm: produtos.ncm,
      ncmStatus: produtos.ncmStatus,
      atualizadoEm: produtos.atualizadoEm,
    })
    .from(produtos)
    .orderBy(desc(produtos.atualizadoEm))
    .limit(5);

  const statusAgenteCustos = pendencias.some((p) => p.origem.includes("Tributos") || p.campo.includes("Câmbio"))
    ? "CONFIG_PENDENTE"
    : "CONFIRMADO";

  const statusAgenteMargem = pendencias.some((p) => p.origem.includes("Venda") || p.origem.includes("Fees"))
    ? "CONFIG_PENDENTE"
    : "CONFIRMADO";

  return {
    pendenciasCount: pendencias.length,
    pendencias,
    totalProdutos: totalProdutos?.value || 0,
    totalCalculos: totalCalculos?.value || 0,
    ultimosProdutos,
    ultimasExecucoes,
    agentes: [
      {
        id: "custos",
        nome: "Custos e Impostos de Importação",
        tipo: "Cálculo puro (Sob demanda)",
        status: statusAgenteCustos,
        descricao: "Calcula FOB, frete, valor aduaneiro, II, IPI, PIS/COFINS, ICMS PR por dentro e custo de formação.",
      },
      {
        id: "margem",
        nome: "Margem e Precificação Mercado Livre",
        tipo: "Cálculo puro (Sob demanda)",
        status: statusAgenteMargem,
        descricao: "Formação de preço alvo, comissões ML, resolução iterativa de faixas de frete/tarifa e sensibilidade.",
      },
      {
        id: "quadro",
        nome: "Quadro de Comparação Visual",
        tipo: "Visual (Em breve - Parte 6)",
        status: "INATIVO",
        descricao: "Área estilo Miro com canvas Konva.js para comparativo com concorrentes.",
      },
      {
        id: "criativos",
        nome: "Criativos & Prompts",
        tipo: "IA Generativa (Em breve - Parte 8)",
        status: "INATIVO",
        descricao: "Gera títulos, descrições e prompts de criativos baseados nos concorrentes.",
      },
    ],
  };
}

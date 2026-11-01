import { executarCalculoMargem } from "../src/core/agents/margem/service";

const args = process.argv.slice(2);
let produtoId = 1;
const pIdx = args.indexOf("--produto");
if (pIdx !== -1 && args[pIdx + 1]) {
  produtoId = parseInt(args[pIdx + 1]!, 10);
}

async function main() {
  console.info(`\n🚀 Executando cálculo de margem para Produto #${produtoId}...`);
  try {
    const resultado = await executarCalculoMargem({ produtoId });
    console.info(`\n📊 Status do Cálculo: [${resultado.status}]`);
    if (resultado.status === "CONFIG_PENDENTE") {
      console.warn(`\n⚠️  CONFIGURAÇÕES PENDENTES (${resultado.pendencias.length}):`);
      for (const p of resultado.pendencias) {
        console.warn(`  - ${p}`);
      }
    } else {
      console.info(`  • Preço Sugerido: R$ ${resultado.precoVenda}`);
      console.info(`  • Lucro Unitário: R$ ${resultado.lucroUnitario}`);
      console.info(`  • Margem Líquida: ${resultado.margemPercentual}%`);
      console.info(`  • Markup: ${resultado.markupPercentual}%`);
      console.info(`  • Preço Mínimo (Equilíbrio): R$ ${resultado.precoMinimoEquilibrio}`);
    }
  } catch (e) {
    console.error("❌ Erro ao calcular margem:", e instanceof Error ? e.message : e);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});

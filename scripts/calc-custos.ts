import { executarCalculoCustos } from "../src/core/agents/custos/service";

const args = process.argv.slice(2);
let produtoId = 1;
const pIdx = args.indexOf("--produto");
if (pIdx !== -1 && args[pIdx + 1]) {
  produtoId = parseInt(args[pIdx + 1]!, 10);
}

async function main() {
  console.info(`\n🚀 Executando cálculo de custos para Produto #${produtoId}...`);
  try {
    const resultado = await executarCalculoCustos({ produtoId });
    console.info(`\n📊 Status do Cálculo: [${resultado.status}]`);
    if (resultado.status === "CONFIG_PENDENTE") {
      console.warn(`\n⚠️  CONFIGURAÇÕES PENDENTES (${resultado.pendencias.length}):`);
      for (const p of resultado.pendencias) {
        console.warn(`  - [${p.rotulo}]: ${p.caminho} (${p.oQueFazer})`);
      }
    } else {
      console.info(`  • Custo Unitário (Desembolsado): R$ ${resultado.custoUnitarioDesembolsadoBrl}`);
      console.info(`  • Custo Unitário (Formação de Preço): R$ ${resultado.custoUnitarioFormacaoPrecoBrl}`);
      console.info(`  • Linhas de Custo apuradas: ${resultado.linhas.length}`);
    }
  } catch (e) {
    console.error("❌ Erro ao executar cálculo:", e instanceof Error ? e.message : e);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});

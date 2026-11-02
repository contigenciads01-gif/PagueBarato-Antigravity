import React from "react";
import { listarProdutos } from "@/core/produtos/service";
import { HeaderNav } from "@/components/HeaderNav";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "@/core/config";
import { listarTodasPendencias } from "@/core/config/service";
import { actionCarregarQuadro } from "@/app/actions/quadro";
import { QuadroClientWrapper } from "@/components/QuadroClientWrapper";

export const dynamic = "force-dynamic";

export default async function QuadroPage({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string }>;
}) {
  const params = await searchParams;
  const produtos = await listarProdutos({ mostrarArquivados: false });
  const pendencias = listarTodasPendencias(loadTaxConfig(), loadFeesConfig(), loadAppConfig());

  const selectedProdutoId = params.produto
    ? parseInt(params.produto, 10)
    : produtos[0]?.id || 1;

  const resQuadro = await actionCarregarQuadro(selectedProdutoId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={pendencias.length} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Quadro de Comparação Visual
            </h1>
            <p className="text-xs text-slate-400">
              Canvas livre estilo Miro (Konva.js) para análise de preços concorrentes e criativos
            </p>
          </div>

          {produtos.length > 0 && (
            <form method="GET" className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Produto:</label>
              <select
                name="produto"
                defaultValue={selectedProdutoId}
                className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs"
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </form>
          )}
        </div>

        {resQuadro.ok ? (
          <QuadroClientWrapper
            quadro={resQuadro.quadro}
            itensIniciais={resQuadro.itens || []}
            cardLojaInfo={resQuadro.cardLoja}
            produtoId={selectedProdutoId}
          />
        ) : (
          <div className="p-8 text-center text-slate-400">Erro ao carregar quadro.</div>
        )}
      </main>
    </div>
  );
}

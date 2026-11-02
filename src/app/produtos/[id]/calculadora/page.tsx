import React from "react";
import { notFound } from "next/navigation";
import { obterProdutoPorId, listarProdutos } from "@/core/produtos/service";
import { HeaderNav } from "@/components/HeaderNav";
import { CalculadoraView } from "@/components/CalculadoraView";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "@/core/config";
import { listarTodasPendencias } from "@/core/config/service";

export const dynamic = "force-dynamic";

export default async function CalculadoraProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prodId = parseInt(id, 10);
  const produto = await obterProdutoPorId(prodId);
  if (!produto) notFound();

  const produtos = await listarProdutos({ mostrarArquivados: false });
  const pendencias = listarTodasPendencias(loadTaxConfig(), loadFeesConfig(), loadAppConfig());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={pendencias.length} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Calculadora: {produto.nome}</h1>
          <p className="text-xs text-slate-400">
            Simulação de precificação dedicada para o produto #{produto.id}
          </p>
        </div>

        <CalculadoraView produtos={produtos as any} produtoSelecionadoId={prodId} />
      </main>
    </div>
  );
}

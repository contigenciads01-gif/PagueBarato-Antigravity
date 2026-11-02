import React from "react";
import { notFound } from "next/navigation";
import { obterProdutoPorId } from "@/core/produtos/service";
import { HeaderNav } from "@/components/HeaderNav";
import { ProdutoForm } from "@/components/ProdutoForm";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "@/core/config";
import { listarTodasPendencias } from "@/core/config/service";

export const dynamic = "force-dynamic";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produto = await obterProdutoPorId(parseInt(id, 10));
  if (!produto) notFound();

  const pendencias = listarTodasPendencias(loadTaxConfig(), loadFeesConfig(), loadAppConfig());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={pendencias.length} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Ficha: {produto.nome}</h1>
          <p className="text-xs text-slate-400">Edição dos dados base de importação e faixas de preço</p>
        </div>
        <ProdutoForm initialData={produto} isEditing={true} />
      </main>
    </div>
  );
}

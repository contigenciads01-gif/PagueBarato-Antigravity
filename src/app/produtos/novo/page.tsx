import React from "react";
import { HeaderNav } from "@/components/HeaderNav";
import { ProdutoForm } from "@/components/ProdutoForm";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "@/core/config";
import { listarTodasPendencias } from "@/core/config/service";

export default function NovoProdutoPage() {
  const pendencias = listarTodasPendencias(loadTaxConfig(), loadFeesConfig(), loadAppConfig());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={pendencias.length} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Novo Produto</h1>
          <p className="text-xs text-slate-400">Cadastre os dados de referência da fábrica no 1688 e medidas</p>
        </div>
        <ProdutoForm />
      </main>
    </div>
  );
}

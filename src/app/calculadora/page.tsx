import React from "react";
import { listarProdutos } from "@/core/produtos/service";
import { HeaderNav } from "@/components/HeaderNav";
import { CalculadoraView } from "@/components/CalculadoraView";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "@/core/config";
import { listarTodasPendencias } from "@/core/config/service";

export const dynamic = "force-dynamic";

export default async function CalculadoraPage() {
  const produtos = await listarProdutos({ mostrarArquivados: false });
  const pendencias = listarTodasPendencias(loadTaxConfig(), loadFeesConfig(), loadAppConfig());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={pendencias.length} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Calculadora de Custos & Precificação</h1>
          <p className="text-xs text-slate-400">
            Simulação em tempo real consumindo os motores fiscais e algoritmo de faixas do Mercado Livre
          </p>
        </div>

        {produtos.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Nenhum produto cadastrado. Cadastre um produto antes de usar a calculadora.
          </div>
        ) : (
          <CalculadoraView produtos={produtos as any} />
        )}
      </main>
    </div>
  );
}

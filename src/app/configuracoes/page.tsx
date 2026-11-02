import React from "react";
import { HeaderNav } from "@/components/HeaderNav";
import { ConfigView } from "@/components/ConfigView";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "@/core/config";
import { listarTodasPendencias } from "@/core/config/service";

export const dynamic = "force-dynamic";

export default function ConfiguracoesPage() {
  const tax = loadTaxConfig();
  const fees = loadFeesConfig();
  const app = loadAppConfig();
  const pendencias = listarTodasPendencias(tax, fees, app);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={pendencias.length} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Configurações Fiscais & Tarifas</h1>
          <p className="text-xs text-slate-400">
            Parâmetros dinâmicos do motor com histórico de versões e backup atômico
          </p>
        </div>

        <ConfigView appConfig={app} taxConfig={tax} pendencias={pendencias} />
      </main>
    </div>
  );
}

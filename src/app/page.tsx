import React from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Pague Barato — Central de Agentes
        </h1>
        <p className="text-slate-400 text-lg">
          Motores determinísticos de custo de importação, tributos e formação de preço no Mercado Livre.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800 text-violet-300 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Partes 1, 2, 3 e 4 Concluídas
        </div>
      </div>
    </main>
  );
}

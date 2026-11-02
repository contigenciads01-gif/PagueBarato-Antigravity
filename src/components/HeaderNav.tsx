import Link from "next/link";

export function HeaderNav({ pendenciasCount }: { pendenciasCount: number }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Pague Barato
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors">
              Visão Geral
            </Link>
            <Link href="/produtos" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors">
              Produtos
            </Link>
            <Link href="/calculadora" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors">
              Calculadora
            </Link>
            <Link href="/configuracoes" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-2">
              Configurações
              {pendenciasCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs">
                  {pendenciasCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Dados Locais (SQLite)
          </span>
        </div>
      </div>
    </header>
  );
}

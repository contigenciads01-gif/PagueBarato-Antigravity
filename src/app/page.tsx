import React from "react";
import Link from "next/link";
import { obterDadosVisaoGeral } from "@/core/dashboard/service";
import { HeaderNav } from "@/components/HeaderNav";
import { Card, Badge, Button } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dados = await obterDadosVisaoGeral();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={dados.pendenciasCount} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Topo / Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Total de Produtos</span>
            <div className="text-3xl font-bold font-mono text-slate-100 mt-2">{dados.totalProdutos}</div>
            <Link href="/produtos" className="text-xs text-violet-400 hover:underline mt-2">
              Gerenciar catálogo &rarr;
            </Link>
          </Card>

          <Card className="flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Cálculos Registrados</span>
            <div className="text-3xl font-bold font-mono text-slate-100 mt-2">{dados.totalCalculos}</div>
            <Link href="/calculadora" className="text-xs text-violet-400 hover:underline mt-2">
              Abrir calculadora &rarr;
            </Link>
          </Card>

          <Card className="flex flex-col justify-between md:col-span-2 border-rose-950/40 bg-rose-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300">Pendências de Configuração</span>
              <Badge status={dados.pendenciasCount > 0 ? "CONFIG_PENDENTE" : "CONFIRMADO"} />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-200 mt-2">
              {dados.pendenciasCount} itens aguardando confirmação
            </div>
            <Link href="/configuracoes" className="text-xs text-rose-400 hover:underline mt-2">
              Ver pendências fiscais e tarifas &rarr;
            </Link>
          </Card>
        </div>

        {/* Central de Agentes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-100">Central de Agentes</h2>
              <p className="text-xs text-slate-400">Status operacional dos agentes de inteligência e cálculo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dados.agentes.map((agente) => (
              <Card key={agente.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100">{agente.nome}</h3>
                    <span className="text-xs text-slate-400">{agente.tipo}</span>
                  </div>
                  <Badge status={agente.status as any} />
                </div>
                <p className="text-sm text-slate-300">{agente.descricao}</p>
                <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
                  <span>Atividade real: {dados.ultimasExecucoes.filter((e) => e.agente === agente.id).length} hoje</span>
                  {agente.id === "custos" || agente.id === "margem" ? (
                    <Link href="/calculadora">
                      <Button size="sm" variant="outline">Simular na Calculadora</Button>
                    </Link>
                  ) : (
                    <span className="text-slate-500 italic">Em desenvolvimento</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Grade Inferior: Últimos Produtos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-100">Produtos Recentes</h2>
            <Link href="/produtos/novo">
              <Button size="sm">+ Novo Produto</Button>
            </Link>
          </div>

          <Card className="p-0 overflow-hidden">
            {dados.ultimosProdutos.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <p>Nenhum produto cadastrado ainda.</p>
                <Link href="/produtos/novo">
                  <Button size="sm">Cadastrar primeiro produto</Button>
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">NCM</th>
                    <th className="p-3">Status NCM</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dados.ultimosProdutos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-medium text-slate-200">{p.nome}</td>
                      <td className="p-3 text-slate-400">{p.categoria || "—"}</td>
                      <td className="p-3 font-mono text-slate-300">{p.ncm || "—"}</td>
                      <td className="p-3">
                        <Badge status={p.ncmStatus as any} />
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/produtos/${p.id}`} className="text-xs text-violet-400 hover:underline">
                          Abrir ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

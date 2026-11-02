import React from "react";
import Link from "next/link";
import { listarProdutos } from "@/core/produtos/service";
import { HeaderNav } from "@/components/HeaderNav";
import { Card, Badge, Button } from "@/components/ui";
import { loadTaxConfig, loadFeesConfig, loadAppConfig } from "@/core/config";
import { listarTodasPendencias } from "@/core/config/service";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; categoria?: string; arquivados?: string }>;
}) {
  const params = await searchParams;
  const mostrarArquivados = params.arquivados === "true";
  const busca = params.busca || "";

  const produtos = await listarProdutos({
    mostrarArquivados,
    buscaNome: busca,
    categoria: params.categoria,
  });

  const pendencias = listarTodasPendencias(loadTaxConfig(), loadFeesConfig(), loadAppConfig());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <HeaderNav pendenciasCount={pendencias.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Catálogo de Produtos</h1>
            <p className="text-xs text-slate-400">Produtos para importação via 1688 e revenda no Mercado Livre</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={mostrarArquivados ? "/produtos" : "/produtos?arquivados=true"}>
              <Button variant="outline" size="sm">
                {mostrarArquivados ? "Ocultar Arquivados" : "Mostrar Arquivados"}
              </Button>
            </Link>
            <Link href="/produtos/novo">
              <Button size="sm">+ Novo Produto</Button>
            </Link>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          {produtos.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <p className="text-base">Nenhum produto encontrado.</p>
              <Link href="/produtos/novo">
                <Button size="sm">Cadastrar produto</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-xs text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Faixas 1688</th>
                    <th className="p-3">Peso Real</th>
                    <th className="p-3">NCM</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {produtos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-medium text-slate-200">
                        <Link href={`/produtos/${p.id}`} className="hover:text-violet-400">
                          {p.nome}
                        </Link>
                      </td>
                      <td className="p-3 text-slate-400">{p.categoria || "—"}</td>
                      <td className="p-3 text-xs font-mono text-slate-300">
                        {p.faixasPreco.length > 0
                          ? `${p.faixasPreco.length} faixas (min: ${p.faixasPreco[0]?.quantidadeMinima} un)`
                          : "—"}
                      </td>
                      <td className="p-3 text-xs font-mono text-slate-300">{p.pesoKg ? `${p.pesoKg} kg` : "—"}</td>
                      <td className="p-3 font-mono text-xs text-slate-300">{p.ncm || "—"}</td>
                      <td className="p-3">
                        <Badge status={p.arquivadoEm ? "INATIVO" : (p.ncmStatus as any)}>
                          {p.arquivadoEm ? "Arquivado" : p.ncmStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Link href={`/produtos/${p.id}/calculadora`} className="text-xs text-emerald-400 hover:underline">
                          Calcular
                        </Link>
                        <Link href={`/produtos/${p.id}`} className="text-xs text-violet-400 hover:underline">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

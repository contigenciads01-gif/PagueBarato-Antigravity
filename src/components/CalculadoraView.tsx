"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { actionSimularCustos, actionSimularMargem, actionMarcarPrecoAdotado } from "@/app/actions/calculadora";
import { ResultadoCustos } from "@/core/agents/custos/schema";
import { ResultadoMargem } from "@/core/agents/margem/schema";
import { Card, Badge, Button, Input } from "@/components/ui";

interface CalculadoraViewProps {
  produtos: Array<{ id: number; nome: string; categoria: string | null; moedaFornecedor: string }>;
  produtoSelecionadoId?: number;
}

export function CalculadoraView({ produtos, produtoSelecionadoId }: CalculadoraViewProps) {
  const [selectedProdutoId, setSelectedProdutoId] = useState<number>(
    produtoSelecionadoId || produtos[0]?.id || 1
  );

  const [quantidade, setQuantidade] = useState<string>("50");
  const [via, setVia] = useState<"aerea" | "maritima" | "courier">("aerea");
  const [freteValor, setFreteValor] = useState<string>("200");
  const [cambioOverride, setCambioOverride] = useState<string>("");

  // Venda & Margem
  const [modoMargem, setModoMargem] = useState<string>("A_PRECO_ALVO");
  const [alvoTipo, setAlvoTipo] = useState<string>("MARGEM_PCT");
  const [alvoValor, setAlvoValor] = useState<string>("25");
  const [overrideComissao, setOverrideComissao] = useState<string>("");
  const [overrideImposto, setOverrideImposto] = useState<string>("");

  const [resultadoCustos, setResultadoCustos] = useState<ResultadoCustos | null>(null);
  const [resultadoMargem, setResultadoMargem] = useState<ResultadoMargem | null>(null);
  const [loading, setLoading] = useState(false);
  const [msgSucessoAdotado, setMsgSucessoAdotado] = useState(false);

  // Executar simulação
  async function executarSimulacao() {
    if (!selectedProdutoId) return;
    setLoading(true);
    setMsgSucessoAdotado(false);

    try {
      // 1. Custos
      const resCustos = await actionSimularCustos({
        produtoId: selectedProdutoId,
        quantidade: parseInt(quantidade, 10) || 1,
        via,
        freteInternacional: { modo: "total", valor: freteValor || "0" },
        cambioOverride: cambioOverride || undefined,
      });

      if (resCustos.ok && resCustos.data) {
        setResultadoCustos(resCustos.data);

        // 2. Margem
        const resMargem = await actionSimularMargem({
          produtoId: selectedProdutoId,
          modo: modoMargem as any,
          alvoTipo: alvoTipo as any,
          alvoValor: alvoValor || "20",
          overridesConfig: {
            ...(overrideComissao ? { comissao_ml: overrideComissao } : {}),
            ...(overrideImposto ? { imposto_venda: overrideImposto } : {}),
          },
        });

        if (resMargem.ok && resMargem.data) {
          setResultadoMargem(resMargem.data);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    executarSimulacao();
  }, [selectedProdutoId, via, modoMargem]);

  const statusGeral =
    resultadoCustos?.status === "CONFIG_PENDENTE" || resultadoMargem?.status === "CONFIG_PENDENTE"
      ? "CONFIG_PENDENTE"
      : resultadoCustos?.status === "SIMULACAO" || resultadoMargem?.status === "SIMULACAO"
      ? "SIMULACAO"
      : "CONFIRMADO";

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Status Geral */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-slate-800 bg-slate-900/90">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Geral do Cálculo</span>
          <div className="flex items-center gap-3 mt-1">
            <Badge status={statusGeral as any} className="text-sm px-3 py-1" />
            {statusGeral === "CONFIG_PENDENTE" && (
              <span className="text-xs text-rose-400 font-medium">
                Alíquotas ou câmbio oficiais pendentes na configuração.
              </span>
            )}
            {statusGeral === "SIMULACAO" && (
              <span className="text-xs text-amber-400 font-medium">
                Cálculo com simulação / alíquotas não confirmadas.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={executarSimulacao} disabled={loading}>
            {loading ? "Calculando..." : "Recalcular"}
          </Button>
        </div>
      </Card>

      {/* Grade em 3 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA A: Entradas */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2">
              Coluna A: Entradas
            </h3>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Produto</label>
              <select
                value={selectedProdutoId}
                onChange={(e) => setSelectedProdutoId(parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
              >
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.moedaFornecedor})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Quantidade (un)"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Modalidade de Frete</label>
              <select
                value={via}
                onChange={(e) => setVia(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
              >
                <option value="aerea">Aérea</option>
                <option value="maritima">Marítima (com AFRMM)</option>
                <option value="courier">Courier Expresso</option>
              </select>
            </div>

            <Input
              label="Frete Internacional Estimado (R$)"
              value={freteValor}
              onChange={(e) => setFreteValor(e.target.value)}
            />

            <Input
              label="Simular Câmbio Override (opcional)"
              placeholder="Ex: 0.82"
              value={cambioOverride}
              onChange={(e) => setCambioOverride(e.target.value)}
              helperText="Preenche temporariamente caso o câmbio oficial esteja pendente"
            />

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300">Modo de Margem</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  variant={modoMargem === "A_PRECO_ALVO" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setModoMargem("A_PRECO_ALVO")}
                >
                  Preço Alvo
                </Button>
                <Button
                  type="button"
                  variant={modoMargem === "C_PONTO_EQUILIBRIO" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setModoMargem("C_PONTO_EQUILIBRIO")}
                >
                  Equilíbrio
                </Button>
              </div>

              {modoMargem === "A_PRECO_ALVO" && (
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Alvo</label>
                    <select
                      value={alvoTipo}
                      onChange={(e) => setAlvoTipo(e.target.value)}
                      className="w-full h-10 px-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100"
                    >
                      <option value="MARGEM_PCT">Margem (%)</option>
                      <option value="MARKUP_PCT">Markup (%)</option>
                      <option value="LUCRO_BRL">Lucro (R$)</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <Input
                      label="Valor Alvo"
                      value={alvoValor}
                      onChange={(e) => setAlvoValor(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Simulação de Tarifas ML</span>
              <Input
                label="Override Comissão ML (%)"
                placeholder="Ex: 14"
                value={overrideComissao}
                onChange={(e) => setOverrideComissao(e.target.value)}
              />
              <Input
                label="Override Imposto Venda (%)"
                placeholder="Ex: 4"
                value={overrideImposto}
                onChange={(e) => setOverrideImposto(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* COLUNA B: Custos de Importação */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-semibold text-slate-100 text-sm">Coluna B: Custo Importação</h3>
              {resultadoCustos && <Badge status={resultadoCustos.status as any} />}
            </div>

            {resultadoCustos?.status === "CONFIG_PENDENTE" ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <p className="font-bold">Totais ocultos: Existem configurações fiscais pendentes.</p>
                <ul className="list-disc list-inside space-y-1">
                  {resultadoCustos.pendencias.map((p, i) => (
                    <li key={i}>
                      {p.rotulo}: {p.oQueFazer}
                    </li>
                  ))}
                </ul>
                <Link href="/configuracoes" className="text-violet-400 underline block pt-2">
                  Ir para Configurações &rarr;
                </Link>
              </div>
            ) : resultadoCustos ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Valor Aduaneiro</span>
                    <div className="text-lg font-mono font-bold text-slate-100">
                      R$ {resultadoCustos.valorAduaneiroBrl}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Total Tributos</span>
                    <div className="text-lg font-mono font-bold text-slate-100">
                      R$ {resultadoCustos.totalTributosBrl}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-violet-950/20 border border-violet-800/40">
                  <span className="text-xs text-violet-300 font-semibold">Custo Unitário Formação de Preço</span>
                  <div className="text-2xl font-mono font-extrabold text-violet-200 mt-1">
                    R$ {resultadoCustos.custoUnitarioFormacaoPrecoBrl}
                  </div>
                  <span className="text-xs text-slate-400">
                    Desembolsado: R$ {resultadoCustos.custoUnitarioDesembolsadoBrl}
                  </span>
                </div>

                {/* Memória Linha a Linha */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Memória de Cálculo (Tributos)</span>
                  <div className="space-y-1.5 text-xs">
                    {resultadoCustos.linhas.map((l, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-200">{l.rotulo}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{l.formulaTexto}</div>
                        </div>
                        <div className="text-right font-mono font-bold text-slate-100">
                          R$ {l.valor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* COLUNA C: Preço e Margem */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-semibold text-slate-100 text-sm">Coluna C: Preço & Margem</h3>
              {resultadoMargem && <Badge status={resultadoMargem.status as any} />}
            </div>

            {resultadoMargem?.status === "CONFIG_PENDENTE" ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <p className="font-bold">Precificação bloqueada por falta de configurações de venda.</p>
                <ul className="list-disc list-inside">
                  {resultadoMargem.pendencias.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
                <Link href="/configuracoes" className="text-violet-400 underline block pt-2">
                  Configurar taxas de venda &rarr;
                </Link>
              </div>
            ) : resultadoMargem ? (
              <div className="space-y-4">
                {/* 3 Métricas Estratégicas Lado a Lado */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">LUCRO</span>
                    <div className="text-base font-mono font-bold text-emerald-400 mt-1">
                      R$ {resultadoMargem.lucroUnitario}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">MARGEM</span>
                    <div className="text-base font-mono font-bold text-violet-400 mt-1">
                      {resultadoMargem.margemPercentual}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">MARKUP</span>
                    <div className="text-base font-mono font-bold text-fuchsia-400 mt-1">
                      {resultadoMargem.markupPercentual}%
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-center">
                  <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                    Preço Sugerido de Venda (ML)
                  </span>
                  <div className="text-3xl font-mono font-extrabold text-emerald-200 mt-1">
                    R$ {resultadoMargem.precoVenda}
                  </div>
                  <span className="text-xs text-slate-400 block mt-1">
                    Preço mínimo de equilíbrio: R$ {resultadoMargem.precoMinimoEquilibrio}
                  </span>
                </div>

                {/* Botão Marcar como Preço Adotado */}
                <Button
                  className="w-full"
                  variant="primary"
                  onClick={async () => {
                    if (resultadoMargem.calculoCustosId) {
                      await actionMarcarPrecoAdotado(resultadoMargem.calculoCustosId);
                      setMsgSucessoAdotado(true);
                    }
                  }}
                >
                  Marcar como Preço Adotado
                </Button>
                {msgSucessoAdotado && (
                  <p className="text-xs text-emerald-400 text-center font-medium">
                    Preço adotado com sucesso para o Quadro da loja!
                  </p>
                )}

                {/* Deduções de Venda */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Deduções Mercado Livre</span>
                  <div className="space-y-1.5 text-xs">
                    {resultadoMargem.linhas.map((l, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-200">{l.rotulo}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{l.formulaTexto}</div>
                        </div>
                        <div className="text-right font-mono font-bold text-slate-100">
                          R$ {l.valor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

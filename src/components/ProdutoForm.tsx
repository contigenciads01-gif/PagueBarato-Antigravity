"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProdutoInput } from "@/core/produtos/schema";
import { actionCriarProduto, actionAtualizarProduto, actionArquivarProduto, actionRestaurarProduto, actionDuplicarProduto } from "@/app/actions/produtos";
import { Button, Input, Card, Badge } from "@/components/ui";

interface ProdutoFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function ProdutoForm({ initialData, isEditing = false }: ProdutoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados dos campos
  const [nome, setNome] = useState(initialData?.nome || "");
  const [categoria, setCategoria] = useState(initialData?.categoria || "");
  const [linkReferencia, setLinkReferencia] = useState(initialData?.linkReferencia || "");
  const [ncm, setNcm] = useState(initialData?.ncm || "");
  const [ncmStatus, setNcmStatus] = useState<"A_CONFIRMAR" | "CONFIRMADO">(initialData?.ncmStatus || "A_CONFIRMAR");
  const [observacoes] = useState(initialData?.observacoes || "");

  // Fornecedor
  const [linkFornecedor, setLinkFornecedor] = useState(initialData?.linkFornecedor || "");
  const [moedaFornecedor, setMoedaFornecedor] = useState<"CNY" | "USD" | "BRL">(initialData?.moedaFornecedor || "CNY");
  const [moq, setMoq] = useState(String(initialData?.moq || "1"));
  const [quantidadePlanejada, setQuantidadePlanejada] = useState(String(initialData?.quantidadePlanejada || "10"));

  // Logística
  const [pesoKg, setPesoKg] = useState(initialData?.pesoKg || "0.2");
  const [comprimentoCm, setComprimentoCm] = useState(initialData?.comprimentoCm || "15");
  const [larguraCm, setLarguraCm] = useState(initialData?.larguraCm || "10");
  const [alturaCm, setAlturaCm] = useState(initialData?.alturaCm || "5");

  // Faixas de preço
  const [faixas, setFaixas] = useState<Array<{ quantidadeMinima: number; precoUnitario: string }>>(
    initialData?.faixasPreco?.length
      ? initialData.faixasPreco.map((f: any) => ({
          quantidadeMinima: f.quantidadeMinima,
          precoUnitario: f.precoUnitario,
        }))
      : [{ quantidadeMinima: 1, precoUnitario: "10.00" }]
  );

  function adicionarFaixa() {
    const lastQtd = faixas[faixas.length - 1]?.quantidadeMinima || 1;
    setFaixas([...faixas, { quantidadeMinima: lastQtd + 10, precoUnitario: "9.00" }]);
  }

  function removerFaixa(index: number) {
    if (faixas.length <= 1) return;
    setFaixas(faixas.filter((_, idx) => idx !== index));
  }

  // Indicador de completude
  const pendenciasFicha: string[] = [];
  if (!ncm) pendenciasFicha.push("NCM ausente");
  if (ncmStatus === "A_CONFIRMAR") pendenciasFicha.push("NCM não confirmado");
  if (!pesoKg) pendenciasFicha.push("Peso não informado");

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload: ProdutoInput = {
      nome,
      categoria: categoria || null,
      linkReferencia: linkReferencia || null,
      ncm: ncm || null,
      ncmStatus,
      observacoes: observacoes || null,
      linkFornecedor: linkFornecedor || null,
      moedaFornecedor,
      moq: parseInt(moq, 10) || 1,
      quantidadePlanejada: parseInt(quantidadePlanejada, 10) || 1,
      pesoKg,
      comprimentoCm,
      larguraCm,
      alturaCm,
      faixasPreco: faixas.map((f, idx) => ({
        quantidadeMinima: f.quantidadeMinima,
        precoUnitario: f.precoUnitario,
        ordem: idx,
      })),
      precosReferencia: [],
    };

    try {
      if (isEditing) {
        const res = await actionAtualizarProduto(initialData.id, payload);
        if (!res.ok) throw new Error(res.error);
      } else {
        const res = await actionCriarProduto(payload);
        if (!res.ok) throw new Error(res.error);
        if (res.produto) router.push(`/produtos/${res.produto.id}`);
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSalvar} className="space-y-6 max-w-4xl">
      {/* Barra de Status e Completude */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-violet-900/40 bg-violet-950/20">
        <div>
          <span className="text-xs text-violet-300 font-semibold uppercase tracking-wider">Status da Ficha</span>
          <div className="flex items-center gap-2 mt-1">
            <Badge status={pendenciasFicha.length > 0 ? "A_CONFIRMAR" : "CONFIRMADO"}>
              {pendenciasFicha.length > 0 ? "Faltam dados fiscais" : "Ficha completa"}
            </Badge>
            {pendenciasFicha.length > 0 && (
              <span className="text-xs text-slate-400">({pendenciasFicha.join(", ")})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (confirm("Duplicar este produto?")) {
                    const dup = await actionDuplicarProduto(initialData.id);
                    if (dup.ok && dup.produto) router.push(`/produtos/${dup.produto.id}`);
                  }
                }}
              >
                Duplicar
              </Button>
              {initialData.arquivadoEm ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await actionRestaurarProduto(initialData.id);
                    router.refresh();
                  }}
                >
                  Restaurar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (confirm("Arquivar este produto?")) {
                      await actionArquivarProduto(initialData.id);
                      router.push("/produtos");
                    }
                  }}
                >
                  Arquivar
                </Button>
              )}
            </>
          )}
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Produto"}
          </Button>
        </div>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* 1. Identificação */}
      <Card className="space-y-4">
        <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2">1. Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Nome do Produto *" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <Input label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          <Input label="Link de Referência" value={linkReferencia} onChange={(e) => setLinkReferencia(e.target.value)} />
          <div>
            <Input label="NCM (8 dígitos)" value={ncm} onChange={(e) => setNcm(e.target.value)} placeholder="Ex: 8517.62.77" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Status do NCM</label>
            <select
              value={ncmStatus}
              onChange={(e) => setNcmStatus(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
            >
              <option value="A_CONFIRMAR">A CONFIRMAR</option>
              <option value="CONFIRMADO">CONFIRMADO</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 2. Fornecedor 1688 */}
      <Card className="space-y-4">
        <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2">2. Fornecedor (1688)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input label="Link Fornecedor 1688" value={linkFornecedor} onChange={(e) => setLinkFornecedor(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Moeda</label>
            <select
              value={moedaFornecedor}
              onChange={(e) => setMoedaFornecedor(e.target.value as any)}
              className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm"
            >
              <option value="CNY">CNY (Renminbi / Yuan)</option>
              <option value="USD">USD (Dólar)</option>
              <option value="BRL">BRL (Real)</option>
            </select>
          </div>
          <Input label="MOQ (Mínimo)" type="number" value={moq} onChange={(e) => setMoq(e.target.value)} />
          <Input label="Quantidade Planejada" type="number" value={quantidadePlanejada} onChange={(e) => setQuantidadePlanejada(e.target.value)} />
        </div>

        {/* Faixas de Preço */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Faixas de Preço por Quantidade</label>
            <Button type="button" variant="outline" size="sm" onClick={adicionarFaixa}>+ Adicionar Faixa</Button>
          </div>
          {faixas.map((f, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <Input
                label="Qtd Mínima"
                type="number"
                value={String(f.quantidadeMinima)}
                onChange={(e) => {
                  const updated = [...faixas];
                  updated[idx]!.quantidadeMinima = parseInt(e.target.value, 10) || 1;
                  setFaixas(updated);
                }}
              />
              <Input
                label={`Preço Unitário (${moedaFornecedor})`}
                value={f.precoUnitario}
                onChange={(e) => {
                  const updated = [...faixas];
                  updated[idx]!.precoUnitario = e.target.value;
                  setFaixas(updated);
                }}
              />
              {faixas.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="mt-5 text-rose-400" onClick={() => removerFaixa(idx)}>
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Logística */}
      <Card className="space-y-4">
        <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2">3. Logística (Dimensões por unidade)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="Peso (kg)" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} />
          <Input label="Comprimento (cm)" value={comprimentoCm} onChange={(e) => setComprimentoCm(e.target.value)} />
          <Input label="Largura (cm)" value={larguraCm} onChange={(e) => setLarguraCm(e.target.value)} />
          <Input label="Altura (cm)" value={alturaCm} onChange={(e) => setAlturaCm(e.target.value)} />
        </div>
      </Card>
    </form>
  );
}

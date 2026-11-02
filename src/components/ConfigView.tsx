"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { actionAtualizarCambio, actionAtualizarTributosImportacao, actionAtualizarImpostoVenda } from "@/app/actions/configuracoes";
import { Card, Badge, Button, Input } from "@/components/ui";

interface ConfigViewProps {
  appConfig: any;
  taxConfig: any;
  pendencias: any[];
}

export function ConfigView({ appConfig, taxConfig, pendencias }: ConfigViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  // Câmbio
  const [cny, setCny] = useState(String(appConfig.cambio_cny_brl?.valor || ""));
  const [usd, setUsd] = useState(String(appConfig.cambio_usd_brl?.valor || ""));
  const [cambioConfirmado, setCambioConfirmado] = useState(appConfig.cambio_cny_brl?.status === "CONFIRMADO");

  // Tributos Importação
  const tribs = taxConfig.regimes?.IMPORTACAO_PJ_DESPACHO?.tributos || [];
  const iiOrig = tribs.find((t: any) => t.codigo === "II")?.aliquota;
  const ipiOrig = tribs.find((t: any) => t.codigo === "IPI")?.aliquota;
  const icmsOrig = tribs.find((t: any) => t.codigo === "ICMS_IMPORTACAO")?.aliquota;

  const [ii, setIi] = useState(String(iiOrig?.valor || ""));
  const [ipi, setIpi] = useState(String(ipiOrig?.valor || ""));
  const [icms, setIcms] = useState(String(icmsOrig?.valor || ""));
  const [tribConfirmado, setTribConfirmado] = useState(iiOrig?.status === "CONFIRMADO");

  // Imposto Venda
  const impVendaOrig = taxConfig.venda?.imposto_sobre_venda_percentual_efetivo;
  const [impVenda, setImpVenda] = useState(String(impVendaOrig?.valor || ""));
  const [impVendaConfirmado, setImpVendaConfirmado] = useState(impVendaOrig?.status === "CONFIRMADO");

  async function salvarCambio(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsgSucesso(null);
    try {
      await actionAtualizarCambio(cny, usd, cambioConfirmado ? "CONFIRMADO" : "A_CONFIRMAR");
      setMsgSucesso("Cotações de câmbio atualizadas!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function salvarTributos(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsgSucesso(null);
    try {
      await actionAtualizarTributosImportacao(ii, ipi, icms, tribConfirmado ? "CONFIRMADO" : "A_CONFIRMAR");
      setMsgSucesso("Alíquotas fiscais de importação atualizadas!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function salvarVenda(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsgSucesso(null);
    try {
      await actionAtualizarImpostoVenda(impVenda, impVendaConfirmado ? "CONFIRMADO" : "A_CONFIRMAR");
      setMsgSucesso("Imposto sobre venda atualizado!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Painel de Pendências */}
      {pendencias.length > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-rose-200 text-sm">
              Pendências Bloqueando Agentes ({pendencias.length})
            </h3>
            <Badge status="CONFIG_PENDENTE" />
          </div>
          <p className="text-xs text-rose-300">
            Valores null ou em A_CONFIRMAR impedem a geração de relatórios oficiais e cálculos de preço definitivos.
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            {pendencias.map((p, idx) => (
              <li key={idx}>
                <strong className="text-rose-200">{p.campo}</strong> ({p.origem}): {p.descricao}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {msgSucesso && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          {msgSucesso}
        </div>
      )}

      {/* 1. Câmbio */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-semibold text-slate-100 text-sm">1. Câmbio Oficial</h3>
          <Badge status={appConfig.cambio_cny_brl?.status || "A_CONFIRMAR"} />
        </div>
        <form onSubmit={salvarCambio} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="CNY &rarr; BRL" placeholder="Ex: 0.80" value={cny} onChange={(e) => setCny(e.target.value)} />
            <Input label="USD &rarr; BRL" placeholder="Ex: 5.60" value={usd} onChange={(e) => setUsd(e.target.value)} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={cambioConfirmado}
                onChange={(e) => setCambioConfirmado(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
              />
              Marcar como Cotação Oficial Confirmada
            </label>
            <Button type="submit" size="sm" disabled={loading}>
              Salvar Câmbio
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Tributos de Importação */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-semibold text-slate-100 text-sm">2. Tributos de Importação (PJ Despacho)</h3>
          <Badge status={iiOrig?.status || "A_CONFIRMAR"} />
        </div>
        <form onSubmit={salvarTributos} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="II - Imposto Importação (%)" placeholder="Ex: 16" value={ii} onChange={(e) => setIi(e.target.value)} />
            <Input label="IPI (%)" placeholder="Ex: 10" value={ipi} onChange={(e) => setIpi(e.target.value)} />
            <Input label="ICMS PR por dentro (%)" placeholder="Ex: 18" value={icms} onChange={(e) => setIcms(e.target.value)} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={tribConfirmado}
                onChange={(e) => setTribConfirmado(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
              />
              Confirmado pelo Contador da Empresa
            </label>
            <Button type="submit" size="sm" disabled={loading}>
              Salvar Tributos
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Venda e Simples Nacional */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-semibold text-slate-100 text-sm">3. Imposto sobre Venda (Mercado Livre)</h3>
          <Badge status={impVendaOrig?.status || "A_CONFIRMAR"} />
        </div>
        <form onSubmit={salvarVenda} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Alíquota Efetiva sobre Venda (%)"
              placeholder="Ex: 4"
              value={impVenda}
              onChange={(e) => setImpVenda(e.target.value)}
              helperText="Alíquota efetiva apurada no Simples Nacional / Anexo I"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={impVendaConfirmado}
                onChange={(e) => setImpVendaConfirmado(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
              />
              Confirmado pelo Contador
            </label>
            <Button type="submit" size="sm" disabled={loading}>
              Salvar Imposto Venda
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

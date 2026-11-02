"use client";

import React, { useState, useRef } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";
import { Button, Card } from "@/components/ui";
import { actionSalvarElemento } from "@/app/actions/quadro";

interface QuadroCanvasProps {
  quadro: any;
  itensIniciais: any[];
  cardLojaInfo: any;
  produtoId: number;
}

export function QuadroCanvas({ quadro, itensIniciais, cardLojaInfo }: QuadroCanvasProps) {
  const [elementos, setElementos] = useState<any[]>(itensIniciais);
  const [modoExportacaoCriativo, setModoExportacaoCriativo] = useState(false);
  const stageRef = useRef<any>(null);

  // Adicionar Card de Preço de Concorrente
  async function adicionarCardPreco() {
    const novoId = "card_" + Math.random().toString(36).substring(2, 9);
    const novo = {
      id: novoId,
      quadroId: quadro.id,
      tipo: "CARD_PRECO" as const,
      dadosJson: JSON.stringify({
        marketplace: "Mercado Livre",
        valor: "89.90",
        vendedor: "Loja Concorrente",
        tituloAnuncio: "Item Concorrente Anúncio",
        status: "CONFIRMADO",
      }),
      x: 120 + elementos.length * 30,
      y: 120 + elementos.length * 30,
      largura: 240,
      altura: 130,
      zIndex: elementos.length + 1,
    };

    setElementos([...elementos, novo]);
    await actionSalvarElemento(novo);
  }

  // Adicionar Nota
  async function adicionarNota() {
    const novoId = "nota_" + Math.random().toString(36).substring(2, 9);
    const novo = {
      id: novoId,
      quadroId: quadro.id,
      tipo: "NOTA" as const,
      dadosJson: JSON.stringify({ texto: "Anotação rápida sobre o mercado..." }),
      x: 200,
      y: 200,
      largura: 200,
      altura: 100,
      zIndex: elementos.length + 1,
    };

    setElementos([...elementos, novo]);
    await actionSalvarElemento(novo);
  }

  // Exportar PNG
  function exportarPNG() {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `quadro-${modoExportacaoCriativo ? "criativo" : "completo"}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas do Canvas */}
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border-slate-800">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={adicionarCardPreco}>
            + Card de Concorrente
          </Button>
          <Button size="sm" variant="outline" onClick={adicionarNota}>
            + Nota
          </Button>
          <Button
            size="sm"
            variant={modoExportacaoCriativo ? "primary" : "outline"}
            onClick={() => setModoExportacaoCriativo(!modoExportacaoCriativo)}
          >
            {modoExportacaoCriativo ? "Modo Criativo Ativo" : "Filtrar p/ Criativo"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={exportarPNG}>
            Exportar PNG
          </Button>
        </div>
      </Card>

      {/* Barra de Resumo de Concorrentes */}
      {cardLojaInfo?.resumo && (
        <Card className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-900/60 text-xs">
          <div>
            <span className="text-slate-400">Menor Preço:</span>
            <div className="text-slate-200 font-mono font-bold text-sm">
              {cardLojaInfo.resumo.menor ? `R$ ${cardLojaInfo.resumo.menor.toFixed(2)}` : "—"}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Mediana Concorrentes:</span>
            <div className="text-violet-300 font-mono font-bold text-sm">
              {cardLojaInfo.resumo.mediana ? `R$ ${cardLojaInfo.resumo.mediana.toFixed(2)}` : "—"}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Maior Preço:</span>
            <div className="text-slate-200 font-mono font-bold text-sm">
              {cardLojaInfo.resumo.maior ? `R$ ${cardLojaInfo.resumo.maior.toFixed(2)}` : "—"}
            </div>
          </div>
          <div>
            <span className="text-slate-400">Nossa Loja vs Mediana:</span>
            <div className="text-emerald-400 font-mono font-bold text-sm">
              {cardLojaInfo.comparacaoMediana ? (
                <span>
                  {cardLojaInfo.comparacaoMediana.maisBarato ? "▼ " : "▲ "}
                  {cardLojaInfo.comparacaoMediana.diferencaPct}%
                </span>
              ) : (
                "Sem preço adotado"
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Canvas Konva Infinito com Drag & Drop */}
      <div className="w-full h-[650px] rounded-xl border border-slate-800 bg-[#0c0817] overflow-hidden relative shadow-inner">
        <Stage width={1200} height={650} ref={stageRef}>
          <Layer>
            {/* Grade de fundo sutil */}
            <Rect x={0} y={0} width={1200} height={650} fill="#090614" />

            {/* Elementos Dinâmicos */}
            {elementos.map((el) => {
              const dados = JSON.parse(el.dadosJson || "{}");
              if (modoExportacaoCriativo && el.tipo === "NOTA") return null;

              return (
                <Group
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  draggable
                  onDragEnd={async (e) => {
                    const nx = e.target.x();
                    const ny = e.target.y();
                    const updated = elementos.map((item) =>
                      item.id === el.id ? { ...item, x: nx, y: ny } : item
                    );
                    setElementos(updated);
                    await actionSalvarElemento({ ...el, x: nx, y: ny });
                  }}
                >
                  {/* Fundo do Card */}
                  <Rect
                    width={el.largura}
                    height={el.altura}
                    fill={el.tipo === "NOTA" ? "#1e1730" : "#130f24"}
                    stroke={el.tipo === "NOTA" ? "#7c3aed" : "#3b2d54"}
                    strokeWidth={1}
                    cornerRadius={8}
                    shadowBlur={8}
                    shadowColor="#000"
                    shadowOpacity={0.4}
                  />

                  {/* Conteúdo do Card */}
                  {el.tipo === "CARD_PRECO" ? (
                    <>
                      <Text
                        x={14}
                        y={14}
                        text={dados.marketplace || "Mercado Livre"}
                        fontSize={11}
                        fill="#a78bfa"
                        fontStyle="bold"
                      />
                      <Text
                        x={14}
                        y={32}
                        text={dados.tituloAnuncio || "Título do anúncio"}
                        fontSize={12}
                        fill="#e2e8f0"
                        width={210}
                      />
                      <Text
                        x={14}
                        y={70}
                        text={`R$ ${dados.valor || "0,00"}`}
                        fontSize={22}
                        fill="#38bdf8"
                        fontStyle="bold"
                      />
                      <Text
                        x={14}
                        y={102}
                        text={`Status: ${dados.status || "CONFIRMADO"}`}
                        fontSize={10}
                        fill="#94a3b8"
                      />
                    </>
                  ) : (
                    <Text
                      x={14}
                      y={14}
                      text={dados.texto || "Nota..."}
                      fontSize={13}
                      fill="#f1f5f9"
                      width={170}
                    />
                  )}
                </Group>
              );
            })}

            {/* Card Fixo da Loja Pague Barato */}
            <Group x={350} y={500} draggable>
              <Rect
                width={500}
                height={120}
                fill="#1e1035"
                stroke="#a855f7"
                strokeWidth={2}
                cornerRadius={10}
                shadowBlur={16}
                shadowColor="#a855f7"
                shadowOpacity={0.2}
              />
              <Text
                x={20}
                y={16}
                text="NOSSA LOJA: PAGUE BARATO"
                fontSize={12}
                fill="#c084fc"
                fontStyle="bold"
              />
              <Text
                x={20}
                y={42}
                text={
                  cardLojaInfo?.precoSugerido?.preco
                    ? `Preço Adotado: R$ ${cardLojaInfo.precoSugerido.preco}`
                    : "Preço não adotado na calculadora"
                }
                fontSize={24}
                fill="#4ade80"
                fontStyle="bold"
              />
              <Text
                x={20}
                y={82}
                text={
                  cardLojaInfo?.precoSugerido
                    ? `Margem: ${cardLojaInfo.precoSugerido.margem}%  |  Lucro: R$ ${cardLojaInfo.precoSugerido.lucro}`
                    : "Simule na Calculadora e clique em 'Marcar como Preço Adotado'"
                }
                fontSize={12}
                fill="#cbd5e1"
              />
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

import { describe, it, expect } from "vitest";
import { calcularMargem } from "./engine";
import { FeesConfig, TaxConfig, AppConfig } from "../../config";
import { fromString } from "../../money";

describe("Motor de Margem e Preço — Mecânica e Modos", () => {
  const feesConfigFicticia: FeesConfig = {
    comissao_ml: {
      itens: [
        {
          categoria: "Eletrônicos",
          tipo_anuncio: "Clássico",
          percentual: { valor: "12", status: "CONFIRMADO" },
        },
      ],
    },
    tarifa_fixa: {
      itens: [
        {
          de: "0",
          ate: "79",
          valor: { valor: "6.00", status: "CONFIRMADO" },
        },
        {
          de: "79.01",
          ate: "9999",
          valor: { valor: "0", status: "CONFIRMADO" },
        },
      ],
    },
    frete_vendedor: {
      itens: [
        {
          logistica: "envio_vendedor",
          faixa_peso_min_kg: "0",
          faixa_peso_max_kg: "1",
          faixa_preco_min: "0",
          faixa_preco_max: "79",
          valor: { valor: "0", status: "CONFIRMADO" },
        },
        {
          logistica: "envio_vendedor",
          faixa_peso_min_kg: "0",
          faixa_peso_max_kg: "1",
          faixa_preco_min: "79.01",
          faixa_preco_max: "9999",
          valor: { valor: "20.00", status: "CONFIRMADO" },
        },
      ],
    },
    custo_full: {
      armazenagem_mensal_por_unidade: { valor: "0", status: "CONFIRMADO" },
      custo_envio_por_unidade: { valor: "0", status: "CONFIRMADO" },
    },
    parametros_frete: {
      frete_gratis_threshold_brl: { valor: "79", status: "CONFIRMADO" },
    },
  };

  const taxConfigFicticia: TaxConfig = {
    regimes: {
      IMPORTACAO_PJ_DESPACHO: { tributos: [] },
      REMESSA_PF: {
        limite_usd: { valor: "50", status: "CONFIRMADO" },
        aliquota_ii_ate_limite: { valor: "20", status: "CONFIRMADO" },
        aliquota_ii_acima_limite: { valor: "60", status: "CONFIRMADO" },
        desconto_usd_sobre_ii: { valor: "20", status: "CONFIRMADO" },
        aliquota_icms: { valor: "17", status: "CONFIRMADO" },
      },
    },
    venda: {
      regime_tributario: { valor: "SIMPLES", status: "CONFIRMADO" },
      imposto_sobre_venda_percentual_efetivo: { valor: "4", status: "CONFIRMADO" },
    },
  };

  const appConfigFicticia: AppConfig = {
    cambio_cny_brl: { valor: "0.80", status: "CONFIRMADO" },
    cambio_usd_brl: { valor: "5.50", status: "CONFIRMADO" },
    iof_pagamento_exterior: { valor: "0.38", status: "CONFIRMADO" },
    spread_cambial: { valor: "1.5", status: "CONFIRMADO" },
    arredondamento_impostos: { metodo: "ROUND_HALF_UP", casas_decimais: 2, status: "CONFIRMADO" },
    modalidade_radar: { valor: "LIMITADA", status: "CONFIRMADO" },
    limite_modalidade_usd: { valor: "50000", status: "CONFIRMADO" },
    alerta_cambio_dias: { valor: 7, status: "CONFIRMADO" },
    fator_peso_cubico: { valor: "6000", status: "CONFIRMADO" },
    limite_ia_mensal_usd: { valor: "50", status: "CONFIRMADO" },
    margem_minima_alerta: { valor: "15", status: "CONFIRMADO" },
    passos_sensibilidade: { valor: "5", status: "CONFIRMADO" },
    preco_final_comercial: { ativo: false, centavos_alvo: null, status: "CONFIRMADO" },
    alerta_fronteira_faixa_reais: { valor: "2", status: "CONFIRMADO" },
    alerta_coleta_antiga_dias: { valor: 30, status: "CONFIRMADO" },
  };

  it("Modo A com margem alvo de 20% gera preço coerente", () => {
    const resultado = calcularMargem(
      {
        produtoId: 1,
        custoUnitarioFormacaoPrecoBrl: "20.00",
        tipoAnuncio: "Clássico",
        categoriaMl: "Eletrônicos",
        logistica: "envio_vendedor",
        pesoCobradoKg: "0.2",
        embalagemUnitariaBrl: "2.00",
        perdasDevolucoesPct: "1",
        marketingValor: "3",
        marketingModo: "percentual_preco",
        custosFixosRateadosBrl: "1.00",
        modo: "A_PRECO_ALVO",
        alvoTipo: "MARGEM_PCT",
        alvoValor: "20",
      },
      feesConfigFicticia,
      taxConfigFicticia,
      appConfigFicticia
    );

    expect(resultado.status).toBe("CONFIRMADO");
    expect(resultado.precoVenda).toBeDefined();
    // Preço deve cobrir custos e dar margem >= 20% (devido a roundCeil)
    expect(fromString(resultado.margemPercentual!).greaterThanOrEqualTo(fromString("20"))).toBe(true);
  });

  it("Ida e volta A ↔ B fecha com precisão de centavos", () => {
    // 1. Calcula preço no Modo A
    const resA = calcularMargem(
      {
        produtoId: 1,
        custoUnitarioFormacaoPrecoBrl: "25.00",
        tipoAnuncio: "Clássico",
        categoriaMl: "Eletrônicos",
        logistica: "envio_vendedor",
        pesoCobradoKg: "0.3",
        embalagemUnitariaBrl: "1.50",
        perdasDevolucoesPct: "0",
        marketingValor: "0",
        marketingModo: "percentual_preco",
        custosFixosRateadosBrl: "0",
        modo: "A_PRECO_ALVO",
        alvoTipo: "MARGEM_PCT",
        alvoValor: "25",
      },
      feesConfigFicticia,
      taxConfigFicticia,
      appConfigFicticia
    );

    const precoCalculado = resA.precoVenda!;

    // 2. Alimenta Modo B com esse mesmo preço
    const resB = calcularMargem(
      {
        produtoId: 1,
        custoUnitarioFormacaoPrecoBrl: "25.00",
        tipoAnuncio: "Clássico",
        categoriaMl: "Eletrônicos",
        logistica: "envio_vendedor",
        pesoCobradoKg: "0.3",
        embalagemUnitariaBrl: "1.50",
        perdasDevolucoesPct: "0",
        marketingValor: "0",
        marketingModo: "percentual_preco",
        custosFixosRateadosBrl: "0",
        modo: "B_MARGEM_DO_PRECO",
        precoInformadoBrl: precoCalculado,
      },
      feesConfigFicticia,
      taxConfigFicticia,
      appConfigFicticia
    );

    expect(resB.precoVenda).toBe(precoCalculado);
    expect(resB.lucroUnitario).toBe(resA.lucroUnitario);
    expect(resB.margemPercentual).toBe(resA.margemPercentual);
  });

  it("Ponto de equilíbrio (Modo C) zera o lucro", () => {
    const resC = calcularMargem(
      {
        produtoId: 1,
        custoUnitarioFormacaoPrecoBrl: "30.00",
        tipoAnuncio: "Clássico",
        categoriaMl: "Eletrônicos",
        logistica: "envio_vendedor",
        pesoCobradoKg: "0.5",
        embalagemUnitariaBrl: "0",
        perdasDevolucoesPct: "0",
        marketingValor: "0",
        marketingModo: "percentual_preco",
        custosFixosRateadosBrl: "0",
        modo: "C_PONTO_EQUILIBRIO",
      },
      feesConfigFicticia,
      taxConfigFicticia,
      appConfigFicticia
    );

    expect(resC.lucroUnitario).toBe("0");
    expect(resC.margemPercentual).toBe("0");
  });

  it("propaga status de menor nível (SIMULACAO se origem for SIMULACAO)", () => {
    const res = calcularMargem(
      {
        produtoId: 1,
        custoUnitarioFormacaoPrecoBrl: "20.00",
        statusCustoOrigem: "SIMULACAO",
        tipoAnuncio: "Clássico",
        categoriaMl: "Eletrônicos",
        logistica: "envio_vendedor",
        pesoCobradoKg: "0.2",
        modo: "A_PRECO_ALVO",
        alvoTipo: "MARGEM_PCT",
        alvoValor: "20",
      },
      feesConfigFicticia,
      taxConfigFicticia,
      appConfigFicticia
    );

    expect(resultadoStatusSimulacao(res.status)).toBe(true);
  });
});

function resultadoStatusSimulacao(st: string) {
  return st === "SIMULACAO";
}

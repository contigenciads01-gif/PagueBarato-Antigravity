import { describe, it, expect } from "vitest";
import { calcularCustos } from "./engine";
import { TaxConfig, AppConfig } from "../../config";

describe("Motor de Custos — Mecânica e Regras", () => {
  const taxConfigFicticia: TaxConfig = {
    regimes: {
      IMPORTACAO_PJ_DESPACHO: {
        tributos: [
          {
            codigo: "II",
            rotulo: "Imposto de Importação",
            aliquota: { valor: "16", status: "CONFIRMADO" },
            base: ["valor_aduaneiro"],
            por_dentro: false,
            ordem: 1,
            credito_recuperavel: { sim_nao: false, depende_regime: false },
          },
          {
            codigo: "IPI",
            rotulo: "IPI",
            aliquota: { valor: "10", status: "CONFIRMADO" },
            base: ["valor_aduaneiro", "ii"],
            por_dentro: false,
            ordem: 2,
            credito_recuperavel: { sim_nao: false, depende_regime: true },
          },
          {
            codigo: "ICMS_IMPORTACAO",
            rotulo: "ICMS PR",
            aliquota: { valor: "18", status: "CONFIRMADO" },
            base: ["valor_aduaneiro", "ii", "ipi"],
            por_dentro: true,
            ordem: 3,
            credito_recuperavel: { sim_nao: false, depende_regime: true },
          },
        ],
      },
      REMESSA_PF: {
        limite_usd: { valor: "50", status: "CONFIRMADO" },
        aliquota_ii_ate_limite: { valor: "20", status: "CONFIRMADO" },
        aliquota_ii_acima_limite: { valor: "60", status: "CONFIRMADO" },
        desconto_usd_sobre_ii: { valor: "20", status: "CONFIRMADO" },
        aliquota_icms: { valor: "17", status: "CONFIRMADO" },
      },
    },
    venda: {
      regime_tributario: { valor: "SIMPLES", status: "A_CONFIRMAR" },
      imposto_sobre_venda_percentual_efetivo: { valor: "4", status: "A_CONFIRMAR" },
    },
  };

  const appConfigFicticia: AppConfig = {
    cambio_cny_brl: { valor: "0.80", status: "CONFIRMADO" },
    cambio_usd_brl: { valor: "5.50", status: "CONFIRMADO" },
    iof_pagamento_exterior: { valor: "0.38", status: "CONFIRMADO" },
    spread_cambial: { valor: "1.5", status: "CONFIRMADO" },
    arredondamento_impostos: {
      metodo: "ROUND_HALF_UP",
      casas_decimais: 2,
      status: "CONFIRMADO",
    },
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

  it("calcula cascata e ICMS por dentro conferindo com cálculo manual", () => {
    // 10 unidades a 100 CNY cada = 1000 CNY * 0.80 = 800 BRL FOB
    // Frete = 200 BRL
    // Valor Aduaneiro = 1000 BRL
    // II (16%) = 160 BRL
    // IPI (10% sobre 1000 + 160 = 1160) = 116 BRL
    // ICMS por dentro (18%): Base = (1000 + 160 + 116) / (1 - 0.18) = 1276 / 0.82 = 1556.09756...
    // ICMS = 1556.09756 * 0.18 = 280.09756... arredondado = 280.10 BRL
    const resultado = calcularCustos(
      {
        produtoId: 1,
        quantidade: 10,
        precoUnitarioFob: "100",
        moeda: "CNY",
        via: "aerea",
        freteInternacional: { modo: "total", valor: "200" },
        seguroInternacional: { modo: "total", valor: "0" },
        despesasNacionais: [],
        regime: "IMPORTACAO_PJ_DESPACHO",
      },
      taxConfigFicticia,
      appConfigFicticia
    );

    expect(resultado.status).toBe("CONFIRMADO");
    expect(resultado.valorAduaneiroBrl).toBe("1000");

    const linhaII = resultado.linhas.find((l) => l.codigo === "II");
    expect(linhaII?.valor).toBe("160");

    const linhaIPI = resultado.linhas.find((l) => l.codigo === "IPI");
    expect(linhaIPI?.valor).toBe("116");

    const linhaICMS = resultado.linhas.find((l) => l.codigo === "ICMS_IMPORTACAO");
    expect(linhaICMS?.valor).toBe("280.1");

    // Total tributos = 160 + 116 + 280.10 = 556.10
    expect(resultado.totalTributosBrl).toBe("556.1");
  });

  it("retorna CONFIG_PENDENTE com pendências claras quando alíquotas forem null", () => {
    const configVazia: TaxConfig = {
      ...taxConfigFicticia,
      regimes: {
        ...taxConfigFicticia.regimes,
        IMPORTACAO_PJ_DESPACHO: {
          tributos: [
            {
              codigo: "II",
              rotulo: "Imposto de Importação",
              aliquota: { valor: null, status: "A_CONFIRMAR" },
              base: ["valor_aduaneiro"],
              por_dentro: false,
              ordem: 1,
              credito_recuperavel: { sim_nao: false, depende_regime: false },
            },
          ],
        },
      },
    };

    const resultado = calcularCustos(
      {
        produtoId: 1,
        quantidade: 1,
        precoUnitarioFob: "10",
        moeda: "CNY",
        via: "aerea",
        freteInternacional: { modo: "total", valor: "0" },
        seguroInternacional: { modo: "total", valor: "0" },
        despesasNacionais: [],
        regime: "IMPORTACAO_PJ_DESPACHO",
      },
      configVazia,
      appConfigFicticia
    );

    expect(resultado.status).toBe("CONFIG_PENDENTE");
    expect(resultado.pendencias.length).toBeGreaterThan(0);
    expect(resultado.pendencias[0]?.rotulo).toBe("Imposto de Importação");
    expect(resultado.fobTotalBrl).toBeNull();
  });

  it("permite overrides gerando status SIMULACAO", () => {
    const resultado = calcularCustos(
      {
        produtoId: 1,
        quantidade: 5,
        precoUnitarioFob: "50",
        moeda: "CNY",
        via: "aerea",
        freteInternacional: { modo: "total", valor: "50" },
        seguroInternacional: { modo: "total", valor: "0" },
        despesasNacionais: [],
        overridesConfig: {
          "tributo.II": "20",
        },
        regime: "IMPORTACAO_PJ_DESPACHO",
      },
      taxConfigFicticia,
      appConfigFicticia
    );

    expect(resultado.status).toBe("SIMULACAO");
    const ii = resultado.linhas.find((l) => l.codigo === "II");
    expect(ii?.statusItem).toBe("SIMULACAO");
  });

  it("garante determinismo: 100 execuções produzem saída rigorosamente idêntica", () => {
    const entrada = {
      produtoId: 1,
      quantidade: 10,
      precoUnitarioFob: "100",
      moeda: "CNY" as const,
      via: "aerea" as const,
      freteInternacional: { modo: "total" as const, valor: "200" },
      seguroInternacional: { modo: "total" as const, valor: "0" },
      despesasNacionais: [],
      regime: "IMPORTACAO_PJ_DESPACHO" as const,
    };

    const primeira = JSON.stringify(
      calcularCustos(entrada, taxConfigFicticia, appConfigFicticia)
    );
    for (let i = 0; i < 100; i++) {
      const atual = JSON.stringify(
        calcularCustos(entrada, taxConfigFicticia, appConfigFicticia)
      );
      expect(atual).toBe(primeira);
    }
  });
});

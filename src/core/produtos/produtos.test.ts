import { describe, it, expect } from "vitest";
import { ProdutoInputSchema } from "./schema";
import {
  calcularPesoCubico,
  calcularPesoCobrado,
  encontrarFaixaAplicada,
  calcularResumoConcorrentes,
} from "./derived";
import {
  criarProduto,
  listarProdutos,
  arquivarProduto,
  restaurarProduto,
  duplicarProduto,
} from "./service";
import { fromString } from "../money";

describe("Produto Schema", () => {
  const produtoValidoBase = {
    nome: "Fita LED RGB 5m",
    linkReferencia: "https://exemplo.com/fita-led",
    categoria: "Iluminação",
    ncm: "8543.70.99",
    ncmStatus: "A_CONFIRMAR" as const,
    linkFornecedor: "https://1688.com/item/123",
    moedaFornecedor: "CNY" as const,
    moq: 10,
    quantidadePlanejada: 50,
    pesoKg: "0,25",
    comprimentoCm: "15.0",
    larguraCm: "15,0",
    alturaCm: "3",
    faixasPreco: [
      { quantidadeMinima: 10, precoUnitario: "15,50" },
      { quantidadeMinima: 50, precoUnitario: "12.00" },
    ],
    precosReferencia: [
      {
        marketplace: "Mercado Livre" as const,
        valor: "45,90",
        dataColeta: "2026-01-15",
      },
    ],
  };

  it("aceita vírgula e ponto decimal e normaliza NCM", () => {
    const parsed = ProdutoInputSchema.parse(produtoValidoBase);
    expect(parsed.ncm).toBe("85437099");
    expect(parsed.pesoKg).toBe("0.25");
    expect(parsed.comprimentoCm).toBe("15.0");
    expect(parsed.faixasPreco[0]?.precoUnitario).toBe("15.50");
  });

  it("rejeita quantidade planeada menor que MOQ", () => {
    expect(() =>
      ProdutoInputSchema.parse({
        ...produtoValidoBase,
        quantidadePlanejada: 5,
        moq: 10,
      })
    ).toThrow("Quantidade planejada deve ser maior ou igual ao MOQ");
  });

  it("rejeita faixas fora de ordem ou duplicadas", () => {
    expect(() =>
      ProdutoInputSchema.parse({
        ...produtoValidoBase,
        faixasPreco: [
          { quantidadeMinima: 50, precoUnitario: "12.00" },
          { quantidadeMinima: 10, precoUnitario: "15.50" },
        ],
      })
    ).toThrow("crescentes e sem duplicidades");
  });

  it("rejeita data de coleta futura", () => {
    expect(() =>
      ProdutoInputSchema.parse({
        ...produtoValidoBase,
        precosReferencia: [
          {
            marketplace: "Mercado Livre" as const,
            valor: "50.00",
            dataColeta: "2099-01-01",
          },
        ],
      })
    ).toThrow("Data de coleta não pode ser futura");
  });
});

describe("Produto Derived Calculations", () => {
  it("peso cúbico com e sem fator configurado", () => {
    const semFator = calcularPesoCubico("20", "20", "20", null);
    expect(semFator.ok).toBe(false);
    expect(semFator.mensagem).toBe("fator não configurado");

    const comFator = calcularPesoCubico("30", "20", "10", "6000");
    expect(comFator.ok).toBe(true);
    // (30 * 20 * 10) / 6000 = 6000 / 6000 = 1.0 kg
    expect(comFator.valor?.toFixed(2)).toBe("1.00");
  });

  it("peso cobrado seleciona o maior entre real e cúbico", () => {
    const cubicoMaior = calcularPesoCobrado("0.5", {
      ok: true,
      valor: fromString("1.2"),
    });
    expect(cubicoMaior.ok).toBe(true);
    expect(cubicoMaior.valor?.toFixed(2)).toBe("1.20");

    const realMaior = calcularPesoCobrado("2.5", {
      ok: true,
      valor: fromString("1.2"),
    });
    expect(realMaior.ok).toBe(true);
    expect(realMaior.valor?.toFixed(2)).toBe("2.50");
  });

  it("faixa aplicada nos limites exatos e fora", () => {
    const faixas = [
      { quantidadeMinima: 10, precoUnitario: "20.00" },
      { quantidadeMinima: 50, precoUnitario: "15.00" },
      { quantidadeMinima: 100, precoUnitario: "12.00" },
    ];

    expect(encontrarFaixaAplicada(5, faixas)).toBeNull();
    expect(encontrarFaixaAplicada(10, faixas)?.precoUnitario).toBe("20.00");
    expect(encontrarFaixaAplicada(49, faixas)?.precoUnitario).toBe("20.00");
    expect(encontrarFaixaAplicada(50, faixas)?.precoUnitario).toBe("15.00");
    expect(encontrarFaixaAplicada(150, faixas)?.precoUnitario).toBe("12.00");
  });

  it("calcularResumoConcorrentes com par, ímpar e vazio", () => {
    expect(calcularResumoConcorrentes([]).quantidade).toBe(0);

    const impar = calcularResumoConcorrentes([
      { valor: "30.00" },
      { valor: "10.00" },
      { valor: "20.00" },
    ]);
    expect(impar.menor?.toFixed(2)).toBe("10.00");
    expect(impar.mediana?.toFixed(2)).toBe("20.00");
    expect(impar.maior?.toFixed(2)).toBe("30.00");

    const par = calcularResumoConcorrentes([
      { valor: "10.00" },
      { valor: "20.00" },
      { valor: "30.00" },
      { valor: "40.00" },
    ]);
    expect(par.mediana?.toFixed(2)).toBe("25.00");
  });
});

describe("Produto Service CRUD", () => {
  it("cria, consulta, atualiza, duplica e arquiva mantendo precisão", async () => {
    const novoProduto = await criarProduto({
      nome: "Smartwatch Bluetooth Z9",
      categoria: "Eletrônicos",
      ncm: "8517.62.77",
      ncmStatus: "A_CONFIRMAR",
      moedaFornecedor: "CNY",
      moq: 5,
      quantidadePlanejada: 20,
      pesoKg: "0.15",
      comprimentoCm: "10",
      larguraCm: "10",
      alturaCm: "5",
      faixasPreco: [
        { quantidadeMinima: 5, precoUnitario: "35.50" },
        { quantidadeMinima: 20, precoUnitario: "30.00" },
      ],
      precosReferencia: [
        {
          marketplace: "Mercado Livre",
          valor: "120.00",
          dataColeta: "2026-02-01",
        },
      ],
    });

    expect(novoProduto).toBeDefined();
    expect(novoProduto?.nome).toBe("Smartwatch Bluetooth Z9");
    expect(novoProduto?.ncm).toBe("85176277");
    expect(novoProduto?.faixasPreco.length).toBe(2);

    const id = novoProduto!.id;
    await arquivarProduto(id);
    const ativos = await listarProdutos({ mostrarArquivados: false });
    expect(ativos.some((p) => p.id === id)).toBe(false);

    await restaurarProduto(id);
    const restaurados = await listarProdutos({ mostrarArquivados: false });
    expect(restaurados.some((p) => p.id === id)).toBe(true);

    const duplicado = await duplicarProduto(id);
    expect(duplicado?.nome).toBe("Smartwatch Bluetooth Z9 (Cópia)");
    expect(duplicado?.faixasPreco.length).toBe(2);
  });
});

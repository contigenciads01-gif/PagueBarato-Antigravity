import { describe, it, expect } from "vitest";
import {
  fromString,
  add,
  sub,
  mul,
  div,
  pct,
  toDisplay,
  toDisplayPct,
  toStorageString,
  roundHalfUp,
  roundCeil,
  fromNumber,
  ZERO,
} from "./index";

describe("Money — fromString", () => {
  it("aceita ponto decimal", () => {
    expect(fromString("12.50").toFixed(2)).toBe("12.50");
  });

  it("aceita vírgula decimal", () => {
    expect(fromString("12,50").toFixed(2)).toBe("12.50");
  });

  it("rejeita texto inválido", () => {
    expect(() => fromString("abc")).toThrow("Valor monetário inválido");
  });

  it("rejeita string vazia após trim", () => {
    expect(() => fromString("  ")).toThrow("Valor monetário inválido");
  });
});

describe("Money — operações básicas", () => {
  it("0,1 + 0,2 = 0,3 exato (sem floating point)", () => {
    const a = fromString("0.1");
    const b = fromString("0.2");
    const result = add(a, b);
    expect(result.toFixed(1)).toBe("0.3");
    // Confirmar que não é 0.30000000000000004
    expect(result.toString()).not.toBe("0.30000000000000004");
  });

  it("add funciona corretamente", () => {
    expect(add(fromString("10.50"), fromString("5.25")).toFixed(2)).toBe("15.75");
  });

  it("sub funciona corretamente", () => {
    expect(sub(fromString("10.00"), fromString("3.50")).toFixed(2)).toBe("6.50");
  });

  it("mul funciona corretamente", () => {
    expect(mul(fromString("3.00"), fromString("2.50")).toFixed(2)).toBe("7.50");
  });

  it("div funciona corretamente", () => {
    expect(div(fromString("10.00"), fromString("4.00")).toFixed(2)).toBe("2.50");
  });

  it("div por zero lança erro claro", () => {
    expect(() => div(fromString("10.00"), ZERO)).toThrow("Divisão por zero");
  });
});

describe("Money — percentual", () => {
  it("10% de 200 = 20", () => {
    expect(pct(fromString("200.00"), fromString("10")).toFixed(2)).toBe("20.00");
  });

  it("100% de qualquer valor = o próprio valor", () => {
    expect(pct(fromString("99.99"), fromString("100")).toFixed(2)).toBe("99.99");
  });

  it("0% de qualquer valor = 0", () => {
    expect(pct(fromString("500.00"), ZERO).toFixed(2)).toBe("0.00");
  });

  it("percentual fracionário: 12,5% de 80 = 10", () => {
    expect(pct(fromString("80.00"), fromString("12.5")).toFixed(2)).toBe("10.00");
  });
});

describe("Money — arredondamento", () => {
  it("roundHalfUp arredonda metade para cima", () => {
    expect(roundHalfUp(fromString("1.005")).toFixed(2)).toBe("1.01");
    expect(roundHalfUp(fromString("1.004")).toFixed(2)).toBe("1.00");
  });

  it("roundCeil sempre arredonda para cima", () => {
    expect(roundCeil(fromString("1.001")).toFixed(2)).toBe("1.01");
    expect(roundCeil(fromString("1.000")).toFixed(2)).toBe("1.00");
  });

  it("roundCeil nunca reduz o valor", () => {
    const original = fromString("10.123");
    const rounded = roundCeil(original);
    expect(rounded.greaterThanOrEqualTo(original)).toBe(true);
  });
});

describe("Money — formatação pt-BR", () => {
  it("formata 1234.56 como R$ 1.234,56", () => {
    const result = toDisplay(fromString("1234.56"));
    expect(result).toBe("R$\u00a01.234,56");
  });

  it("formata zero como R$ 0,00", () => {
    expect(toDisplay(ZERO)).toBe("R$\u00a00,00");
  });

  it("toDisplayPct formata 12.5 como 12,50%", () => {
    expect(toDisplayPct(fromString("12.5"))).toBe("12,50%");
  });

  it("toDisplay arredonda ROUND_HALF_UP na exibição", () => {
    // 1.005 → 1.01 com ROUND_HALF_UP
    const result = toDisplay(fromString("1.005"));
    expect(result).toBe("R$\u00a01,01");
  });
});

describe("Money — persistência", () => {
  it("toStorageString mantém precisão sem trailing zeros desnecessários", () => {
    expect(toStorageString(fromString("10.50"))).toBe("10.5");
    expect(toStorageString(fromString("10.00"))).toBe("10");
    expect(toStorageString(fromString("10.123456789"))).toBe("10.123456789");
  });

  it("ida e volta: fromString(toStorageString(x)) = x", () => {
    const original = fromString("123.456789");
    const stored = toStorageString(original);
    const restored = fromString(stored);
    expect(restored.equals(original)).toBe(true);
  });
});

describe("Money — precisão acumulada", () => {
  it("soma de 100 parcelas de 0.1 = 10 exato", () => {
    let total = ZERO;
    for (let i = 0; i < 100; i++) {
      total = add(total, fromString("0.1"));
    }
    expect(total.toFixed(1)).toBe("10.0");
  });

  it("divisão e multiplicação sem drift", () => {
    const val = fromString("1");
    const divided = div(val, fromNumber(3));
    const multiplied = mul(divided, fromNumber(3));
    // 1/3 * 3 deve ser 1 com alta precisão
    expect(multiplied.toDecimalPlaces(10).toFixed(10)).toBe("1.0000000000");
  });
});

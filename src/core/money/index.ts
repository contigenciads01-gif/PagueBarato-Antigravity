/**
 * src/core/money/index.ts
 *
 * Utilitários monetários baseados em decimal.js.
 * REGRA: nunca usar number nativo para dinheiro ou percentual.
 * Cálculos internos mantêm precisão total; arredondamento só na exibição final.
 */

import Decimal from "decimal.js";

// Configuração global do decimal.js
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/** Tipo Money: wrapper sobre Decimal para valores monetários */
export type Money = Decimal;

/** Cria um Money a partir de string, aceitando vírgula ou ponto decimal */
export function fromString(value: string): Money {
  const normalized = value.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Valor monetário inválido: "${value}"`);
  }
  return new Decimal(normalized);
}

/** Cria um Money a partir de string ou Decimal */
export function toMoney(value: string | Decimal): Money {
  if (value instanceof Decimal) return value;
  return fromString(value);
}

/** Soma dois valores Money */
export function add(a: Money, b: Money): Money {
  return a.plus(b);
}

/** Subtrai b de a */
export function sub(a: Money, b: Money): Money {
  return a.minus(b);
}

/** Multiplica dois valores Money */
export function mul(a: Money, b: Money): Money {
  return a.times(b);
}

/** Divide a por b. Lança erro claro se b for zero */
export function div(a: Money, b: Money): Money {
  if (b.isZero()) {
    throw new Error("Divisão por zero não permitida em cálculos monetários");
  }
  return a.dividedBy(b);
}

/**
 * Calcula percentual de um valor.
 * pct(valor, 10) = 10% de valor
 * O percentual é interpretado como porcentagem (10 = 10%, não 0.10)
 */
export function pct(valor: Money, percentual: Money): Money {
  return valor.times(percentual).dividedBy(new Decimal(100));
}

/**
 * Formata para exibição em pt-BR: "R$ 1.234,56"
 * Arredondamento ROUND_HALF_UP com 2 casas decimais APENAS na exibição.
 */
export function toDisplay(value: Money): string {
  const rounded = value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(rounded.toString()));
}

/**
 * Formata percentual para exibição: "12,50%"
 */
export function toDisplayPct(value: Money): string {
  const rounded = value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return (
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(rounded.toString())) + "%"
  );
}

/**
 * Retorna o valor como string decimal para persistência (nunca float).
 * Mantém precisão total.
 */
export function toStorageString(value: Money): string {
  return value.toFixed(10).replace(/\.?0+$/, "") || "0";
}

/** Arredonda para centavos com ROUND_HALF_UP */
export function roundHalfUp(value: Money): Money {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Arredonda para cima (ROUND_CEIL) — nunca reduz margem */
export function roundCeil(value: Money): Money {
  return value.toDecimalPlaces(2, Decimal.ROUND_CEIL);
}

/** Zero */
export const ZERO: Money = new Decimal(0);

/** Cria Money a partir de número (apenas para testes/fixtures fictícias — não usar em produção) */
export function fromNumber(n: number): Money {
  return new Decimal(n);
}

import { fromString, div, mul, Money } from "../money";
import Decimal from "decimal.js";

export interface PesoCubicoResult {
  ok: boolean;
  valor?: Money;
  mensagem?: string;
}

export function calcularPesoCubico(
  comprimentoCm: string,
  larguraCm: string,
  alturaCm: string,
  fatorPesoCubico: string | number | null
): PesoCubicoResult {
  if (
    fatorPesoCubico === null ||
    fatorPesoCubico === undefined ||
    fatorPesoCubico === ""
  ) {
    return { ok: false, mensagem: "fator não configurado" };
  }

  const fator = fromString(String(fatorPesoCubico));
  if (fator.isZero()) {
    return { ok: false, mensagem: "fator não pode ser zero" };
  }

  const c = fromString(comprimentoCm);
  const l = fromString(larguraCm);
  const a = fromString(alturaCm);

  const vol = mul(mul(c, l), a);
  const pesoCubico = div(vol, fator);

  return { ok: true, valor: pesoCubico };
}

export interface PesoCobradoResult {
  ok: boolean;
  valor?: Money;
  mensagem?: string;
}

export function calcularPesoCobrado(
  pesoRealKg: string,
  pesoCubicoRes: PesoCubicoResult
): PesoCobradoResult {
  if (!pesoCubicoRes.ok || !pesoCubicoRes.valor) {
    return { ok: false, mensagem: pesoCubicoRes.mensagem ?? "peso cúbico indisponível" };
  }

  const real = fromString(pesoRealKg);
  const maior = real.greaterThan(pesoCubicoRes.valor) ? real : pesoCubicoRes.valor;
  return { ok: true, valor: maior };
}

export interface FaixaPrecoItem {
  quantidadeMinima: number;
  precoUnitario: string;
}

export function encontrarFaixaAplicada(
  quantidade: number,
  faixas: FaixaPrecoItem[]
): FaixaPrecoItem | null {
  if (!faixas || faixas.length === 0) return null;
  const ordenadas = [...faixas].sort(
    (a, b) => a.quantidadeMinima - b.quantidadeMinima
  );

  let aplicada: FaixaPrecoItem | null = null;
  for (const f of ordenadas) {
    if (quantidade >= f.quantidadeMinima) {
      aplicada = f;
    } else {
      break;
    }
  }
  return aplicada;
}

export interface ResumoConcorrentes {
  quantidade: number;
  menor: Money | null;
  mediana: Money | null;
  maior: Money | null;
}

export function calcularResumoConcorrentes(
  precos: Array<{ valor: string; dataColeta?: string }>
): ResumoConcorrentes {
  if (!precos || precos.length === 0) {
    return { quantidade: 0, menor: null, mediana: null, maior: null };
  }

  const decimais = precos
    .map((p) => fromString(p.valor))
    .sort((a, b) => a.comparedTo(b));

  const count = decimais.length;
  const menor = decimais[0] ?? null;
  const maior = decimais[count - 1] ?? null;

  let mediana: Money;
  const mid = Math.floor(count / 2);
  if (count % 2 === 1) {
    mediana = decimais[mid]!;
  } else {
    const d1 = decimais[mid - 1]!;
    const d2 = decimais[mid]!;
    mediana = d1.plus(d2).dividedBy(new Decimal(2));
  }

  return {
    quantidade: count,
    menor,
    mediana,
    maior,
  };
}

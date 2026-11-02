"use server";

import { revalidatePath } from "next/cache";
import { executarCalculoCustos } from "@/core/agents/custos/service";
import { executarCalculoMargem, marcarPrecoAdotado } from "@/core/agents/margem/service";
import { EntradaCustos } from "@/core/agents/custos/schema";
import { EntradaMargemInput } from "@/core/agents/margem/schema";

export async function actionSimularCustos(dados: Partial<EntradaCustos> & { produtoId: number }) {
  try {
    const res = await executarCalculoCustos(dados);
    return { ok: true, data: res };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro no cálculo de custos" };
  }
}

export async function actionSimularMargem(dados: Partial<EntradaMargemInput> & { produtoId: number }) {
  try {
    const res = await executarCalculoMargem(dados as any);
    return { ok: true, data: res };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro no cálculo de margem" };
  }
}

export async function actionMarcarPrecoAdotado(calculoId: number) {
  try {
    await marcarPrecoAdotado(calculoId);
    revalidatePath("/calculadora");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao adotar preço" };
  }
}

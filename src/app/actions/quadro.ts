"use server";

import { revalidatePath } from "next/cache";
import { obterOuCriarQuadroPrincipal, carregarElementosQuadro, obterDadosCardLoja } from "@/core/board/summary";
import { salvarElemento, removerElemento, OperacaoElemento } from "@/core/board/operations";

export async function actionCarregarQuadro(produtoId: number) {
  try {
    const quadro = await obterOuCriarQuadroPrincipal(produtoId);
    const itens = await carregarElementosQuadro(quadro.id);
    const cardLoja = await obterDadosCardLoja(produtoId);
    return { ok: true, quadro, itens, cardLoja };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function actionSalvarElemento(op: OperacaoElemento) {
  try {
    await salvarElemento(op);
    revalidatePath("/quadro");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function actionRemoverElemento(id: string) {
  try {
    await removerElemento(id);
    revalidatePath("/quadro");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

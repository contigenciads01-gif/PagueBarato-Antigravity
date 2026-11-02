"use server";

import { revalidatePath } from "next/cache";
import { criarProduto, atualizarProduto, arquivarProduto, restaurarProduto, duplicarProduto } from "@/core/produtos/service";
import { ProdutoInput } from "@/core/produtos/schema";

export async function actionCriarProduto(dados: ProdutoInput) {
  try {
    const novoProduto = await criarProduto(dados);
    revalidatePath("/produtos");
    revalidatePath("/");
    return { ok: true, produto: novoProduto };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

export async function actionAtualizarProduto(id: number, dados: ProdutoInput) {
  try {
    const atualizado = await atualizarProduto(id, dados);
    revalidatePath(`/produtos/${id}`);
    revalidatePath("/produtos");
    return { ok: true, produto: atualizado };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

export async function actionArquivarProduto(id: number) {
  await arquivarProduto(id);
  revalidatePath("/produtos");
  revalidatePath("/");
  return { ok: true };
}

export async function actionRestaurarProduto(id: number) {
  await restaurarProduto(id);
  revalidatePath("/produtos");
  revalidatePath("/");
  return { ok: true };
}

export async function actionDuplicarProduto(id: number) {
  const dup = await duplicarProduto(id);
  revalidatePath("/produtos");
  return { ok: true, produto: dup };
}

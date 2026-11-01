import { db } from "../../db/client";
import {
  produtos,
  produtoFaixasPreco,
  produtoPrecosReferencia,
} from "../../db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { ProdutoInput, ProdutoInputSchema } from "./schema";

export interface ListarProdutosFiltros {
  categoria?: string;
  mostrarArquivados?: boolean;
  buscaNome?: string;
}

export async function criarProduto(dados: ProdutoInput) {
  const validado = ProdutoInputSchema.parse(dados);

  const [novoProd] = await db
    .insert(produtos)
    .values({
      nome: validado.nome,
      linkReferencia: validado.linkReferencia,
      categoria: validado.categoria,
      ncm: validado.ncm,
      ncmStatus: validado.ncmStatus,
      observacoes: validado.observacoes,
      linkFornecedor: validado.linkFornecedor,
      moedaFornecedor: validado.moedaFornecedor,
      moq: validado.moq,
      quantidadePlanejada: validado.quantidadePlanejada,
      prazoProducaoDias: validado.prazoProducaoDias,
      pesoKg: validado.pesoKg,
      comprimentoCm: validado.comprimentoCm,
      larguraCm: validado.larguraCm,
      alturaCm: validado.alturaCm,
      unidadesPorCaixa: validado.unidadesPorCaixa,
      pesoCaixaKg: validado.pesoCaixaKg,
    })
    .returning();

  if (!novoProd) {
    throw new Error("Falha ao inserir registro do produto");
  }

  const produtoId = novoProd.id;

  if (validado.faixasPreco && validado.faixasPreco.length > 0) {
    await db.insert(produtoFaixasPreco).values(
      validado.faixasPreco.map((f, idx) => ({
        produtoId,
        quantidadeMinima: f.quantidadeMinima,
        precoUnitario: f.precoUnitario,
        ordem: idx,
      }))
    );
  }

  if (validado.precosReferencia && validado.precosReferencia.length > 0) {
    await db.insert(produtoPrecosReferencia).values(
      validado.precosReferencia.map((p) => ({
        produtoId,
        marketplace: p.marketplace,
        valor: p.valor,
        tituloAnuncio: p.tituloAnuncio,
        link: p.link,
        dataColeta: p.dataColeta,
        origem: p.origem || "manual",
      }))
    );
  }

  return obterProdutoPorId(produtoId);
}

export async function obterProdutoPorId(id: number) {
  const [prod] = await db.select().from(produtos).where(eq(produtos.id, id));
  if (!prod) return null;

  const faixas = await db
    .select()
    .from(produtoFaixasPreco)
    .where(eq(produtoFaixasPreco.produtoId, id));

  const precos = await db
    .select()
    .from(produtoPrecosReferencia)
    .where(eq(produtoPrecosReferencia.produtoId, id));

  return {
    ...prod,
    faixasPreco: faixas.sort((a, b) => a.ordem - b.ordem),
    precosReferencia: precos,
  };
}

export async function atualizarProduto(id: number, dados: ProdutoInput) {
  const validado = ProdutoInputSchema.parse(dados);

  await db
    .update(produtos)
    .set({
      nome: validado.nome,
      linkReferencia: validado.linkReferencia,
      categoria: validado.categoria,
      ncm: validado.ncm,
      ncmStatus: validado.ncmStatus,
      observacoes: validado.observacoes,
      linkFornecedor: validado.linkFornecedor,
      moedaFornecedor: validado.moedaFornecedor,
      moq: validado.moq,
      quantidadePlanejada: validado.quantidadePlanejada,
      prazoProducaoDias: validado.prazoProducaoDias,
      pesoKg: validado.pesoKg,
      comprimentoCm: validado.comprimentoCm,
      larguraCm: validado.larguraCm,
      alturaCm: validado.alturaCm,
      unidadesPorCaixa: validado.unidadesPorCaixa,
      pesoCaixaKg: validado.pesoCaixaKg,
      atualizadoEm: new Date().toISOString(),
    })
    .where(eq(produtos.id, id));

  await db
    .delete(produtoFaixasPreco)
    .where(eq(produtoFaixasPreco.produtoId, id));
  if (validado.faixasPreco && validado.faixasPreco.length > 0) {
    await db.insert(produtoFaixasPreco).values(
      validado.faixasPreco.map((f, idx) => ({
        produtoId: id,
        quantidadeMinima: f.quantidadeMinima,
        precoUnitario: f.precoUnitario,
        ordem: idx,
      }))
    );
  }

  await db
    .delete(produtoPrecosReferencia)
    .where(eq(produtoPrecosReferencia.produtoId, id));
  if (validado.precosReferencia && validado.precosReferencia.length > 0) {
    await db.insert(produtoPrecosReferencia).values(
      validado.precosReferencia.map((p) => ({
        produtoId: id,
        marketplace: p.marketplace,
        valor: p.valor,
        tituloAnuncio: p.tituloAnuncio,
        link: p.link,
        dataColeta: p.dataColeta,
        origem: p.origem || "manual",
      }))
    );
  }

  return obterProdutoPorId(id);
}

export async function listarProdutos(filtros: ListarProdutosFiltros = {}) {
  let query = db.select().from(produtos).$dynamic();

  if (!filtros.mostrarArquivados) {
    query = query.where(isNull(produtos.arquivadoEm));
  }

  const prods = await query.orderBy(desc(produtos.atualizadoEm));

  const resultado = [];
  for (const p of prods) {
    if (filtros.categoria && p.categoria !== filtros.categoria) {
      continue;
    }
    if (
      filtros.buscaNome &&
      !p.nome.toLowerCase().includes(filtros.buscaNome.toLowerCase())
    ) {
      continue;
    }

    const faixas = await db
      .select()
      .from(produtoFaixasPreco)
      .where(eq(produtoFaixasPreco.produtoId, p.id));
    const precos = await db
      .select()
      .from(produtoPrecosReferencia)
      .where(eq(produtoPrecosReferencia.produtoId, p.id));

    resultado.push({
      ...p,
      faixasPreco: faixas.sort((a, b) => a.ordem - b.ordem),
      precosReferencia: precos,
    });
  }

  return resultado;
}

export async function arquivarProduto(id: number) {
  await db
    .update(produtos)
    .set({ arquivadoEm: new Date().toISOString() })
    .where(eq(produtos.id, id));
  return true;
}

export async function restaurarProduto(id: number) {
  await db
    .update(produtos)
    .set({ arquivadoEm: null })
    .where(eq(produtos.id, id));
  return true;
}

export async function duplicarProduto(id: number) {
  const original = await obterProdutoPorId(id);
  if (!original) throw new Error("Produto original não encontrado para duplicação");

  const dadosDuplicados: ProdutoInput = {
    nome: `${original.nome} (Cópia)`,
    linkReferencia: original.linkReferencia,
    categoria: original.categoria,
    ncm: original.ncm,
    ncmStatus: "A_CONFIRMAR",
    observacoes: original.observacoes,
    linkFornecedor: original.linkFornecedor,
    moedaFornecedor: original.moedaFornecedor as "CNY" | "USD" | "BRL",
    moq: original.moq || 1,
    quantidadePlanejada: original.quantidadePlanejada || 1,
    prazoProducaoDias: original.prazoProducaoDias,
    pesoKg: original.pesoKg || "0.1",
    comprimentoCm: original.comprimentoCm || "10",
    larguraCm: original.larguraCm || "10",
    alturaCm: original.alturaCm || "10",
    unidadesPorCaixa: original.unidadesPorCaixa,
    pesoCaixaKg: original.pesoCaixaKg,
    faixasPreco: original.faixasPreco.map((f) => ({
      quantidadeMinima: f.quantidadeMinima,
      precoUnitario: f.precoUnitario,
      ordem: f.ordem,
    })),
    precosReferencia: original.precosReferencia.map((p) => ({
      marketplace: p.marketplace as
        | "Mercado Livre"
        | "Shopee"
        | "TikTok Shop"
        | "Alibaba"
        | "1688"
        | "Outro",
      valor: p.valor,
      tituloAnuncio: p.tituloAnuncio,
      link: p.link,
      dataColeta: new Date().toISOString().split("T")[0]!,
      origem: "duplicacao",
    })),
  };

  return criarProduto(dadosDuplicados);
}

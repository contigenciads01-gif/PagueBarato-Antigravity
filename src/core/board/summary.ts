import { db } from "../../db/client";
import { quadros, elementos, produtos, Elemento } from "../../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { calcularResumoConcorrentes } from "../produtos/derived";
import { obterPrecoSugerido } from "../agents/margem/service";
import { fromString, sub, div, mul, roundHalfUp, toStorageString } from "../money";
import Decimal from "decimal.js";
import { garantirMigracaoPronta } from "../../db/autoMigrate";

export interface PrecoConcorrenteQuadro {
  id: string;
  marketplace: string;
  valor: string;
  dataColeta: string;
  titulo?: string;
  status: "CONFIRMADO" | "RASCUNHO";
}

export async function obterOuCriarQuadroPrincipal(produtoId: number) {
  await garantirMigracaoPronta();
  const [existente] = await db
    .select()
    .from(quadros)
    .where(and(eq(quadros.produtoId, produtoId), eq(quadros.principal, 1), isNull(quadros.arquivadoEm)));

  if (existente) return existente;

  const [novo] = await db
    .insert(quadros)
    .values({
      produtoId,
      nome: "Quadro Principal",
      principal: 1,
    })
    .returning();

  return novo!;
}

export async function carregarElementosQuadro(quadroId: number) {
  return db.select().from(elementos).where(eq(elementos.quadroId, quadroId));
}

export async function obterPrecosConcorrentes(produtoId: number) {
  const quadro = await obterOuCriarQuadroPrincipal(produtoId);
  const elems = await carregarElementosQuadro(quadro.id);

  const cardsConcorrentes = elems
    .filter((e: Elemento) => e.tipo === "CARD_PRECO")
    .map((e: Elemento) => {
      try {
        const dados = JSON.parse(e.dadosJson);
        return {
          id: e.id,
          marketplace: dados.marketplace || "Outro",
          valor: dados.valor || "0",
          dataColeta: dados.dataColeta || "",
          titulo: dados.tituloAnuncio || "",
          status: dados.status || "CONFIRMADO",
        } as PrecoConcorrenteQuadro;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as PrecoConcorrenteQuadro[];

  const confirmados = cardsConcorrentes.filter((c) => c.status === "CONFIRMADO");

  // Fallback para a lista da Ficha do Produto se o quadro não tiver confirmados
  if (confirmados.length === 0) {
    const [prod] = await db.select().from(produtos).where(eq(produtos.id, produtoId));
    if (!prod) return { precos: [], resumo: null };
  }

  const resumo = calcularResumoConcorrentes(confirmados.map((c) => ({ valor: c.valor })));
  return { precos: cardsConcorrentes, confirmados, resumo };
}

export async function obterDadosCardLoja(produtoId: number) {
  const precoSugerido = await obterPrecoSugerido(produtoId);
  const { resumo } = await obterPrecosConcorrentes(produtoId);

  let comparacaoMediana = null;
  if (precoSugerido?.preco && resumo?.mediana) {
    const precoLoja = fromString(precoSugerido.preco);
    const difBrl = sub(precoLoja, resumo.mediana);
    const difPct = mul(div(difBrl, resumo.mediana), new Decimal(100));

    comparacaoMediana = {
      diferencaBrl: toStorageString(difBrl),
      diferencaPct: toStorageString(roundHalfUp(difPct)),
      maisBarato: difBrl.isNegative(),
    };
  }

  return { precoSugerido, resumo, comparacaoMediana };
}

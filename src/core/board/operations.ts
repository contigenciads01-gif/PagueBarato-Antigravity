import { db } from "../../db/client";
import { elementos } from "../../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const OperacaoElementoSchema = z.object({
  id: z.string(),
  quadroId: z.number().int(),
  tipo: z.enum(["CARD_PRECO", "CARD_LOJA", "IMAGEM", "NOTA"]),
  dadosJson: z.string(),
  x: z.number().default(100),
  y: z.number().default(100),
  largura: z.number().default(240),
  altura: z.number().default(160),
  zIndex: z.number().default(1),
});

export type OperacaoElemento = z.infer<typeof OperacaoElementoSchema>;

export async function salvarElemento(op: OperacaoElemento) {
  const validado = OperacaoElementoSchema.parse(op);

  const [existente] = await db
    .select()
    .from(elementos)
    .where(eq(elementos.id, validado.id));

  if (existente) {
    await db
      .update(elementos)
      .set({
        dadosJson: validado.dadosJson,
        x: validado.x,
        y: validado.y,
        largura: validado.largura,
        altura: validado.altura,
        zIndex: validado.zIndex,
        atualizadoEm: new Date().toISOString(),
      })
      .where(eq(elementos.id, validado.id));
  } else {
    await db.insert(elementos).values({
      id: validado.id,
      quadroId: validado.quadroId,
      tipo: validado.tipo,
      dadosJson: validado.dadosJson,
      x: validado.x,
      y: validado.y,
      largura: validado.largura,
      altura: validado.altura,
      zIndex: validado.zIndex,
    });
  }

  return true;
}

export async function removerElemento(id: string) {
  await db.delete(elementos).where(eq(elementos.id, id));
  return true;
}

import { z } from "zod";

export const decimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val).trim().replace(",", "."))
  .refine((val) => /^-?\d+(\.\d+)?$/.test(val), {
    message: "Valor decimal inválido",
  });

export const positiveDecimalStringSchema = decimalStringSchema.refine(
  (val) => parseFloat(val) > 0,
  { message: "Valor deve ser maior que zero" }
);

export const nonNegativeDecimalStringSchema = decimalStringSchema.refine(
  (val) => parseFloat(val) >= 0,
  { message: "Valor não pode ser negativo" }
);

export const ncmSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.replace(/\D/g, "") : null))
  .refine((val) => val === null || val === "" || val.length === 8, {
    message: "NCM deve conter exatamente 8 dígitos numéricos",
  });

export const urlOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .refine((val) => !val || val === "" || /^https?:\/\/.+/.test(val), {
    message: "URL inválida (deve começar com http:// ou https://)",
  });

export const FaixaPrecoSchema = z.object({
  id: z.number().optional(),
  quantidadeMinima: z.number().int().min(1, "Quantidade mínima deve ser ≥ 1"),
  precoUnitario: positiveDecimalStringSchema,
  ordem: z.number().int().optional().default(0),
});

export const PrecoReferenciaSchema = z.object({
  id: z.number().optional(),
  marketplace: z.enum([
    "Mercado Livre",
    "Shopee",
    "TikTok Shop",
    "Alibaba",
    "1688",
    "Outro",
  ]),
  valor: positiveDecimalStringSchema,
  tituloAnuncio: z.string().optional().nullable(),
  link: urlOptionalSchema,
  dataColeta: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    },
    { message: "Data de coleta não pode ser futura ou inválida" }
  ),
  origem: z.string().optional().default("manual"),
});

export const ProdutoInputSchema = z
  .object({
    id: z.number().optional(),
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(120, "Nome deve ter no máximo 120 caracteres"),
    linkReferencia: urlOptionalSchema,
    categoria: z.string().optional().nullable(),
    ncm: ncmSchema,
    ncmStatus: z.enum(["A_CONFIRMAR", "CONFIRMADO"]).default("A_CONFIRMAR"),
    observacoes: z.string().optional().nullable(),
    linkFornecedor: urlOptionalSchema,
    moedaFornecedor: z.enum(["CNY", "USD", "BRL"]).default("CNY"),
    faixasPreco: z.array(FaixaPrecoSchema).min(1, "O produto deve ter ao menos 1 faixa de preço"),
    moq: z.number().int().min(1, "MOQ deve ser ≥ 1"),
    quantidadePlanejada: z.number().int().min(1, "Quantidade planejada deve ser ≥ 1"),
    prazoProducaoDias: z.number().int().optional().nullable(),
    pesoKg: positiveDecimalStringSchema,
    comprimentoCm: positiveDecimalStringSchema,
    larguraCm: positiveDecimalStringSchema,
    alturaCm: positiveDecimalStringSchema,
    unidadesPorCaixa: z.number().int().optional().nullable(),
    pesoCaixaKg: positiveDecimalStringSchema.optional().nullable(),
    precosReferencia: z.array(PrecoReferenciaSchema).default([]),
  })
  .refine((data) => data.quantidadePlanejada >= data.moq, {
    message: "Quantidade planejada deve ser maior ou igual ao MOQ",
    path: ["quantidadePlanejada"],
  })
  .refine(
    (data) => {
      const qtds = data.faixasPreco.map((f) => f.quantidadeMinima);
      const uniques = new Set(qtds);
      if (uniques.size !== qtds.length) return false;
      for (let i = 1; i < qtds.length; i++) {
        const prev = qtds[i - 1];
        const curr = qtds[i];
        if (prev !== undefined && curr !== undefined && curr <= prev) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Faixas de preço devem ter quantidades estritamente crescentes e sem duplicidades",
      path: ["faixasPreco"],
    }
  );

export type ProdutoInput = z.input<typeof ProdutoInputSchema>;
export type ProdutoOutput = z.output<typeof ProdutoInputSchema>;

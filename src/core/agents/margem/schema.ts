import { z } from "zod";

export const ModoMargemSchema = z.enum([
  "A_PRECO_ALVO",
  "B_MARGEM_DO_PRECO",
  "C_PONTO_EQUILIBRIO",
  "D_TABELA_PRECOS",
  "E_CAC_MAXIMO",
]);

export type ModoMargem = z.infer<typeof ModoMargemSchema>;

export const TipoAlvoSchema = z.enum(["MARGEM_PCT", "MARKUP_PCT", "LUCRO_BRL"]);
export type TipoAlvo = z.infer<typeof TipoAlvoSchema>;

export const EntradaMargemSchema = z.object({
  produtoId: z.number().int(),
  calculoCustosId: z.number().int().optional().nullable(),
  custoUnitarioFormacaoPrecoBrl: z.string(), // Decimal em BRL
  custoUnitarioDesembolsadoBrl: z.string().optional().nullable(),
  statusCustoOrigem: z.enum(["CONFIRMADO", "SIMULACAO", "CONFIG_PENDENTE"]).default("CONFIRMADO"),
  tipoAnuncio: z.string(),
  categoriaMl: z.string(),
  logistica: z.enum(["full", "flex", "coleta_propria", "envio_vendedor"]),
  pesoCobradoKg: z.string(),
  embalagemUnitariaBrl: z.string().default("0"),
  perdasDevolucoesPct: z.string().default("0"),
  marketingValor: z.string().default("0"),
  marketingModo: z.enum(["percentual_preco", "fixo_venda"]).default("percentual_preco"),
  custosFixosRateadosBrl: z.string().default("0"),
  modo: ModoMargemSchema.default("A_PRECO_ALVO"),
  alvoTipo: TipoAlvoSchema.default("MARGEM_PCT"),
  alvoValor: z.string().default("20"), // ex: "20" para 20%
  precoInformadoBrl: z.string().optional().nullable(),
  tabelaFaixa: z
    .object({
      de: z.string(),
      ate: z.string(),
      passo: z.string(),
    })
    .optional(),
  cacMargemMinimaPct: z.string().optional(),
  overridesConfig: z.record(z.string(), z.string()).optional(),
});

export type EntradaMargemInput = z.input<typeof EntradaMargemSchema>;
export type EntradaMargem = z.output<typeof EntradaMargemSchema>;

export const LinhaMargemSchema = z.object({
  codigo: z.string(),
  rotulo: z.string(),
  formulaTexto: z.string(),
  base: z.string(),
  percentual: z.string().nullable().optional(),
  valor: z.string(),
  origemConfig: z.string(),
  statusItem: z.enum(["CONFIRMADO", "SIMULACAO", "A_CONFIRMAR", "CONFIG_PENDENTE"]),
});

export type LinhaMargem = z.infer<typeof LinhaMargemSchema>;

export const ComparacaoConcorrentesMargemSchema = z.object({
  menor: z.string().nullable(),
  mediana: z.string().nullable(),
  maior: z.string().nullable(),
  posicao: z.string().nullable(),
  diferencaParaMedianaBrl: z.string().nullable(),
  diferencaParaMedianaPct: z.string().nullable(),
  aviso: z.string().nullable(),
});

export const ItemTabelaPrecoSchema = z.object({
  precoVenda: z.string(),
  lucroUnitario: z.string(),
  margemPercentual: z.string(),
  markupPercentual: z.string(),
});

export const ResultadoMargemSchema = z.object({
  status: z.enum(["CONFIRMADO", "SIMULACAO", "CONFIG_PENDENTE"]),
  modo: ModoMargemSchema,
  precoVenda: z.string().nullable(),
  lucroUnitario: z.string().nullable(),
  margemPercentual: z.string().nullable(),
  markupPercentual: z.string().nullable(),
  precoMinimoEquilibrio: z.string().nullable(),
  cacMaximoPossivelBrl: z.string().nullable().optional(),
  tabelaPrecos: z.array(ItemTabelaPrecoSchema).optional(),
  linhas: z.array(LinhaMargemSchema),
  faixaAplicada: z.string().nullable(),
  solucoesAlternativas: z.array(z.string()).optional(),
  comparacaoConcorrentes: ComparacaoConcorrentesMargemSchema.nullable(),
  alertas: z.array(z.string()),
  pendencias: z.array(z.string()),
  versaoMotor: z.string(),
  configSnapshot: z.record(z.string(), z.unknown()),
  calculoCustosId: z.number().int().optional().nullable(),
});

export type ResultadoMargem = z.infer<typeof ResultadoMargemSchema>;

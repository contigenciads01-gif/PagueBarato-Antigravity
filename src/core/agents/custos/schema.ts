import { z } from "zod";

export const EntradaCustosSchema = z.object({
  produtoId: z.number().int(),
  quantidade: z.number().int().min(1, "Quantidade deve ser ≥ 1"),
  precoUnitarioFob: z.string().optional(),
  moeda: z.enum(["CNY", "USD", "BRL"]).default("CNY"),
  via: z.enum(["aerea", "maritima", "courier"]),
  freteInternacional: z.object({
    modo: z.enum(["por_kg", "por_m3", "total"]),
    valor: z.string(), // Decimal em BRL ou moeda base convertida
  }),
  seguroInternacional: z.object({
    modo: z.enum(["percentual_fob", "total"]),
    valor: z.string(),
  }),
  freteInternoChina: z.string().optional().nullable(),
  comissaoAgentePercentual: z.string().optional().nullable(),
  despesasNacionais: z
    .array(
      z.object({
        rotulo: z.string(),
        valor: z.string(),
        tipo: z.string().optional(),
      })
    )
    .default([]),
  cambioOverride: z.string().optional().nullable(),
  overridesConfig: z.record(z.string(), z.string()).optional(),
  regime: z
    .enum(["IMPORTACAO_PJ_DESPACHO", "REMESSA_PF"])
    .default("IMPORTACAO_PJ_DESPACHO"),
});

export type EntradaCustos = z.infer<typeof EntradaCustosSchema>;

export const LinhaCustoSchema = z.object({
  codigo: z.string(),
  rotulo: z.string(),
  formulaTexto: z.string(),
  base: z.string(),
  aliquota: z.string(),
  valor: z.string(),
  origemConfig: z.string(),
  vigencia: z.string().nullable().optional(),
  statusItem: z.enum(["CONFIRMADO", "SIMULACAO", "A_CONFIRMAR"]),
  creditoRecuperavel: z.boolean().default(false),
});

export type LinhaCusto = z.infer<typeof LinhaCustoSchema>;

export const PendenciaConfigSchema = z.object({
  caminho: z.string(),
  rotulo: z.string(),
  oQueFazer: z.string(),
});

export type PendenciaConfig = z.infer<typeof PendenciaConfigSchema>;

export const ResultadoCustosSchema = z.object({
  status: z.enum(["CONFIRMADO", "SIMULACAO", "CONFIG_PENDENTE"]),
  regime: z.string(),
  quantidade: z.number().int(),
  fobTotalBrl: z.string().nullable(),
  valorAduaneiroBrl: z.string().nullable(),
  totalTributosBrl: z.string().nullable(),
  totalDespesasBrl: z.string().nullable(),
  custoTotalDesembolsadoBrl: z.string().nullable(),
  custoTotalFormacaoPrecoBrl: z.string().nullable(),
  custoUnitarioDesembolsadoBrl: z.string().nullable(),
  custoUnitarioFormacaoPrecoBrl: z.string().nullable(),
  linhas: z.array(LinhaCustoSchema),
  alertas: z.array(z.string()),
  pendencias: z.array(PendenciaConfigSchema),
  versaoMotor: z.string(),
  configSnapshot: z.record(z.string(), z.unknown()),
});

export type ResultadoCustos = z.infer<typeof ResultadoCustosSchema>;

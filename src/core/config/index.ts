import { z } from "zod";
import fs from "fs";
import path from "path";

export const ConfigItemSchema = z.object({
  valor: z.union([z.string(), z.number(), z.null()]),
  vigencia_inicio: z.string().nullable().optional(),
  data: z.string().nullable().optional(),
  fonte: z.string().nullable().optional(),
  status: z.enum(["A_CONFIRMAR", "CONFIRMADO"]).default("A_CONFIRMAR"),
});

export type ConfigItem = z.infer<typeof ConfigItemSchema>;

export const TributoConfigSchema = z.object({
  codigo: z.string(),
  rotulo: z.string(),
  aliquota: ConfigItemSchema.optional(),
  valor_fixo: ConfigItemSchema.optional(),
  reducao_base_percentual: ConfigItemSchema.optional(),
  beneficio: ConfigItemSchema.optional(),
  base: z.array(z.string()),
  por_dentro: z.boolean(),
  ordem: z.number(),
  apenas_via: z.string().optional(),
  por_registro: z.boolean().optional(),
  credito_recuperavel: z.object({
    sim_nao: z.boolean().nullable(),
    depende_regime: z.boolean(),
  }),
});

export const TaxConfigSchema = z.object({
  regimes: z.object({
    IMPORTACAO_PJ_DESPACHO: z.object({
      tributos: z.array(TributoConfigSchema),
    }),
    REMESSA_PF: z.object({
      limite_usd: ConfigItemSchema,
      aliquota_ii_ate_limite: ConfigItemSchema,
      aliquota_ii_acima_limite: ConfigItemSchema,
      desconto_usd_sobre_ii: ConfigItemSchema,
      aliquota_icms: ConfigItemSchema,
    }),
  }),
  venda: z.object({
    regime_tributario: ConfigItemSchema,
    imposto_sobre_venda_percentual_efetivo: ConfigItemSchema,
  }),
});

export type TaxConfig = z.infer<typeof TaxConfigSchema>;

export const FeesConfigSchema = z.object({
  comissao_ml: z.object({
    itens: z.array(
      z.object({
        categoria: z.string(),
        tipo_anuncio: z.string(),
        percentual: ConfigItemSchema,
      })
    ),
  }),
  tarifa_fixa: z.object({
    itens: z.array(
      z.object({
        de: z.string(),
        ate: z.string(),
        valor: ConfigItemSchema,
      })
    ),
  }),
  frete_vendedor: z.object({
    itens: z.array(
      z.object({
        logistica: z.string(),
        faixa_peso_min_kg: z.string(),
        faixa_peso_max_kg: z.string(),
        faixa_preco_min: z.string(),
        faixa_preco_max: z.string(),
        valor: ConfigItemSchema,
      })
    ),
  }),
  custo_full: z.object({
    armazenagem_mensal_por_unidade: ConfigItemSchema,
    custo_envio_por_unidade: ConfigItemSchema,
  }),
  parametros_frete: z.object({
    frete_gratis_threshold_brl: ConfigItemSchema,
  }),
});

export type FeesConfig = z.infer<typeof FeesConfigSchema>;

export const AppConfigSchema = z.object({
  cambio_cny_brl: ConfigItemSchema,
  cambio_usd_brl: ConfigItemSchema,
  iof_pagamento_exterior: ConfigItemSchema,
  spread_cambial: ConfigItemSchema,
  arredondamento_impostos: z.object({
    metodo: z.string(),
    casas_decimais: z.number(),
    status: z.string(),
  }),
  modalidade_radar: ConfigItemSchema,
  limite_modalidade_usd: ConfigItemSchema,
  alerta_cambio_dias: ConfigItemSchema,
  fator_peso_cubico: z.object({
    valor: z.union([z.string(), z.number(), z.null()]),
    status: z.string(),
  }),
  limite_ia_mensal_usd: ConfigItemSchema,
  margem_minima_alerta: ConfigItemSchema,
  passos_sensibilidade: ConfigItemSchema,
  preco_final_comercial: z.object({
    ativo: z.boolean(),
    centavos_alvo: z.number().nullable(),
    status: z.string(),
  }),
  alerta_fronteira_faixa_reais: ConfigItemSchema,
  alerta_coleta_antiga_dias: ConfigItemSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export function loadTaxConfig(configDir = "config"): TaxConfig {
  const filePath = path.join(process.cwd(), configDir, "tax_config.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  const result = TaxConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Erro de validação em tax_config.json: ${result.error.message}`);
  }
  return result.data;
}

export function loadFeesConfig(configDir = "config"): FeesConfig {
  const filePath = path.join(process.cwd(), configDir, "fees_config.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  const result = FeesConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Erro de validação em fees_config.json: ${result.error.message}`);
  }
  return result.data;
}

export function loadAppConfig(configDir = "config"): AppConfig {
  const filePath = path.join(process.cwd(), configDir, "app_config.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  const result = AppConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Erro de validação em app_config.json: ${result.error.message}`);
  }
  return result.data;
}

export function getRequiredConfigValue(item: ConfigItem, fieldName: string): string {
  if (item.valor === null || item.valor === undefined || item.valor === "") {
    throw new Error(`Configuração obrigatória ausente: ${fieldName} não preenchido`);
  }
  return String(item.valor);
}

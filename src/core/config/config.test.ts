import { describe, it, expect } from "vitest";
import {
  loadTaxConfig,
  loadFeesConfig,
  loadAppConfig,
  getRequiredConfigValue,
  ConfigItemSchema,
} from "./index";

describe("Config Loader", () => {
  it("carrega tax_config.json válido", () => {
    const config = loadTaxConfig();
    expect(config.regimes.IMPORTACAO_PJ_DESPACHO.tributos.length).toBeGreaterThan(0);
    expect(config.regimes.REMESSA_PF.limite_usd.status).toBe("A_CONFIRMAR");
  });

  it("carrega fees_config.json válido", () => {
    const config = loadFeesConfig();
    expect(Array.isArray(config.comissao_ml.itens)).toBe(true);
    expect(Array.isArray(config.tarifa_fixa.itens)).toBe(true);
  });

  it("carrega app_config.json válido", () => {
    const config = loadAppConfig();
    expect(config.arredondamento_impostos.metodo).toBe("ROUND_HALF_UP");
  });

  it("getRequiredConfigValue lança erro legível quando valor for null", () => {
    const item = { valor: null, status: "A_CONFIRMAR" as const };
    expect(() => getRequiredConfigValue(item, "tax_config.icms_pr")).toThrow(
      "Configuração obrigatória ausente: tax_config.icms_pr não preenchido"
    );
  });

  it("getRequiredConfigValue retorna string quando valor estiver presente", () => {
    const item = { valor: "18.0", status: "CONFIRMADO" as const };
    expect(getRequiredConfigValue(item, "aliquota")).toBe("18.0");
  });

  it("rejeita estrutura inválida de ConfigItem", () => {
    const invalid = { valor: {}, status: "INVALIDO" };
    const res = ConfigItemSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

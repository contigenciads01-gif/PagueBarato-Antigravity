"use server";

import { revalidatePath } from "next/cache";
import { salvarConfigAtomica } from "@/core/config/service";
import { loadTaxConfig, loadAppConfig } from "@/core/config";

export async function actionAtualizarCambio(cnyValor: string, usdValor: string, status: "A_CONFIRMAR" | "CONFIRMADO") {
  const app = loadAppConfig();
  app.cambio_cny_brl.valor = cnyValor ? parseFloat(cnyValor) : null;
  app.cambio_cny_brl.status = status;
  app.cambio_usd_brl.valor = usdValor ? parseFloat(usdValor) : null;
  app.cambio_usd_brl.status = status;

  salvarConfigAtomica("app", app, {
    data: new Date().toISOString(),
    arquivo: "app_config.json",
    chave: "cambio",
    valorAntigo: null,
    valorNovo: { cny: cnyValor, usd: usdValor },
    fonte: "Interface Web",
  });

  revalidatePath("/configuracoes");
  revalidatePath("/");
  return { ok: true };
}

export async function actionAtualizarTributosImportacao(ii: string, ipi: string, icms: string, status: "A_CONFIRMAR" | "CONFIRMADO") {
  const tax = loadTaxConfig();
  const tribs = tax.regimes.IMPORTACAO_PJ_DESPACHO.tributos;

  const tII = tribs.find((t) => t.codigo === "II");
  if (tII && tII.aliquota) {
    tII.aliquota.valor = ii ? parseFloat(ii) : null;
    tII.aliquota.status = status;
  }

  const tIPI = tribs.find((t) => t.codigo === "IPI");
  if (tIPI && tIPI.aliquota) {
    tIPI.aliquota.valor = ipi ? parseFloat(ipi) : null;
    tIPI.aliquota.status = status;
  }

  const tICMS = tribs.find((t) => t.codigo === "ICMS_IMPORTACAO");
  if (tICMS && tICMS.aliquota) {
    tICMS.aliquota.valor = icms ? parseFloat(icms) : null;
    tICMS.aliquota.status = status;
  }

  salvarConfigAtomica("tax", tax, {
    data: new Date().toISOString(),
    arquivo: "tax_config.json",
    chave: "tributos_importacao",
    valorAntigo: null,
    valorNovo: { ii, ipi, icms },
    fonte: "Interface Web",
  });

  revalidatePath("/configuracoes");
  revalidatePath("/");
  return { ok: true };
}

export async function actionAtualizarImpostoVenda(aliquotaVenda: string, status: "A_CONFIRMAR" | "CONFIRMADO") {
  const tax = loadTaxConfig();
  tax.venda.imposto_sobre_venda_percentual_efetivo.valor = aliquotaVenda ? parseFloat(aliquotaVenda) : null;
  tax.venda.imposto_sobre_venda_percentual_efetivo.status = status;

  salvarConfigAtomica("tax", tax, {
    data: new Date().toISOString(),
    arquivo: "tax_config.json",
    chave: "imposto_venda",
    valorAntigo: null,
    valorNovo: aliquotaVenda,
    fonte: "Interface Web",
  });

  revalidatePath("/configuracoes");
  revalidatePath("/");
  return { ok: true };
}

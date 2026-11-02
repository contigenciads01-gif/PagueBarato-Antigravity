import fs from "fs";
import path from "path";
import { TaxConfig, FeesConfig, AppConfig, TaxConfigSchema, FeesConfigSchema, AppConfigSchema } from "./index";

export interface HistoricoAlteracao {
  data: string;
  arquivo: string;
  chave: string;
  valorAntigo: unknown;
  valorNovo: unknown;
  fonte?: string;
}

const HISTORY_DIR = path.join(process.cwd(), "config", "history");

function garantirDiretorioHistorico() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

export function salvarConfigAtomica(
  tipo: "tax" | "fees" | "app",
  dados: unknown,
  registroHistorico?: HistoricoAlteracao
) {
  garantirDiretorioHistorico();
  const nomeArquivo = `${tipo}_config.json`;
  const destino = path.join(process.cwd(), "config", nomeArquivo);
  const temp = path.join(process.cwd(), "config", `${nomeArquivo}.tmp`);
  const backup = path.join(HISTORY_DIR, `${tipo}_backup_${Date.now()}.json`);

  // Validar antes de escrever
  if (tipo === "tax") TaxConfigSchema.parse(dados);
  if (tipo === "fees") FeesConfigSchema.parse(dados);
  if (tipo === "app") AppConfigSchema.parse(dados);

  if (fs.existsSync(destino)) {
    fs.copyFileSync(destino, backup);
  }

  // Escrita atômica via tmp
  fs.writeFileSync(temp, JSON.stringify(dados, null, 2), "utf-8");
  fs.renameSync(temp, destino);

  if (registroHistorico) {
    const logPath = path.join(HISTORY_DIR, "changelog.jsonl");
    fs.appendFileSync(logPath, JSON.stringify(registroHistorico) + "\n", "utf-8");
  }

  return true;
}

export interface PendenciaGeral {
  origem: string;
  campo: string;
  status: string;
  descricao: string;
}

export function listarTodasPendencias(
  tax: TaxConfig,
  fees: FeesConfig,
  app: AppConfig
): PendenciaGeral[] {
  const pendencias: PendenciaGeral[] = [];

  // 1. Câmbio
  if (app.cambio_cny_brl.valor === null || app.cambio_cny_brl.status !== "CONFIRMADO") {
    pendencias.push({
      origem: "App Config",
      campo: "Câmbio CNY→BRL",
      status: app.cambio_cny_brl.status,
      descricao: "Necessário para conversão dos produtos do 1688",
    });
  }

  // 2. Tributos
  for (const t of tax.regimes.IMPORTACAO_PJ_DESPACHO.tributos) {
    if (t.aliquota && (t.aliquota.valor === null || t.aliquota.status !== "CONFIRMADO")) {
      pendencias.push({
        origem: "Tributos Importação",
        campo: t.rotulo,
        status: t.aliquota.status,
        descricao: "Alíquota necessária para o motor fiscal",
      });
    }
  }

  // 3. Venda ML
  if (tax.venda.imposto_sobre_venda_percentual_efetivo.valor === null || tax.venda.imposto_sobre_venda_percentual_efetivo.status !== "CONFIRMADO") {
    pendencias.push({
      origem: "Tributos Venda",
      campo: "Imposto sobre a Venda",
      status: tax.venda.imposto_sobre_venda_percentual_efetivo.status,
      descricao: "Alíquota efetiva do Simples/Presumido",
    });
  }

  return pendencias;
}

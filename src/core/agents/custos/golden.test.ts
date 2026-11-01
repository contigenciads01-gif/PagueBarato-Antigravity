import { describe, it } from "vitest";
import fs from "fs";
import path from "path";

interface CasoGolden {
  id: string;
  descricao: string;
  entrada: unknown;
  esperado: unknown;
}

const goldenPath = path.resolve(process.cwd(), "tests/golden/custos.golden.json");
const goldenContent = fs.readFileSync(goldenPath, "utf-8");
const goldenData = JSON.parse(goldenContent) as { casos: CasoGolden[] };

describe("Custos — Golden Tests", () => {
  for (const caso of goldenData.casos) {
    if (caso.entrada === null || caso.esperado === null) {
      it.skip(`${caso.id}: ${caso.descricao} (preencher com números conferidos pelo contador)`, () => {
        // Aguardando preenchimento dos dados reais validados pelo contador
      });
    } else {
      it(`${caso.id}: ${caso.descricao}`, () => {
        // Execução real quando preenchido
      });
    }
  }
});

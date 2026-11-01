import { TributoConfigSchema } from "../../config";
import { z } from "zod";

export type TributoPipelineItem = z.infer<typeof TributoConfigSchema>;

export function obterPipelineTributos(tributos: TributoPipelineItem[]): TributoPipelineItem[] {
  return [...tributos].sort((a, b) => a.ordem - b.ordem);
}

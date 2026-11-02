/**
 * src/db/schema.ts
 * Schema Drizzle ORM — tabelas base (Parte 1)
 */

import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Tabela de produtos (estrutura básica — expandida na Parte 2) */
export const produtos = sqliteTable("produtos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  linkReferencia: text("link_referencia"),
  categoria: text("categoria"),
  ncm: text("ncm"),
  ncmStatus: text("ncm_status").notNull().default("A_CONFIRMAR"),
  observacoes: text("observacoes"),
  // Campos de fornecedor
  linkFornecedor: text("link_fornecedor"),
  moedaFornecedor: text("moeda_fornecedor").notNull().default("CNY"),
  moq: integer("moq"),
  quantidadePlanejada: integer("quantidade_planejada"),
  prazoProducaoDias: integer("prazo_producao_dias"),
  // Logística
  pesoKg: text("peso_kg"),
  comprimentoCm: text("comprimento_cm"),
  larguraCm: text("largura_cm"),
  alturaCm: text("altura_cm"),
  unidadesPorCaixa: integer("unidades_por_caixa"),
  pesoCaixaKg: text("peso_caixa_kg"),
  // Controle
  arquivadoEm: text("arquivado_em"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
  atualizadoEm: text("atualizado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/** Faixas de preço por quantidade do fornecedor */
export const produtoFaixasPreco = sqliteTable("produto_faixas_preco", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  quantidadeMinima: integer("quantidade_minima").notNull(),
  precoUnitario: text("preco_unitario").notNull(), // Decimal como texto
  ordem: integer("ordem").notNull(),
});

/** Preços de referência de concorrentes */
export const produtoPrecosReferencia = sqliteTable("produto_precos_referencia", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  marketplace: text("marketplace").notNull(),
  valor: text("valor").notNull(), // Decimal como texto, BRL
  tituloAnuncio: text("titulo_anuncio"),
  link: text("link"),
  dataColeta: text("data_coleta").notNull(), // ISO date
  origem: text("origem").notNull().default("manual"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/** Registro de cálculos executados */
export const calculos = sqliteTable("calculos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id").references(() => produtos.id),
  tipo: text("tipo").notNull(), // "custos" | "margem"
  entradaJson: text("entrada_json").notNull(),
  saidaJson: text("saida_json").notNull(),
  configSnapshotJson: text("config_snapshot_json").notNull(),
  versaoMotor: text("versao_motor").notNull(),
  calculoCustosId: integer("calculo_custos_id"),
  precoAdotado: integer("preco_adotado").notNull().default(0), // 0 = false, 1 = true
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/** Registro de execuções de agentes */
export const execucoesAgente = sqliteTable("execucoes_agente", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agente: text("agente").notNull(),
  status: text("status").notNull(), // "sucesso" | "erro" | "pendente"
  inicio: text("inicio").notNull(),
  fim: text("fim"),
  erro: text("erro"),
  tokens: integer("tokens"),
});

export type Produto = typeof produtos.$inferSelect;
export type NovoProduto = typeof produtos.$inferInsert;
export type ProdutoFaixaPreco = typeof produtoFaixasPreco.$inferSelect;
export type NovaProdutoFaixaPreco = typeof produtoFaixasPreco.$inferInsert;
export type ProdutoPrecoReferencia = typeof produtoPrecosReferencia.$inferSelect;
export type NovoProdutoPrecoReferencia = typeof produtoPrecosReferencia.$inferInsert;
export type Calculo = typeof calculos.$inferSelect;
export type NovoCalculo = typeof calculos.$inferInsert;
export type ExecucaoAgente = typeof execucoesAgente.$inferSelect;

export const quadros = sqliteTable("quadros", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  nome: text("nome").notNull().default("Quadro Principal"),
  principal: integer("principal").notNull().default(1),
  arquivadoEm: text("arquivado_em"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
  atualizadoEm: text("atualizado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const elementos = sqliteTable("elementos", {
  id: text("id").primaryKey(), // UUID string
  quadroId: integer("quadro_id")
    .notNull()
    .references(() => quadros.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // "CARD_PRECO" | "CARD_LOJA" | "IMAGEM" | "NOTA"
  dadosJson: text("dados_json").notNull(),
  x: integer("x").notNull().default(100),
  y: integer("y").notNull().default(100),
  largura: integer("largura").notNull().default(240),
  altura: integer("altura").notNull().default(160),
  zIndex: integer("z_index").notNull().default(1),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
  atualizadoEm: text("atualizado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const arquivos = sqliteTable("arquivos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caminho: text("caminho").notNull(),
  mime: text("mime").notNull(),
  tamanho: integer("tamanho").notNull(),
  hash: text("hash").notNull(),
  largura: integer("largura"),
  altura: integer("altura"),
  criadoEm: text("criado_em")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Quadro = typeof quadros.$inferSelect;
export type Elemento = typeof elementos.$inferSelect;
export type Arquivo = typeof arquivos.$inferSelect;


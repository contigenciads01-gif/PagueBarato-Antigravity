CREATE TABLE `calculos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer,
	`tipo` text NOT NULL,
	`entrada_json` text NOT NULL,
	`saida_json` text NOT NULL,
	`config_snapshot_json` text NOT NULL,
	`versao_motor` text NOT NULL,
	`calculo_custos_id` integer,
	`preco_adotado` integer DEFAULT 0 NOT NULL,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `execucoes_agente` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agente` text NOT NULL,
	`status` text NOT NULL,
	`inicio` text NOT NULL,
	`fim` text,
	`erro` text,
	`tokens` integer
);
--> statement-breakpoint
CREATE TABLE `produto_faixas_preco` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`quantidade_minima` integer NOT NULL,
	`preco_unitario` text NOT NULL,
	`ordem` integer NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `produto_precos_referencia` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`marketplace` text NOT NULL,
	`valor` text NOT NULL,
	`titulo_anuncio` text,
	`link` text,
	`data_coleta` text NOT NULL,
	`origem` text DEFAULT 'manual' NOT NULL,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`link_referencia` text,
	`categoria` text,
	`ncm` text,
	`ncm_status` text DEFAULT 'A_CONFIRMAR' NOT NULL,
	`observacoes` text,
	`link_fornecedor` text,
	`moeda_fornecedor` text DEFAULT 'CNY' NOT NULL,
	`moq` integer,
	`quantidade_planejada` integer,
	`prazo_producao_dias` integer,
	`peso_kg` text,
	`comprimento_cm` text,
	`largura_cm` text,
	`altura_cm` text,
	`unidades_por_caixa` integer,
	`peso_caixa_kg` text,
	`arquivado_em` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	`atualizado_em` text DEFAULT (datetime('now')) NOT NULL
);

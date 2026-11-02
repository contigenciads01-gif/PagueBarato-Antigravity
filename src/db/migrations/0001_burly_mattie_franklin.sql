CREATE TABLE `arquivos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`caminho` text NOT NULL,
	`mime` text NOT NULL,
	`tamanho` integer NOT NULL,
	`hash` text NOT NULL,
	`largura` integer,
	`altura` integer,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `elementos` (
	`id` text PRIMARY KEY NOT NULL,
	`quadro_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`dados_json` text NOT NULL,
	`x` integer DEFAULT 100 NOT NULL,
	`y` integer DEFAULT 100 NOT NULL,
	`largura` integer DEFAULT 240 NOT NULL,
	`altura` integer DEFAULT 160 NOT NULL,
	`z_index` integer DEFAULT 1 NOT NULL,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	`atualizado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`quadro_id`) REFERENCES `quadros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quadros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`produto_id` integer NOT NULL,
	`nome` text DEFAULT 'Quadro Principal' NOT NULL,
	`principal` integer DEFAULT 1 NOT NULL,
	`arquivado_em` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	`atualizado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE cascade
);

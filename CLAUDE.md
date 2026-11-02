# CLAUDE.md — PagueBarato (Central de Agentes)

Dashboard e central de agentes para revendedor de Curitiba/PR que importa produtos do 1688 e revende no Mercado Livre.
O sistema calcula custo de importação, impostos, preço e margem, e gera prompts de criativos.
Os motores de cálculo são estritamente determinísticos, livres de chamadas de IA e de rede.
Todos os cálculos operam sob precisão total via decimal.js e validação forte de esquemas com Zod.
Alíquotas fiscais e taxas de marketplace são dinâmicas e editáveis via arquivos de configuração.

## Regras Permanentes
1. **Nunca usar number nativo para dinheiro ou percentual**: Todo valor financeiro ou percentual deve usar a abstração `Money` (baseada em `Decimal` de `decimal.js`).
2. **Nunca inventar ou embutir alíquotas fiscais, comissões ou câmbio**: Nenhuma alíquota ou taxa é fixada no código. Toda tributação vem de `config/` com registro de vigência e status (`A_CONFIRMAR` ou `CONFIRMADO`).
3. **Agentes de cálculo são código puro**: Isentos de IA, rede, relógio ou aleatoriedade. Mesma entrada + mesma configuração = mesmo resultado.
4. **Validação estrita em Zod**: Toda entrada e saída de serviços e motores passa por schemas Zod.
5. **Erros explícitos em vez de defaults silenciosos**: Qualquer dado pendente ou nulo deve disparar status de pendência claro (`CONFIG_PENDENTE`) ou erro específico.
6. **Segredos protegidos**: Chaves de API (ex: Anthropic) devem residir apenas em variáveis de ambiente acessadas no servidor (.env), nunca expostas ao client.

## Comandos Principais
- `pnpm dev`: Inicia servidor local de desenvolvimento
- `pnpm build`: Compila aplicação Next.js
- `pnpm lint`: Executa linter ESLint
- `pnpm typecheck`: Executa verificação de tipos estritos do TypeScript
- `pnpm test`: Executa suíte de testes Vitest
- `pnpm db:migrate`: Aplica migrações versionadas do SQLite via Drizzle
- `pnpm calc:custos`: CLI de cálculo de custos e impostos
- `pnpm calc:margem`: CLI de cálculo de margem e precificação

## Convenções de Nomenclatura
- Português para domínio de negócio: `produto`, `custo`, `margem`, `faixaPreco`, `aliquota`, `imposto`.
- Inglês para termos técnicos e infraestrutura: `schema`, `service`, `pipeline`, `engine`, `repository`, `helpers`.
- Um subdiretório isolado por agente em `src/core/agents/`.

## Mapa das 7 a 9 Partes
- [x] **Parte 1**: Fundação (Next.js, SQLite/libsql, Drizzle, Money/decimal.js, Configs Zod, Vitest)
- [x] **Parte 2**: Ficha do Produto (Cadastro detalhado, faixas de preço, medidas, concorrentes, CRUD e derived)
- [x] **Parte 3**: Motor de Custos e Impostos de Importação (Cascata de tributos, ICMS por dentro, cenários, snapshot de auditoria)
- [x] **Parte 4**: Motor de Margem e Preço (Modos A/B/C/D/E, resolução de faixas circulares, sensibilidade, obterPrecoSugerido)
- [x] **Parte 5**: Telas Centrais (Visão Geral, Produtos, Calculadora 3 Colunas, Configurações com Backup Atômico)
- [x] **Parte 6**: Quadro de Comparação (Canvas visual com Konva.js, persistência no banco, exportação criativa)
- [ ] **Parte 7**: Agente do Quadro
- [ ] **Parte 8**: Agente de Criativos
- [ ] **Parte 9**: Conectores de Marketplace

## Decisões em Aberto e a Confirmar com Contador
- **Arredondamento de tributos**: ROUND_HALF_UP por tributo apurado, com precisão total nos termos intermediários.
- **Arredondamento de preço final de venda**: ROUND_CEIL ao centavo para resguardar a margem mínima estipulada.
- **Regime tributário da empresa**: Simples Nacional vs Lucro Presumido (atualmente marcado como `A_CONFIRMAR`).
- **NCMs e alíquotas reais de II, IPI, PIS/COFINS e ICMS-PR**: Atualmente com valores `null` e status `A_CONFIRMAR`.
- **Tabelas de tarifas e comissões do Mercado Livre**: Atualmente vazias e com status `A_CONFIRMAR`.

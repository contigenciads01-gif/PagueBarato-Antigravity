# Agente de Margem e Preço de Venda (Mercado Livre)

Motor determinístico puro de precificação e formação de margem.
Sem IA, sem rede, sem relógio.

## Definições Estratégicas
- **Margem (%)**: Lucro Líquido ÷ Preço de Venda.
- **Markup (%)**: Lucro Líquido ÷ Custo de Formação de Preço.
- **Lucro (R$)**: Preço de Venda − Todos os Custos e Deduções.

## Modos Operacionais
- **Modo A (Preço Alvo)**: Fornece Margem %, Markup % ou Lucro R$ e obtém o Preço sugerido.
- **Modo B (Margem do Preço)**: Fornece o Preço pretendido e apura Lucro, Margem e Markup reais.
- **Modo C (Ponto de Equilíbrio)**: Preço mínimo absoluto com Lucro = 0.
- **Modo D (Tabela de Preços)**: Simulação de faixa de preços.
- **Modo E (CAC Máximo)**: Valor máximo de publicidade por venda para atingir margem alvo.

## Resolução de Faixas (Tiers)
A tarifa fixa e o frete dependem da faixa em que o preço final se enquadra. O motor resolve iterativamente até convergir para a solução exata que pertence à própria faixa.

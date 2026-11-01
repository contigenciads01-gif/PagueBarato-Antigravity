# Agente de Custos e Impostos de Importação

Motor determinístico puro de custos de importação.
Sem IA, sem rede, sem relógio.

## Cascata Tributária (Regime A - Despacho PJ)
1. **FOB**: Preço unitário × Quantidade, convertido pelo Câmbio.
2. **Valor Aduaneiro**: FOB + Frete Internacional + Seguro (+ Frete interno China).
3. **II**: Base = Valor Aduaneiro.
4. **IPI**: Base = Valor Aduaneiro + II.
5. **PIS/COFINS Importação**: Base = Valor Aduaneiro.
6. **ICMS Importação (PR - por dentro)**:
   Base = (Valor Aduaneiro + II + IPI + PIS + COFINS + Despesas Aduaneiras) ÷ (1 − Alíquota ICMS).
   Valor ICMS = Base calculada × Alíquota ICMS.
7. **AFRMM**: Incide apenas sobre frete internacional marítimo.

## Decisões a Confirmar com Contador
- Arredondamento centavo a centavo (ROUND_HALF_UP) na apuração de cada tributo.
- Critério de apropriação e desconto de créditos do regime da empresa.

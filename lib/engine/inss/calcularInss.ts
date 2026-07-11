// lib/engine/inss/calcularInss.ts
import { resolverLegislacaoVigente } from "../legislacao/2026";
import { ItemCalculo } from "../../../types";

/**
 * Calcula o desconto de INSS sobre uma remuneração, pelo método progressivo por faixas
 * sucessivas (cada faixa é tributada apenas na parte que nela se enquadra).
 * Usa a fórmula simplificada (salário × alíquota da faixa) − parcela a deduzir,
 * que é matematicamente equivalente ao cálculo faixa a faixa.
 */
export function calcularInss(remuneracao: number, dataCompetencia: string): ItemCalculo {
  const { tabelaInss, tetoInss } = resolverLegislacaoVigente(dataCompetencia);

  const baseCalculo = Math.min(remuneracao, tetoInss);
  const faixa = tabelaInss.faixas.find((f) => baseCalculo <= f.ate)!;

  const valorBruto = baseCalculo * faixa.aliquota;
  const valorInss = Math.max(0, valorBruto - faixa.deducao);
  const valorArredondado = Math.round(valorInss * 100) / 100;

  return {
    codigo: "inss",
    descricao: "Desconto de INSS",
    valor: -valorArredondado,
    formula: `min(remuneração, teto R$${tetoInss.toFixed(2)}) × ${(faixa.aliquota * 100).toFixed(1)}% − R$${faixa.deducao.toFixed(2)} (parcela a deduzir)`,
    baseLegal: "Lei 8.212/1991 e Portaria Interministerial MPS/MF vigente",
    explicacao:
      "O INSS é calculado de forma progressiva: cada faixa salarial paga uma alíquota diferente (7,5% a 14%), " +
      "e não uma alíquota única sobre o valor total. A fórmula com 'parcela a deduzir' chega ao mesmo resultado " +
      "do cálculo faixa a faixa, de forma mais direta. Acima do teto de contribuição, o desconto não aumenta mais.",
  };
}

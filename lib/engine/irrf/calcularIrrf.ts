// lib/engine/irrf/calcularIrrf.ts
import { resolverLegislacaoVigente } from "../legislacao/2026";
import { ItemCalculo } from "../../../types";

interface ParametrosIrrf {
  rendaBrutaMensal: number;   // salário bruto do mês (antes de qualquer desconto)
  inssDoMes: number;          // valor já calculado do desconto de INSS (positivo)
  dependentes: number;        // nº de dependentes legais para fins de IR
  dataCompetencia: string;
  usarDescontoSimplificado?: boolean; // se true, ignora INSS/dependentes e usa o desconto fixo
}

/**
 * Calcula o IRRF mensal em duas etapas, conforme a legislação vigente desde 01/01/2026:
 *  1) Tabela progressiva tradicional (Lei 15.191/2025) sobre a base de cálculo.
 *  2) Redutor da Lei 15.270/2025 ("Reforma da Renda"): zera o imposto até R$5.000 de renda
 *     bruta mensal e reduz parcialmente até R$7.350. Acima disso, sem redução.
 * O redutor nunca pode tornar o imposto negativo (não gera crédito).
 */
export function calcularIrrf(params: ParametrosIrrf): ItemCalculo {
  const { rendaBrutaMensal, inssDoMes, dependentes, dataCompetencia, usarDescontoSimplificado } = params;
  const { tabelaIrrf, redutorIrrf } = resolverLegislacaoVigente(dataCompetencia);

  // Etapa 0 — deduções da base de cálculo: desconto simplificado OU (INSS + dependentes),
  // o que for mais vantajoso ao contribuinte (a legislação exige usar o mais benéfico).
  const deducaoDependentes = dependentes * tabelaIrrf.deducaoPorDependente;
  const deducoesLegais = inssDoMes + deducaoDependentes;
  const usarSimplificado =
    usarDescontoSimplificado ?? tabelaIrrf.descontoSimplificadoMaximo > deducoesLegais;
  const deducaoAplicada = usarSimplificado ? tabelaIrrf.descontoSimplificadoMaximo : deducoesLegais;

  const baseCalculo = Math.max(0, rendaBrutaMensal - deducaoAplicada);

  // Etapa 1 — tabela progressiva tradicional
  const faixa = tabelaIrrf.faixas.find((f) => baseCalculo <= f.ate)!;
  const irrfTabela = Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao);

  // Etapa 2 — redutor da Lei 15.270/2025, calculado sobre a renda BRUTA mensal (não a base)
  let redutor = 0;
  if (rendaBrutaMensal <= redutorIrrf.isencaoTotalAte) {
    redutor = irrfTabela; // zera totalmente
  } else if (rendaBrutaMensal <= redutorIrrf.faixaTransicaoAte) {
    redutor = Math.max(0, redutorIrrf.formula(rendaBrutaMensal));
  }
  redutor = Math.min(redutor, irrfTabela); // nunca gera crédito

  const irrfFinal = Math.round((irrfTabela - redutor) * 100) / 100;

  const explicacaoRedutor =
    rendaBrutaMensal <= redutorIrrf.isencaoTotalAte
      ? "Como a renda bruta mensal é de até R$5.000,00, o Imposto de Renda é totalmente zerado pelo redutor da Lei 15.270/2025."
      : rendaBrutaMensal <= redutorIrrf.faixaTransicaoAte
      ? "Como a renda bruta mensal está entre R$5.000,01 e R$7.350,00, o Imposto de Renda é reduzido parcialmente pelo redutor da Lei 15.270/2025 (a redução diminui à medida que a renda se aproxima de R$7.350,00)."
      : "Como a renda bruta mensal ultrapassa R$7.350,00, não há redução — o imposto segue a tabela progressiva tradicional.";

  return {
    codigo: "irrf",
    descricao: "Desconto de IRRF",
    valor: -irrfFinal,
    formula:
      `Base = renda bruta − ${usarSimplificado ? "desconto simplificado R$607,20" : "(INSS + dependentes)"}; ` +
      `IRRF tabela = base × ${(faixa.aliquota * 100).toFixed(1)}% − R$${faixa.deducao.toFixed(2)}; ` +
      `IRRF final = IRRF tabela − redutor Lei 15.270/2025`,
    baseLegal: "Lei 9.250/1995 (tabela progressiva) e Lei 15.270/2025 (redutor)",
    explicacao:
      "O IRRF é calculado em duas etapas. Primeiro aplica-se a tabela progressiva tradicional " +
      "(alíquotas de 0% a 27,5% conforme a faixa de renda). Depois, desde janeiro de 2026, aplica-se " +
      "o redutor criado pela Lei 15.270/2025, que pode zerar ou reduzir esse valor. " +
      explicacaoRedutor,
  };
}

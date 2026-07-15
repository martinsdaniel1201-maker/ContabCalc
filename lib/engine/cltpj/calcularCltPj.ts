// lib/engine/cltpj/calcularCltPj.ts
import { ItemCalculo } from "../../../types";
import { calcularInss } from "../inss/calcularInss";
import { calcularIrrf } from "../irrf/calcularIrrf";

interface ParametrosCltPj {
  salarioCltBruto: number;
  valorBrutoMensalPj: number;
  percentualImpostoPj: number; // ex: 6 para 6%
  dataCompetencia: string;
}

/**
 * Comparação CLT x PJ — estimativa simplificada. Mensaliza os benefícios que o CLT só
 * entrega uma vez por ano (13º, férias) ou ao sair do emprego (FGTS), para comparar
 * de forma justa com o valor líquido do PJ.
 *
 * LIMITAÇÕES IMPORTANTES (sempre exibir ao usuário): não considera o regime tributário
 * específico do PJ (MEI, Simples Nacional por anexo, Lucro Presumido), custo de
 * contador, INSS por conta própria, nem os riscos/benefícios não financeiros de cada
 * regime (estabilidade, plano de saúde, etc.).
 */
export function calcularCltPj(params: ParametrosCltPj): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioCltBruto, valorBrutoMensalPj, percentualImpostoPj, dataCompetencia } = params;

  const inss = calcularInss(salarioCltBruto, dataCompetencia);
  const irrf = calcularIrrf({
    rendaBrutaMensal: salarioCltBruto,
    inssDoMes: Math.abs(inss.valor),
    dependentes: 0,
    dataCompetencia,
  });
  const cltLiquido = salarioCltBruto + inss.valor + irrf.valor;
  const decimoTerceiroMensal = salarioCltBruto / 12;
  const feriasMensal = (salarioCltBruto + salarioCltBruto / 3) / 12;
  const fgtsMensal = salarioCltBruto * 0.08;
  const cltTotalMensalizado = cltLiquido + decimoTerceiroMensal + feriasMensal + fgtsMensal;

  const pjImpostoValor = valorBrutoMensalPj * (percentualImpostoPj / 100);
  const pjLiquido = valorBrutoMensalPj - pjImpostoValor;

  const diferenca = pjLiquido - cltTotalMensalizado;

  const itens: ItemCalculo[] = [
    {
      codigo: "clt_liquido",
      descricao: "CLT — Salário Líquido Mensal",
      valor: Math.round(cltLiquido * 100) / 100,
      formula: "salário bruto − INSS − IRRF",
      baseLegal: "—",
      explicacao: "O que cai na conta todo mês como CLT.",
    },
    {
      codigo: "clt_beneficios",
      descricao: "CLT — 13º + Férias + FGTS (mensalizado)",
      valor: Math.round((decimoTerceiroMensal + feriasMensal + fgtsMensal) * 100) / 100,
      formula: "(13º ÷ 12) + (férias+1/3 ÷ 12) + (FGTS 8%)",
      baseLegal: "—",
      explicacao: "Benefícios que só aparecem uma vez por ano (13º, férias) ou ao sair (FGTS), mas valem dinheiro todo mês.",
    },
    {
      codigo: "clt_total",
      descricao: "CLT — Valor Total Mensalizado",
      valor: Math.round(cltTotalMensalizado * 100) / 100,
      formula: "líquido + 13º/12 + férias/12 + FGTS",
      baseLegal: "—",
      explicacao: "Comparação justa com o PJ — inclui tudo que a CLT dá, não só o que cai na conta no mês.",
    },
    {
      codigo: "pj_liquido",
      descricao: "PJ — Valor Líquido Mensal",
      valor: Math.round(pjLiquido * 100) / 100,
      formula: `bruto PJ − ${percentualImpostoPj}% de impostos`,
      baseLegal: "—",
      explicacao:
        "Estimativa considerando só o percentual de impostos informado — não inclui custo de contador, " +
        "INSS por conta própria, nem a ausência de férias/13º remunerados.",
    },
  ];

  return { itens, valorFinal: Math.round(diferenca * 100) / 100 };
}

// lib/engine/simulacaoaumento/calcularSimulacaoAumento.ts
import { ItemCalculo } from "../../../types";
import { calcularInss } from "../inss/calcularInss";
import { calcularIrrf } from "../irrf/calcularIrrf";

interface ParametrosSimulacaoAumento {
  salarioAtual: number;
  salarioNovo: number;
  dependentesIR: number;
  dataCompetencia: string;
}

function calcularLiquido(salario: number, dependentes: number, dataCompetencia: string): number {
  const inss = calcularInss(salario, dataCompetencia);
  const irrf = calcularIrrf({
    rendaBrutaMensal: salario,
    inssDoMes: Math.abs(inss.valor),
    dependentes,
    dataCompetencia,
  });
  return salario + inss.valor + irrf.valor;
}

/**
 * Simulador de Aumento ou Promoção — funcionalmente idêntico independente de ser
 * chamado "aumento" ou "promoção": compara o salário líquido atual com uma proposta
 * nova, já descontando INSS e IRRF de cada um.
 */
export function calcularSimulacaoAumento(params: ParametrosSimulacaoAumento): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioAtual, salarioNovo, dependentesIR, dataCompetencia } = params;
  const liquidoAtual = calcularLiquido(salarioAtual, dependentesIR, dataCompetencia);
  const liquidoNovo = calcularLiquido(salarioNovo, dependentesIR, dataCompetencia);
  const diferenca = liquidoNovo - liquidoAtual;

  const itens: ItemCalculo[] = [
    {
      codigo: "atual",
      descricao: "Salário Líquido Atual",
      valor: Math.round(liquidoAtual * 100) / 100,
      formula: "salário atual − INSS − IRRF",
      baseLegal: "—",
      explicacao: "O que o funcionário recebe hoje, líquido.",
    },
    {
      codigo: "novo",
      descricao: "Salário Líquido Novo",
      valor: Math.round(liquidoNovo * 100) / 100,
      formula: "salário novo − INSS − IRRF",
      baseLegal: "—",
      explicacao: "O que passaria a receber, líquido.",
    },
    {
      codigo: "diferenca",
      descricao: "Diferença Mensal",
      valor: Math.round(diferenca * 100) / 100,
      formula: "líquido novo − líquido atual",
      baseLegal: "—",
      explicacao: "Quanto a mais (ou a menos) por mês.",
    },
    {
      codigo: "diferenca_anual",
      descricao: "Diferença Anual Estimada",
      valor: Math.round(diferenca * 13 * 100) / 100,
      formula: "diferença mensal × 13 (considerando 13º)",
      baseLegal: "—",
      explicacao: "Estimativa simplificada considerando o 13º salário também reajustado.",
    },
  ];

  return { itens, valorFinal: Math.round(diferenca * 100) / 100 };
}

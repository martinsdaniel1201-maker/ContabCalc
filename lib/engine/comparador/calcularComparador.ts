// lib/engine/comparador/calcularComparador.ts
import { ItemCalculo } from "../../../types";

interface PropostaEmprego {
  salario: number;
  valeAlimentacaoRefeicao: number;
  temPlanoDeSaude: boolean;
}

interface ParametrosComparador {
  propostaA: PropostaEmprego;
  propostaB: PropostaEmprego;
}

/**
 * Comparador de Propostas de Emprego — soma salário + VA/VR de cada proposta e mostra
 * a diferença. O plano de saúde é sinalizado, mas não somado ao valor (varia demais
 * de empresa para empresa para entrar numa soma direta).
 */
export function calcularComparador(params: ParametrosComparador): { itens: ItemCalculo[]; valorFinal: number } {
  const { propostaA, propostaB } = params;
  const totalA = propostaA.salario + propostaA.valeAlimentacaoRefeicao;
  const totalB = propostaB.salario + propostaB.valeAlimentacaoRefeicao;
  const diferenca = totalB - totalA;

  const itens: ItemCalculo[] = [
    {
      codigo: "a_total",
      descricao: "Empresa A — Salário + VA/VR",
      valor: Math.round(totalA * 100) / 100,
      formula: `salário + benefícios`,
      baseLegal: "—",
      explicacao: propostaA.temPlanoDeSaude ? "Também oferece plano de saúde (não somado ao valor)." : "Não oferece plano de saúde.",
    },
    {
      codigo: "b_total",
      descricao: "Empresa B — Salário + VA/VR",
      valor: Math.round(totalB * 100) / 100,
      formula: `salário + benefícios`,
      baseLegal: "—",
      explicacao: propostaB.temPlanoDeSaude ? "Também oferece plano de saúde (não somado ao valor)." : "Não oferece plano de saúde.",
    },
    {
      codigo: "diferenca",
      descricao: "Diferença (B − A)",
      valor: Math.round(diferenca * 100) / 100,
      formula: "total B − total A",
      baseLegal: "—",
      explicacao: "Valor mensal a mais (ou a menos) na proposta B comparada à A.",
    },
  ];

  return { itens, valorFinal: Math.round(diferenca * 100) / 100 };
}

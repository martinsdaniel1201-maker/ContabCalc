// lib/engine/reajuste/calcularReajuste.ts
import { ItemCalculo } from "../../../types";

interface ParametrosReajuste {
  salarioAtual: number;
  percentualReajuste: number; // ex: 5 para 5%
}

/**
 * Reajuste Salarial — aplica um percentual sobre o salário atual e mostra o novo
 * valor, a diferença mensal e uma estimativa anual (considerando o 13º).
 */
export function calcularReajuste(params: ParametrosReajuste): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioAtual, percentualReajuste } = params;
  const novoSalario = salarioAtual * (1 + percentualReajuste / 100);
  const diferenca = novoSalario - salarioAtual;

  const itens: ItemCalculo[] = [
    {
      codigo: "novo",
      descricao: "Novo Salário",
      valor: Math.round(novoSalario * 100) / 100,
      formula: `salário atual × (1 + ${percentualReajuste}%)`,
      baseLegal: "—",
      explicacao: "Salário bruto após aplicar o reajuste.",
    },
    {
      codigo: "diferenca",
      descricao: "Diferença Mensal",
      valor: Math.round(diferenca * 100) / 100,
      formula: "novo − atual",
      baseLegal: "—",
      explicacao: "Quanto a mais por mês, em valores brutos.",
    },
    {
      codigo: "diferenca_anual",
      descricao: "Diferença Anual Estimada (× 13)",
      valor: Math.round(diferenca * 13 * 100) / 100,
      formula: "diferença mensal × 13",
      baseLegal: "—",
      explicacao: "Estimativa simplificada considerando o 13º salário também reajustado.",
    },
  ];

  return { itens, valorFinal: Math.round(novoSalario * 100) / 100 };
}

// lib/engine/atrasos/calcularAtrasos.ts
import { ItemCalculo } from "../../../types";

interface ParametrosAtrasos {
  salarioBruto: number;
  cargaHorariaMensal?: number; // padrão 220h
  minutosAtraso: number;
}

/**
 * Calcula o desconto aproximado por minutos de atraso no mês, com base no valor do
 * minuto de trabalho do funcionário.
 */
export function calcularAtrasos(params: ParametrosAtrasos): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioBruto, cargaHorariaMensal = 220, minutosAtraso } = params;
  const valorMinuto = salarioBruto / cargaHorariaMensal / 60;
  const desconto = valorMinuto * minutosAtraso;

  const itens: ItemCalculo[] = [
    {
      codigo: "valor_minuto",
      descricao: "Valor do Minuto de Trabalho",
      valor: Math.round(valorMinuto * 100) / 100,
      formula: "(salário ÷ carga horária) ÷ 60",
      baseLegal: "Art. 58, §1º da CLT",
      explicacao: "Base para calcular o desconto de atrasos e faltas parciais.",
    },
    {
      codigo: "desconto",
      descricao: "Desconto por Atraso",
      valor: -Math.round(desconto * 100) / 100,
      formula: `valor do minuto × ${minutosAtraso} minutos`,
      baseLegal: "Art. 58, §1º da CLT",
      explicacao: "A lei permite descontar atrasos e faltas proporcionalmente ao tempo não trabalhado.",
    },
  ];

  return { itens, valorFinal: -Math.round(desconto * 100) / 100 };
}

// lib/engine/bancohoras/calcularBancoHoras.ts
import { ItemCalculo } from "../../../types";

interface ParametrosBancoHoras {
  salarioBruto: number;
  cargaHorariaMensal?: number; // padrão 220h
  horasPositivas: number;      // crédito acumulado
  horasNegativas: number;      // débito acumulado
}

/**
 * Banco de Horas — mostra o saldo (positivo ou negativo) em horas e o equivalente em
 * reais, para referência. Na prática, o saldo positivo costuma ser compensado com
 * folga, não pago em dinheiro (a não ser na rescisão do contrato).
 */
export function calcularBancoHoras(params: ParametrosBancoHoras): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioBruto, cargaHorariaMensal = 220, horasPositivas, horasNegativas } = params;
  const valorHora = salarioBruto / cargaHorariaMensal;
  const saldo = horasPositivas - horasNegativas;
  const valorSaldo = saldo * valorHora;

  const itens: ItemCalculo[] = [
    {
      codigo: "positivas",
      descricao: "Horas Positivas (crédito)",
      valor: horasPositivas,
      formula: "informado",
      baseLegal: "Art. 59, §2º da CLT",
      explicacao: "Horas que o funcionário trabalhou a mais e ainda não compensou.",
    },
    {
      codigo: "negativas",
      descricao: "Horas Negativas (débito)",
      valor: -horasNegativas,
      formula: "informado",
      baseLegal: "Art. 59, §2º da CLT",
      explicacao: "Horas que faltam ao banco (saiu mais cedo, faltou parte do dia, etc.).",
    },
    {
      codigo: "saldo",
      descricao: "Saldo em Horas",
      valor: Math.round(saldo * 100) / 100,
      formula: "positivas − negativas",
      baseLegal: "Acordo ou convenção coletiva",
      explicacao: "Esse é o saldo que resta no banco de horas do funcionário.",
    },
  ];

  return { itens, valorFinal: Math.round(valorSaldo * 100) / 100 };
}

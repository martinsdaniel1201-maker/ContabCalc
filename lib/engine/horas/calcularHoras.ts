// lib/engine/horas/calcularHoras.ts
import { ItemCalculo } from "../../../types";

interface ParametrosHoras {
  salarioBruto: number;
  cargaHorariaMensal?: number;  // padrão 220h (jornada de 44h semanais, a mais comum no Brasil)
  horasExtras50?: number;       // quantidade de horas extras a 50%
  horasExtras100?: number;      // quantidade de horas extras a 100% (domingos/feriados, normalmente)
  horasNoturnas?: number;       // quantidade de horas trabalhadas em período noturno (22h-5h)
}

/**
 * Calcula o valor da hora normal e os adicionais de horas extras (50%/100%) e noturno (20%).
 *
 * IMPORTANTE — o que este módulo NÃO calcula: o reflexo do DSR (Descanso Semanal Remunerado)
 * sobre as horas extras. Esse reflexo depende do número de dias úteis e domingos/feriados no
 * mês específico, e normalmente é calculado pelo departamento de RH com base na folha real.
 * Aqui mostramos apenas o valor direto das horas, sem esse reflexo — para não apresentar um
 * número que pareça exato sem ser.
 */
export function calcularHoras(params: ParametrosHoras): { itens: ItemCalculo[] } {
  const {
    salarioBruto,
    cargaHorariaMensal = 220,
    horasExtras50 = 0,
    horasExtras100 = 0,
    horasNoturnas = 0,
  } = params;

  const itens: ItemCalculo[] = [];

  const valorHoraNormal = salarioBruto / cargaHorariaMensal;
  itens.push({
    codigo: "valor_hora_normal",
    descricao: "Valor da Hora Normal",
    valor: Math.round(valorHoraNormal * 100) / 100,
    formula: `salário ÷ ${cargaHorariaMensal}h (carga horária mensal)`,
    baseLegal: "Súmula 431 do TST",
    explicacao:
      "Base de cálculo para todos os adicionais abaixo. A carga horária mensal padrão para " +
      "jornada de 44h semanais é 220h (44 × 5 ÷ 6 × 30, simplificado pela jurisprudência).",
  });

  if (horasExtras50 > 0) {
    const valor = valorHoraNormal * 1.5 * horasExtras50;
    itens.push({
      codigo: "he_50",
      descricao: "Horas Extras (50%)",
      valor: Math.round(valor * 100) / 100,
      formula: `valor hora × 1,5 × ${horasExtras50}h`,
      baseLegal: "Art. 7º, XVI da Constituição Federal",
      explicacao: "Adicional mínimo de 50% sobre a hora normal para horas extras em dias úteis.",
    });
  }

  if (horasExtras100 > 0) {
    const valor = valorHoraNormal * 2 * horasExtras100;
    itens.push({
      codigo: "he_100",
      descricao: "Horas Extras (100%)",
      valor: Math.round(valor * 100) / 100,
      formula: `valor hora × 2 × ${horasExtras100}h`,
      baseLegal: "Súmula 146 do TST",
      explicacao: "Adicional de 100% aplicado geralmente a horas trabalhadas em domingos e feriados, quando previsto em convenção coletiva.",
    });
  }

  if (horasNoturnas > 0) {
    const valor = valorHoraNormal * 0.20 * horasNoturnas;
    itens.push({
      codigo: "adicional_noturno",
      descricao: "Adicional Noturno (20%)",
      valor: Math.round(valor * 100) / 100,
      formula: `valor hora × 20% × ${horasNoturnas}h`,
      baseLegal: "Art. 73 da CLT",
      explicacao:
        "Adicional de no mínimo 20% para trabalho entre 22h e 5h. A hora noturna também é " +
        "reduzida (52min30s), mas essa redução não está sendo aplicada aqui — apenas o adicional.",
    });
  }

  itens.push({
    codigo: "nota_dsr",
    descricao: "Nota sobre o Reflexo em DSR",
    valor: 0,
    formula: "—",
    baseLegal: "Lei 605/1949 e Súmula 172 do TST",
    explicacao:
      "Este cálculo não inclui o reflexo das horas extras no Descanso Semanal Remunerado (DSR), " +
      "que depende do número de domingos/feriados do mês específico. Esse reflexo normalmente " +
      "é apurado pelo RH com base na folha de ponto real.",
  });

  return { itens };
}

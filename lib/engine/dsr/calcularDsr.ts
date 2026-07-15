// lib/engine/dsr/calcularDsr.ts
import { ItemCalculo } from "../../../types";

interface ParametrosDsr {
  valorHorasExtrasMes: number;
  diasUteisMes: number;
  domingosEFeriadosMes: number;
}

/**
 * Descanso Semanal Remunerado (DSR) sobre horas extras — quando o funcionário faz
 * horas extras com habitualidade, esse valor também deve refletir no seu descanso
 * semanal remunerado (domingos e feriados), como um valor adicional.
 */
export function calcularDsr(params: ParametrosDsr): { itens: ItemCalculo[]; valorFinal: number } {
  const { valorHorasExtrasMes, diasUteisMes, domingosEFeriadosMes } = params;
  const dsr = (valorHorasExtrasMes / diasUteisMes) * domingosEFeriadosMes;

  const itens: ItemCalculo[] = [
    {
      codigo: "dsr",
      descricao: "Valor do DSR sobre Horas Extras",
      valor: Math.round(dsr * 100) / 100,
      formula: "(total de horas extras ÷ dias úteis) × domingos e feriados",
      baseLegal: "Lei 605/1949 e Súmula 172 do TST",
      explicacao:
        "Quando há horas extras habituais, esse valor reflete no descanso semanal remunerado — é um " +
        "valor adicional, não incluído nas próprias horas extras.",
    },
  ];

  return { itens, valorFinal: Math.round(dsr * 100) / 100 };
}

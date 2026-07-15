// lib/engine/adicionalnoturno/calcularAdicionalNoturno.ts
import { ItemCalculo } from "../../../types";

interface ParametrosAdicionalNoturno {
  salarioBruto: number;
  cargaHorariaMensal?: number; // padrão 220h
  horasNoturnas: number;       // horas trabalhadas entre 22h e 5h
}

/**
 * Adicional Noturno dedicado — diferente do cálculo simplificado dentro do módulo de
 * Horas Extras, este aplica corretamente a REDUÇÃO DA HORA NOTURNA: cada hora noturna
 * dura, na prática, 52 minutos e 30 segundos, mas é paga como se fosse uma hora cheia
 * (Art. 73, §1º da CLT). Isso significa que as horas reais trabalhadas "rendem" mais
 * na hora de pagar.
 */
export function calcularAdicionalNoturno(params: ParametrosAdicionalNoturno): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioBruto, cargaHorariaMensal = 220, horasNoturnas } = params;
  const valorHora = salarioBruto / cargaHorariaMensal;
  const horasComputadas = horasNoturnas * (60 / 52.5);
  const adicional = valorHora * 0.2 * horasComputadas;

  const itens: ItemCalculo[] = [
    {
      codigo: "reducao",
      descricao: "Horas Convertidas (hora noturna reduzida)",
      valor: Math.round(horasComputadas * 100) / 100,
      formula: `${horasNoturnas}h × (60 ÷ 52,5)`,
      baseLegal: "Art. 73, §1º da CLT",
      explicacao:
        "A 'hora noturna' dura só 52 minutos e 30 segundos, mas é paga como se fosse uma hora cheia — " +
        "por isso as horas reais 'crescem' nesse cálculo.",
    },
    {
      codigo: "adicional",
      descricao: "Adicional Noturno (20%)",
      valor: Math.round(adicional * 100) / 100,
      formula: "valor hora × 20% × horas convertidas",
      baseLegal: "Art. 73 da CLT",
      explicacao: "Adicional de 20% sobre a hora, pago a mais por trabalhar no período noturno (22h às 5h).",
    },
  ];

  return { itens, valorFinal: Math.round(adicional * 100) / 100 };
}

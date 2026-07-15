// lib/engine/conversores/calcularConversores.ts
import { ItemCalculo } from "../../../types";

interface ParametrosConversores {
  salarioMensal: number;
  cargaHorariaMensal?: number; // padrão 220h
}

/**
 * Conversor de salário — mês, semana, dia, hora e minuto. Une num só módulo o que
 * seriam duas telas quase idênticas ("quanto vale minha hora" e "conversor de
 * salário"), já que ambas pedem essencialmente a mesma tabela de conversão.
 *
 * A hora usa a carga horária mensal de trabalho (Súmula 431 TST); dia e semana usam
 * o critério de dias corridos (salário ÷ 30), consistente com o restante da
 * plataforma (saldo de salário, aviso prévio, etc.).
 */
export function calcularConversores(params: ParametrosConversores): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioMensal, cargaHorariaMensal = 220 } = params;
  const hora = salarioMensal / cargaHorariaMensal;
  const minuto = hora / 60;
  const dia = salarioMensal / 30;
  const semana = dia * 7;

  const itens: ItemCalculo[] = [
    { codigo: "mes", descricao: "Por Mês", valor: Math.round(salarioMensal * 100) / 100, formula: "valor informado", baseLegal: "—", explicacao: "Salário mensal, como referência." },
    { codigo: "semana", descricao: "Por Semana", valor: Math.round(semana * 100) / 100, formula: "(salário ÷ 30) × 7", baseLegal: "Art. 459 da CLT", explicacao: "Usando o critério de dias corridos." },
    { codigo: "dia", descricao: "Por Dia", valor: Math.round(dia * 100) / 100, formula: "salário ÷ 30", baseLegal: "Art. 459 da CLT", explicacao: "Valor de um dia corrido do salário." },
    { codigo: "hora", descricao: "Por Hora", valor: Math.round(hora * 100) / 100, formula: `salário ÷ ${cargaHorariaMensal}h`, baseLegal: "Súmula 431 do TST", explicacao: "Usando a carga horária mensal de trabalho." },
    { codigo: "minuto", descricao: "Por Minuto", valor: Math.round(minuto * 100) / 100, formula: "valor da hora ÷ 60", baseLegal: "Súmula 431 do TST", explicacao: "O quanto vale cada minuto de trabalho." },
  ];

  return { itens, valorFinal: Math.round(hora * 100) / 100 };
}

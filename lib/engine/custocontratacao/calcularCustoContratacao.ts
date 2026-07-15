// lib/engine/custocontratacao/calcularCustoContratacao.ts
import { ItemCalculo } from "../../../types";

interface ParametrosCustoContratacao {
  salarioBruto: number;
  empresaSimplesNacional: boolean;
}

/**
 * Quanto custa contratar um funcionário — voltado a pequenos empresários. Mostra o
 * salário + os encargos provisionados (FGTS, 13º e férias mensalizados) e, para
 * empresas fora do Simples Nacional, uma estimativa de INSS patronal + RAT + terceiros.
 *
 * ESTIMATIVA SIMPLIFICADA: encargos reais variam por CNAE, grau de risco (RAT) e
 * acordos/convenções coletivas da categoria — sempre recomendar consulta a contador.
 */
export function calcularCustoContratacao(params: ParametrosCustoContratacao): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioBruto, empresaSimplesNacional } = params;

  const fgts = salarioBruto * 0.08;
  const decimoProvisao = salarioBruto / 12;
  const feriasProvisao = (salarioBruto + salarioBruto / 3) / 12;
  const inssPatronal = empresaSimplesNacional ? 0 : salarioBruto * 0.268;

  const itens: ItemCalculo[] = [
    { codigo: "salario", descricao: "Salário Bruto", valor: Math.round(salarioBruto * 100) / 100, formula: "valor oferecido", baseLegal: "—", explicacao: "O que o funcionário recebe diretamente." },
    { codigo: "fgts", descricao: "FGTS (8%)", valor: Math.round(fgts * 100) / 100, formula: "salário × 8%", baseLegal: "Lei 8.036/1990", explicacao: "Depósito mensal obrigatório." },
    { codigo: "decimo", descricao: "Provisão de 13º (mensalizado)", valor: Math.round(decimoProvisao * 100) / 100, formula: "salário ÷ 12", baseLegal: "Lei 4.090/1962", explicacao: "Reserva mensal para pagar o 13º no fim do ano." },
    { codigo: "ferias", descricao: "Provisão de Férias + 1/3 (mensalizado)", valor: Math.round(feriasProvisao * 100) / 100, formula: "(salário + 1/3) ÷ 12", baseLegal: "Art. 7º, XVII da CF", explicacao: "Reserva mensal para as férias do funcionário." },
  ];

  if (!empresaSimplesNacional) {
    itens.push({
      codigo: "inss_patronal",
      descricao: "INSS Patronal + RAT + Terceiros (~26,8%)",
      valor: Math.round(inssPatronal * 100) / 100,
      formula: "salário × 26,8% (estimativa)",
      baseLegal: "Lei 8.212/1991",
      explicacao: "Encargo que empresas fora do Simples Nacional pagam sobre a folha. Varia por CNAE e grau de risco (RAT).",
    });
  } else {
    itens.push({
      codigo: "simples_info",
      descricao: "INSS Patronal (incluso no Simples)",
      valor: 0,
      formula: "—",
      baseLegal: "LC 123/2006",
      explicacao: "Empresas do Simples Nacional já pagam o equivalente ao INSS patronal dentro do DAS.",
    });
  }

  const custoTotal = salarioBruto + fgts + decimoProvisao + feriasProvisao + inssPatronal;
  itens.push({
    codigo: "total",
    descricao: "Custo Total Mensal Estimado",
    valor: Math.round(custoTotal * 100) / 100,
    formula: "salário + todos os encargos",
    baseLegal: "—",
    explicacao: "Valor real que sai do caixa da empresa todo mês por esse funcionário — bem mais que só o salário.",
  });

  return { itens, valorFinal: Math.round(custoTotal * 100) / 100 };
}

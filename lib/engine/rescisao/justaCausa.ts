// lib/engine/rescisao/justaCausa.ts
import { DadosFuncionario, ResultadoCalculo, ItemCalculo } from "../../../types";
import { validarPeriodo } from "../utils/datas";
import { calcularInss } from "../inss/calcularInss";
import { calcularIrrf } from "../irrf/calcularIrrf";

/**
 * Dispensa por justa causa (Art. 482 da CLT) — é o cenário com menos verbas de todos.
 * O empregado perde o direito a: aviso prévio, 13º proporcional, férias proporcionais,
 * multa de 40% do FGTS e saque do FGTS. Recebe apenas: saldo de salário e férias VENCIDAS
 * (+ 1/3), se houver período completo já adquirido e não gozado — este é o único direito
 * que a justa causa não pode suprimir (é anterior à falta cometida).
 */
export function calcularJustaCausa(dados: DadosFuncionario): ResultadoCalculo {
  const { salarioBruto, dataAdmissao, dataDesligamento, dependentesIR, feriasVencidasDisponiveis = false } = dados;

  if (!dataDesligamento) throw new Error("dataDesligamento é obrigatório.");

  const alertas = validarPeriodo(dataAdmissao, dataDesligamento);
  if (salarioBruto <= 0) alertas.push("O salário informado deve ser maior que zero.");

  const itens: ItemCalculo[] = [];
  const descontos: ItemCalculo[] = [];

  const dataFim = new Date(dataDesligamento);
  const diasTrabalhadosNoMes = dataFim.getDate();
  const valorSaldoSalario = (salarioBruto / 30) * diasTrabalhadosNoMes;
  itens.push({
    codigo: "saldo_salario",
    descricao: "Saldo de Salário",
    valor: Math.round(valorSaldoSalario * 100) / 100,
    formula: `(salário ÷ 30) × ${diasTrabalhadosNoMes} dias trabalhados no mês`,
    baseLegal: "Art. 459 da CLT",
    explicacao: "Mesmo na justa causa, os dias efetivamente trabalhados são sempre devidos.",
  });

  if (feriasVencidasDisponiveis) {
    const valorFeriasVencidas = salarioBruto;
    const tercoVencidas = valorFeriasVencidas / 3;
    itens.push({
      codigo: "ferias_vencidas",
      descricao: "Férias Vencidas",
      valor: Math.round(valorFeriasVencidas * 100) / 100,
      formula: "1 salário bruto integral",
      baseLegal: "Súmula 171 do TST",
      explicacao:
        "Férias já vencidas (período aquisitivo completo e não gozado) são devidas mesmo na " +
        "justa causa, pois o direito já havia se incorporado ao patrimônio do trabalhador antes " +
        "da falta cometida.",
    });
    itens.push({
      codigo: "terco_ferias_vencidas",
      descricao: "Terço Constitucional (Férias Vencidas)",
      valor: Math.round(tercoVencidas * 100) / 100,
      formula: "valor das férias vencidas ÷ 3",
      baseLegal: "Art. 7º, XVII da Constituição Federal",
      explicacao: "O adicional de 1/3 constitucional acompanha qualquer férias devida.",
    });
  }

  itens.push({
    codigo: "verbas_nao_devidas",
    descricao: "Verbas NÃO Devidas nesta Modalidade",
    valor: 0,
    formula: "—",
    baseLegal: "Art. 482 da CLT",
    explicacao:
      "Na justa causa o trabalhador NÃO recebe: aviso prévio, 13º salário proporcional, " +
      "férias proporcionais (do período em curso) e multa de 40% do FGTS — e não pode sacar " +
      "o saldo do FGTS.",
  });

  const baseDescontos = valorSaldoSalario;
  const inss = calcularInss(baseDescontos, dataDesligamento);
  descontos.push(inss);
  const irrf = calcularIrrf({ rendaBrutaMensal: baseDescontos, inssDoMes: Math.abs(inss.valor), dependentes: dependentesIR, dataCompetencia: dataDesligamento });
  descontos.push(irrf);

  const valorFinal = itens.reduce((s, i) => s + i.valor, 0) + descontos.reduce((s, d) => s + d.valor, 0);

  return {
    tipoCalculo: "justa_causa",
    valorFinal: Math.round(valorFinal * 100) / 100,
    itens,
    descontos,
    alertas,
    faqRelacionado: [
      {
        pergunta: "A empresa precisa comprovar a justa causa?",
        resposta:
          "Sim. A justa causa é a modalidade de dispensa mais restritiva e precisa se enquadrar " +
          "em uma das hipóteses do Art. 482 da CLT (ex: desídia, insubordinação, ato de improbidade), " +
          "com provas. Se aplicada indevidamente, pode ser revertida na Justiça do Trabalho.",
      },
    ],
    geradoEm: new Date().toISOString(),
  };
}

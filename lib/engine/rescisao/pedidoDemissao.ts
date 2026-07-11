// lib/engine/rescisao/pedidoDemissao.ts
import { DadosFuncionario, ResultadoCalculo, ItemCalculo } from "../../../types";
import { contarMesesProporcionais, validarPeriodo } from "../utils/datas";
import { calcularFerias } from "../ferias/calcularFerias";
import { calcularDecimoTerceiro } from "../decimoTerceiro/calcularDecimoTerceiro";
import { calcularInss } from "../inss/calcularInss";
import { calcularIrrf } from "../irrf/calcularIrrf";
import { calcularFgts } from "../fgts/calcularFgts";

interface ParametrosPedidoDemissao extends DadosFuncionario {
  cumpriuAvisoPrevio?: boolean; // se NÃO cumpriu, a empresa pode descontar o aviso do acerto
}

/**
 * Pedido de demissão (iniciativa do empregado). Diferenças principais em relação à
 * dispensa sem justa causa: NÃO há aviso prévio indenizado a receber, NÃO há multa de
 * FGTS, e o saldo do FGTS não pode ser sacado. Se o empregado não cumprir o aviso prévio
 * de 30 dias, a empresa pode descontar esse valor do acerto rescisório (Art. 487, §2º CLT).
 */
export function calcularPedidoDemissao(dados: ParametrosPedidoDemissao): ResultadoCalculo {
  const { salarioBruto, dataAdmissao, dataDesligamento, dependentesIR, feriasVencidasDisponiveis = false, cumpriuAvisoPrevio = true } = dados;

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
    explicacao: "Dias efetivamente trabalhados no mês do desligamento.",
  });

  const mesesFerias = contarMesesProporcionais(dataAdmissao, dataDesligamento);
  const { itens: itensFerias } = calcularFerias({ salarioBruto, mesesProporcionais: mesesFerias, temFeriasVencidas: feriasVencidasDisponiveis });
  itens.push(...itensFerias);

  const mesesDecimo = contarMesesProporcionais(`${dataFim.getFullYear()}-01-01`, dataDesligamento);
  const { itens: itens13 } = calcularDecimoTerceiro({ salarioBruto, mesesTrabalhadosNoAno: mesesDecimo });
  itens.push(...itens13);

  const { itens: itensFgts } = calcularFgts({
    salarioBruto,
    dataAdmissao,
    dataReferencia: dataDesligamento,
    tipoSaida: "pedido_demissao",
  });
  itens.push(...itensFgts);

  if (!cumpriuAvisoPrevio) {
    const descontoAviso = salarioBruto; // 30 dias de aviso não cumprido = 1 salário
    descontos.push({
      codigo: "desconto_aviso_previo",
      descricao: "Desconto por Aviso Prévio Não Cumprido",
      valor: -Math.round(descontoAviso * 100) / 100,
      formula: "1 salário (30 dias que a empresa deixou de contar com o funcionário)",
      baseLegal: "Art. 487, §2º da CLT",
      explicacao:
        "Quando o próprio empregado pede demissão e não cumpre (ou é dispensado do) o aviso " +
        "prévio de 30 dias, a empresa tem o direito de descontar esse valor do acerto rescisório.",
    });
  }

  const baseDescontos = valorSaldoSalario + (itens13[0]?.valor ?? 0);
  const inss = calcularInss(baseDescontos, dataDesligamento);
  descontos.push(inss);
  const irrf = calcularIrrf({ rendaBrutaMensal: baseDescontos, inssDoMes: Math.abs(inss.valor), dependentes: dependentesIR, dataCompetencia: dataDesligamento });
  descontos.push(irrf);

  const valorFinal = itens.reduce((s, i) => s + i.valor, 0) + descontos.reduce((s, d) => s + d.valor, 0);

  return {
    tipoCalculo: "pedido_demissao",
    valorFinal: Math.round(valorFinal * 100) / 100,
    itens,
    descontos,
    alertas,
    faqRelacionado: [
      {
        pergunta: "Quem pede demissão tem direito a sacar o FGTS?",
        resposta: "Não. No pedido de demissão o saldo do FGTS fica retido na conta vinculada até uma hipótese legal de saque (ex: aposentadoria, compra da casa própria).",
      },
      {
        pergunta: "Recebo multa de 40% do FGTS pedindo demissão?",
        resposta: "Não. A multa de 40% é exclusiva da dispensa sem justa causa pelo empregador.",
      },
    ],
    geradoEm: new Date().toISOString(),
  };
}

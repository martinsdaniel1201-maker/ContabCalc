// lib/engine/rescisao/semJustaCausa.ts
import { DadosFuncionario, ResultadoCalculo, ItemCalculo } from "../../../types";
import { resolverLegislacaoVigente } from "../legislacao/2026";
import {
  contarMesesProporcionais,
  calcularDiasAvisoPrevio,
  validarPeriodo,
} from "../utils/datas";
import { calcularFerias } from "../ferias/calcularFerias";
import { calcularDecimoTerceiro } from "../decimoTerceiro/calcularDecimoTerceiro";
import { calcularInss } from "../inss/calcularInss";
import { calcularIrrf } from "../irrf/calcularIrrf";

/**
 * Rescisão SEM justa causa (iniciativa do empregador) — o cenário mais comum e mais buscado.
 * Verbas devidas: saldo de salário, aviso prévio (indenizado), férias vencidas + proporcionais
 * (+ 1/3), 13º proporcional, FGTS do período + multa de 40%. Descontos: INSS e IRRF sobre as
 * verbas de natureza salarial (saldo de salário e 13º; aviso prévio indenizado e FGTS não sofrem
 * desconto de INSS/IRRF).
 */
export function calcularRescisaoSemJustaCausa(dados: DadosFuncionario): ResultadoCalculo {
  const {
    salarioBruto,
    dataAdmissao,
    dataDesligamento,
    dependentesIR,
    feriasVencidasDisponiveis = false,
  } = dados;

  if (!dataDesligamento) {
    throw new Error("dataDesligamento é obrigatório para o cálculo de rescisão.");
  }

  const alertas = validarPeriodo(dataAdmissao, dataDesligamento);
  if (salarioBruto <= 0) alertas.push("O salário informado deve ser maior que zero.");

  const { fgts } = resolverLegislacaoVigente(dataDesligamento);

  const itens: ItemCalculo[] = [];
  const descontos: ItemCalculo[] = [];

  // 1) Saldo de salário — dias trabalhados no mês do desligamento
  const dataFim = new Date(dataDesligamento);
  const diasTrabalhadosNoMes = dataFim.getDate();
  const valorSaldoSalario = (salarioBruto / 30) * diasTrabalhadosNoMes;
  itens.push({
    codigo: "saldo_salario",
    descricao: "Saldo de Salário",
    valor: Math.round(valorSaldoSalario * 100) / 100,
    formula: `(salário ÷ 30) × ${diasTrabalhadosNoMes} dias trabalhados no mês`,
    baseLegal: "Art. 459 da CLT",
    explicacao: "Corresponde aos dias efetivamente trabalhados no mês da rescisão, ainda não pagos.",
  });

  // 2) Aviso prévio indenizado
  const diasAviso = dados.diasAvisoPrevio ?? calcularDiasAvisoPrevio(dataAdmissao, dataDesligamento);
  const valorAvisoPrevio = (salarioBruto / 30) * diasAviso;
  itens.push({
    codigo: "aviso_previo_indenizado",
    descricao: "Aviso Prévio Indenizado",
    valor: Math.round(valorAvisoPrevio * 100) / 100,
    formula: `(salário ÷ 30) × ${diasAviso} dias (30 + 3 por ano completo, máx. 90)`,
    baseLegal: "Lei 12.506/2011",
    explicacao:
      "Como a empresa dispensou o funcionário sem exigir o cumprimento do aviso, ele é pago " +
      "em dinheiro. O prazo mínimo é de 30 dias, acrescido de 3 dias por ano completo de casa, " +
      "até o limite de 90 dias.",
  });
  // O aviso prévio indenizado projeta o contrato para fins de tempo de serviço (Súmula 371 TST) —
  // simplificação: mantemos a data de desligamento informada como base de cálculo das demais verbas.

  // 3) Férias vencidas + proporcionais (+ 1/3)
  const mesesProporcionaisFerias = contarMesesProporcionais(dataAdmissao, dataDesligamento);
  const { itens: itensFerias } = calcularFerias({
    salarioBruto,
    mesesProporcionais: mesesProporcionaisFerias,
    temFeriasVencidas: feriasVencidasDisponiveis,
  });
  itens.push(...itensFerias);

  // 4) 13º proporcional
  const mesesDecimoTerceiro = contarMesesProporcionais(
    `${new Date(dataDesligamento).getFullYear()}-01-01`,
    dataDesligamento
  );
  const { itens: itens13 } = calcularDecimoTerceiro({
    salarioBruto,
    mesesTrabalhadosNoAno: mesesDecimoTerceiro,
  });
  itens.push(...itens13);

  // 5) FGTS do período + multa de 40%
  // Estimativa simplificada: assume que não há saldo de FGTS prévio informado —
  // projeta o depósito só sobre o mês corrente para fins didáticos. Em uso real,
  // o saldo de FGTS deve vir do extrato (Caixa) e ser somado aqui.
  const depositoFgtsMes = salarioBruto * fgts.aliquotaDeposito;
  itens.push({
    codigo: "fgts_deposito_mes",
    descricao: "Depósito de FGTS do Mês",
    valor: Math.round(depositoFgtsMes * 100) / 100,
    formula: `salário × ${(fgts.aliquotaDeposito * 100).toFixed(0)}%`,
    baseLegal: "Lei 8.036/1990",
    explicacao:
      "Todo mês o empregador deposita 8% do salário do funcionário em uma conta vinculada do FGTS. " +
      "Este valor pertence ao trabalhador e pode ser sacado em situações previstas em lei, como " +
      "a dispensa sem justa causa.",
  });

  const multaFgts = depositoFgtsMes * fgts.multaSemJustaCausa;
  itens.push({
    codigo: "multa_fgts_40",
    descricao: "Multa de 40% do FGTS",
    valor: Math.round(multaFgts * 100) / 100,
    formula: `saldo do FGTS × ${(fgts.multaSemJustaCausa * 100).toFixed(0)}%`,
    baseLegal: "Art. 18, §1º da Lei 8.036/1990",
    explicacao:
      "Na dispensa sem justa causa, o empregador é obrigado a pagar uma multa de 40% sobre todo " +
      "o saldo do FGTS depositado durante o contrato (não apenas o do último mês).",
  });

  // 6) Descontos — INSS e IRRF incidem sobre saldo de salário + 13º (verbas salariais).
  //    Aviso prévio indenizado e FGTS não sofrem desconto de INSS/IRRF.
  const baseDescontos = valorSaldoSalario + (itens13[0]?.valor ?? 0);
  const inss = calcularInss(baseDescontos, dataDesligamento);
  descontos.push(inss);

  const irrf = calcularIrrf({
    rendaBrutaMensal: baseDescontos,
    inssDoMes: Math.abs(inss.valor),
    dependentes: dependentesIR,
    dataCompetencia: dataDesligamento,
  });
  descontos.push(irrf);

  const valorFinal =
    itens.reduce((soma, i) => soma + i.valor, 0) + descontos.reduce((soma, d) => soma + d.valor, 0);

  return {
    tipoCalculo: "rescisao_sem_justa_causa",
    valorFinal: Math.round(valorFinal * 100) / 100,
    itens,
    descontos,
    alertas,
    faqRelacionado: [
      {
        pergunta: "O FGTS entra no valor total da rescisão que recebo na mão?",
        resposta:
          "Não diretamente no TRCT — o FGTS fica na conta vinculada (Caixa) e é sacado à parte, " +
          "mediante a chave de saque por rescisão sem justa causa. Aqui ele é mostrado para você " +
          "entender o valor total a que tem direito.",
      },
      {
        pergunta: "Por que o aviso prévio indenizado não tem desconto de INSS/IRRF?",
        resposta:
          "Porque tem natureza indenizatória, não salarial — é uma compensação pela falta de aviso, " +
          "não uma remuneração por trabalho prestado.",
      },
    ],
    geradoEm: new Date().toISOString(),
  };
}

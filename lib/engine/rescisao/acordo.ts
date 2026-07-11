// lib/engine/rescisao/acordo.ts
import { DadosFuncionario, ResultadoCalculo, ItemCalculo } from "../../../types";
import { contarMesesProporcionais, calcularDiasAvisoPrevio, validarPeriodo } from "../utils/datas";
import { calcularFerias } from "../ferias/calcularFerias";
import { calcularDecimoTerceiro } from "../decimoTerceiro/calcularDecimoTerceiro";
import { calcularInss } from "../inss/calcularInss";
import { calcularIrrf } from "../irrf/calcularIrrf";
import { calcularFgts } from "../fgts/calcularFgts";

/**
 * Rescisão por acordo entre empregado e empregador (Art. 484-A da CLT, criado pela
 * Reforma Trabalhista de 2017). É um "meio-termo": o aviso prévio (quando indenizado) e
 * a multa do FGTS são pagos pela METADE, e o trabalhador pode sacar até 80% do saldo do
 * FGTS — mas não tem direito ao seguro-desemprego.
 */
export function calcularAcordo(dados: DadosFuncionario): ResultadoCalculo {
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
    explicacao: "Dias efetivamente trabalhados no mês do desligamento.",
  });

  const diasAvisoIntegral = calcularDiasAvisoPrevio(dataAdmissao, dataDesligamento);
  const valorAvisoMetade = (salarioBruto / 30) * diasAvisoIntegral * 0.5;
  itens.push({
    codigo: "aviso_previo_metade",
    descricao: "Aviso Prévio Indenizado (50%)",
    valor: Math.round(valorAvisoMetade * 100) / 100,
    formula: `(salário ÷ 30) × ${diasAvisoIntegral} dias × 50%`,
    baseLegal: "Art. 484-A, I da CLT",
    explicacao:
      "Na rescisão por acordo, o aviso prévio indenizado é pago pela metade do valor que " +
      "seria devido na dispensa sem justa causa.",
  });

  const mesesFerias = contarMesesProporcionais(dataAdmissao, dataDesligamento);
  const { itens: itensFerias } = calcularFerias({ salarioBruto, mesesProporcionais: mesesFerias, temFeriasVencidas: feriasVencidasDisponiveis });
  itens.push(...itensFerias); // férias (vencidas + proporcionais) são pagas INTEGRALMENTE no acordo

  const mesesDecimo = contarMesesProporcionais(`${dataFim.getFullYear()}-01-01`, dataDesligamento);
  const { itens: itens13 } = calcularDecimoTerceiro({ salarioBruto, mesesTrabalhadosNoAno: mesesDecimo });
  itens.push(...itens13); // 13º proporcional também é integral no acordo

  const { itens: itensFgts } = calcularFgts({
    salarioBruto,
    dataAdmissao,
    dataReferencia: dataDesligamento,
    tipoSaida: "acordo",
  });
  itens.push(...itensFgts);

  itens.push({
    codigo: "info_saque_fgts_80",
    descricao: "Direito de Saque do FGTS",
    valor: 0,
    formula: "—",
    baseLegal: "Art. 484-A, §1º da CLT",
    explicacao:
      "Na rescisão por acordo, o trabalhador pode sacar até 80% do saldo da conta vinculada " +
      "do FGTS (os outros 20% ficam retidos). Não há direito ao seguro-desemprego nesta modalidade.",
  });

  const baseDescontos = valorSaldoSalario + (itens13[0]?.valor ?? 0);
  const inss = calcularInss(baseDescontos, dataDesligamento);
  descontos.push(inss);
  const irrf = calcularIrrf({ rendaBrutaMensal: baseDescontos, inssDoMes: Math.abs(inss.valor), dependentes: dependentesIR, dataCompetencia: dataDesligamento });
  descontos.push(irrf);

  const valorFinal = itens.reduce((s, i) => s + i.valor, 0) + descontos.reduce((s, d) => s + d.valor, 0);

  return {
    tipoCalculo: "rescisao_por_acordo",
    valorFinal: Math.round(valorFinal * 100) / 100,
    itens,
    descontos,
    alertas,
    faqRelacionado: [
      {
        pergunta: "Rescisão por acordo dá direito a seguro-desemprego?",
        resposta: "Não. Essa é a principal desvantagem do acordo em relação à dispensa sem justa causa — não há acesso ao seguro-desemprego.",
      },
      {
        pergunta: "Os 20% retidos do FGTS são perdidos?",
        resposta: "Não, ficam na conta vinculada e podem ser sacados futuramente em outra hipótese legal (ex: aposentadoria, nova dispensa sem justa causa em outro emprego).",
      },
    ],
    geradoEm: new Date().toISOString(),
  };
}

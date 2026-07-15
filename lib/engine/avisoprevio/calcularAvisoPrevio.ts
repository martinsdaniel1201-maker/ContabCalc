// lib/engine/avisoprevio/calcularAvisoPrevio.ts
import { ItemCalculo } from "../../../types";
import { calcularDiasAvisoPrevio } from "../utils/datas";

export type TipoAvisoPrevio = "indenizado" | "trabalhado" | "desconto";

interface ParametrosAvisoPrevio {
  salarioBruto: number;
  dataAdmissao: string;
  dataDesligamento: string;
  tipo: TipoAvisoPrevio;
}

/**
 * Módulo independente de Aviso Prévio — cobre as três situações mais comuns:
 *  - indenizado: empresa dispensa e paga o período em dinheiro, sem exigir trabalho
 *  - trabalhado: o funcionário cumpre o período normalmente, recebendo salário normal
 *  - desconto: o próprio empregado pede demissão e não cumpre o aviso, gerando desconto
 *
 * Em todos os casos, o número de dias é sempre o mesmo: 30 + 3 por ano completo de
 * casa, até o limite de 90 dias (Lei 12.506/2011) — o que muda é apenas a forma de
 * pagamento/desconto.
 */
export function calcularAvisoPrevio(params: ParametrosAvisoPrevio): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioBruto, dataAdmissao, dataDesligamento, tipo } = params;
  const dias = calcularDiasAvisoPrevio(dataAdmissao, dataDesligamento);
  const itens: ItemCalculo[] = [];
  let valorFinal = 0;

  itens.push({
    codigo: "dias",
    descricao: "Dias de Aviso Prévio",
    valor: dias,
    formula: "30 dias + 3 por ano completo de casa, até 90",
    baseLegal: "Lei 12.506/2011",
    explicacao: "O tempo de aviso cresce com o tempo de casa: quanto mais tempo trabalhado, mais dias de aviso.",
  });

  if (tipo === "indenizado") {
    const valor = (salarioBruto / 30) * dias;
    itens.push({
      codigo: "valor",
      descricao: "Valor do Aviso Prévio Indenizado",
      valor: Math.round(valor * 100) / 100,
      formula: `(salário ÷ 30) × ${dias} dias`,
      baseLegal: "Lei 12.506/2011",
      explicacao: "Pago em dinheiro porque a empresa não exigiu que o funcionário trabalhasse esse período.",
    });
    valorFinal = Math.round(valor * 100) / 100;
  } else if (tipo === "trabalhado") {
    itens.push({
      codigo: "info",
      descricao: "Como é Pago",
      valor: 0,
      formula: "—",
      baseLegal: "Art. 487 da CLT",
      explicacao:
        "No aviso trabalhado, o funcionário recebe o salário normal durante esses dias — não há valor " +
        "extra, pois é trabalho de verdade sendo remunerado como sempre.",
    });
    valorFinal = 0;
  } else {
    const valor = (salarioBruto / 30) * dias;
    itens.push({
      codigo: "desconto",
      descricao: "Desconto no Acerto Rescisório",
      valor: -Math.round(valor * 100) / 100,
      formula: `(salário ÷ 30) × ${dias} dias`,
      baseLegal: "Art. 487, §2º da CLT",
      explicacao:
        "Como o funcionário pediu demissão e não cumpriu o aviso, a empresa pode descontar esse valor " +
        "do que ele tem a receber.",
    });
    valorFinal = -Math.round(valor * 100) / 100;
  }

  return { itens, valorFinal };
}

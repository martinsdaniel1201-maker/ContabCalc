// lib/engine/fgts/calcularFgts.ts
import { ItemCalculo } from "../../../types";
import { resolverLegislacaoVigente } from "../legislacao/2026";
import { contarMesesProporcionais } from "../utils/datas";

interface ParametrosFgts {
  salarioBruto: number;
  dataAdmissao: string;
  dataReferencia: string;       // data até quando calcular o extrato estimado
  saldoFgtsInformado?: number;  // se o usuário já sabe o saldo real (do extrato da Caixa)
  tipoSaida?: "sem_justa_causa" | "acordo" | "pedido_demissao" | "justa_causa" | "nenhuma";
}

/**
 * Módulo independente de FGTS — cobre:
 *  - Estimativa de depósitos acumulados (quando o usuário não informa o saldo real)
 *  - Multa rescisória, quando aplicável ao tipo de saída
 *
 * IMPORTANTE: a estimativa de depósitos NÃO substitui o extrato oficial da Caixa —
 * ela ignora reajustes salariais ao longo do tempo e a correção monetária/juros da conta
 * vinculada. Sempre que o usuário souber o saldo real, ele deve informá-lo em
 * `saldoFgtsInformado` para um resultado preciso.
 */
export function calcularFgts(params: ParametrosFgts): { itens: ItemCalculo[] } {
  const {
    salarioBruto,
    dataAdmissao,
    dataReferencia,
    saldoFgtsInformado,
    tipoSaida = "nenhuma",
  } = params;

  const { fgts } = resolverLegislacaoVigente(dataReferencia);
  const itens: ItemCalculo[] = [];

  let saldoFgts: number;

  if (saldoFgtsInformado !== undefined) {
    saldoFgts = saldoFgtsInformado;
    itens.push({
      codigo: "fgts_saldo_informado",
      descricao: "Saldo de FGTS (informado pelo usuário)",
      valor: Math.round(saldoFgts * 100) / 100,
      formula: "valor informado, extraído do extrato oficial (Caixa/app FGTS)",
      baseLegal: "Lei 8.036/1990",
      explicacao:
        "Este valor foi informado diretamente por você, a partir do extrato oficial. " +
        "É o mais preciso, pois já contempla reajustes salariais e a correção monetária da conta.",
    });
  } else {
    // Estimativa simplificada: assume salário constante durante todo o período —
    // não reflete reajustes nem correção monetária/juros da conta vinculada.
    const mesesCompletos = Math.max(
      1,
      Math.round(
        (new Date(dataReferencia).getTime() - new Date(dataAdmissao).getTime()) /
          (1000 * 60 * 60 * 24 * 30.44)
      )
    );
    saldoFgts = salarioBruto * fgts.aliquotaDeposito * mesesCompletos;
    itens.push({
      codigo: "fgts_estimativa",
      descricao: "Estimativa de Saldo Acumulado de FGTS",
      valor: Math.round(saldoFgts * 100) / 100,
      formula: `salário × 8% × ${mesesCompletos} meses estimados`,
      baseLegal: "Lei 8.036/1990",
      explicacao:
        "Estimativa simplificada assumindo salário constante durante todo o período. " +
        "NÃO substitui o extrato oficial: não considera reajustes salariais nem a correção " +
        "monetária e os juros da conta vinculada. Para o valor exato, consulte o app FGTS ou " +
        "o extrato na Caixa Econômica Federal.",
    });
  }

  if (tipoSaida === "sem_justa_causa") {
    const multa = saldoFgts * fgts.multaSemJustaCausa;
    itens.push({
      codigo: "multa_fgts_40",
      descricao: "Multa de 40% do FGTS",
      valor: Math.round(multa * 100) / 100,
      formula: `saldo do FGTS × ${(fgts.multaSemJustaCausa * 100).toFixed(0)}%`,
      baseLegal: "Art. 18, §1º da Lei 8.036/1990",
      explicacao:
        "Na dispensa sem justa causa, o empregador paga uma multa de 40% sobre todo o saldo " +
        "do FGTS depositado durante o contrato — não apenas o do último mês.",
    });
  } else if (tipoSaida === "acordo") {
    const multa = saldoFgts * fgts.multaAcordo;
    itens.push({
      codigo: "multa_fgts_20",
      descricao: "Multa de 20% do FGTS (Rescisão por Acordo)",
      valor: Math.round(multa * 100) / 100,
      formula: `saldo do FGTS × ${(fgts.multaAcordo * 100).toFixed(0)}%`,
      baseLegal: "Art. 484-A da CLT",
      explicacao:
        "Na rescisão por acordo entre empregado e empregador, a multa é reduzida para 20% " +
        "(metade da multa da dispensa sem justa causa), e o trabalhador pode sacar até 80% " +
        "do saldo do FGTS.",
    });
  } else if (tipoSaida === "pedido_demissao" || tipoSaida === "justa_causa") {
    itens.push({
      codigo: "fgts_sem_multa",
      descricao: "Sem Multa de FGTS",
      valor: 0,
      formula: "não há multa aplicável",
      baseLegal: "Lei 8.036/1990, Art. 20",
      explicacao:
        "No pedido de demissão e na dispensa por justa causa não há multa rescisória de FGTS, " +
        "e o trabalhador não pode sacar o saldo — ele permanece na conta vinculada até uma " +
        "situação de saque prevista em lei (aposentadoria, compra de imóvel, etc.).",
    });
  }

  return { itens };
}

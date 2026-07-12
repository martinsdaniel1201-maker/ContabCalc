// lib/engine/segurodesemprego/calcularSeguroDesemprego.ts
import { ItemCalculo } from "../../../types";

interface ParametrosSeguroDesemprego {
  mediaSalarial: number;        // média dos últimos 3 salários antes da dispensa
  mesesTrabalhados36: number;   // meses trabalhados nos últimos 36 meses
  numeroSolicitacao: 1 | 2 | 3; // 1ª, 2ª ou 3ª+ solicitação do benefício
}

const SALARIO_MINIMO_2026 = 1621.00;
const TETO_SEGURO_2026 = 2518.65;
const FAIXA1_LIMITE = 2222.17;
const FAIXA2_LIMITE = 3703.99;
const FAIXA2_BASE = 1777.74;

function calcularValorParcela(mediaSalarial: number): { valor: number; faixa: string } {
  let valor: number;
  let faixa: string;
  if (mediaSalarial <= FAIXA1_LIMITE) {
    valor = mediaSalarial * 0.8;
    faixa = "1ª faixa (até R$2.222,17): média × 80%";
  } else if (mediaSalarial <= FAIXA2_LIMITE) {
    valor = FAIXA2_BASE + (mediaSalarial - FAIXA1_LIMITE) * 0.5;
    faixa = "2ª faixa (R$2.222,18 a R$3.703,99): R$1.777,74 + 50% do excedente";
  } else {
    valor = TETO_SEGURO_2026;
    faixa = "3ª faixa (acima de R$3.703,99): valor fixo (teto)";
  }
  valor = Math.max(SALARIO_MINIMO_2026, Math.min(valor, TETO_SEGURO_2026));
  return { valor, faixa };
}

function calcularNumeroParcelas(mesesTrabalhados36: number, numeroSolicitacao: 1 | 2 | 3): number {
  if (numeroSolicitacao === 1) {
    if (mesesTrabalhados36 >= 24) return 5;
    if (mesesTrabalhados36 >= 12) return 4;
    return 0; // não tem direito (mínimo 12 meses na 1ª solicitação)
  }
  if (numeroSolicitacao === 2) {
    if (mesesTrabalhados36 >= 24) return 5;
    if (mesesTrabalhados36 >= 12) return 4;
    if (mesesTrabalhados36 >= 9) return 3;
    return 0;
  }
  // 3ª solicitação ou mais
  if (mesesTrabalhados36 >= 24) return 5;
  if (mesesTrabalhados36 >= 12) return 4;
  if (mesesTrabalhados36 >= 6) return 3;
  return 0;
}

/**
 * Seguro-Desemprego (Lei 7.998/1990 + Resolução CODEFAT nº 957/2022, tabela vigente
 * desde 11/01/2026). Só se aplica a dispensa sem justa causa ou rescisão indireta —
 * pedido de demissão e justa causa NÃO dão direito ao benefício.
 */
export function calcularSeguroDesemprego(params: ParametrosSeguroDesemprego): { itens: ItemCalculo[] } {
  const { mediaSalarial, mesesTrabalhados36, numeroSolicitacao } = params;
  const itens: ItemCalculo[] = [];

  const { valor: valorParcela, faixa } = calcularValorParcela(mediaSalarial);
  const numeroParcelas = calcularNumeroParcelas(mesesTrabalhados36, numeroSolicitacao);

  if (numeroParcelas === 0) {
    itens.push({
      codigo: "sem_direito",
      descricao: "Sem Direito ao Benefício",
      valor: 0,
      formula: "—",
      baseLegal: "Lei 7.998/1990, Art. 3º",
      explicacao:
        "Com base no tempo trabalhado informado e no número desta solicitação, o tempo mínimo " +
        "exigido por lei não foi atingido. Os requisitos mínimos variam: 12 meses (1ª solicitação), " +
        "9 meses (2ª solicitação) ou 6 meses (3ª solicitação ou mais), nos últimos 36 meses.",
    });
    return { itens };
  }

  itens.push({
    codigo: "valor_parcela",
    descricao: "Valor de Cada Parcela",
    valor: Math.round(valorParcela * 100) / 100,
    formula: faixa,
    baseLegal: "Resolução CODEFAT nº 957/2022, tabela vigente desde 11/01/2026",
    explicacao:
      "Calculado com base na média dos últimos 3 salários. O valor nunca é inferior ao salário " +
      `mínimo (R$${SALARIO_MINIMO_2026.toFixed(2)}) nem superior ao teto (R$${TETO_SEGURO_2026.toFixed(2)}).`,
  });

  itens.push({
    codigo: "numero_parcelas",
    descricao: "Número de Parcelas",
    valor: numeroParcelas,
    formula: `${mesesTrabalhados36} meses trabalhados nos últimos 36 meses, ${numeroSolicitacao}ª solicitação`,
    baseLegal: "Lei 7.998/1990, Art. 4º",
    explicacao:
      "O número de parcelas (3 a 5) depende de quanto tempo você trabalhou nos últimos 36 meses " +
      "e de quantas vezes já solicitou o benefício antes — quem solicita pela primeira vez precisa " +
      "de mais tempo de trabalho para ter direito ao mesmo número de parcelas.",
  });

  itens.push({
    codigo: "total_estimado",
    descricao: "Total Estimado do Benefício",
    valor: Math.round(valorParcela * numeroParcelas * 100) / 100,
    formula: `R$${valorParcela.toFixed(2)} × ${numeroParcelas} parcelas`,
    baseLegal: "Lei 7.998/1990",
    explicacao: "Soma de todas as parcelas a que você tem direito, pagas mensalmente pela Caixa Econômica Federal.",
  });

  return { itens };
}

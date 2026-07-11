// lib/engine/decimoTerceiro/calcularDecimoTerceiro.ts
import { ItemCalculo } from "../../../types";

interface ParametrosDecimoTerceiro {
  salarioBruto: number;
  mesesTrabalhadosNoAno: number; // 0 a 12
  primeiraParcelaJaPaga?: number; // valor já adiantado (se houver), para desconto na 2ª parcela
}

export function calcularDecimoTerceiro(params: ParametrosDecimoTerceiro): { itens: ItemCalculo[] } {
  const { salarioBruto, mesesTrabalhadosNoAno, primeiraParcelaJaPaga } = params;
  const itens: ItemCalculo[] = [];

  const valorIntegral = (salarioBruto / 12) * mesesTrabalhadosNoAno;

  itens.push({
    codigo: "decimo_terceiro_proporcional",
    descricao: mesesTrabalhadosNoAno >= 12 ? "13º Salário Integral" : "13º Salário Proporcional",
    valor: Math.round(valorIntegral * 100) / 100,
    formula: `(salário ÷ 12) × ${mesesTrabalhadosNoAno} meses`,
    baseLegal: "Lei 4.090/1962 e Lei 4.749/1965",
    explicacao:
      "O 13º salário corresponde a 1/12 do salário para cada mês trabalhado com 15 dias ou mais " +
      "no ano. Quem trabalhou o ano inteiro recebe o valor integral; quem foi admitido ou " +
      "desligado durante o ano recebe de forma proporcional.",
  });

  if (primeiraParcelaJaPaga && primeiraParcelaJaPaga > 0) {
    itens.push({
      codigo: "desconto_primeira_parcela_13",
      descricao: "Dedução da 1ª Parcela do 13º já Adiantada",
      valor: -Math.round(primeiraParcelaJaPaga * 100) / 100,
      formula: "valor já adiantado ao funcionário",
      baseLegal: "Lei 4.749/1965, Art. 2º",
      explicacao:
        "A primeira parcela do 13º (geralmente paga até 30 de novembro) é um adiantamento e " +
        "deve ser descontada do valor total apurado, para não haver pagamento em duplicidade.",
    });
  }

  return { itens };
}

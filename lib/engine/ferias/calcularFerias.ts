// lib/engine/ferias/calcularFerias.ts
import { ItemCalculo } from "../../../types";
import { contarMesesProporcionais } from "../utils/datas";

interface ParametrosFerias {
  salarioBruto: number;
  mesesProporcionais: number;   // meses trabalhados desde o último período aquisitivo
  temFeriasVencidas: boolean;   // já completou 12 meses sem gozar férias?
  venderFerias?: boolean;       // abono pecuniário (vender 1/3 do período)
}

export function calcularFerias(params: ParametrosFerias): { itens: ItemCalculo[] } {
  const { salarioBruto, mesesProporcionais, temFeriasVencidas, venderFerias } = params;
  const itens: ItemCalculo[] = [];

  if (temFeriasVencidas) {
    const valorFeriasVencidas = salarioBruto;
    const tercoVencidas = valorFeriasVencidas / 3;
    itens.push({
      codigo: "ferias_vencidas",
      descricao: "Férias Vencidas",
      valor: Math.round(valorFeriasVencidas * 100) / 100,
      formula: "1 salário bruto integral (período aquisitivo já vencido)",
      baseLegal: "Art. 7º, XVII da Constituição Federal e Art. 130 da CLT",
      explicacao:
        "Quando o funcionário completa 12 meses de trabalho sem gozar férias, esse período " +
        "'vence' e deve ser pago em dobro em caso de atraso do empregador (Art. 137 CLT), ou de " +
        "forma simples se ainda dentro do prazo legal para concessão.",
    });
    itens.push({
      codigo: "terco_ferias_vencidas",
      descricao: "Terço Constitucional (Férias Vencidas)",
      valor: Math.round(tercoVencidas * 100) / 100,
      formula: "valor das férias vencidas ÷ 3",
      baseLegal: "Art. 7º, XVII da Constituição Federal",
      explicacao:
        "A Constituição garante um adicional de 1/3 sobre o valor das férias, chamado de " +
        "'terço constitucional', pago sempre que há férias a receber.",
    });
  }

  if (mesesProporcionais > 0) {
    const valorProporcional = (salarioBruto / 12) * mesesProporcionais;
    const tercoProporcional = valorProporcional / 3;
    itens.push({
      codigo: "ferias_proporcionais",
      descricao: "Férias Proporcionais",
      valor: Math.round(valorProporcional * 100) / 100,
      formula: `(salário ÷ 12) × ${mesesProporcionais} meses`,
      baseLegal: "Art. 146, parágrafo único da CLT",
      explicacao:
        "Refere-se ao período do atual período aquisitivo (ainda não completou 12 meses). " +
        "Cada mês trabalhado com 15 dias ou mais gera direito a 1/12 avos de férias proporcionais.",
    });
    itens.push({
      codigo: "terco_ferias_proporcionais",
      descricao: "Terço Constitucional (Férias Proporcionais)",
      valor: Math.round(tercoProporcional * 100) / 100,
      formula: "valor das férias proporcionais ÷ 3",
      baseLegal: "Art. 7º, XVII da Constituição Federal",
      explicacao: "Mesmo adicional de 1/3 aplicado também sobre as férias proporcionais.",
    });
  }

  if (venderFerias) {
    const valorAbono = salarioBruto / 3; // vende 1/3 do período de férias (10 dias)
    const tercoAbono = valorAbono / 3;
    itens.push({
      codigo: "abono_pecuniario",
      descricao: "Abono Pecuniário (Venda de 1/3 das Férias)",
      valor: Math.round(valorAbono * 100) / 100,
      formula: "salário ÷ 3 (equivalente a 10 dias)",
      baseLegal: "Art. 143 da CLT",
      explicacao:
        "O funcionário pode optar por 'vender' até 1/3 do período de férias ao empregador, " +
        "recebendo em dinheiro em vez de descansar esses dias. É uma opção, não uma obrigação.",
    });
    itens.push({
      codigo: "terco_abono_pecuniario",
      descricao: "Terço Constitucional (Abono Pecuniário)",
      valor: Math.round(tercoAbono * 100) / 100,
      formula: "valor do abono ÷ 3",
      baseLegal: "Art. 7º, XVII da Constituição Federal",
      explicacao: "O terço constitucional também incide sobre o valor do abono pecuniário vendido.",
    });
  }

  return { itens };
}

export { contarMesesProporcionais };

// lib/engine/valetransporte/calcularValeTransporte.ts
import { ItemCalculo } from "../../../types";

interface ParametrosValeTransporte {
  salarioBruto: number;
  custoRealTransporte?: number; // custo real do transporte no mês, se o usuário souber
}

/**
 * Vale Transporte — desconto máximo (6% do salário), participação do empregado e,
 * quando o custo real é maior que o teto legal, a participação da empresa na diferença.
 */
export function calcularValeTransporte(params: ParametrosValeTransporte): { itens: ItemCalculo[]; valorFinal: number } {
  const { salarioBruto, custoRealTransporte } = params;
  const tetoLegal = salarioBruto * 0.06;
  const descontoFuncionario =
    custoRealTransporte !== undefined ? Math.min(tetoLegal, custoRealTransporte) : tetoLegal;

  const itens: ItemCalculo[] = [
    {
      codigo: "teto",
      descricao: "Desconto Máximo Permitido (6%)",
      valor: Math.round(tetoLegal * 100) / 100,
      formula: "salário × 6%",
      baseLegal: "Lei 7.418/1985, Art. 4º",
      explicacao: "A lei limita o desconto do VT a no máximo 6% do salário bruto, não importa o custo real do transporte.",
    },
    {
      codigo: "desconto_funcionario",
      descricao: "Participação do Empregado",
      valor: Math.round(descontoFuncionario * 100) / 100,
      formula:
        custoRealTransporte !== undefined
          ? "menor valor entre 6% do salário e o custo real informado"
          : "6% do salário (sem custo real informado)",
      baseLegal: "Lei 7.418/1985",
      explicacao: "É o valor efetivamente descontado do salário do funcionário.",
    },
  ];

  if (custoRealTransporte !== undefined && custoRealTransporte > tetoLegal) {
    const participacaoEmpresa = custoRealTransporte - descontoFuncionario;
    itens.push({
      codigo: "participacao_empresa",
      descricao: "Participação da Empresa",
      valor: Math.round(participacaoEmpresa * 100) / 100,
      formula: "custo real − desconto do empregado",
      baseLegal: "Lei 7.418/1985",
      explicacao: "Como o custo real do transporte é maior que 6% do salário, a empresa paga a diferença.",
    });
  }

  return { itens, valorFinal: Math.round(descontoFuncionario * 100) / 100 };
}

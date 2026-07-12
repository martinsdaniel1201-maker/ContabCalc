// lib/engine/salarioLiquido/calcularSalarioLiquido.ts
import { ItemCalculo } from "../../../types";
import { calcularInss } from "../inss/calcularInss";
import { calcularIrrf } from "../irrf/calcularIrrf";

interface ParametrosSalarioLiquido {
  salarioBruto: number;
  dependentesIR: number;
  dataCompetencia: string;
  descontoValeTransporte?: boolean;  // desconta até 6% do salário base, limitado ao custo real
  custoValeTransporte?: number;      // custo real do VT no mês (o desconto é o menor entre 6% e este valor)
  descontoValeAlimentacao?: number;  // valor fixo descontado (parte do custo que cabe ao funcionário)
  descontoPlanoSaude?: number;
  outrosDescontos?: number;          // empréstimos consignados, pensão alimentícia, etc.
}

/**
 * Consolida o salário líquido: parte do salário bruto, aplica INSS e IRRF (via módulos
 * já existentes) e depois os descontos específicos do contrato (VT, VA, plano de saúde,
 * outros). A ordem importa: INSS e IRRF incidem sobre o salário bruto, os demais descontos
 * (VT, VA, plano de saúde) NÃO reduzem a base de cálculo do IRRF.
 */
export function calcularSalarioLiquido(params: ParametrosSalarioLiquido): { itens: ItemCalculo[]; descontos: ItemCalculo[] } {
  const {
    salarioBruto,
    dependentesIR,
    dataCompetencia,
    descontoValeTransporte = false,
    custoValeTransporte = 0,
    descontoValeAlimentacao = 0,
    descontoPlanoSaude = 0,
    outrosDescontos = 0,
  } = params;

  const itens: ItemCalculo[] = [
    {
      codigo: "salario_bruto",
      descricao: "Salário Bruto",
      valor: Math.round(salarioBruto * 100) / 100,
      formula: "valor informado no contrato",
      baseLegal: "Art. 457 da CLT",
      explicacao: "Valor total combinado antes de qualquer desconto legal ou contratual.",
    },
  ];

  const descontos: ItemCalculo[] = [];

  const inss = calcularInss(salarioBruto, dataCompetencia);
  descontos.push(inss);

  const irrf = calcularIrrf({
    rendaBrutaMensal: salarioBruto,
    inssDoMes: Math.abs(inss.valor),
    dependentes: dependentesIR,
    dataCompetencia,
  });
  descontos.push(irrf);

  if (descontoValeTransporte) {
    const tetoLegal = salarioBruto * 0.06;
    const valorDesconto = custoValeTransporte > 0 ? Math.min(tetoLegal, custoValeTransporte) : tetoLegal;
    descontos.push({
      codigo: "vale_transporte",
      descricao: "Desconto de Vale Transporte",
      valor: -Math.round(valorDesconto * 100) / 100,
      formula: "min(6% do salário bruto, custo real do VT)",
      baseLegal: "Lei 7.418/1985, Art. 4º",
      explicacao:
        "O desconto do vale transporte é limitado a 6% do salário bruto, mesmo que o custo " +
        "real do transporte seja maior — o empregador arca com a diferença.",
    });
  }

  if (descontoValeAlimentacao > 0) {
    descontos.push({
      codigo: "vale_alimentacao",
      descricao: "Desconto de Vale Alimentação/Refeição",
      valor: -Math.round(descontoValeAlimentacao * 100) / 100,
      formula: "valor informado no contrato/convenção",
      baseLegal: "Lei 6.321/1976 (PAT) e convenção coletiva aplicável",
      explicacao: "Parte do custo do benefício que cabe ao funcionário, conforme definido pela empresa ou convenção coletiva.",
    });
  }

  if (descontoPlanoSaude > 0) {
    descontos.push({
      codigo: "plano_saude",
      descricao: "Desconto de Plano de Saúde",
      valor: -Math.round(descontoPlanoSaude * 100) / 100,
      formula: "valor informado no contrato",
      baseLegal: "Cláusula contratual / convenção coletiva",
      explicacao: "Parte da mensalidade do plano de saúde que é descontada do funcionário.",
    });
  }

  if (outrosDescontos > 0) {
    descontos.push({
      codigo: "outros_descontos",
      descricao: "Outros Descontos (empréstimos, pensão, etc.)",
      valor: -Math.round(outrosDescontos * 100) / 100,
      formula: "valor informado",
      baseLegal: "Art. 462 da CLT (descontos autorizados)",
      explicacao: "Descontos autorizados em contrato, acordo ou determinação judicial (ex: consignado, pensão alimentícia).",
    });
  }

  return { itens, descontos };
}

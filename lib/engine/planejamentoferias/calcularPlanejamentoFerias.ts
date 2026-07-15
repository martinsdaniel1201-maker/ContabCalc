// lib/engine/planejamentoferias/calcularPlanejamentoFerias.ts
import { ItemCalculo } from "../../../types";
import { contarAnosCompletos } from "../utils/datas";

interface ParametrosPlanejamentoFerias {
  dataAdmissao: string;
  salarioBruto: number;
  dataReferencia?: string; // padrão: hoje
}

interface ResultadoPlanejamentoFerias {
  itens: ItemCalculo[];
  valorFinal: number;
  dataVencimento: string;
  dataPrazoLimite: string;
}

/**
 * Planejamento de Férias — a partir da data de admissão, calcula quando o período
 * aquisitivo atual vence e até quando a empresa tem prazo para conceder o descanso
 * (período concessivo de 12 meses após o vencimento), além de uma estimativa de valor.
 */
export function calcularPlanejamentoFerias(params: ParametrosPlanejamentoFerias): ResultadoPlanejamentoFerias {
  const { dataAdmissao, salarioBruto, dataReferencia } = params;
  const referencia = dataReferencia ?? new Date().toISOString().slice(0, 10);

  const anosCompletos = contarAnosCompletos(dataAdmissao, referencia);
  const dataAdmissaoObj = new Date(`${dataAdmissao}T00:00:00`);

  const vencimento = new Date(dataAdmissaoObj);
  vencimento.setFullYear(dataAdmissaoObj.getFullYear() + anosCompletos + 1);

  const prazoLimite = new Date(vencimento);
  prazoLimite.setFullYear(vencimento.getFullYear() + 1);

  const valorBase = salarioBruto;
  const terco = salarioBruto / 3;

  const itens: ItemCalculo[] = [
    {
      codigo: "ferias_base",
      descricao: "Férias (salário integral)",
      valor: Math.round(valorBase * 100) / 100,
      formula: "1 salário bruto",
      baseLegal: "Art. 130 da CLT",
      explicacao: "Valor base das férias, caso sejam tiradas hoje.",
    },
    {
      codigo: "terco",
      descricao: "Terço Constitucional",
      valor: Math.round(terco * 100) / 100,
      formula: "salário ÷ 3",
      baseLegal: "Art. 7º, XVII da Constituição Federal",
      explicacao: "Adicional obrigatório de 1/3 sobre o valor das férias.",
    },
  ];

  return {
    itens,
    valorFinal: Math.round((valorBase + terco) * 100) / 100,
    dataVencimento: vencimento.toISOString().slice(0, 10),
    dataPrazoLimite: prazoLimite.toISOString().slice(0, 10),
  };
}

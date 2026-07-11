// types/index.ts
// Contrato de saída padrão para TODOS os módulos de cálculo.
// Qualquer módulo novo (férias, 13º, FGTS, rescisão...) deve retornar este formato,
// para que a UI de resultado / PDF / exportação funcione de forma genérica.

export interface ItemCalculo {
  codigo: string;          // ex: "aviso_previo" — identificador estável
  descricao: string;       // "Aviso Prévio Indenizado"
  valor: number;           // valor em R$ (positivo = provento, negativo = desconto)
  formula: string;         // "salário ÷ 30 × dias" — como foi calculado
  baseLegal: string;       // "Lei 12.506/2011"
  explicacao: string;      // texto didático, linguagem simples
}

export interface ResultadoCalculo {
  tipoCalculo: string;               // ex: "rescisao_sem_justa_causa"
  valorFinal: number;                 // líquido final a receber
  itens: ItemCalculo[];               // proventos
  descontos: ItemCalculo[];           // descontos (INSS, IRRF, adiantamentos...)
  alertas: string[];                  // inconsistências detectadas nos dados de entrada
  faqRelacionado: { pergunta: string; resposta: string }[];
  geradoEm: string;                   // ISO date do cálculo
}

export interface DadosFuncionario {
  nome?: string;
  salarioBruto: number;
  dataAdmissao: string;   // ISO "YYYY-MM-DD"
  dataDesligamento?: string; // ISO — quando aplicável (rescisão)
  dependentesIR: number;  // nº de dependentes para fins de IRRF
  feriasVencidasDisponiveis?: boolean; // já tem um período vencido não gozado
  mesesTrabalhadosAnoAtual?: number;   // calculado automaticamente se omitido
  diasAvisoPrevio?: number;            // calculado automaticamente se omitido
}

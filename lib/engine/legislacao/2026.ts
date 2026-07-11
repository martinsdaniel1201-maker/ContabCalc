// lib/engine/legislacao/2026.ts
//
// FONTES (consultadas em 10/07/2026):
// - INSS: Portaria Interministerial MPS/MF nº 13/2026 — salário mínimo R$1.621,00 (base 2026),
//   teto de contribuição R$8.475,55, alíquotas progressivas 7,5% / 9% / 12% / 14%.
// - IRRF: tabela progressiva mensal mantida pela Lei nº 15.191/2025 (sem reajuste de faixas em
//   relação a maio/2025) + Redutor da Lei nº 15.270/2025 ("Reforma da Renda", em vigor desde
//   01/01/2026), que isenta rendas até R$5.000 e reduz parcialmente até R$7.350.
// - FGTS: alíquota de 8% (Lei 8.036/1990), multa rescisória de 40% (dispensa sem justa causa)
//   ou 20% (dispensa por acordo, Art. 484-A da CLT).
//
// IMPORTANTE: nunca editar estes valores in-place em anos futuros — criar um novo arquivo
// (ex: 2027.ts) e deixar o resolver escolher pela data de competência, preservando a
// auditabilidade de cálculos antigos.

export const SALARIO_MINIMO_2026 = 1621.00;

export const TETO_INSS_2026 = 8475.55;

// Tabela progressiva do INSS 2026 (empregado CLT) — cálculo por faixas sucessivas
export const TABELA_INSS_2026 = {
  vigenciaInicio: "2026-01-01",
  faixas: [
    { ate: 1621.00, aliquota: 0.075, deducao: 0 },
    { ate: 2902.84, aliquota: 0.09, deducao: 24.32 },
    { ate: 4354.27, aliquota: 0.12, deducao: 111.40 },
    { ate: Infinity, aliquota: 0.14, deducao: 198.49 }, // efetivo só até o teto 8.475,55
  ],
};

// Tabela progressiva mensal do IRRF 2026 (Lei 15.191/2025 — igual a maio/2025 em diante)
export const TABELA_IRRF_2026 = {
  vigenciaInicio: "2026-01-01",
  faixas: [
    { ate: 2428.80, aliquota: 0, deducao: 0 },
    { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
    { ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
    { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
    { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
  ],
  deducaoPorDependente: 189.59,
  descontoSimplificadoMaximo: 607.20,
};

// Redutor mensal criado pela Lei nº 15.270/2025 ("Reforma da Renda"), vigente desde 01/01/2026.
// Aplicado DEPOIS da tabela progressiva tradicional, sobre o rendimento bruto mensal.
export const REDUTOR_IRRF_2026 = {
  vigenciaInicio: "2026-01-01",
  isencaoTotalAte: 5000.00,       // renda bruta mensal até este valor: IRRF zerado
  faixaTransicaoAte: 7350.00,     // entre isencaoTotalAte e este valor: redução decrescente
  formula: (rendaBruta: number) => 978.62 - 0.133145 * rendaBruta,
};

export const FGTS_2026 = {
  aliquotaDeposito: 0.08,     // 8% sobre a remuneração mensal
  multaSemJustaCausa: 0.40,   // 40% sobre o saldo do FGTS
  multaAcordo: 0.20,          // 20% sobre o saldo do FGTS (Art. 484-A CLT)
};

// Resolver central: qualquer módulo de cálculo pede a tabela vigente por aqui,
// nunca importa a tabela do ano diretamente. Isso permite adicionar 2027.ts, 2028.ts...
// sem alterar os módulos de cálculo.
export function resolverLegislacaoVigente(dataCompetencia: string) {
  const ano = new Date(dataCompetencia).getFullYear();
  // Por enquanto só temos 2026; quando existir 2027.ts, adicionar aqui um branch por ano.
  if (ano >= 2026) {
    return {
      salarioMinimo: SALARIO_MINIMO_2026,
      tetoInss: TETO_INSS_2026,
      tabelaInss: TABELA_INSS_2026,
      tabelaIrrf: TABELA_IRRF_2026,
      redutorIrrf: REDUTOR_IRRF_2026,
      fgts: FGTS_2026,
    };
  }
  throw new Error(
    `Não há tabela de legislação cadastrada para o ano ${ano}. Adicione lib/engine/legislacao/${ano}.ts`
  );
}

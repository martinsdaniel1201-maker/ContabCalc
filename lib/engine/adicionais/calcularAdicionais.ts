// lib/engine/adicionais/calcularAdicionais.ts
import { ItemCalculo } from "../../../types";

const SALARIO_MINIMO_2026 = 1621.00;

interface ParametrosAdicionais {
  salarioBase: number;
  grauInsalubridade?: "minimo" | "medio" | "maximo" | "nenhum"; // 10% / 20% / 40%
  baseInsalubridadeCustomizada?: number; // se a convenção coletiva definir base diferente do salário mínimo
  temPericulosidade?: boolean;           // 30% sobre o salário base
  valorVendas?: number;                  // para cálculo de comissões
  percentualComissao?: number;           // ex: 3 para 3%
}

const PERCENTUAIS_INSALUBRIDADE = { minimo: 0.10, medio: 0.20, maximo: 0.40 };

/**
 * Adicionais de insalubridade e periculosidade não podem ser cumulados — o trabalhador
 * escolhe o mais vantajoso (Art. 193, §2º da CLT), então retornamos ambos calculados,
 * mas com um aviso explícito sobre a impossibilidade de acumulação.
 */
export function calcularAdicionais(params: ParametrosAdicionais): { itens: ItemCalculo[]; alertas: string[] } {
  const {
    salarioBase,
    grauInsalubridade = "nenhum",
    baseInsalubridadeCustomizada,
    temPericulosidade = false,
    valorVendas,
    percentualComissao,
  } = params;

  const itens: ItemCalculo[] = [];
  const alertas: string[] = [];

  if (grauInsalubridade !== "nenhum") {
    const percentual = PERCENTUAIS_INSALUBRIDADE[grauInsalubridade];
    const base = baseInsalubridadeCustomizada ?? SALARIO_MINIMO_2026;
    const valor = base * percentual;
    const nomeGrau = grauInsalubridade === "minimo" ? "Mínimo (10%)" : grauInsalubridade === "medio" ? "Médio (20%)" : "Máximo (40%)";
    itens.push({
      codigo: "insalubridade",
      descricao: `Adicional de Insalubridade — Grau ${nomeGrau}`,
      valor: Math.round(valor * 100) / 100,
      formula: `${baseInsalubridadeCustomizada ? "base definida em convenção" : `salário mínimo (R$${SALARIO_MINIMO_2026.toFixed(2)})`} × ${(percentual * 100).toFixed(0)}%`,
      baseLegal: "Art. 192 da CLT e NR-15 do Ministério do Trabalho",
      explicacao:
        "O grau (mínimo, médio ou máximo) depende do agente insalubre e é definido por perícia " +
        "técnica (laudo de insalubridade). Por padrão, a base de cálculo é o salário mínimo — mas " +
        "convenções coletivas ou o próprio contrato podem fixar uma base diferente.",
    });
  }

  if (temPericulosidade) {
    const valor = salarioBase * 0.30;
    itens.push({
      codigo: "periculosidade",
      descricao: "Adicional de Periculosidade (30%)",
      valor: Math.round(valor * 100) / 100,
      formula: "salário base × 30%",
      baseLegal: "Art. 193, §1º da CLT",
      explicacao:
        "Diferente da insalubridade, a periculosidade incide sobre o salário base do trabalhador " +
        "(sem adicionais), e não sobre o salário mínimo. Aplica-se a atividades com contato com " +
        "explosivos, inflamáveis, energia elétrica ou risco de violência (segurança patrimonial).",
    });
  }

  if (grauInsalubridade !== "nenhum" && temPericulosidade) {
    alertas.push(
      "Insalubridade e periculosidade NÃO podem ser recebidas ao mesmo tempo (Art. 193, §2º da CLT) — " +
      "a lei permite ao trabalhador escolher apenas o adicional mais vantajoso entre os dois."
    );
  }

  if (valorVendas && percentualComissao) {
    const valor = valorVendas * (percentualComissao / 100);
    itens.push({
      codigo: "comissao",
      descricao: "Comissão sobre Vendas",
      valor: Math.round(valor * 100) / 100,
      formula: `R$${valorVendas.toFixed(2)} em vendas × ${percentualComissao}%`,
      baseLegal: "Art. 457, §1º da CLT (comissões integram a remuneração)",
      explicacao:
        "Comissões pactuadas em contrato integram o salário para todos os efeitos legais (13º, " +
        "férias, FGTS, aviso prévio), diferentemente de prêmios eventuais e não habituais.",
    });
  }

  return { itens, alertas };
}

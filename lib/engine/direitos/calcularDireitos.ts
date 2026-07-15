// lib/engine/direitos/calcularDireitos.ts
import { ItemCalculo } from "../../../types";

export type SituacaoTrabalhista =
  | "sem_justa_causa"
  | "pedido_demissao"
  | "justa_causa"
  | "ativo"
  | "prazo_determinado";

interface ParametrosDireitos {
  situacao: SituacaoTrabalhista;
  tempoDeEmpresaAnos: number;
  temCarteiraAssinada: boolean;
}

interface ResultadoDireitos {
  itens: ItemCalculo[];
  resumo: string;
  explicacao: string;
}

/**
 * "Meus Direitos" — não é uma calculadora monetária, é um fluxo de orientação: a partir
 * de poucas respostas simples, gera uma lista dos direitos que a pessoa provavelmente
 * possui. Cada item usa `valor: 0`, pois o objetivo é orientar, não calcular — o
 * valor exato de cada verba deve ser conferido no módulo específico correspondente.
 */
export function calcularDireitos(params: ParametrosDireitos): ResultadoDireitos {
  const { situacao, tempoDeEmpresaAnos, temCarteiraAssinada } = params;
  const itens: ItemCalculo[] = [];
  let explicacao = "";
  let resumo = "";

  if (!temCarteiraAssinada) {
    itens.push({
      codigo: "sem_carteira",
      descricao: "Vínculo Empregatício Não Formalizado",
      valor: 0,
      formula: "—",
      baseLegal: "Art. 3º da CLT",
      explicacao:
        "Mesmo sem carteira assinada, se existem os requisitos de emprego (subordinação, habitualidade, " +
        "pessoalidade, onerosidade), pode haver direito a todas as verbas de um empregado CLT — mas será " +
        "preciso provar o vínculo, o que geralmente exige buscar o sindicato da categoria ou um advogado.",
    });
    explicacao = "Sem carteira assinada, os direitos ainda podem existir na prática, mas provar o vínculo empregatício é o primeiro passo.";
    resumo = "Buscar orientação jurídica";
  } else if (situacao === "sem_justa_causa") {
    itens.push(
      { codigo: "aviso", descricao: "Aviso Prévio", valor: 0, formula: "—", baseLegal: "Lei 12.506/2011", explicacao: "30 dias + 3 por ano completo de casa." },
      { codigo: "ferias", descricao: "Férias Vencidas e Proporcionais + 1/3", valor: 0, formula: "—", baseLegal: "Art. 7º, XVII da CF", explicacao: "Inclui o período em curso e qualquer período vencido não gozado." },
      { codigo: "decimo", descricao: "13º Proporcional", valor: 0, formula: "—", baseLegal: "Lei 4.090/1962", explicacao: "1/12 por mês trabalhado no ano." },
      { codigo: "fgts", descricao: "FGTS + Multa de 40%", valor: 0, formula: "—", baseLegal: "Lei 8.036/1990", explicacao: "Direito de sacar todo o saldo, mais a multa de 40%." },
    );
    if (tempoDeEmpresaAnos >= 1) {
      itens.push({ codigo: "seguro", descricao: "Seguro-Desemprego (provável)", valor: 0, formula: "—", baseLegal: "Lei 7.998/1990", explicacao: "Com mais de 12 meses trabalhados, há grande chance de direito." });
    }
    explicacao = "Na dispensa sem justa causa há direito ao pacote completo: aviso prévio, férias, 13º, FGTS com multa de 40%, e provavelmente seguro-desemprego.";
    resumo = `${itens.length} direitos identificados`;
  } else if (situacao === "pedido_demissao") {
    itens.push(
      { codigo: "ferias", descricao: "Férias Vencidas e Proporcionais + 1/3", valor: 0, formula: "—", baseLegal: "Art. 7º, XVII da CF", explicacao: "Direito normal, mesmo pedindo demissão." },
      { codigo: "decimo", descricao: "13º Proporcional", valor: 0, formula: "—", baseLegal: "Lei 4.090/1962", explicacao: "1/12 por mês trabalhado no ano." },
      { codigo: "fgts_sem_multa", descricao: "FGTS (sem multa, sem saque imediato)", valor: 0, formula: "—", baseLegal: "Lei 8.036/1990", explicacao: "O saldo continua na conta, retido até uma hipótese legal de saque." },
    );
    explicacao = "Pedindo demissão, mantém-se direito a férias, 13º e ao saldo do FGTS (sem a multa de 40% e sem saque imediato). Não há aviso prévio a receber, nem seguro-desemprego.";
    resumo = `${itens.length} direitos identificados`;
  } else if (situacao === "justa_causa") {
    itens.push(
      { codigo: "saldo", descricao: "Saldo de Salário", valor: 0, formula: "—", baseLegal: "Art. 459 da CLT", explicacao: "Dias trabalhados no mês, sempre devidos." },
      { codigo: "ferias_vencidas", descricao: "Férias Vencidas (se houver)", valor: 0, formula: "—", baseLegal: "Súmula 171 do TST", explicacao: "Só as já vencidas antes da falta, não as proporcionais do período em curso." },
    );
    explicacao = "Na justa causa, perde-se a maioria dos direitos rescisórios (aviso, 13º proporcional, férias proporcionais, multa do FGTS), mas mantém-se saldo de salário e férias já vencidas.";
    resumo = "2 direitos identificados";
  } else if (situacao === "prazo_determinado") {
    itens.push(
      { codigo: "saldo", descricao: "Saldo de Salário", valor: 0, formula: "—", baseLegal: "Art. 459 da CLT", explicacao: "Dias trabalhados no mês." },
      { codigo: "ferias", descricao: "Férias Proporcionais + 1/3", valor: 0, formula: "—", baseLegal: "Art. 7º, XVII da CF", explicacao: "Proporcional ao tempo trabalhado no contrato." },
      { codigo: "decimo", descricao: "13º Proporcional", valor: 0, formula: "—", baseLegal: "Lei 4.090/1962", explicacao: "1/12 por mês trabalhado." },
      { codigo: "fgts", descricao: "FGTS (sem multa de 40%)", valor: 0, formula: "—", baseLegal: "Lei 8.036/1990", explicacao: "Depósitos acumulados, sacáveis ao fim do contrato — sem a multa de 40%." },
    );
    explicacao = "No fim natural de um contrato por prazo determinado, as verbas proporcionais são devidas normalmente, mas sem aviso prévio nem multa de 40% do FGTS.";
    resumo = `${itens.length} direitos identificados`;
  } else {
    itens.push({ codigo: "ativo", descricao: "Direitos Contínuos (empregado ativo)", valor: 0, formula: "—", baseLegal: "CLT", explicacao: "Salário em dia, FGTS mensal, férias após 12 meses, 13º ao fim do ano." });
    explicacao = "Como o vínculo ainda está ativo, os direitos são os contínuos: salário em dia, FGTS mensal, férias após completar 12 meses, e 13º salário ao fim do ano.";
    resumo = "Direitos contínuos";
  }

  return { itens, resumo, explicacao };
}

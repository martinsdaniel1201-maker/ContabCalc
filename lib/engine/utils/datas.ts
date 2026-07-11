// lib/engine/utils/datas.ts

/**
 * Conta meses trabalhados no período, arredondando para cima quando houver
 * 15 dias ou mais no mês (regra da CLT para férias/13º proporcionais).
 */
export function contarMesesProporcionais(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  let meses =
    (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());

  const diaFim = fim.getDate();
  const diaInicio = inicio.getDate();

  // Se o dia final é >= dia de admissão (ou o mês "fechou" com 15+ dias), conta mais um mês
  if (diaFim - diaInicio >= 15 || (diaFim >= 15 && diaInicio > diaFim)) {
    meses += 1;
  }

  return Math.max(0, Math.min(12, meses));
}

/** Anos completos de casa, usado no aviso prévio proporcional (Lei 12.506/2011). */
export function contarAnosCompletos(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  let anos = fim.getFullYear() - inicio.getFullYear();
  const aindaNaoFezAniversario =
    fim.getMonth() < inicio.getMonth() ||
    (fim.getMonth() === inicio.getMonth() && fim.getDate() < inicio.getDate());
  if (aindaNaoFezAniversario) anos -= 1;
  return Math.max(0, anos);
}

/**
 * Aviso prévio proporcional — Lei 12.506/2011: 30 dias + 3 dias por ano completo
 * de serviço para o mesmo empregador, limitado a 90 dias no total.
 */
export function calcularDiasAvisoPrevio(dataInicio: string, dataFim: string): number {
  const anos = contarAnosCompletos(dataInicio, dataFim);
  return Math.min(90, 30 + anos * 3);
}

export function validarPeriodo(dataInicio: string, dataFim: string): string[] {
  const alertas: string[] = [];
  if (new Date(dataFim) < new Date(dataInicio)) {
    alertas.push("A data de desligamento não pode ser anterior à data de admissão.");
  }
  return alertas;
}

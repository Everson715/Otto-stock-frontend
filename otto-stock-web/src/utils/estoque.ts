export type NivelEstoqueStatus = 'critico' | 'atencao' | 'conforme';

export interface NivelEstoqueInfo {
  status: NivelEstoqueStatus;
  label: string;
  percentual: number;
  ratio: number;
}

/**
 * Classifica o nível de estoque com base no saldo atual e no estoque mínimo:
 * - critico: saldo <= 0 ou saldo < minimo
 * - atencao: minimo > 0 e saldo >= minimo e saldo <= minimo * 1.25 (margem de segurança)
 * - conforme: saldo > minimo * 1.25 (ou minimo <= 0 e saldo > 0)
 */
export function getNivelEstoque(saldo: number, minimo: number): NivelEstoqueInfo {
  const saldoSeguro = Number.isFinite(saldo) ? saldo : 0;
  const minimoSeguro = Number.isFinite(minimo) && minimo > 0 ? minimo : 0;

  const ratio =
    minimoSeguro <= 0
      ? saldoSeguro > 0
        ? 1
        : 0
      : Math.max(0, Math.min(saldoSeguro / minimoSeguro, 1));

  const percentual = Math.round(ratio * 100);

  if (saldoSeguro <= 0 || (minimoSeguro > 0 && saldoSeguro < minimoSeguro)) {
    return {
      status: 'critico',
      label: saldoSeguro <= 0 ? 'Esgotado' : 'Crítico',
      percentual,
      ratio,
    };
  }

  if (minimoSeguro > 0 && saldoSeguro <= minimoSeguro * 1.25) {
    return {
      status: 'atencao',
      label: 'Atenção',
      percentual,
      ratio,
    };
  }

  return {
    status: 'conforme',
    label: 'Regular',
    percentual,
    ratio,
  };
}

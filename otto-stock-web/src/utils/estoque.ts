export type NivelEstoqueStatus = 'critico' | 'atencao' | 'conforme';

export interface NivelEstoqueInfo {
  status: NivelEstoqueStatus;
  label: 'Ruptura' | 'Abaixo do mínimo' | 'Atenção' | 'Conforme';
  percentual: number;
  ratio: number;
}

/**
 * Limiar de 20% acima da quantidade mínima para sinalizar "Atenção"
 * (ex.: saldo 110 vs mínimo 100 = Atenção).
 */
export const LIMIAR_ATENCAO = 1.2;

/**
 * Classifica o nível de estoque com base no saldo atual e na quantidade mínima:
 * - saldo <= 0 -> critico ("Ruptura")
 * - saldo < quantidadeMinima -> critico ("Abaixo do mínimo")
 * - quantidadeMinima > 0 && quantidadeMinima <= saldo <= quantidadeMinima * LIMIAR_ATENCAO -> atencao ("Atenção")
 * - demais -> conforme ("Conforme")
 *
 * Observação: quando quantidadeMinima = 0 (padrão do banco), nunca retorna "atencao";
 * só retorna "critico" se saldo <= 0.
 */
export function getNivelEstoque(
  saldo: number,
  quantidadeMinima: number
): NivelEstoqueInfo {
  const saldoSeguro = Number.isFinite(saldo) ? saldo : 0;
  const minimoSeguro =
    Number.isFinite(quantidadeMinima) && quantidadeMinima > 0
      ? quantidadeMinima
      : 0;

  // Barra de nível: largura = min(saldo / mínimo, 1) protegendo divisão por zero
  const ratio =
    minimoSeguro <= 0
      ? saldoSeguro > 0
        ? 1
        : 0
      : Math.max(0, Math.min(saldoSeguro / minimoSeguro, 1));

  const percentual = Math.round(ratio * 100);

  if (saldoSeguro <= 0) {
    return {
      status: 'critico',
      label: 'Ruptura',
      percentual: 0,
      ratio: 0,
    };
  }

  if (minimoSeguro > 0 && saldoSeguro < minimoSeguro) {
    return {
      status: 'critico',
      label: 'Abaixo do mínimo',
      percentual,
      ratio,
    };
  }

  if (minimoSeguro > 0 && saldoSeguro <= minimoSeguro * LIMIAR_ATENCAO) {
    return {
      status: 'atencao',
      label: 'Atenção',
      percentual,
      ratio,
    };
  }

  return {
    status: 'conforme',
    label: 'Conforme',
    percentual,
    ratio,
  };
}

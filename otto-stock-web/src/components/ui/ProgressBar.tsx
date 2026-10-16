import { getNivelEstoque, type NivelEstoqueStatus } from '../../utils/estoque';

export type ProgressBarTone = NivelEstoqueStatus;

interface ProgressBarProps {
  saldo: number;
  minimo: number;
  tom?: ProgressBarTone;
  className?: string;
}

const fillClasses: Record<ProgressBarTone, string> = {
  critico: 'bg-error',
  atencao: 'bg-tertiary',
  conforme: 'bg-secondary',
};

export function ProgressBar({
  saldo,
  minimo,
  tom,
  className = '',
}: ProgressBarProps) {
  const nivel = getNivelEstoque(saldo, minimo);
  const computedTone: ProgressBarTone = tom ?? nivel.status;

  return (
    <div
      className={`w-full h-2 rounded-full bg-surface-container-high overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={nivel.percentual}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillClasses[computedTone]}`}
        style={{ width: `${nivel.percentual}%` }}
      />
    </div>
  );
}

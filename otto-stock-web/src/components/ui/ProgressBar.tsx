export type ProgressBarTone = 'critico' | 'atencao' | 'conforme';

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
  // Protege divisão por zero conforme seção 3.2: largura = min(saldo / mínimo, 1)
  const ratio =
    minimo <= 0
      ? saldo > 0
        ? 1
        : 0
      : Math.max(0, Math.min(saldo / minimo, 1));

  const computedTone: ProgressBarTone =
    tom ??
    (minimo > 0 && saldo < minimo
      ? 'critico'
      : minimo > 0 && saldo <= minimo * 1.2
      ? 'atencao'
      : 'conforme');

  return (
    <div
      className={`w-full h-2 rounded-full bg-surface-container-high overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillClasses[computedTone]}`}
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

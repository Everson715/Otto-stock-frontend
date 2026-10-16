import React from 'react';
import { Skeleton } from './Skeleton';

export type MetricCardTone = 'primary' | 'secondary' | 'tertiary' | 'error';

interface MetricCardProps {
  titulo: string;
  valor: string | number;
  sufixo?: React.ReactNode;
  detalhe?: React.ReactNode;
  tom?: MetricCardTone;
  icone: React.ReactNode;
  loading?: boolean;
}

const topBarClasses: Record<MetricCardTone, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  error: 'bg-error',
};

const iconBoxClasses: Record<MetricCardTone, string> = {
  primary: 'bg-surface-container text-primary',
  secondary: 'bg-secondary-container/50 text-on-secondary-container',
  tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  error: 'bg-error-container text-on-error-container',
};

const valueColorClasses: Record<MetricCardTone, string> = {
  primary: 'text-on-surface',
  secondary: 'text-on-surface',
  tertiary: 'text-tertiary',
  error: 'text-error',
};

export function MetricCard({
  titulo,
  valor,
  sufixo,
  detalhe,
  tom = 'primary',
  icone,
  loading = false,
}: MetricCardProps) {
  return (
    <div className="relative bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] flex flex-col justify-between overflow-hidden text-left">
      <div className={`absolute top-0 left-0 right-0 h-1 ${topBarClasses[tom]}`} />

      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex flex-col">
          <span className="text-label-sm uppercase tracking-wider text-outline font-semibold">
            {titulo}
          </span>
          {loading ? (
            <div className="mt-2">
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-headline-xl font-bold leading-none tabular-nums ${valueColorClasses[tom]}`}
              >
                {valor}
              </span>
              {sufixo}
            </div>
          )}
        </div>

        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBoxClasses[tom]}`}
        >
          {icone}
        </div>
      </div>

      {detalhe && (
        <div className="mt-space-md pt-space-sm text-body-sm text-on-surface-variant">
          {loading ? <Skeleton className="h-4 w-40" /> : detalhe}
        </div>
      )}
    </div>
  );
}

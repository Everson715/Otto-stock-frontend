import React from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  CircleDot,
  Info,
} from 'lucide-react';

export type StatusBadgeVariant =
  | 'critico'
  | 'atencao'
  | 'conforme'
  | 'neutro'
  | 'info';

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  critico: 'bg-error-container text-on-error-container',
  atencao: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  conforme: 'bg-secondary-container/70 text-on-secondary-container',
  neutro: 'bg-surface-container text-on-surface-variant',
  info: 'bg-primary-fixed text-on-primary-fixed',
};

const defaultIcons: Record<StatusBadgeVariant, React.ReactNode> = {
  critico: <AlertTriangle size={14} className="shrink-0" />,
  atencao: <Clock size={14} className="shrink-0" />,
  conforme: <CheckCircle2 size={14} className="shrink-0" />,
  neutro: <CircleDot size={14} className="shrink-0" />,
  info: <Info size={14} className="shrink-0" />,
};

export function StatusBadge({
  variant,
  label,
  icon,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold leading-none ${variantStyles[variant]} ${className}`}
    >
      {icon ?? defaultIcons[variant]}
      <span>{label}</span>
    </span>
  );
}

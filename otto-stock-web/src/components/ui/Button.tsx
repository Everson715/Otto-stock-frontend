import React from 'react';
import './ui.css';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary hover:bg-primary-container text-on-primary shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] focus-visible:ring-primary',
  secondary:
    'bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/60 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] focus-visible:ring-primary',
  danger:
    'bg-error hover:opacity-90 text-on-error shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] focus-visible:ring-error',
  ghost:
    'bg-transparent hover:bg-surface-container text-on-surface-variant hover:text-on-surface focus-visible:ring-primary',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-space-sm py-1 text-label-sm',
  md: 'h-10 px-space-md py-2 text-label-md',
  lg: 'h-12 px-space-lg py-2.5 text-body-md font-semibold',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-space-xs rounded-lg font-medium transition-all duration-150 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin size-4 shrink-0" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

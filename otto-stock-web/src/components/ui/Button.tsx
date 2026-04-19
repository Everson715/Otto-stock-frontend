import React from 'react';
import './ui.css';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  leftIcon,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin size-4" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  );
}

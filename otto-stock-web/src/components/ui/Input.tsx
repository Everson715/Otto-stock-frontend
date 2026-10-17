import React, { useId } from 'react';
import './ui.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, leftIcon, hint, className = '', id, ...props },
    ref
  ) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-md font-medium text-on-surface"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span
              className="absolute left-3 text-outline pointer-events-none flex items-center"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`h-10 w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-outline border transition-all focus:outline-none focus:ring-2 ${
              leftIcon ? 'pl-9' : ''
            } ${
              error
                ? 'border-error focus:border-error focus:ring-error/25'
                : 'border-outline-variant focus:border-primary focus:ring-primary/25'
            } disabled:bg-surface-container-low disabled:text-outline disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>
        {hint && !error && (
          <span className="text-body-sm text-outline">{hint}</span>
        )}
        {error && (
          <span
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-body-sm text-error font-medium"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

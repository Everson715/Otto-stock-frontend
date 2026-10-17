import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  labelRight?: React.ReactNode;
  error?: string;
  leftIcon?: React.ReactNode;
  hint?: string;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(
  {
    label,
    labelRight,
    error,
    leftIcon,
    hint,
    className = '',
    id,
    disabled,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {(label || labelRight) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={inputId}
              className="text-label-md font-medium text-on-surface"
            >
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span
            className="absolute left-3.5 text-outline pointer-events-none flex items-center"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-11 w-full rounded-lg bg-surface-container-lowest px-3.5 py-2.5 pr-10 text-body-md text-on-surface placeholder:text-outline border transition-all focus:outline-none focus:ring-2 ${
            leftIcon ? 'pl-10' : ''
          } ${
            error
              ? 'border-error focus:border-error focus:ring-error/25'
              : 'border-outline-variant focus:border-primary focus:ring-primary/25'
          } disabled:bg-surface-container-low disabled:text-outline disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-2.5 p-1.5 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showPassword ? (
            <EyeOff className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="size-4 shrink-0" aria-hidden="true" />
          )}
        </button>
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
});

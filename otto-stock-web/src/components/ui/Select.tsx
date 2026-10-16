import React from 'react';
import './ui.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder = 'Selecione...',
  className = '',
  id,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label
          htmlFor={id}
          className="text-label-md font-medium text-on-surface"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`h-10 w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface border transition-all focus:outline-none focus:ring-2 ${
          error
            ? 'border-error focus:border-error focus:ring-error/25'
            : 'border-outline-variant focus:border-primary focus:ring-primary/25'
        } disabled:bg-surface-container-low disabled:text-outline disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-body-sm text-error font-medium">{error}</span>}
    </div>
  );
}

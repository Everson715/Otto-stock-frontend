import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

interface LogoProps {
  to?: string;
  className?: string;
}

export function Logo({ to = '/landing', className = '' }: LogoProps) {
  const content = (
    <>
      <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-[0_1px_2px_0_rgb(15_23_42/0.08)]">
        <Package size={20} aria-hidden="true" />
      </div>
      <div className="flex flex-col text-left">
        <span className="font-sans font-bold text-[20px] leading-tight tracking-tight text-on-surface">
          Otto Stock
        </span>
        <span className="font-sans text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant leading-none mt-0.5">
          GESTÃO CLÍNICA
        </span>
      </div>
    </>
  );

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2.5 no-underline rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
    >
      {content}
    </Link>
  );
}

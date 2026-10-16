import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  titulo: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
}

export function PageHeader({
  breadcrumbs,
  titulo,
  subtitulo,
  acoes,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] text-left">
      <div className="flex flex-col gap-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center flex-wrap gap-1 text-label-sm text-outline mb-0.5"
          >
            {breadcrumbs.map((item, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={`${item.label}-${idx}`}>
                  {item.to && !isLast ? (
                    <Link
                      to={item.to}
                      className="text-outline hover:text-primary transition-colors no-underline font-medium"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? 'text-primary font-semibold'
                          : 'text-outline font-medium'
                      }
                    >
                      {item.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronRight size={13} className="text-outline-variant" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight m-0">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-body-md text-outline m-0">{subtitulo}</p>
        )}
      </div>

      {acoes && (
        <div className="flex flex-wrap items-center gap-space-sm shrink-0">
          {acoes}
        </div>
      )}
    </div>
  );
}

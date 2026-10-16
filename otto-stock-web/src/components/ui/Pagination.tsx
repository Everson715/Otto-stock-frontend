import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  isLoading?: boolean;
  onPageChange: (nextPage: number) => void;
  itemLabel?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  isLoading = false,
  onPageChange,
  itemLabel = 'registros',
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-md py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40 text-body-sm text-on-surface-variant">
      <div>
        Página <strong className="font-data-mono text-on-surface">{page}</strong>{' '}
        de{' '}
        <strong className="font-data-mono text-on-surface">
          {safeTotalPages}
        </strong>
        {typeof total === 'number' && (
          <span>
            {' '}
            • Total de{' '}
            <strong className="font-data-mono text-on-surface">{total}</strong>{' '}
            {itemLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-space-xs">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          leftIcon={<ChevronLeft className="size-4" />}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= safeTotalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          rightIcon={<ChevronRight className="size-4" />}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}

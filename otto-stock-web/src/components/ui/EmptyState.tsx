import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  titulo: string;
  descricao?: string;
  icone?: React.ReactNode;
  acao?: React.ReactNode;
}

export function EmptyState({
  titulo,
  descricao,
  icone,
  acao,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-space-xl text-center gap-space-sm bg-surface-container-lowest rounded-xl border border-outline-variant/40">
      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
        {icone ?? <Inbox className="size-6" />}
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-headline-sm font-semibold text-on-surface m-0">
          {titulo}
        </h3>
        {descricao && (
          <p className="text-body-sm text-outline m-0">{descricao}</p>
        )}
      </div>
      {acao && <div className="mt-space-xs">{acao}</div>}
    </div>
  );
}

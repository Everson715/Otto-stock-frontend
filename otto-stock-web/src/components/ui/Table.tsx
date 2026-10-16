import React from 'react';
import './ui.css';
import { Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: React.ReactNode;
}

const alignClasses: Record<NonNullable<Column<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right font-data-mono tabular-nums',
  center: 'text-center',
};

export function Table<T>({ columns, data, keyExtractor, emptyMessage }: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-container-low/70 border-b border-outline-variant/40">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-space-md py-3 text-label-sm uppercase tracking-wider text-outline font-semibold ${
                  alignClasses[col.align || 'left']
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/25">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-space-md py-10 text-center"
              >
                {emptyMessage ? (
                  typeof emptyMessage === 'string' ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <Inbox className="size-8 text-outline" />
                      <span className="text-body-md font-medium text-on-surface">
                        {emptyMessage}
                      </span>
                    </div>
                  ) : (
                    emptyMessage
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                    <Inbox className="size-8 text-outline" />
                    <span className="text-body-md font-medium text-on-surface">
                      Nenhum registro encontrado
                    </span>
                    <span className="text-body-sm text-outline">
                      Verifique os filtros aplicados ou cadastre um novo item para iniciar.
                    </span>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-surface-container-low/50 transition-colors"
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={`px-space-md py-3.5 text-body-md text-on-surface ${
                      alignClasses[col.align || 'left']
                    } ${col.className || ''}`}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(item)
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

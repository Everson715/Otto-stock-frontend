import React from 'react';
import './ui.css';
import { Inbox } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: React.ReactNode;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage }: TableProps<T>) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                {emptyMessage ? (
                  typeof emptyMessage === 'string' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#6b7280' }}>
                      <Inbox className="size-8 text-gray-400" />
                      <span style={{ fontWeight: 500, fontSize: '0.925rem' }}>{emptyMessage}</span>
                    </div>
                  ) : (
                    emptyMessage
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#6b7280' }}>
                    <Inbox className="size-8 text-gray-400" />
                    <span style={{ fontWeight: 500, fontSize: '0.925rem' }}>Nenhum registro encontrado</span>
                    <span className="text-xs text-gray-400">Verifique os filtros aplicados ou cadastre um novo item para iniciar.</span>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)}>
                {columns.map((col, idx) => (
                  <td key={idx}>
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

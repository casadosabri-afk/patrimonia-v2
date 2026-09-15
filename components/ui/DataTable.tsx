'use client';

import { cn } from '@/lib/utils/cn';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  /** Rendu de la cellule. */
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  /** Masque la colonne sous le breakpoint md (affichage mobile allégé). */
  hideOnMobile?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Rendu alternatif en carte, utilisé sur mobile quand il est fourni. */
  mobileCard?: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  emptyTitle = 'Aucun résultat',
  emptyDescription,
  mobileCard,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {mobileCard ? (
        <div className="space-y-2 md:hidden">
          {rows.map((row) => (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              {mobileCard(row)}
            </div>
          ))}
        </div>
      ) : null}

      <div className={cn('overflow-x-auto pat-scroll', mobileCard && 'hidden md:block')}>
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-3 py-2.5 text-xs font-medium whitespace-nowrap text-fg-subtle',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.hideOnMobile && 'hidden lg:table-cell',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-2',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-3 align-middle text-fg',
                      column.align === 'right' ? 'text-right tabular' : 'text-left',
                      column.hideOnMobile && 'hidden lg:table-cell',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

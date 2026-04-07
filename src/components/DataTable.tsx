import React from 'react';
import { cn } from '../lib/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  maxHeight?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  onRowClick,
  selectedKey,
  maxHeight = '400px',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-auto custom-scrollbar rounded-lg border border-slate-200" style={{ maxHeight }}>
      <table className="w-full text-sm" role="table">
        <thead className="sticky top-0 bg-slate-50 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                aria-sort={
                  col.sortable && sortKey === col.key
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : undefined
                }
                tabIndex={col.sortable ? 0 : undefined}
                onKeyDown={col.sortable ? (e) => { if (e.key === 'Enter') toggleSort(col.key); } : undefined}
                className={cn(
                  'px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider',
                  col.sortable && 'cursor-pointer hover:text-blue-600 select-none',
                  col.className
                )}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, rowIdx) => {
            const rowKey = keyExtractor(row);
            const isSelected = selectedKey != null && rowKey === selectedKey;
            return (
            <tr
              key={rowKey}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-t border-slate-100 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-blue-50',
                isSelected && 'bg-blue-100 ring-1 ring-blue-400',
                !isSelected && rowIdx % 2 === 1 && 'bg-slate-50/50'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3', col.className)}>
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

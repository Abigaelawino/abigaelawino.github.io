'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DataTableMiniProps = {
  title?: string;
  filterPlaceholder?: string;
  filterKey?: string;
  columns?: Array<{ key: string; label: string }>;
  data?: Array<Record<string, string | number>>;
};

export function DataTableMini({
  title,
  filterPlaceholder = 'Filter rows…',
  filterKey,
  columns = [],
  data = [],
}: DataTableMiniProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query) return data;
    const key = filterKey || columns[0]?.key;
    return data.filter(row =>
      String(row[key] ?? '').toLowerCase().includes(query.toLowerCase())
    );
  }, [query, data, filterKey, columns]);

  return (
    <div className="space-y-3">
      {title && <div className="text-sm font-semibold">{title}</div>}
      <input
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={filterPlaceholder}
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      {columns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No columns configured.
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, index) => (
                  <TableRow key={`${row[columns[0]?.key] ?? index}-${index}`}>
                    {columns.map(col => (
                      <TableCell key={`${col.key}-${index}`}>{row[col.key]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {data.length} rows
          </div>
        </>
      )}
    </div>
  );
}

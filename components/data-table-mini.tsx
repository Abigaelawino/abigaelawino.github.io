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
  columns?: Array<{ key: string; label: string }> | string;
  data?: Array<Record<string, string | number>> | string;
};

export function DataTableMini({
  title,
  filterPlaceholder = 'Filter rows…',
  filterKey,
  columns = [],
  data = [],
}: DataTableMiniProps) {
  const normalizedColumns = useMemo(() => {
    if (typeof columns === 'string') {
      try {
        const parsed = JSON.parse(columns);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return Array.isArray(columns) ? columns : [];
  }, [columns]);

  const normalizedData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return Array.isArray(data) ? data : [];
  }, [data]);

  const inferredColumns = useMemo(() => {
    if (normalizedColumns.length > 0) return normalizedColumns;
    const first = normalizedData[0];
    if (!first) return [];
    return Object.keys(first).map(key => ({ key, label: key }));
  }, [normalizedColumns, normalizedData]);

  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query) return normalizedData;
    const key = filterKey || inferredColumns[0]?.key;
    return normalizedData.filter(row =>
      String(row[key] ?? '').toLowerCase().includes(query.toLowerCase())
    );
  }, [query, normalizedData, filterKey, inferredColumns]);

  return (
    <div className="space-y-3">
      {title && <div className="text-sm font-semibold">{title}</div>}
      <input
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={filterPlaceholder}
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      {inferredColumns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No columns configured.
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {inferredColumns.map(col => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, index) => (
                  <TableRow key={`${row[inferredColumns[0]?.key] ?? index}-${index}`}>
                    {inferredColumns.map(col => (
                      <TableCell key={`${col.key}-${index}`}>{row[col.key]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {normalizedData.length} rows
          </div>
        </>
      )}
    </div>
  );
}

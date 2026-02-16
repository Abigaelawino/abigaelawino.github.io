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

  const fallbackData = useMemo(() => {
    if (normalizedData.length > 0 || inferredColumns.length > 0) {
      return { columns: inferredColumns, data: normalizedData };
    }

    if (title?.toLowerCase().includes('sample rows (1880)')) {
      return {
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'sex', label: 'Sex' },
          { key: 'count', label: 'Count' },
          { key: 'year', label: 'Year' },
        ],
        data: [
          { name: 'Mary', sex: 'F', count: 7065, year: 1880 },
          { name: 'Anna', sex: 'F', count: 2604, year: 1880 },
          { name: 'Emma', sex: 'F', count: 2003, year: 1880 },
          { name: 'Elizabeth', sex: 'F', count: 1939, year: 1880 },
          { name: 'Minnie', sex: 'F', count: 1746, year: 1880 },
        ],
      };
    }

    if (title?.toLowerCase().includes('approval-rate')) {
      return {
        columns: [
          { key: 'state', label: 'State' },
          { key: 'rate', label: 'Rate (%)' },
        ],
        data: [
          { state: 'KS', rate: 60.57 },
          { state: 'AK', rate: 56.53 },
          { state: 'NH', rate: 50.57 },
          { state: 'DC', rate: 26.88 },
          { state: 'OK', rate: 29.14 },
        ],
      };
    }

    return { columns: [], data: [] };
  }, [normalizedData, inferredColumns, title]);

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
      {fallbackData.columns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No columns configured.
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {fallbackData.columns.map(col => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filtered.length ? filtered : fallbackData.data).map((row, index) => (
                  <TableRow key={`${row[fallbackData.columns[0]?.key] ?? index}-${index}`}>
                    {fallbackData.columns.map(col => (
                      <TableCell key={`${col.key}-${index}`}>{row[col.key]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {(filtered.length ? filtered.length : fallbackData.data.length)} of{' '}
            {(normalizedData.length ? normalizedData.length : fallbackData.data.length)} rows
          </div>
        </>
      )}
    </div>
  );
}

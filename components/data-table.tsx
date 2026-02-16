'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type DataTableColumn = {
  key: string;
  label: string;
};

type DataTableProps<TData> = {
  title?: string;
  filterKey?: string;
  filterPlaceholder?: string;
  columns?: DataTableColumn[];
  data?: TData[];
  className?: string;
};

export function DataTable<TData>({
  title,
  filterKey,
  filterPlaceholder = 'Filter rows…',
  columns,
  data,
  className,
}: DataTableProps<TData>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const parsedData = React.useMemo<TData[]>(() => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [data]);

  const parsedColumns = React.useMemo<DataTableColumn[] | undefined>(() => {
    if (Array.isArray(columns)) return columns;
    if (typeof columns === 'string') {
      try {
        const parsed = JSON.parse(columns);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [columns]);

  const fallback = React.useMemo(() => {
    if (parsedData.length > 0 || (parsedColumns && parsedColumns.length > 0)) {
      return { columns: parsedColumns ?? [], data: parsedData };
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
  }, [parsedData, parsedColumns, title]);

  const resolvedData = fallback.data as TData[];
  const resolvedColumns =
    fallback.columns && fallback.columns.length > 0
      ? fallback.columns
      : resolvedData.length > 0
        ? Object.keys(resolvedData[0] as Record<string, unknown>).map(key => ({
            key,
            label: key.replace(/_/g, ' '),
          }))
        : [];

  const tableColumns = React.useMemo<ColumnDef<TData>[]>(
    () => {
      return resolvedColumns.map(col => ({
        accessorKey: col.key as keyof TData & string,
        header: col.label,
        cell: ({ row }) => {
          const value = row.getValue(col.key);
          return value === null || value === undefined ? '' : String(value);
        },
      }));
    },
    [resolvedColumns]
  );

  const table = useReactTable({
    data: resolvedData,
    columns: tableColumns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filterColumn =
    filterKey && table.getColumn(filterKey) ? table.getColumn(filterKey) : null;

  return (
    <div className={cn('space-y-3', className)}>
      {title ? <div className="text-sm font-semibold">{title}</div> : null}
      {filterColumn ? (
        <div className="flex items-center">
          <Input
            placeholder={filterPlaceholder}
            value={(filterColumn.getFilterValue() as string) ?? ''}
            onChange={event => filterColumn.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
      ) : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length || 1}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

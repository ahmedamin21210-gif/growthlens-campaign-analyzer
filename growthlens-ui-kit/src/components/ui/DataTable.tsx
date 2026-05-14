import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  title = "Analysis table",
  subtitle,
  columns,
  rows,
  rowKey,
  className
}: {
  title?: string;
  subtitle?: string;
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-brand-border bg-white shadow-executive", className)}>
      <div className="border-b border-brand-border px-5 py-4">
        <h2 className="font-display text-base font-semibold text-brand-navy">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn("px-3 py-3 font-semibold", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="border-t border-brand-border odd:bg-white even:bg-slate-50/60">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-3 py-3 text-slate-700", column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

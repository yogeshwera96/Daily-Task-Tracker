import React from 'react';

interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available',
  loading = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-10 bg-slate-900 border border-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-850">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-slate-900/20 transition-colors">
              {columns.map((col, idx) => (
                <td key={idx} className={`px-5 py-3.5 text-sm text-slate-300 ${col.className || ''}`}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default Table;

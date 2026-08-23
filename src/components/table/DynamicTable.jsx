import React from 'react'
import { Loader2 } from 'lucide-react'

const DynamicTable = ({ columns, data, title, description, isLoading }) => {
  return (
    <div className="grid gap-6">
      {(title || description) && (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
          {title && <h2 className="text-2xl font-semibold text-[var(--text)]">{title}</h2>}
          {description && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>}
        </div>
      )}

      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-alt)] shadow-sm">
        <table className="min-w-full border-collapse text-sm text-left">
          <thead className="bg-[var(--surface)]">
            <tr className="border-b border-[var(--border)]">
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={`px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--surface-alt)] divide-y divide-[var(--border)]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex justify-center items-center gap-2 text-[var(--muted)]">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-[var(--muted)]">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) =>
              // prettier-ignore
              (
                <tr key={row.id ?? rowIndex} className="bg-[var(--surface)] transition hover:bg-[rgba(11,116,255,0.08)]">
                  {columns.map((column) => {
                    const value = row[column.accessor]
                    return (
                      <td
                        key={column.accessor}
                        className={`px-6 py-2 text-base align-top ${column.cellClassName || ''}`}
                      >
                        {column.render ? column.render(value, row) : value}
                      </td>
                    )
                  })}
                </tr>
              )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DynamicTable

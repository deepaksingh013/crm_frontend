import React from 'react'
import TableSkeleton from './TableSkeleton'

const DynamicTable = ({ columns, data, title, description, isLoading }) => {
  return (
    <div className="grid gap-4">
      {(title || description) && (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_68px_rgba(15,23,36,0.08)]">
          {title && <h2 className="text-2xl font-semibold text-[var(--text)]">{title}</h2>}
          {description && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>}
        </div>
      )}

      <div className="app-table-card">
        <div className="overflow-x-auto">
        <table className="app-table min-w-full">
          <thead className="bg-[var(--surface)]">
            <tr className="border-b border-[var(--border)]">
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={column.className || ''}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton columns={columns.length} />
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
                <tr key={row.id ?? rowIndex}>
                  {columns.map((column) => {
                    const value = row[column.accessor]
                    return (
                      <td
                        key={column.accessor}
                        className={column.cellClassName || ''}
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
    </div>
  )
}

export default DynamicTable

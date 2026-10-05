import React from 'react'

// Bar widths cycle per cell so the shimmer rows look like real data
const BAR_WIDTHS = ['w-24', 'w-32', 'w-20', 'w-16', 'w-28', 'w-14', 'w-20', 'w-24', 'w-12', 'w-16']

// Shimmer <tr> rows shown inside any table's <tbody> while data is loading
const TableSkeleton = ({ columns, rows = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={`skeleton-${rowIndex}`} className="app-table-skeleton">
        {Array.from({ length: columns }).map((__, columnIndex) => (
          <td key={columnIndex}>
            <span className={`lead-skeleton block h-3.5 rounded ${BAR_WIDTHS[(rowIndex + columnIndex) % BAR_WIDTHS.length]}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
)

export default TableSkeleton

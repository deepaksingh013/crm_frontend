import React from 'react'

// Works for a populated user ({ _id, name }), a raw id, or null
export const getId = (value) => String(value?._id || value || '')

// Who a user reports to:
// manager -> Admin
// tl      -> their manager, or Admin when created directly
// tc      -> their TL (+ that TL's manager), their manager, or Admin
const ReportsToCell = ({ user }) => {
  const role = String(user?.role || '').toLowerCase()

  if (role === 'admin') {
    return <span className="text-xs text-[var(--muted)]">-</span>
  }

  const managerName = user?.manager?.name
  const teamLeaderName = user?.teamLeader?.name

  if (role === 'manager' || (!managerName && !teamLeaderName)) {
    return (
      <span className="inline-flex rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[13px] font-semibold text-[var(--text)]">
        Admin (direct)
      </span>
    )
  }

  const primary = teamLeaderName || managerName
  const secondary = teamLeaderName
    ? `Team Leader · ${managerName ? `Manager: ${managerName}` : 'Admin (direct)'}`
    : 'Manager'

  return (
    <div className="leading-tight">
      <div className="text-sm font-medium text-[var(--text)]">{primary}</div>
      <div className="mt-0.5 text-xs text-[var(--muted)]">{secondary}</div>
    </div>
  )
}

export default ReportsToCell

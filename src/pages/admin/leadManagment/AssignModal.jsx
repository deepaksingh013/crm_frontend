import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

const API_BASE_URL = 'https://crm-backend-5-iocr.onrender.com/api'

const isTelecallerUser = (user) => {
  const role = String(user?.role || user?.userRole || '')
    .toLowerCase()
    .trim()

  return (
    role === 'tc' ||
    role === 'telecaller' ||
    role === 'tele caller' ||
    role === 'tele-caller'
  )
}

const AssignModal = ({
  open,
  onClose,
  leadsCount = 0,
  tcOptions = [],
  onAssign,
  isAssigning = false,
  selectedLeadIds = [],
}) => {
  const [assignCount, setAssignCount] = useState(1)
  const [selectedTcId, setSelectedTcId] = useState('')
  const [searchTc, setSearchTc] = useState('')
  const [localError, setLocalError] = useState(null)

  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState(null)

  // Fetch TC users
  useEffect(() => {
    let mounted = true

    const fetchUsers = async () => {
      setUsersLoading(true)
      setUsersError(null)

      const token = Cookies.get('token')

      if (!token) {
        if (mounted) {
          setUsersError('Auth token not found')
          setUsersLoading(false)
        }
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const text = await res.text()

        if (!res.ok) {
          let msg = `Failed to fetch users (${res.status})`

          try {
            const data = JSON.parse(text)
            msg = data?.message || data?.error || msg
          } catch {}

          throw new Error(msg)
        }

        let data = []

        try {
          data = text ? JSON.parse(text) : []
        } catch (error) {
          console.error('PARSE USERS ERROR:', error)
          throw new Error('Invalid users response')
        }

        if (!mounted) return

        let list = []

        if (Array.isArray(data)) {
          list = data
        } else if (Array.isArray(data?.users)) {
          list = data.users
        } else if (Array.isArray(data?.data)) {
          list = data.data
        } else if (Array.isArray(data?.data?.users)) {
          list = data.data.users
        }

        const telecallers = list.filter(isTelecallerUser)

        setUsers(telecallers)
      } catch (err) {
        console.error('FETCH USERS ERROR:', err)

        if (mounted) {
          setUsersError(err?.message || 'Failed to load users')
          setUsers([])
        }
      } finally {
        if (mounted) {
          setUsersLoading(false)
        }
      }
    }

    if (open) {
      setSelectedTcId('')
      setSearchTc('')
      setLocalError(null)
      setAssignCount(1)

      fetchUsers()
    }

    return () => {
      mounted = false
    }
  }, [open])

  // Search/filter TC list
  const filteredUsers = useMemo(() => {
    const search = searchTc.trim().toLowerCase()

    if (!search) {
      return users
    }

    return users.filter((u) => {
      const name = String(
        u?.name ||
          u?.fullName ||
          u?.username ||
          u?.email ||
          ''
      ).toLowerCase()

      const email = String(u?.email || '').toLowerCase()

      return name.includes(search) || email.includes(search)
    })
  }, [users, searchTc])

  const handleTcClick = (tcId) => {
    setSelectedTcId(tcId)
    setLocalError(null)
  }

  const hasSelectedLeads =
    Array.isArray(selectedLeadIds) && selectedLeadIds.length > 0

  // ---------------------------------------------------------
  // ASSIGN
  // Frontend validation removed.
  // Backend will validate everything.
  // ---------------------------------------------------------
  const handleSubmit = async () => {
    setLocalError(null)

    if (typeof onAssign !== 'function') {
      setLocalError('Assign handler not provided')
      return
    }

    try {
      const count = hasSelectedLeads
        ? selectedLeadIds.length
        : Number(assignCount)

      const leadIds = hasSelectedLeads ? selectedLeadIds : []

      const ok = await onAssign(
        count,
        selectedTcId,
        leadIds
      )

      if (ok) {
        onClose()
      }
    } catch (err) {
      console.error('Assign modal error:', err)

      const message =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to assign leads'

      setLocalError(message)
      toast.error(message)
    }
  }

  if (!open) {
    return null
  }

  const selectedUser = users.find(
    (u) => (u?._id || u?.id) === selectedTcId
  )

  const selectedTcName =
    selectedUser?.name ||
    selectedUser?.fullName ||
    selectedUser?.username ||
    selectedUser?.email ||
    tcOptions.find((t) => t.id === selectedTcId)?.name ||
    selectedTcId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => !isAssigning && onClose()}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-lg">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Assign Leads
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="text-xl text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Available Leads */}
        <div className="mb-4 rounded-xl bg-[var(--surface-alt)] p-3">
          <div className="text-xs text-[var(--muted)]">
            {hasSelectedLeads ? 'Selected Leads' : 'Available Leads'}
          </div>

          <div className="mt-1 text-lg font-semibold text-[var(--text)]">
            {hasSelectedLeads ? selectedLeadIds.length : leadsCount}
          </div>
        </div>

        {/* Number of leads */}
        {!hasSelectedLeads && (
          <div className="mb-4">
            <label className="mb-1 block text-sm text-[var(--muted)]">
              Number of leads
            </label>

            <input
              type="number"
              value={assignCount}
              onChange={(e) => {
                setAssignCount(e.target.value)
                setLocalError(null)
              }}
              disabled={isAssigning}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none disabled:opacity-50"
              placeholder="Enter number of leads"
            />
          </div>
        )}

        {/* Selected Leads Info */}
        {hasSelectedLeads && (
          <div className="mb-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3 text-sm text-[var(--text)]">
            Assigning the selected leads to the chosen telecaller.
          </div>
        )}

        {/* Select TC */}
        <div className="mb-4">
          <label className="mb-2 block text-sm text-[var(--muted)]">
            Select TC
          </label>

          {/* Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchTc}
              onChange={(e) => {
                setSearchTc(e.target.value)
                setLocalError(null)
              }}
              disabled={isAssigning || usersLoading}
              placeholder="Search TC by name..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 pr-10 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none disabled:opacity-50"
            />

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
              🔍
            </span>
          </div>

          {/* Loading */}
          {usersLoading ? (
            <div className="rounded-xl border border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
              Loading TC list...
            </div>
          ) : usersError ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-500">
              {usersError}
            </div>
          ) : users.length > 0 ? (
            <>
              {filteredUsers.length > 0 ? (
                <div className="grid max-h-52 grid-cols-1 gap-2 overflow-auto pr-1">
                  {filteredUsers.map((u) => {
                    const tcId = u?._id || u?.id

                    const tcName =
                      u?.name ||
                      u?.fullName ||
                      u?.username ||
                      u?.email ||
                      tcId

                    const isSelected = selectedTcId === tcId

                    return (
                      <button
                        key={tcId}
                        type="button"
                        disabled={isAssigning}
                        onClick={() => handleTcClick(tcId)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isSelected
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-[var(--text)]">
                              {tcName}
                            </div>

                            {u?.email && u?.name && (
                              <div className="truncate text-xs text-[var(--muted)]">
                                {u.email}
                              </div>
                            )}
                          </div>

                          {isSelected && (
                            <span className="shrink-0 text-sm font-semibold text-[var(--primary)]">
                              Selected ✓
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
                  No TC found for "{searchTc}"
                </div>
              )}

              {/* Result Count */}
              {searchTc.trim() && filteredUsers.length > 0 && (
                <div className="mt-2 text-xs text-[var(--muted)]">
                  {filteredUsers.length} TC
                  {filteredUsers.length === 1 ? '' : 's'} found
                </div>
              )}
            </>
          ) : tcOptions.length > 0 ? (
            <select
              value={selectedTcId}
              onChange={(e) => {
                setSelectedTcId(e.target.value)
                setLocalError(null)
              }}
              disabled={isAssigning}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none disabled:opacity-50"
            >
              <option value="">Select TC</option>

              {tcOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-xl border border-[var(--border)] p-4 text-center text-sm text-[var(--muted)]">
              No TC options available.
            </div>
          )}
        </div>

        {/* Selected TC */}
        {selectedTcId && (
          <div className="mb-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3">
            <div className="text-xs text-[var(--muted)]">
              Selected TC
            </div>

            <div className="mt-1 font-medium text-[var(--text)]">
              {selectedTcName}
            </div>
          </div>
        )}

        {/* Backend Error */}
        {localError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-500">
            {localError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isAssigning}
            className="rounded-xl bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAssigning
              ? 'Assigning...'
              : hasSelectedLeads
                ? 'Assign Selected'
                : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignModal
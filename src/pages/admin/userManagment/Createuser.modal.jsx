import React, { useEffect, useState } from 'react'
import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import Modal from '../../../components/modal/Modal'

const permissionOptions = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'User management', value: 'users' },
  { label: 'Campaigns', value: 'campaigns' },
  { label: 'Leads', value: 'leads' },
  { label: 'Reports', value: 'reports' },
  { label: 'Settings', value: 'settings' },
]

const rolePermissionMap = {
  Manager: [
    'dashboard',
    'users',
    'campaigns',
    'leads',
    'reports',
    'settings',
  ],
  'Team Leader': [
    'dashboard',
    'campaigns',
    'leads',
    'reports',
  ],
  'Tele caller': ['leads', 'reports'],
}

const Createusermodal = ({
  open,
  isEditing,
  isSubmitting,
  onClose,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
  status,
  setStatus,
  permissions,
  setPermissions,
  onSubmit,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setDropdownOpen(false)
      setPasswordVisible(false)
    }
  }, [open])

  const handleTogglePermission = (value) => {
    setPermissions((current) =>
      current.includes(value)
        ? current.filter(
            (permission) => permission !== value
          )
        : [...current, value]
    )
  }

  useEffect(() => {
    const allowed = rolePermissionMap[role] || []
    setPermissions(allowed)
  }, [role, setPermissions])

  const availablePermissions = permissionOptions.filter(
    (option) =>
      rolePermissionMap[role]?.includes(option.value)
  )

  const selectedLabels = availablePermissions
    .filter((permission) =>
      permissions.includes(permission.value)
    )
    .map((permission) => permission.label)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit user' : 'Create new user'}
    >
      <form onSubmit={onSubmit} >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--text)]">
              Full name
            </span>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter full name"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)]"
            />
          </label>

          {/* EMAIL */}
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--text)]">
              Email
            </span>

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              type="email"
              required
              placeholder="Enter email address"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)]"
            />
          </label>

          {/* PASSWORD */}
          {!isEditing && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">
                Password
              </span>

              <div className="relative">
                <input
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  type={
                    passwordVisible
                      ? 'text'
                      : 'password'
                  }
                  required={!isEditing} // Password is not required when editing
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 pr-12 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setPasswordVisible(
                      (prev) => !prev
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--surface-alt)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  aria-label={
                    passwordVisible
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {passwordVisible ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
          )}

          {/* ROLE */}
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--text)]">
              Role
            </span>

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)]"
            >
              <option value="Manager">
                Manager
              </option>

              <option value="Team Leader">
                Team Leader
              </option>

              <option value="Tele caller">
                Tele caller
              </option>
            </select>
          </label>

          {/* STATUS */}
          {isEditing && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">
                Status
              </span>

              <select // This select will now only appear in "Edit user" mode
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] outline-none transition fozcus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)]"
              >
                <option value="active">
                  Active
                </option>

                <option value="block">
                  Block
                </option>
              </select>
            </label>
          )}
        </div>

        {/* PERMISSIONS */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-[var(--text)]">
            Permissions
          </span>
          <p className="text-xs text-[var(--muted)]">
            Grant access to sidebar sections based on the selected role.
          </p>

          <div className="relative w-full">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] transition hover:border-[var(--primary)] focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[rgba(11,116,255,0.12)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[1.5rem] flex-1 text-sm text-[var(--muted)]">
                  {selectedLabels.length > 0
                    ? selectedLabels.join(', ')
                    : 'No permissions selected.'}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDropdownOpen(
                      (prev) => !prev
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)]"
                >
                  {selectedLabels.length > 0
                    ? `${selectedLabels.length} selected`
                    : 'Select Permissions'}

                  <ChevronDown
                    size={16}
                    className={`transition duration-200 ${
                      dropdownOpen
                        ? 'rotate-180'
                        : 'rotate-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* PERMISSION DROPDOWN */}
            <div
              className={`absolute right-0 z-20 mt-2 w-full origin-top-right overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_16px_40px_rgba(15,23,36,0.12)] transition-all duration-200 sm:w-64 ${
                dropdownOpen
                  ? 'max-h-72 opacity-100'
                  : 'pointer-events-none max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-1 p-3">
                {availablePermissions.length > 0 ? (
                  availablePermissions.map((option) => {
                    const checked = permissions.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          handleTogglePermission(
                            option.value
                          )
                        }
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--surface-alt)]"
                      >
                        <span>{option.label}</span>

                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                            checked
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                              : 'border-[var(--border)] bg-transparent text-[var(--muted)]'
                          }`}
                        >
                          {checked && <Check size={14} />}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-center text-sm text-[var(--muted)]">
                    No permissions available for this role.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">

          {/* CANCEL */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          {/* CREATE */}
          <button
            disabled={isSubmitting}
            type="submit"
            className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? isEditing ? 'Saving...' : 'Creating...'
              : isEditing ? 'Save changes' : 'Create user'
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default Createusermodal

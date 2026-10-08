import React, { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Cookies from 'js-cookie'
import Modal from '../../../components/modal/Modal'
import { getId } from './ReportsToCell'

const ROLE_OPTIONS = ['Manager', 'Team Leader', 'Tele caller']

// Role hierarchy: which roles the logged-in user is allowed to create
// admin -> everyone, manager -> TL + TC, TL -> TC only
const getCreatableRoles = (currentRole) => {
  const roleKey = String(currentRole || '').toLowerCase().trim()

  if (roleKey === 'admin') {
    return ROLE_OPTIONS
  }

  if (roleKey === 'manager') {
    return ['Team Leader', 'Tele caller']
  }

  if (['tl', 'teamleader', 'team leader', 'team-leader', 'team_leader'].includes(roleKey)) {
    return ['Tele caller']
  }

  return ['Tele caller']
}

const selectClassName = 'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)]'

// Red border + ring when the field is invalid
const getInputClassName = (hasError, extra = '') =>
  `w-full rounded-2xl border bg-[var(--surface-alt)] px-4 py-3 text-[var(--text)] outline-none transition focus:ring-4 ${extra} ${hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
    : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[rgba(11,116,255,0.12)]'
  }`

// =====================================
// VALIDATION
// =====================================

const NAME_PATTERN = /^[\p{L}\p{M}\d\s.'-]+$/u
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Returns { field: message } for every invalid field
const validateUser = ({ name, email, password, isEditing, users, editingUserId }) => {
  const errors = {}

  const trimmedName = name.trim()
  if (!trimmedName) errors.name = 'Full name is required'
  else if (trimmedName.length < 2) errors.name = 'Name must be at least 2 characters'
  else if (trimmedName.length > 50) errors.name = 'Name must be 50 characters or less'
  else if (!NAME_PATTERN.test(trimmedName)) errors.name = "Use only letters, numbers, spaces, . ' or -"

  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail) errors.email = 'Email is required'
  else if (trimmedEmail.length > 100 || !EMAIL_PATTERN.test(trimmedEmail)) errors.email = 'Enter a valid email address'
  // Best effort - only checks users this person can see; the server still checks everyone
  else if (users.some((user) => String(user.email || '').toLowerCase() === trimmedEmail && getId(user) !== editingUserId)) {
    errors.email = 'This email is already in use'
  }

  // Password is only set when creating
  if (!isEditing) {
    if (!password) errors.password = 'Password is required'
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
    else if (password.length > 50) errors.password = 'Password must be 50 characters or less'
    else if (/\s/.test(password)) errors.password = 'Password cannot contain spaces'
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Use at least one letter and one number'
  }

  return errors
}

// Order fields are focused in when the form has errors
const FIELD_IDS = { name: 'user-name', email: 'user-email', password: 'user-password' }

const FieldError = ({ field, message }) =>
  message ? (
    <p id={`${FIELD_IDS[field]}-error`} className="text-xs font-medium text-red-600">
      {message}
    </p>
  ) : null

const RequiredMark = () => <span className="text-red-600" aria-hidden="true"> *</span>

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
  managerId,
  setManagerId,
  teamLeaderId,
  setTeamLeaderId,
  users = [],
  editingUserId = '',
  onSubmit,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false)
  // Errors show once a field is left, or after a submit attempt
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setPasswordVisible(false)
    setTouched({})
    setSubmitted(false)
  }, [open])

  const errors = useMemo(
    () => validateUser({ name, email, password, isEditing, users, editingUserId }),
    [name, email, password, isEditing, users, editingUserId]
  )

  const getError = (field) => (touched[field] || submitted ? errors[field] : undefined)

  const markTouched = (field) => () => setTouched((current) => ({ ...current, [field]: true }))

  const getFieldProps = (field) => ({
    id: FIELD_IDS[field],
    onBlur: markTouched(field),
    'aria-invalid': Boolean(getError(field)),
    'aria-describedby': getError(field) ? `${FIELD_IDS[field]}-error` : undefined,
  })

  // Never hit the server while anything is invalid
  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)

    const firstInvalid = Object.keys(FIELD_IDS).find((field) => errors[field])

    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }

    onSubmit(e)
  }

  const currentRole = String(Cookies.get('role') || '').toLowerCase().trim()
  const creatableRoles = getCreatableRoles(currentRole)

  // =====================================
  // TEAM PLACEMENT
  // =====================================
  // admin   -> picks a manager (or none = direct to admin),
  //            and for a TC, a TL of that manager
  // manager -> TL / TC go into their own team; TC can pick a TL
  // tl      -> TC goes under them automatically

  const isAdmin = currentRole === 'admin'
  const isTeamMemberRole = role === 'Team Leader' || role === 'Tele caller'
  const showManagerSelect = isAdmin && isTeamMemberRole
  const showTeamLeaderSelect = (isAdmin || currentRole === 'manager') && role === 'Tele caller'

  const managerOptions = users.filter(
    (user) => user.role === 'manager' && (user.isActive || getId(user) === managerId)
  )

  // Manager's /users list is already only their team
  const teamLeaderOptions = users.filter(
    (user) =>
      user.role === 'tl' &&
      (user.isActive || getId(user) === teamLeaderId) &&
      (!isAdmin || getId(user.manager) === (managerId || ''))
  )

  const getPlacementNote = () => {
    if (role === 'Manager') return 'Managers report directly to Admin.'
    if (currentRole === 'tl') return 'This telecaller will be added to your team.'
    if (currentRole === 'manager') return 'This user will be added to your team.'
    if (!managerId) {
      return managerOptions.length === 0
        ? 'No manager created yet. This user will report directly to Admin.'
        : 'No manager selected. This user will report directly to Admin.'
    }
    return 'Only this manager (and Admin) will be able to see this user.'
  }

  // When editing a user whose role is above the current user's level,
  // still show that role (disabled) so the select displays the right value
  const roleOptions = creatableRoles.includes(role) || !role
    ? creatableRoles
    : [role, ...creatableRoles]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit user' : 'Create new user'}
    >
      {/* noValidate: our own messages replace the browser's bubbles */}
      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--text)]">
              Full name<RequiredMark />
            </span>

            <input
              {...getFieldProps('name')}
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              maxLength={50}
              autoComplete="off"
              placeholder="Enter full name"
              className={getInputClassName(getError('name'))}
            />
            <FieldError field="name" message={getError('name')} />
          </label>

          {/* EMAIL */}
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--text)]">
              Email<RequiredMark />
            </span>

            {/* autoComplete off so the browser doesn't fill in the admin's own login */}
            <input
              {...getFieldProps('email')}
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              type="email"
              maxLength={100}
              autoComplete="off"
              placeholder="Enter email address"
              className={getInputClassName(getError('email'))}
            />
            <FieldError field="email" message={getError('email')} />
          </label>

          {/* PASSWORD */}
          {!isEditing && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">
                Password<RequiredMark />
              </span>

              <div className="relative">
                <input
                  {...getFieldProps('password')}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  type={
                    passwordVisible
                      ? 'text'
                      : 'password'
                  }
                  maxLength={50}
                  autoComplete="new-password"
                  placeholder="Min 6 characters, letters + numbers"
                  className={getInputClassName(getError('password'), 'pr-12')}
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
              <FieldError field="password" message={getError('password')} />
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
              {roleOptions.map((roleOption) => (
                <option
                  key={roleOption}
                  value={roleOption}
                  disabled={!creatableRoles.includes(roleOption)}
                >
                  {roleOption}
                </option>
              ))}
            </select>
          </label>

          {/* MANAGER (admin only) */}
          {showManagerSelect && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">
                Manager
              </span>

              <select
                value={managerId}
                onChange={(e) => {
                  setManagerId(e.target.value)
                  // TL list depends on the manager
                  setTeamLeaderId('')
                }}
                className={selectClassName}
              >
                <option value="">Directly under Admin</option>
                {managerOptions.map((manager) => (
                  <option key={getId(manager)} value={getId(manager)}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* TEAM LEADER (TC only) */}
          {showTeamLeaderSelect && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">
                Team Leader
              </span>

              <select
                value={teamLeaderId}
                onChange={(e) => setTeamLeaderId(e.target.value)}
                className={selectClassName}
              >
                <option value="">
                  {teamLeaderOptions.length === 0 ? 'No team leader in this team' : 'No team leader'}
                </option>
                {teamLeaderOptions.map((teamLeader) => (
                  <option key={getId(teamLeader)} value={getId(teamLeader)}>
                    {teamLeader.name}
                  </option>
                ))}
              </select>
            </label>
          )}

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

          <p className="text-xs text-[var(--muted)] sm:col-span-2">
            {getPlacementNote()}
          </p>
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

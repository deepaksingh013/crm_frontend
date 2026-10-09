import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DynamicTable from '../../../components/table/DynamicTable'
import Createusermodal from './Createuser.modal'
import axios from 'axios'
import DeleteConfirmModal from './DeleteConfirmModal'
import ReportsToCell, { getId } from './ReportsToCell'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { Edit, Trash2, Plus, AlertCircle, Filter } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'

const API_URL = process.env.REACT_APP_API_URL

const roleMap = {
  Manager: 'manager',
  'Team Leader': 'tl',
  'Tele caller': 'tc',
}

const reverseRoleMap = Object.fromEntries(
  Object.entries(roleMap).map(([key, value]) => [value, key])
);

const normalizeUserRole = (user) => {
  const role = String(user?.role || user?.userRole || '').toLowerCase().trim()

  if (role === 'manager') return 'manager'
  if (['tl', 'teamleader', 'team leader', 'team-leader', 'team_leader'].includes(role)) return 'tl'
  if (['tc', 'telecaller', 'tele caller', 'tele-caller'].includes(role)) return 'tc'

  return role
}

const isTelecallerUser = (user) => {
  const role = String(user?.role || user?.userRole || '').toLowerCase()

  return (
    role === 'tc' ||
    role === 'telecaller' ||
    role === 'tele caller' ||
    role === 'tele-caller'
  )
}

const UserManagement = () => {
  const { role: authRole } = useAuth()
  const currentRole = String(authRole || '').toLowerCase().trim()
  const isAdmin = currentRole === 'admin'
  // Admin / manager / TL can create, edit or delete users
  // (TL only their own telecallers - backend enforces the scope)
  const canManageUsers = ['admin', 'manager', 'tl'].includes(currentRole)
  const roleFilterOptions = currentRole === 'admin'
    ? [
      { label: 'Manager', value: 'manager' },
      { label: 'Team Leader', value: 'tl' },
      { label: 'Tele caller', value: 'tc' },
    ]
    : currentRole === 'tl'
      ? [{ label: 'Tele caller', value: 'tc' }]
      : [{ label: 'Team Leader', value: 'tl' }, { label: 'Tele caller', value: 'tc' }]
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Tele caller')
  const [status, setStatus] = useState("active")
  const [managerId, setManagerId] = useState('')
  const [teamLeaderId, setTeamLeaderId] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')

  const fetchUsers = useCallback(async () => {
    const token = Cookies.get('token')

    if (!token) {
      setError('Not authenticated. Please log in again.')
      setLoading(false)
      return
    }

    try {
      setError('')

      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data?.success) {
        const userList = Array.isArray(response.data.users)
          ? response.data.users
          : []

        setUsers(userList.map((user) => ({
          ...user,
          id: user.id || user._id,
        })))
      } else {
        setError(response.data?.message || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])


  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('Tele caller')
    setStatus("active")
    setManagerId('')
    setTeamLeaderId('')
  }

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false)
      setEditingUser(null)
      resetForm()
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    const token = Cookies.get('token')

    if (!token) {
      setError('Not authenticated. Please log in again.')
      return
    }

    setIsSubmitting(true)

    const userData = {
      // Already validated in the modal
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: roleMap[role] || 'tc',
      isActive: status === "active" ? true : false,
      // Empty = reports directly to admin / no TL.
      // Backend fills these in itself for manager / TL creators.
      managerId: managerId || null,
      teamLeaderId: teamLeaderId || null,
    }
    console.log(userData)

    if (password) {
      userData.password = password
    }

    const url = editingUser
      ? `${API_URL}/users/${editingUser._id}`
      : `${API_URL}/users`
    const method = editingUser ? 'patch' : 'post'

    try {
      await axios({
        method,
        url,
        data: userData,
        headers: { Authorization: `Bearer ${token}` },
      })

      await fetchUsers()
      toast.success(editingUser ? 'User updated successfully!' : 'User created successfully!');

      setIsModalOpen(false)
      setEditingUser(null)
      resetForm()
    } catch (err) {
      const action = editingUser ? 'update' : 'create'
      const errorMessage = err.response?.data?.message || `Failed to ${action} user`;
      console.error(`Failed to ${action} user:`, err)
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setName(user.name)
    setEmail(user.email)
    const roleKey = Object.keys(roleMap).find(key => roleMap[key] === user.role) || 'Tele caller';
    setRole(roleKey)
    // Load the real status, otherwise saving would un-block a blocked user
    setStatus(user.isActive === false ? 'block' : 'active')
    setManagerId(getId(user.manager))
    setTeamLeaderId(getId(user.teamLeader))
    setIsModalOpen(true)
  }

  const openDeleteModal = (user) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    const token = Cookies.get('token')

    if (!token) {
      setError('Not authenticated. Please log in again.')
      return
    }

    setIsDeleting(true)
    try {
      const response = await axios.delete(`${API_URL}/users/${userToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await fetchUsers()
      // Server says how many leads went back to the pool
      toast.success(response.data?.message || 'User deleted successfully!');
      closeDeleteModal()
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      console.error('Delete user error:', err)
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false)
    }
  }


  // const handleToggleStatus = async (user) => {
  //   const token = Cookies.get('token')
  //   if (!token) {
  //     setError('Not authenticated. Please log in again.')
  //     return
  //   }

  //   const newStatus = !user.isActive
  //   const optimisticUsers = users.map(u => u._id === user._id ? { ...u, isActive: newStatus } : u)
  //   setUsers(optimisticUsers)

  //   try {
  //     await axios.put(
  //       `${API_URL}/users/${user._id}`,
  //       { isActive: newStatus },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     )

  //   } catch (err) {
  //     console.error('Update status error:', err)
  //     alert(err.response?.data?.message || 'Failed to update user status')
  //     setUsers(users) // Revert on error
  //   }
  // }

  // Admin: narrow the table down to one manager's team
  const managers = useMemo(
    () => users.filter((user) => user.role === 'manager'),
    [users]
  )

  // Team filter (admin) and role filter both apply
  const visibleUsers = useMemo(() => {
    let list = users

    if (teamFilter === 'direct') {
      list = list.filter(
        (user) => ['tl', 'tc'].includes(user.role) && !getId(user.manager)
      )
    } else if (teamFilter !== 'all') {
      list = list.filter(
        (user) => getId(user) === teamFilter || getId(user.manager) === teamFilter
      )
    }

    if (roleFilter !== 'all') {
      list = list.filter((user) => normalizeUserRole(user) === roleFilter)
    }

    return list
  }, [users, teamFilter, roleFilter])

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
    },

    {
      header: 'Email',
      accessor: 'email',
    },

    {
      header: 'Role',
      accessor: 'role',
      render: (value) => (
        <span className="capitalize">
          {reverseRoleMap[value] || value}
        </span>
      ),
    },

    // REPORTS TO
    {
      header: 'Reports To',
      accessor: 'reportsTo',
      render: (_, user) => <ReportsToCell user={user} />,
    },

    // STATUS
    {
      header: 'Status',
      accessor: 'isActive',

      render: (value) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${value
            ? 'bg-[var(--success)]'
            : 'bg-red-500'
            }`}
        >
          {value ? 'Active' : 'Blocked'}
        </span>
      ),
    },

    // ACTIONS (admin / manager / TL)
    ...(canManageUsers
      ? [{
        header: 'Actions',
        accessor: 'actions',
        render: (_, user) => (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="Edit User"
              onClick={() => handleEditUser(user)}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-amber-50 hover:text-amber-600"
            >
              <Edit size={18} />
            </button>

            <button
              type="button"
              title={user.role === 'admin' ? 'Admin cannot be deleted' : 'Delete User'}
              onClick={() => openDeleteModal(user)}
              disabled={user.role === 'admin'}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      }]
      : []),
  ]


  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">User Management</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Create, edit, and manage your team members.
            </p>
          </div>
          {canManageUsers && (
            <button
              type="button"
              onClick={() => { setEditingUser(null); resetForm(); setIsModalOpen(true); }}
              disabled={loading || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-95 disabled:opacity-50"
            >
              <Plus size={18} />
              Create User
            </button>
          )}
        </div>

        {canManageUsers && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-[var(--primary)]">
                <Filter size={18} />
              </span>
              <div>
                <label htmlFor="user-role-filter" className="block text-sm font-semibold text-[var(--text)]">
                  Filter users
                </label>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {visibleUsers.length} {visibleUsers.length === 1 ? 'user' : 'users'} shown
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isAdmin && (
                <select
                  id="team-filter"
                  aria-label="Filter by team"
                  value={teamFilter}
                  onChange={(event) => setTeamFilter(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2.5 text-sm font-medium text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)] sm:w-64"
                >
                  <option value="all">All teams</option>
                  <option value="direct">Directly under Admin (no manager)</option>
                  {managers.map((manager) => (
                    <option key={getId(manager)} value={getId(manager)}>
                      {manager.name}'s team
                    </option>
                  ))}
                </select>
              )}
              <select
                id="user-role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2.5 text-sm font-medium text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(11,116,255,0.12)] sm:w-56"
              >
                <option value="all">All roles</option>
                {roleFilterOptions.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-2xl shadow-sm">
          <DynamicTable
            columns={columns}
            data={visibleUsers}
            isLoading={loading}
          />
        </div>
      </div>
      {/* CREATE USER MODAL */}
      <Createusermodal
        open={isModalOpen}
        onCancel={handleCloseModal}
        isEditing={!!editingUser}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        role={role}
        setRole={setRole}
        status={status}
        setStatus={setStatus}
        managerId={managerId}
        setManagerId={setManagerId}
        teamLeaderId={teamLeaderId}
        setTeamLeaderId={setTeamLeaderId}
        users={users}
        editingUserId={editingUser ? getId(editingUser) : ''}
        onSubmit={handleFormSubmit}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
        title="Delete User"
        message={`Delete "${userToDelete?.name || userToDelete?.email}"? They will be hidden from all lists and won't be able to log in. Any leads assigned to them go back to the unassigned pool. To only stop them logging in for now, edit the user and set Status to Block instead.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  )
}

export default UserManagement

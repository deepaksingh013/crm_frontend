import React, { useCallback, useEffect, useState } from 'react'
import DynamicTable from '../../../components/table/DynamicTable'
import Createusermodal from './Createuser.modal'
import axios from 'axios'
import DeleteConfirmModal from './DeleteConfirmModal'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { Edit, Trash2, Plus, AlertCircle } from 'lucide-react'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

const roleMap = {
  Manager: 'manager',
  'Team Leader': 'tl',
  'Tele caller': 'tc',
}

const reverseRoleMap = Object.fromEntries(
  Object.entries(roleMap).map(([key, value]) => [value, key])
);

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
  const [users, setUsers] = useState([])
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
  const [permissions, setPermissions] = useState(['leads', 'reports'])
  // const [isActive, setIsActive] = useState(true) 
  console.log(status)

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
        const telecallerUsers = (response.data.users || []).filter(isTelecallerUser)

        setUsers(
          telecallerUsers.map((user) => ({
            ...user,
            id: user._id,
          }))
        )
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      console.error('Get users error:', err)
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
    setPermissions(['leads', 'reports'])
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
      name: name || email.split('@')[0],
      email,
      role: roleMap[role] || 'tc',
      permissions,
      isActive: status === "active" ? true : false,
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
    setPermissions(user.permissions || [])
    // setIsActive(user.isActive)
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
      await axios.delete(`${API_URL}/users/${userToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await fetchUsers()
      toast.success('User deleted successfully!');
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

    // STATUS
    {
      header: 'Status',
      accessor: 'isActive',

      render: (value) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${value
            ? 'bg-[var(--success)]'
            : 'bg-[var(--muted)]'
            }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },

    // PERMISSIONS
    {
      header: 'Permissions',
      accessor: 'permissions',

      render: (value) => {
        const permissionList = value || []

        const visiblePermissions =
          permissionList.slice(0, 2)

        const hasMore = permissionList.length > 2

        const hiddenPermissions =
          permissionList.slice(2)

        return (
          <div className="flex flex-wrap items-center gap-2">
            {visiblePermissions.length > 0 ? (
              visiblePermissions.map(
                (permission) => (
                  <span
                    key={permission}
                    className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[13px] font-semibold text-[var(--text)]"
                  >
                    {permission}
                  </span>
                )
              )
            ) : (
              <span className="text-xs text-[var(--muted)]">
                No permissions
              </span>
            )}

            {hasMore && (
              <span
                title={hiddenPermissions.join(', ')}
                className="cursor-help rounded-full bg-[var(--surface-alt)] px-3 py-1 text-[11px] font-bold text-[var(--muted)]"
              >
                ...
              </span>
            )}
          </div>
        )
      },
    },

    // ACTIONS
    {
      header: 'Actions',
      accessor: 'actions',

      render: (_, user) => (
        <div className="flex flex-wrap items-center gap-2">
          {/* EDIT */}
          <button
            type="button"
            title="Edit User"
            onClick={() => handleEditUser(user)}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-amber-50 hover:text-amber-600"
          >
            <Edit size={18} />
          </button>

          {/* DELETE */}
          <button
            type="button"
            title="Delete User"
            onClick={() => openDeleteModal(user)}
            disabled={!user.isActive}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>

          {/* TOGGLE STATUS */}
          {/* <button
            type="button"
            onClick={() => handleToggleStatus(user)}
            className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition active:scale-95 ${user.isActive ? 'border-orange-200 text-orange-500 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
          >
            {user.isActive ? 'Block' : 'Activate'}
          </button> */}
        </div>
      ),
    },
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
          <button
            type="button"
            onClick={() => { setEditingUser(null); resetForm(); setIsModalOpen(true); }}
            disabled={loading || isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-95 disabled:opacity-50"
          >
            <Plus size={18} />
            Create User
          </button>
        </div>

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
            data={users}
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
        permissions={permissions}
        setPermissions={setPermissions}
        onSubmit={handleFormSubmit}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.name || userToDelete?.email}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  )
}

export default UserManagement

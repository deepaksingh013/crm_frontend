import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { AlertCircle, Check, } from 'lucide-react'
import DynamicTable from '../../../components/table/DynamicTable'
import ConfirmationModal from './ConfirmationModal'
const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

const roleMap = {
    Manager: 'manager',
    'Team Leader': 'tl',
    'Tele caller': 'tc',
}

const reverseRoleMap = Object.fromEntries(
    Object.entries(roleMap).map(([key, value]) => [value, key])
);

const DeviceManagment = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [confirmModalState, setConfirmModalState] = useState({
        isOpen: false,
        user: null,
    })

    const fetchUsers = useCallback(async () => {
        const token = Cookies.get('token')

        if (!token) {
            setError('Not authenticated. Please log in again.')
            setLoading(false)
            return
        }

        try {
            setError(null)

            const response = await axios.get(`${API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.data?.success) {
                setUsers(
                    (response.data.users || []).map((user) => ({
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

    const openConfirmationModal = (user) => {
        setConfirmModalState({ isOpen: true, user })
    }

    const closeConfirmationModal = () => {
        if (!isSubmitting) {
            setConfirmModalState({ isOpen: false, user: null })
        }
    }

    const handleConfirmToggleApproval = async () => {
        const { user } = confirmModalState
        if (!user) return

        const token = Cookies.get('token')
        if (!token) {
            toast.error('Not authenticated. Please log in again.')
            return
        }

        setIsSubmitting(true)
        const newApprovalStatus = !user.isApproved
        const action = newApprovalStatus ? 'approving' : 'blocking'
        const successMessage = `User ${newApprovalStatus ? 'approved' : 'blocked'} successfully!`
        const errorMessage = `Failed to ${newApprovalStatus ? 'approve' : 'block'} user.`

        // Optimistic UI update
        setUsers((currentUsers) =>
            currentUsers.map((u) =>
                u._id === user._id ? { ...u, isApproved: newApprovalStatus } : u
            )
        )

        try {
            await axios.patch(`${API_URL}/users/${user._id}/approve`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            toast.success("User approved successfully!" || successMessage)
            closeConfirmationModal()
        } catch (err) {
            console.error(`Error ${action} user:`, err)
            toast.error(err.response?.data?.message || errorMessage)
            // Revert optimistic update on error
            setUsers((currentUsers) =>
                currentUsers.map((u) =>
                    u._id === user._id ? { ...u, isApproved: user.isApproved } : u
                )
            )
        } finally {
            setIsSubmitting(false)
        }
    }

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

        // ACTIONS
        {
            header: 'Actions',
            accessor: 'actions',

            render: (_, user) => (
                <button
                    onClick={() => openConfirmationModal(user)}
                    type="button"
                    disabled={user.isApproved}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${user.isApproved
                        ? 'cursor-not-allowed bg-gray-400 opacity-60'
                        : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md focus:ring-emerald-500 active:scale-[0.98]'
                        }`}
                >
                    <Check className="h-4 w-4" />
                    {user.isApproved ? "Approved" : "Approve"}
                </button>


            ),
        },
    ]

    const totalUsers = users.length;
    const approvedUsersCount = users.filter(user => user.isApproved).length;
    const notApprovedUsersCount = totalUsers - approvedUsersCount;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Device Management</h1>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            Manage your all devices.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                        <p className="mt-1 text-3xl font-semibold text-gray-900">{totalUsers}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Approved Users</h3>
                        <p className="mt-1 text-3xl font-semibold text-emerald-600">{approvedUsersCount}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Not Approved Users</h3>
                        <p className="mt-1 text-3xl font-semibold text-red-600">{notApprovedUsersCount}</p>
                    </div>
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
            <ConfirmationModal
                isOpen={confirmModalState.isOpen}
                user={confirmModalState.user}
                onClose={closeConfirmationModal}
                onConfirm={handleConfirmToggleApproval}
                isSubmitting={isSubmitting}
            />
        </>
    )
}

export default DeviceManagment

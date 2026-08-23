import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Edit, Trash2, Plus, AlertCircle } from 'lucide-react'
import CreateCampaign from './CreateCampaign'
import DynamicTable from '../../../components/table/DynamicTable'
import Modal from '../../../components/modal/Modal'
import toast from 'react-hot-toast'
import ConfirmationModal from './ConfirmationModal'
import ImportCampaignModal from '../leadManagment/ImportCampaignModal'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

const statusStyles = {
  Live: 'bg-emerald-500 text-white',
  Pending: 'bg-amber-500 text-white',
  Paused: 'bg-slate-500 text-white',
}

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Modal and Selected Campaign State
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  // Auth Header helper
  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    if (!token) {
      throw new Error('Authentication token not found. Please log in.')
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const config = getAuthHeaders()
      const response = await axios.get(`${API_URL}/campaigns`, config)
      const campaignList = response.data?.campaigns || response.data || []
      setCampaigns(Array.isArray(campaignList) ? campaignList : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch campaigns.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Open Modals
  const handleOpenCreate = () => {
    setSelectedCampaign(null)
    setError('')
    setIsCreateEditModalOpen(true)
  }

  const handleOpenEdit = (campaign) => {
    setSelectedCampaign(campaign)
    setError('')
    setIsCreateEditModalOpen(true)
  }

  const handleOpenDelete = (campaign) => {
    setSelectedCampaign(campaign)
    setError('')
    setIsDeleteModalOpen(true)
  }

  // 2. Create or Update Campaign Handler
  const handleSaveCampaign = async (formData) => {
    setIsSubmitting(true)
    setError('')
    try {
      const config = getAuthHeaders()

      if (selectedCampaign) {
        // Edit Mode: Send updated title to PUT /campaigns/:id
        const payload = {
          title: formData.title || formData.name,
        }
        await axios.patch(`${API_URL}/campaigns/${selectedCampaign._id}`, payload, config)
        toast.success('Campaign updated successfully!')
      } else {
        const payload = {
          title: formData.title,
        }
        await axios.post(`${API_URL}/campaigns`, payload, config)
        toast.success('Campaign created successfully!')
      }

      await fetchCampaigns()
      setIsCreateEditModalOpen(false)
      setSelectedCampaign(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save campaign.')
      setError(err.response?.data?.message || 'Failed to save campaign.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Delete Campaign Handler
  const handleDeleteConfirm = async () => {
    if (!selectedCampaign?._id) return

    setIsSubmitting(true)
    setError('')
    try {
      const config = getAuthHeaders()
      await axios.delete(`${API_URL}/campaigns/${selectedCampaign._id}`, config)
      await fetchCampaigns()
      toast.success('Campaign deleted successfully!')
      setIsDeleteModalOpen(false)
      setSelectedCampaign(null)
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete campaign.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. Import Campaigns Handler
  const handleImportCampaigns = async (file) => {
    setIsSubmitting(true)
    setError('')
    try {
      const config = {
        ...getAuthHeaders(),
        headers: {
          ...getAuthHeaders().headers,
          'Content-Type': 'multipart/form-data',
        },
      }
      const formData = new FormData()
      formData.append('file', file)

      await axios.post(`${API_URL}/campaigns/import`, formData, config)
      // On success, show toast, refetch data, and close the modal
      toast.success('Campaigns imported successfully!')
      await fetchCampaigns() // Re-fetch data to update the table
      setIsImportModalOpen(false)
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to import campaigns.'
      toast.error(errorMessage) // Show error toast directly
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      header: 'Campaign Name',
      accessor: 'title',
      render: (_, row) => (
        <span className="font-medium text-[var(--text)]">
          {row.title || row.name || 'Untitled Campaign'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      render: (_, row) => (
        <span className="text-sm text-[var(--muted)]">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
            : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (_, row) => {
        let status = 'Pending'
        if (row.status && ['Live', 'Paused', 'Pending'].includes(row.status)) {
          status = row.status
        } else if (typeof row.isActive === 'boolean') {
          status = row.isActive ? 'Live' : 'Paused'
        }
        return (
          <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-medium shadow-sm ${statusStyles[status] || statusStyles.Paused}`}>
            {status}
          </span>
        )
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (_, campaign) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Edit Campaign"
            onClick={() => handleOpenEdit(campaign)}
            className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-amber-100 hover:text-amber-600"
          >
            <Edit size={18} />
          </button>
          <button
            type="button"
            title="Delete Campaign"
            onClick={() => handleOpenDelete(campaign)}
            className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 size={18} />
          </button>
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
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Campaign Management</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Create, edit, and delete your marketing campaigns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={isLoading || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-95 disabled:opacity-50"
            >
              <Plus size={18} />
              Create Campaign
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Campaigns Table */}
        <div className="rounded-2xl shadow-sm">
          <DynamicTable
            columns={columns}
            data={campaigns}
            isLoading={isLoading}
          />
        </div>
      </div>
      {/* Create / Edit Modal */}
      <Modal
        open={isCreateEditModalOpen}
        title={selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateEditModalOpen(false)
            setSelectedCampaign(null)
          }
        }}
        size="md"
      >
        <CreateCampaign
          onSubmit={handleSaveCampaign}
          isLoading={isSubmitting}
          initialData={selectedCampaign}
          onCancel={() => {
            setIsCreateEditModalOpen(false)
            setSelectedCampaign(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Popup */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${selectedCampaign?.title || selectedCampaign?.name || 'this campaign'}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          if (!isSubmitting) {
            setIsDeleteModalOpen(false)
            setSelectedCampaign(null)
          }
        }}
      />

      {/* Import Modal */}
      <ImportCampaignModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCampaigns}
        isLoading={isSubmitting}
      />
    </>
  )
}

export default CampaignManagement
import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Search, ArrowLeft, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react'
import ImportCampaignModal from './ImportCampaignModal'
import AssignModal from './AssignModal'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

const API_BASE_URL ='https://crm-backend-5-iocr.onrender.com/api'
const PAGE_SIZE = 10

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateTime = (value) => {
  if (!value) return 'N/A'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getCampaignTitle = (campaign) => {
  if (!campaign || typeof campaign !== 'object') {
    return 'Campaign'
  }

  return (
    campaign.title ||
    campaign.name ||
    campaign.campaignName ||
    campaign.heading ||
    'Campaign'
  )
}

const LeadDetails = () => {
  const { id: campaignId } = useParams()
  const location = useLocation()

  const campaignNameFromList =
    location.state?.campaignName || 'Campaign'

  const [campaign, setCampaign] = useState({
    title: campaignNameFromList,
  })

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLeadIds, setSelectedLeadIds] = useState([])
  const [filterQuery, setFilterQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('unassigned')
  const [totalLeads, setTotalLeads] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  
  const fetchLeads = useCallback(async () => {
    if (!campaignId) return

    setLoading(true)
    setError(null)

    const token = Cookies.get('token')

    if (!token) {
      setError(
        'Authorization token not found. Please log in again.'
      )
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams()

      params.append('page', String(page))
      params.append('limit', String(PAGE_SIZE))

      if (assignedFilter !== 'all') {
        params.append('assigned', assignedFilter)
      }

      if (filterQuery.trim()) {
        params.append(
          'search',
          filterQuery.trim()
        )
      }

      if (fromDate) {
        params.append('fromDate', fromDate)
      }

      if (toDate) {
        params.append('toDate', toDate)
      }

      const queryString = params.toString()

      const url = queryString
        ? `${API_BASE_URL}/campaigns/${campaignId}/leads?${queryString}`
        : `${API_BASE_URL}/campaigns/${campaignId}/leads`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const responseText = await response.text()

      if (!response.ok) {
        let message = `Failed to fetch leads (${response.status})`

        try {
          const errorData = responseText
            ? JSON.parse(responseText)
            : {}

          message =
            errorData?.message ||
            errorData?.error ||
            message
        } catch {
          if (responseText) {
            message = responseText
          }
        }

        throw new Error(message)
      }

      let data = {}

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {}
      } catch {
        throw new Error(
          'Invalid response received from server.'
        )
      }

      let leadsData = []

      if (Array.isArray(data)) {
        leadsData = data
      } else if (Array.isArray(data?.leads)) {
        leadsData = data.leads
      } else if (Array.isArray(data?.data)) {
        leadsData = data.data
      } else if (
        Array.isArray(data?.data?.leads)
      ) {
        leadsData = data.data.leads
      }

      setLeads(leadsData)

      const campaignData =
        data?.campaign ||
        data?.data?.campaign

      if (
        campaignData &&
        typeof campaignData === 'object'
      ) {
        setCampaign((prev) => ({
          ...prev,
          ...campaignData,
        }))
      }

      const pagination =
        data?.pagination ||
        data?.meta ||
        data?.data?.pagination ||
        data?.data?.meta ||
        {}

      const total =
        data?.total ??
        data?.data?.total ??
        data?.totalCount ??
        data?.data?.totalCount ??
        pagination.total ??
        pagination.totalItems ??
        leadsData.length

      const pages =
        data?.totalPages ??
        data?.data?.totalPages ??
        pagination.totalPages ??
        pagination.pages ??
        Math.max(Math.ceil(Number(total) / PAGE_SIZE), 1)

      setTotalLeads(Number(total) || leadsData.length)
      setTotalPages(Math.max(Number(pages) || 1, 1))
    } catch (err) {
      setError(
        err?.message ||
          'Something went wrong while fetching leads.'
      )
    } finally {
      setLoading(false)
    }
  }, [
    campaignId,
    assignedFilter,
    filterQuery,
    fromDate,
    toDate,
    page,
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads()
    }, filterQuery ? 500 : 0)

    return () => clearTimeout(timer)
  }, [
    fetchLeads,
    filterQuery,
    fromDate,
    toDate,
    assignedFilter,
    page,
  ])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const resetToFirstPage = () => {
    setPage(1)
    setSelectedLeadIds([])
  }

  const displayedRange = totalLeads === 0
    ? 'No leads found'
    : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, totalLeads)} of ${totalLeads}`

  const handleImportLeads = async (file) => {
    if (!file) {
      throw new Error('Please select a file.')
    }

    const token = Cookies.get('token')

    if (!token) {
      const message = 'Authorization token not found. Please log in again.'

      setError(message)
      throw new Error(message)
    }

    setIsImporting(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(
        `${API_BASE_URL}/campaigns/${campaignId}/leads/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      const responseText =
        await response.text()

      if (!response.ok) {
        let message = `Import failed (${response.status})`

        try {
          const errorData = responseText
            ? JSON.parse(responseText)
            : {}

          message =
            errorData?.message ||
            errorData?.error ||
            message
        } catch {
          if (responseText) {
            message = responseText
          }
        }

        throw new Error(message)
      }

      await fetchLeads()

      setIsImportModalOpen(false)

      toast.success(
        'Leads imported successfully!'
      )

      return true
    } catch (err) {
      toast.error(
        err?.message ||
          'Failed to import leads.'
      )

      throw err
    } finally {
      setIsImporting(false)
    }
  }
  const getTcOptions = () => {
    const map = new Map()

    leads.forEach((lead) => {
      const assignedTo = lead?.assignedTo

      if (
        assignedTo &&
        (assignedTo._id || assignedTo.id)
      ) {
        const id =
          assignedTo._id ||
          assignedTo.id

        if (!map.has(id)) {
          map.set(
            id,
            assignedTo.name ||
              assignedTo.fullName ||
              `TC ${String(id).slice(0, 6)}`
          )
        }
      }
    })

    return Array.from(
      map.entries()
    ).map(([id, name]) => ({
      id,
      name,
    }))
  }

  const assignLeads = async (
    count,
    tcId,
    selectedIds = []
  ) => {
    const token = Cookies.get('token')

    if (!token) {
      throw new Error(
        'Authorization token not found. Please log in again.'
      )
    }

    if (!tcId) {
      throw new Error(
        'Please select a TC to assign leads to.'
      )
    }

    const normalizedSelectedIds =
      selectedIds.filter(Boolean)

    const hasSelectedLeads =
      normalizedSelectedIds.length > 0

    const leadCount =
      Number(count) || 0

    if (
      !hasSelectedLeads &&
      leadCount <= 0
    ) {
      throw new Error(
        'Please enter a valid number of leads to assign.'
      )
    }

    setIsAssigning(true)

    try {
      let response

      if (hasSelectedLeads) {
        response = await fetch(
          `${API_BASE_URL}/leads/assign`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              leadIds:
                normalizedSelectedIds,
              assignedTo: tcId,
            }),
          }
        )
      } else {
        response = await fetch(
          `${API_BASE_URL}/campaigns/${campaignId}/leads/assign-by-count`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              count: leadCount,
              userId: tcId,
            }),
          }
        )
      }

      const responseText =
        await response.text()

      if (!response.ok) {
        let message = `Assign failed (${response.status})`

        try {
          const errorData = responseText
            ? JSON.parse(responseText)
            : {}

          message =
            errorData?.message ||
            errorData?.error ||
            message
        } catch {
          if (responseText) {
            message = responseText
          }
        }

        throw new Error(message)
      }

      toast.success(
        hasSelectedLeads
          ? 'Selected leads assigned successfully'
          : 'Leads assigned successfully'
      )

      setSelectedLeadIds([])

      await fetchLeads()

      return true
    } catch (err) {
      toast.error(
        err?.message ||
          'Failed to assign leads.'
      )

      throw err
    } finally {
      setIsAssigning(false)
    }
  }

  const toggleLeadSelection = (leadId) => {
    if (!leadId) return

    setSelectedLeadIds((prev) => {
      if (prev.includes(leadId)) {
        return prev.filter(
          (id) => id !== leadId
        )
      }

      return [...prev, leadId]
    })
  }
  const toggleSelectAllRows = () => {
    const visibleIds = leads
      .map(
        (lead) =>
          lead._id || lead.id
      )
      .filter(Boolean)

    if (visibleIds.length === 0) {
      return
    }

    const allSelected =
      visibleIds.every((id) =>
        selectedLeadIds.includes(id)
      )

    if (allSelected) {
      setSelectedLeadIds((prev) =>
        prev.filter(
          (id) =>
            !visibleIds.includes(id)
        )
      )

      return
    }

    setSelectedLeadIds((prev) => [
      ...new Set([
        ...prev,
        ...visibleIds,
      ]),
    ])
  }

  const selectedLeadCount =
    selectedLeadIds.length

  const allLeadsSelected =
    leads.length > 0 &&
    leads.every((lead) => {
      const leadId =
        lead._id || lead.id

      return (
        leadId &&
        selectedLeadIds.includes(
          leadId
        )
      )
    })

  const tcOptions = getTcOptions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">
            Campaign Leads
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            {getCampaignTitle(campaign)}
          </h1>

          <p className="mt-1 text-sm text-[var(--muted)]">
            View and manage leads for
            this campaign.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setIsImportModalOpen(true)
            }
            disabled={isImporting}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={16} />
            Import Leads
          </button>

          <Link
            to="/leads"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--surface-alt)]"
          >
            <ArrowLeft size={16} />
            Back to Campaigns
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={20}
          />

          <input
            type="text"
            placeholder="Search leads..."
            value={filterQuery}
            onChange={(e) =>
              (() => {
                setFilterQuery(e.target.value)
                resetToFirstPage()
              })()
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-11 pr-4 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            (() => {
              setFromDate(e.target.value)
              resetToFirstPage()
            })()
          }
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            (() => {
              setToDate(e.target.value)
              resetToFirstPage()
            })()
          }
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>

      {/* Actions */}
      {!loading && !error && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-[var(--muted)]">
            Showing{' '}
            <span className="font-semibold text-[var(--text)]">
              {leads.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-[var(--text)]">
              {totalLeads}
            </span>{' '}
            leads
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Assignment filter */}
            <div className="flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
              {[
                ['unassigned', 'Unassigned'],
                ['assigned', 'Assigned'],
                ['all', 'All'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAssignedFilter(value)
                    resetToFirstPage()
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    assignedFilter === value
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setIsAssignModalOpen(true)
              }
              disabled={isAssigning}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {/* Selection info */}
      {!loading &&
        !error &&
        selectedLeadCount > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text)]">
            <span>
              {selectedLeadCount}{' '}
              lead
              {selectedLeadCount === 1
                ? ''
                : 's'}{' '}
              selected for assignment.
            </span>

            <button
              type="button"
              onClick={() =>
                setSelectedLeadIds([])
              }
              className="text-sm font-semibold text-[var(--primary)] hover:opacity-80"
            >
              Clear selection
            </button>
          </div>
        )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-4 font-semibold text-[var(--muted)]">
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allLeadsSelected}
                      onChange={
                        toggleSelectAllRows
                      }
                      disabled={
                        leads.length === 0 ||
                        loading
                      }
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </label>
                </th>

                <th className="px-4 py-4 font-semibold text-[var(--muted)]">
                  Date
                </th>

                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Name
                </th>

                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Mobile No
                </th>

                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Pin code
                </th>

                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Address
                </th>

                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  TC name
                </th>

                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Last activity
                </th>

                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {/* Loading */}
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-[var(--muted)]">
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />

                      <span>
                        Loading leads...
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Error */}
              {!loading && error && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-red-500"
                  >
                    Error: {error}
                  </td>
                </tr>
              )}

              {/* Leads */}
              {!loading &&
                !error &&
                leads.length > 0 &&
                leads.map((row) => {
                  const leadId =
                    row._id || row.id

                  return (
                    <tr
                      key={
                        leadId ||
                        `${row.mobile}-${row.createdAt}`
                      }
                      className="hover:bg-[var(--surface-alt)]"
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={
                            !!leadId &&
                            selectedLeadIds.includes(
                              leadId
                            )
                          }
                          onChange={() =>
                            toggleLeadSelection(
                              leadId
                            )
                          }
                          disabled={!leadId}
                          className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[var(--muted)]">
                        {formatDate(
                          row.createdAt
                        )}
                      </td>

                      <td className="px-6 py-4 font-medium text-[var(--text)]">
                        {row.name || 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-[var(--muted)]">
                        {row.mobile || 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-[var(--muted)]">
                        {row.pincode || 'N/A'}
                      </td>

                      <td
                        className="max-w-xs truncate px-6 py-4 text-[var(--muted)]"
                        title={row.address || ''}
                      >
                        {row.address || 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-[var(--muted)]">
                        {row.assignedTo?.name ||
                          'N/A'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-[var(--muted)]">
                        {formatDateTime(
                          row.activityAt ||
                          row.lastActivityAt ||
                          row.assignedAt ||
                          row.updatedAt ||
                          row.createdAt
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled
                          className="cursor-not-allowed rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white opacity-50 shadow-sm"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  )
                })}

              {/* Empty */}
              {!loading &&
                !error &&
                leads.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-[var(--muted)]"
                    >
                      No leads found for this campaign.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>{displayedRange}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page === 1 || loading}
              aria-label="Previous page"
              className="rounded-lg border border-[var(--border)] p-2 text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="min-w-24 text-center font-medium text-[var(--text)]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page >= totalPages || loading}
              aria-label="Next page"
              className="rounded-lg border border-[var(--border)] p-2 text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      <AssignModal
        open={isAssignModalOpen}
        onClose={() =>
          setIsAssignModalOpen(false)
        }
        leadsCount={leads.length}
        tcOptions={tcOptions}
        onAssign={assignLeads}
        isAssigning={isAssigning}
        selectedLeadIds={selectedLeadIds}
      />

      {/* Import modal */}
      <ImportCampaignModal
        open={isImportModalOpen}
        campaignId={campaignId}
        onClose={() =>
          setIsImportModalOpen(false)
        }
        onImport={handleImportLeads}
        isLoading={isImporting}
      />
    </div>
  )
}

export default LeadDetails

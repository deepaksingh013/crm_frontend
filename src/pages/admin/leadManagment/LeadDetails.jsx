import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Search, ArrowLeft, Upload, Loader2 } from 'lucide-react'
import ImportCampaignModal from './ImportCampaignModal'
import AssignModal from './AssignModal'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

const API_BASE_URL = 'https://crm-backend-5-iocr.onrender.com/api'

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

const getCampaignTitle = (campaignValue) => {
  if (!campaignValue || typeof campaignValue !== 'object') {
    return 'Campaign'
  }

  return (
    campaignValue.title ||
    campaignValue.name ||
    campaignValue.campaignName ||
    campaignValue.heading ||
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)

  const [assignedFilter, setAssignedFilter] =
    useState('unassigned')
  const fetchLeads = useCallback(
    async (page = 1, assigned = 'unassigned') => {
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
        params.append('page', page)
        params.append('limit', pageSize)
        if (assigned && assigned !== 'all') {
          params.append('assigned', assigned)
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

        const url =`${API_BASE_URL}/campaigns/${campaignId}/leads?${params.toString()}`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const responseText = await response.text()
        if (!response.ok) {
          let errorMessage = `Failed to fetch leads (${response.status})`

          try {
            const errorData =
              JSON.parse(responseText)

            errorMessage =
              errorData?.message ||
              errorData?.error ||
              errorMessage
          } catch {
            if (responseText) {
              errorMessage = responseText
            }
          }

          throw new Error(errorMessage)
        }

        let data = {}
        try {
          data = responseText
            ? JSON.parse(responseText)
            : {}
        } catch (parseError) {
          throw new Error('Invalid response received from server.')
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

        const campaignPayload =
          data?.campaign ||
          data?.data?.campaign ||
          null
        if (
          campaignPayload &&
          typeof campaignPayload === 'object'
        ) {
          setCampaign((prev) => ({
            ...prev,
            ...campaignPayload,
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
          pagination?.total ??
          data?.data?.total ??
          leadsData.length

        const limit =
          data?.limit ??
          pagination?.limit ??
          data?.data?.limit ??
          pageSize

        const serverPage =
          data?.page ??
          pagination?.page ??
          data?.data?.page ??
          page

        const serverTotalPages =
          data?.totalPages ??
          pagination?.totalPages ??
          data?.data?.totalPages ??
          Math.ceil(
            Number(total) / Number(limit)
          )

        setTotalLeads(
          Number(total) || 0
        )

        setTotalPages(
          Math.max(
            1,
            Number(serverTotalPages) || 1
          )
        )

        setCurrentPage(
          Number(serverPage) || page
        )
      } catch (err) {
        setError( err.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    },
    [
      campaignId,
      pageSize,
      filterQuery,
      fromDate,
      toDate,
    ]
  )

  useEffect(() => {
    fetchLeads(1, assignedFilter)
  }, [
    assignedFilter,
    pageSize,
    fetchLeads,
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(1, assignedFilter)
    }, 500)

    return () => clearTimeout(timer)
  }, [ filterQuery, fromDate, toDate, assignedFilter, fetchLeads,])

  const handleImportLeads = async (file) => {
    if (!file) {
      throw new Error('Please select a file.')
    }

    const token = Cookies.get('token')
    if (!token) {
      setError('Authorization token not found. Please log in again.')

      throw new Error('Not authenticated')
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
        let errorMessage = `Import failed (${response.status})`

        try {
          const errorData =
            JSON.parse(responseText)

          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorMessage
        } catch {
          if (responseText) {
            errorMessage = responseText
          }
        }

        throw new Error(errorMessage)
      }

      await fetchLeads(
        currentPage,
        assignedFilter
      )

      setIsImportModalOpen(false)

      toast.success(
        'Leads imported successfully!'
      )

      return true
    } catch (err) {
      toast.error( err.message || 'Failed to import leads.')
      throw err
    } finally {
      setIsImporting(false)
    }
  }

  const tcOptions = useMemo(() => {
    const map = new Map()

    leads.forEach((lead) => {
      const assignedTo =
        lead?.assignedTo

      if (
        assignedTo &&
        (assignedTo._id ||
          assignedTo.id)
      ) {
        const id =
          assignedTo._id ||
          assignedTo.id

        if (!map.has(id)) {
          map.set(
            id,
            assignedTo.name ||
            assignedTo.fullName ||
            `TC ${id.slice(0, 6)}`
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
  }, [leads])

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
      (selectedIds || [])
        .map((id) => id)
        .filter(Boolean)

    const hasSelectedLeads =
      normalizedSelectedIds.length > 0

    const c = Number(count) || 0

    if (!hasSelectedLeads && c <= 0) {
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
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              count: c,
              userId: tcId,
            }),
          }
        )
      }

      const responseText =
        await response.text()

      if (!response.ok) {
        let errorMessage = `Assign failed (${response.status})`

        try {
          const errorData =
            JSON.parse(responseText)

          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorMessage
        } catch {
          if (responseText) {
            errorMessage =
              responseText
          }
        }

        throw new Error(
          errorMessage
        )
      }

      toast.success(
        hasSelectedLeads
          ? 'Selected leads assigned successfully'
          : 'Leads assigned successfully'
      )

      setSelectedLeadIds([])

      await fetchLeads(
        currentPage,
        assignedFilter
      )

      return true
    } finally {
      setIsAssigning(false)
    }
  }

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages
      )
    }
  }, [
    currentPage,
    totalPages,
  ])

  const toggleLeadSelection = (
    leadId
  ) => {
    if (!leadId) return

    setSelectedLeadIds(
      (prev) => {
        if (
          prev.includes(leadId)
        ) {
          return prev.filter(
            (id) =>
              id !== leadId
          )
        }

        return [
          ...prev,
          leadId,
        ]
      }
    )
  }

  const toggleSelectAllVisibleRows =
    () => {
      const visibleIds =
        leads
          .map(
            (row) =>
              row._id ||
              row.id
          )
          .filter(Boolean)

      if (
        visibleIds.length === 0
      ) {
        return
      }

      const allVisibleSelected =
        visibleIds.every(
          (id) =>
            selectedLeadIds.includes(
              id
            )
        )

      if (
        allVisibleSelected
      ) {
        setSelectedLeadIds(
          (prev) =>
            prev.filter(
              (id) =>
                !visibleIds.includes(
                  id
                )
            )
        )

        return
      }

      setSelectedLeadIds(
        (prev) => [
          ...new Set([
            ...prev,
            ...visibleIds,
          ]),
        ]
      )
    }

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return
    }

    setSelectedLeadIds([])

    fetchLeads(
      page,
      assignedFilter
    )
  }

  const selectedLeadCount =
    selectedLeadIds.length

  const allVisibleSelected =
    leads.length > 0 &&
    leads.every((row) => {
      const leadId =
        row._id || row.id

      return (
        leadId &&
        selectedLeadIds.includes(
          leadId
        )
      )
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">
            Campaign Leads
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            {getCampaignTitle(
              campaign
            )}
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
              setIsImportModalOpen(
                true
              )
            }
            disabled={
              isImporting
            }
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={20}
          />

          <input
            type="text"
            placeholder="Search leads..."
            value={
              filterQuery
            }
            onChange={(e) =>
              setFilterQuery(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-11 pr-4 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(
              e.target.value
            )
          }
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(
              e.target.value
            )
          }
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        />

        <select
          value={
            assignedFilter
          }
          onChange={(e) => {
            setAssignedFilter(
              e.target.value
            )
            setSelectedLeadIds(
              []
            )
          }}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
        >
          <option value="unassigned">
            Unassigned
          </option>

          <option value="assigned">
            Assigned
          </option>

          <option value="all">
            All
          </option>
        </select>
      </div>

      {/* Top info / actions */}
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setIsAssignModalOpen(
                  true
                )
              }
              disabled={
                isAssigning
              }
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Assign
            </button>

            <select
              value={
                pageSize
              }
              onChange={(e) => {
                setPageSize(
                  Number(
                    e.target.value
                  )
                )

                setCurrentPage(
                  1
                )

                setSelectedLeadIds(
                  []
                )
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            >
              <option value={10}>
                10 / page
              </option>

              <option value={20}>
                20 / page
              </option>

              <option value={50}>
                50 / page
              </option>

              <option value={100}>
                100 / page
              </option>
            </select>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        selectedLeadCount > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm text-[var(--text)]">
            <span>
              {selectedLeadCount}{' '}
              lead
              {selectedLeadCount ===
                1
                ? ''
                : 's'}{' '}
              selected for
              assignment.
            </span>

            <button
              type="button"
              onClick={() =>
                setSelectedLeadIds(
                  []
                )
              }
              className="text-sm font-semibold text-[var(--primary)] hover:opacity-80"
            >
              Clear selection
            </button>
          </div>
        )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-4 font-semibold text-[var(--muted)]">
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={
                        allVisibleSelected
                      }
                      onChange={
                        toggleSelectAllVisibleRows
                      }
                      disabled={
                        leads.length ===
                        0 ||
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
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
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

              {!loading &&
                error && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-red-500"
                    >
                      Error:{' '}
                      {error}
                    </td>
                  </tr>
                )}

              {!loading &&
                !error &&
                leads.length >
                0 &&
                leads.map(
                  (row) => {
                    const leadId =
                      row._id ||
                      row.id

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
                            disabled={
                              !leadId
                            }
                            className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-[var(--muted)]">
                          {formatDate(
                            row.createdAt
                          )}
                        </td>

                        <td className="px-6 py-4 font-medium text-[var(--text)]">
                          {row.name ||
                            'N/A'}
                        </td>

                        <td className="px-6 py-4 text-[var(--muted)]">
                          {row.mobile ||
                            'N/A'}
                        </td>

                        <td className="px-6 py-4 text-[var(--muted)]">
                          {row.pincode ||
                            'N/A'}
                        </td>

                        <td
                          className="max-w-xs truncate px-6 py-4 text-[var(--muted)]"
                          title={
                            row.address ||
                            ''
                          }
                        >
                          {row.address ||
                            'N/A'}
                        </td>

                        <td className="px-6 py-4 text-[var(--muted)]">
                          {row
                            .assignedTo
                            ?.name ||
                            'N/A'}
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
                  }
                )}

              {!loading &&
                !error &&
                leads.length ===
                0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-[var(--muted)]"
                    >
                      {totalLeads ===
                        0
                        ? 'No leads found for this campaign.'
                        : 'No leads found on this page.'}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {!loading &&
          !error &&
          totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-[var(--border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-[var(--muted)]">
                Showing page{' '}
                <span className="font-semibold text-[var(--text)]">
                  {currentPage}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[var(--text)]">
                  {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage -
                      1
                    )
                  }
                  disabled={
                    currentPage <=
                    1 ||
                    loading
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="min-w-[90px] text-center text-xs font-medium text-[var(--muted)]">
                  Page{' '}
                  {currentPage}{' '}
                  of{' '}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage +
                      1
                    )
                  }
                  disabled={
                    currentPage >=
                    totalPages ||
                    loading
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>

      <AssignModal
        open={isAssignModalOpen} onClose={() =>
          setIsAssignModalOpen(
            false
          )
        }
        leadsCount={
          leads.length
        }
        tcOptions={
          tcOptions
        }
        onAssign={
          assignLeads
        }
        isAssigning={
          isAssigning
        }
        selectedLeadIds={
          selectedLeadIds
        }
      />

      <ImportCampaignModal
        open={isImportModalOpen} campaignId={campaignId} onClose={() => setIsImportModalOpen(false)}
        onImport={
          handleImportLeads
        }
        isLoading={
          isImporting
        }
      />
    </div>
  )
}

export default LeadDetails

import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Search, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Upload, Loader2, UserRound, UserPlus, RotateCcw,} from 'lucide-react'
import ImportCampaignModal from './ImportCampaignModal'
import AssignModal from './AssignModal'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

const API_BASE_URL = 'https://crm-backend-5-iocr.onrender.com/api'
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

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

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

const STATUS_TABS = [
  {
    label: 'New leads',
    value: 'New',
  },
  {
    label: 'Pending',
    value: 'Pending',
  },
  {
    label: 'Completed',
    value: 'Complete',
  },
  {
    label: 'Not contacted',
    value: 'Not Connected',
  },
  {
    label: 'Holding',
    value: 'Holding',
  },
  {
    label: 'Rejected',
    value: 'Reject',
  },
]

const getStatusLabel = (status) => {
  const normalizedStatus = String(status || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

  const labels = {
    new: 'New leads',
    pending: 'Pending',
    complete: 'Completed',
    completed: 'Completed',
    connected: 'Completed',
    notconnected: 'Not contacted',
    holding: 'Holding',
    hold: 'Holding',
    reject: 'Rejected',
    rejected: 'Rejected',
  }

  return labels[normalizedStatus] || status || 'N/A'
}

const getStatusClass = (status) => {
  const normalizedStatus = String(status || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

  const classes = {
    new: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    complete: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-emerald-50 text-emerald-700',
    connected: 'bg-emerald-50 text-emerald-700',
    notconnected: 'bg-slate-100 text-slate-700',
    holding: 'bg-orange-50 text-orange-700',
    hold: 'bg-orange-50 text-orange-700',
    reject: 'bg-red-50 text-red-700',
    rejected: 'bg-red-50 text-red-700',
  }

  return (
    classes[normalizedStatus] ||
    'bg-slate-100 text-slate-700'
  )
}

const isTelecaller = (user) => {
  const role = String(
    user?.role ||
      user?.userRole ||
      user?.user?.role ||
      user?.user?.userRole ||
      ''
  )
    .toLowerCase()
    .trim()

  return [
    'tc',
    'telecaller',
    'tele caller',
    'tele-caller',
  ].includes(role)
}

const getUserId = (user) =>
  user?._id ||
  user?.id ||
  user?.userId ||
  user?.user?._id ||
  user?.user?.id ||
  user?.user?.userId

const getUserName = (user) =>
  user?.name ||
  user?.fullName ||
  user?.username ||
  user?.user?.name ||
  user?.user?.fullName ||
  user?.user?.username ||
  user?.email ||
  user?.user?.email ||
  'Unnamed telecaller'

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

  const [selectedLeadIds, setSelectedLeadIds] =
    useState([])

  // Filters
  const [filterQuery, setFilterQuery] =
    useState('')

  const [fromDate, setFromDate] =
    useState('')

  const [toDate, setToDate] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('New')

  // TC filter
  const [selectedTcId, setSelectedTcId] =
    useState('')

  const [telecallers, setTelecallers] =
    useState([])

  const [telecallersLoading, setTelecallersLoading] =
    useState(false)

  const [totalLeads, setTotalLeads] =
    useState(0)

  const [page, setPage] =
    useState(1)

  const [totalPages, setTotalPages] =
    useState(1)

  // Import
  const [isImportModalOpen, setIsImportModalOpen] =
    useState(false)

  const [isImporting, setIsImporting] =
    useState(false)

  // Assign
  const [isAssignModalOpen, setIsAssignModalOpen] =
    useState(false)

  const [isAssigning, setIsAssigning] =
    useState(false)

  useEffect(() => {
    const fetchTelecallers = async () => {
      const token = Cookies.get('token')

      if (!token) return

      setTelecallersLoading(true)

      try {
        const response = await fetch(
          `${API_BASE_URL}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const responseText =
          await response.text()

        const data = responseText
          ? JSON.parse(responseText)
          : []

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              'Failed to fetch telecallers.'
          )
        }

        const users = Array.isArray(data)
          ? data
          : data?.users ||
            data?.data?.users ||
            data?.data ||
            []

        const tcUsers = Array.isArray(users)
          ? users.filter(isTelecaller)
          : []

        setTelecallers(tcUsers)
      } catch (err) {
        setError(
          err?.message ||
            'Failed to fetch telecallers.'
        )
      } finally {
        setTelecallersLoading(false)
      }
    }

    fetchTelecallers()
  }, [])

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
      const params =
        new URLSearchParams()

      params.append(
        'page',
        String(page)
      )

      params.append(
        'limit',
        String(PAGE_SIZE)
      )

      if (statusFilter) {
        params.append(
          'status',
          statusFilter
        )
      }

      if (selectedTcId) {
        params.append(
          'assignedTo',
          selectedTcId
        )
      }

      if (filterQuery.trim()) {
        params.append(
          'search',
          filterQuery.trim()
        )
      }

      if (fromDate) {
        params.append(
          'fromDate',
          fromDate
        )
      }

      if (toDate) {
        params.append(
          'toDate',
          toDate
        )
      }

      const queryString =
        params.toString()

      const url = queryString
        ? `${API_BASE_URL}/campaigns/${campaignId}/leads?${queryString}`
        : `${API_BASE_URL}/campaigns/${campaignId}/leads`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type':
            'application/json',
        },
      })

      const responseText =
        await response.text()

      if (!response.ok) {
        let message = `Failed to fetch leads (${response.status})`

        try {
          const errorData =
            responseText
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
        throw new Error( 'Invalid response received from server.')
      }

      let leadsData = []
      if (Array.isArray(data)) {
        leadsData = data
      } else if (
        Array.isArray(data?.leads)
      ) {
        leadsData = data.leads
      } else if (
        Array.isArray(data?.data)
      ) {
        leadsData = data.data
      } else if (
        Array.isArray(
          data?.data?.leads
        )
      ) {
        leadsData =
          data.data.leads
      }

      setLeads(leadsData)

     
      const campaignData =
        data?.campaign ||
        data?.data?.campaign

      if (
        campaignData &&
        typeof campaignData ===
          'object'
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
        Math.max(
          Math.ceil(
            Number(total) /
              PAGE_SIZE
          ),
          1
        )

      setTotalLeads(
        Number(total) ||
          leadsData.length
      )

      setTotalPages(
        Math.max(
          Number(pages) || 1,
          1
        )
      )
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
    selectedTcId,
    statusFilter,
    filterQuery,
    fromDate,
    toDate,
    page,
  ])

 
  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchLeads()
      },
      filterQuery ? 500 : 0
    )

    return () =>
      clearTimeout(timer)
  }, [
    fetchLeads,
    filterQuery,
    fromDate,
    toDate,
    statusFilter,
    selectedTcId,
    page,
  ])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [
    page,
    totalPages,
  ])

 
  const resetToFirstPage = () => {
    setPage(1)
    setSelectedLeadIds([])
  }


  const handleImportLeads = async (
    file
  ) => {
    if (!file) {
      throw new Error(
        'Please select a file.'
      )
    }

    const token =
      Cookies.get('token')

    if (!token) {
      const message =
        'Authorization token not found. Please log in again.'

      setError(message)

      throw new Error(message)
    }

    setIsImporting(true)
    setError(null)

    const formData =
      new FormData()

    formData.append(
      'file',
      file
    )

    try {
      const response =
        await fetch(
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
          const errorData =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {}

          message =
            errorData?.message ||
            errorData?.error ||
            message
        } catch {
          if (responseText) {
            message =
              responseText
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
    return telecallers
      .map((telecaller) => {
        const id =
          getUserId(
            telecaller
          )

        if (!id) {
          return null
        }

        return {
          id,
          name:
            getUserName(
              telecaller
            ),
        }
      })
      .filter(Boolean)
  }

  const assignLeads = async (
    count,
    tcId,
    selectedIds = []
  ) => {
    const token =
      Cookies.get('token')

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
      normalizedSelectedIds.length >
      0

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
        response =
          await fetch(
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
      }

      else {
        response =
          await fetch(
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
                status: statusFilter,
                userId: tcId,
                ...(selectedTcId ? { fromUserId: selectedTcId } : {}),
              }),
            }
          )
      }

      const responseText =
        await response.text()

      if (!response.ok) {
        let message = `Assign failed (${response.status})`

        try {
          const errorData =
            responseText
              ? JSON.parse(
                  responseText
                )
              : {}

          message =
            errorData?.message ||
            errorData?.error ||
            message
        } catch {
          if (responseText) {
            message =
              responseText
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
  const toggleLeadSelection = (
    leadId
  ) => {
    if (!leadId) return

    setSelectedLeadIds(
      (prev) => {
        if (
          prev.includes(
            leadId
          )
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

  const toggleSelectAllRows =
    () => {
      const visibleIds =
        leads
          .map(
            (lead) =>
              lead._id ||
              lead.id
          )
          .filter(Boolean)

      if (
        visibleIds.length ===
        0
      ) {
        return
      }

      const allSelected =
        visibleIds.every(
          (id) =>
            selectedLeadIds.includes(
              id
            )
        )

      if (allSelected) {
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
  const selectedLeadCount =
    selectedLeadIds.length

  const allLeadsSelected =
    leads.length > 0 &&
    leads.every(
      (lead) => {
        const leadId =
          lead._id ||
          lead.id

        return (
          leadId &&
          selectedLeadIds.includes(
            leadId
          )
        )
      }
    )

  const tcOptions =
    getTcOptions()

  const displayedRange =
    totalLeads === 0
      ? ''
      : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(
          page * PAGE_SIZE,
          totalLeads
        )} of ${totalLeads}`
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--primary)]">
            Campaign Leads
          </p>

          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-[var(--text)]">
            {getCampaignTitle(
              campaign
            )}
          </h1>

          <p className="mt-1 text-sm text-[var(--muted)]">
            View and manage leads for
            this campaign.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">

          {/* IMPORT */}
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
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-4"
          >
            {isImporting ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Upload
                size={17}
              />
            )}

            {isImporting
              ? 'Importing...'
              : 'Import Leads'}
          </button>

          {/* BACK */}
          <Link
            to="/leads"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] shadow-sm transition-all hover:bg-[var(--surface-alt)]"
          >
            <ArrowLeft
              size={17}
            />

            <span className="hidden sm:inline">
              Back
            </span>
          </Link>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
        {/* SEARCH */}
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />

          <input
            type="text"
            placeholder="Search leads..."
            value={
              filterQuery
            }
            onChange={(e) => {
              setFilterQuery(
                e.target.value
              )

              resetToFirstPage()
            }}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
          />
        </div>

        {/* FROM DATE */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(
              e.target.value
            )

            resetToFirstPage()
          }}
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
        />

        {/* TO DATE */}
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(
              e.target.value
            )

            resetToFirstPage()
          }}
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
        />
      </div>

      {!loading &&
        !error && (
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-full flex-wrap items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
              {STATUS_TABS.map(
                ({
                  value,
                  label,
                }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(
                        value
                      )

                      resetToFirstPage()
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all sm:px-4 ${
                      statusFilter ===
                      value
                        ? 'bg-[var(--primary)] text-white shadow-sm'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <div className="relative min-w-0 flex-1 lg:flex-none">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]"
                />
                <select
                  value={
                    selectedTcId
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedTcId(
                      event.target
                        .value
                    )

                    resetToFirstPage()
                  }}
                  disabled={
                    telecallersLoading
                  }
                  className="h-11 w-full min-w-0 appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-10 text-sm font-semibold text-[var(--text)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-[190px]"
                >
                  <option value="">
                    {telecallersLoading
                      ? 'Loading TC...'
                      : 'All Telecallers'}
                  </option>

                  {telecallers.map(
                    (
                      telecaller
                    ) => {
                      const userId =
                        getUserId(
                          telecaller
                        )

                      return userId ? (
                        <option
                          key={
                            userId
                          }
                          value={
                            userId
                          }
                        >
                          {getUserName(
                            telecaller
                          )}
                        </option>
                      ) : null
                    }
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
              </div>

              {/* CLEAR TC */}
              {selectedTcId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTcId(
                      ''
                    )

                    resetToFirstPage()
                  }}
                  title="Clear telecaller filter"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-all hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
                >
                  <RotateCcw
                    size={16}
                  />
                </button>
              )}

              {/* ASSIGN */}
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
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isAssigning ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <UserPlus
                    size={17}
                  />
                )}

                <span>
                  {isAssigning
                    ? 'Assigning...'
                    : 'Assign'}
                </span>

                {selectedLeadCount >
                  0 && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {
                      selectedLeadCount
                    }
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

      {!loading &&
        error && (
          <div className="rounded-2xl border border-red-200 bg-[var(--surface)] px-6 py-12 text-center">

            <p className="text-sm font-semibold text-red-500">
              Failed to load leads
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              {error}
            </p>

            <button
              type="button"
              onClick={
                fetchLeads
              }
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white"
            >
              <RotateCcw
                size={14}
              />

              Try Again
            </button>
          </div>
        )}

      {!error && (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className={`max-w-full overflow-x-auto overscroll-x-contain lead-table-scroll ${loading ? 'lead-table-loading' : ''}`}>
              <table className="lead-table w-full min-w-0 border-collapse text-left text-sm md:min-w-[1150px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
                    <th className="px-4 py-4">
                      <label className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={
                            allLeadsSelected
                          }
                          onChange={
                            toggleSelectAllRows
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
                      TC Name
                    </th>
                    <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                      Last Activity
                    </th>
                    <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={`loading-${index}`} className="animate-pulse">
                        <td className="px-4 py-4"><span className="lead-skeleton block h-4 w-4 rounded" /></td>
                        <td className="px-4 py-4"><span className="lead-skeleton block h-4 w-20 rounded" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-4 w-28 rounded" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-4 w-24 rounded" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-4 w-12 rounded" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-4 w-20 rounded" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-4 w-24 rounded" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-6 w-20 rounded-full" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-4 w-32 rounded" /></td>
                        <td className="px-6 py-4"><span className="lead-skeleton block h-7 w-14 rounded-lg" /></td>
                      </tr>
                    ))
                  ) : leads.length === 0 ? (
                    <tr className="lead-empty-row">
                      <td colSpan="10" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Search
                            size={24}
                            strokeWidth={1.8}
                            className="mb-3 text-[var(--muted)]"
                          />
                          <span className="text-sm font-semibold text-[var(--text)]">
                            Data is not available
                          </span>
                          <span className="mt-1 text-xs text-[var(--muted)]">
                            No leads match the selected filters.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : leads.map(
                    (row) => {
                      const leadId =
                        row._id ||
                        row.id

                      const isSelected =
                        !!leadId &&
                        selectedLeadIds.includes(
                          leadId
                        )

                      return (
                        <tr
                          key={
                            leadId ||
                            `${row.mobile}-${row.createdAt}`
                          }
                          className={`transition-colors hover:bg-[var(--surface-alt)] ${
                            isSelected
                              ? 'bg-[var(--primary)]/5'
                              : ''
                          }`}
                        >
                          <td data-label="Select" className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={
                                isSelected
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
                          <td data-label="Date" className="whitespace-nowrap px-4 py-4 text-[var(--muted)]">
                            {formatDate(
                              row.createdAt
                            )}
                          </td>
                          <td data-label="Name" className="px-6 py-4">
                            <span className="font-semibold text-[var(--text)]">
                              {row.name ||
                                'N/A'}
                            </span>
                          </td>
                          <td data-label="Mobile No" className="px-6 py-4 text-[var(--muted)]">
                            {row.mobile ||
                              'N/A'}
                          </td>
                          <td data-label="Pin code" className="px-6 py-4 text-[var(--muted)]">
                            {row.pincode ||
                              'N/A'}
                          </td>
                          <td
                            data-label="Address"
                            className="max-w-xs truncate px-6 py-4 text-[var(--muted)]"
                            title={
                              row.address ||
                              ''
                            }
                          >
                            {row.address ||
                              'N/A'}
                          </td>
                          <td data-label="TC Name" className="px-6 py-4">
                            {row.assignedTo
                              ?.name ? (
                              <div className="inline-flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)]/10">
                                  <UserRound
                                    size={
                                      14
                                    }
                                    className="text-[var(--primary)]"
                                  />
                                </div>
                                <span className="font-medium text-[var(--text)]">
                                  {
                                    row
                                      .assignedTo
                                      .name
                                  }
                                </span>
                              </div>
                            ) : (
                              <span className="text-[var(--muted)]">
                                N/A
                              </span>
                            )}
                          </td>
                          <td data-label="Status" className="px-6 py-4">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                row.status
                              )}`}
                            >
                              {getStatusLabel(
                                row.status
                              )}
                            </span>
                          </td>
                          <td data-label="Last Activity" className="whitespace-nowrap px-6 py-4 text-[var(--muted)]">
                            {formatDateTime(
                              row.activityAt ||
                                row.lastActivityAt ||
                                row.assignedAt ||
                                row.updatedAt ||
                                row.createdAt
                            )}
                          </td>
                          <td data-label="Action" className="px-6 py-4">
                            <button
                              type="button"
                              disabled
                              className="cursor-not-allowed rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white opacity-60 shadow-sm"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      )
                    }
                  )}

                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span className="font-medium text-[var(--muted)]">
                {displayedRange}
              </span>
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          current -
                            1,
                          1
                        )
                    )
                  }
                  disabled={
                    page === 1
                  }
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>
                <span className="min-w-24 text-center text-sm font-semibold text-[var(--text)]">
                  Page {page} of{' '}
                  {
                    totalPages
                  }
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          current +
                            1,
                          totalPages
                        )
                    )
                  }
                  disabled={
                    page >=
                    totalPages
                  }
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight
                    size={17}
                  />
                </button>

              </div>
            </div>
          </div>
        )}
      <AssignModal
        open={
          isAssignModalOpen
        }
        onClose={() =>
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
        open={
          isImportModalOpen
        }
        campaignId={
          campaignId
        }
        onClose={() =>
          setIsImportModalOpen(
            false
          )
        }
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
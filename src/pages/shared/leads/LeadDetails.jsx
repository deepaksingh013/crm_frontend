import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Search, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Upload, Loader2, UserRound, UserPlus, RotateCcw, ArrowRightLeft, X } from 'lucide-react'
import ImportCampaignModal from './ImportCampaignModal'
import AssignModal from './AssignModal'
import LeadStatusUpdateModal from '../../telecaller/sales-management/LeadStatusUpdateModal'
import Modal from '../../../components/modal/Modal'
import { useDispatch } from 'react-redux'
import { apiGet, apiPost } from '../../../redux/apiMethods'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.REACT_APP_API_URL
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
    label: 'Pending',
    value: 'Pending',
  },
  {
    label: 'Not Connected',
    value: 'Not Connected',
  },
  {
    label: 'Completed',
    value: 'Complete',
  },
  {
    label: 'Rejected',
    value: 'Reject',
  },
  {
    label: 'Holding',
    value: 'Holding',
  },
  {
    label: 'New',
    value: 'New',
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

const getPaginationItems = (currentPage, pageCount) => {
  const total = Math.max(Number(pageCount) || 1, 1)
  let pages

  if (total <= 10) {
    pages = Array.from({ length: total }, (_, index) => index + 1)
  } else if (currentPage <= 6) {
    pages = [...Array.from({ length: 9 }, (_, index) => index + 1), total]
  } else if (currentPage >= total - 5) {
    pages = [1, ...Array.from({ length: 9 }, (_, index) => total - 8 + index)]
  } else {
    pages = [1, ...Array.from({ length: 7 }, (_, index) => currentPage - 3 + index), total]
  }

  return pages.reduce((items, pageNumber, index) => {
    if (index > 0 && pageNumber - pages[index - 1] > 1) {
      items.push({ type: 'ellipsis', key: `ellipsis-${pages[index - 1]}-${pageNumber}` })
    }

    items.push({ type: 'page', value: pageNumber, key: `page-${pageNumber}` })
    return items
  }, [])
}

const getUserRole = (user) =>
  String(
    user?.role ||
    user?.userRole ||
    user?.user?.role ||
    user?.user?.userRole ||
    ''
  )
    .toLowerCase()
    .trim()

// Leads can be assigned to every user except admins (telecallers, team leaders, managers)
const isAssignableUser = (user) => getUserRole(user) !== 'admin'

const ROLE_LABELS = {
  tc: 'Tele Caller',
  telecaller: 'Tele Caller',
  'tele caller': 'Tele Caller',
  'tele-caller': 'Tele Caller',
  tl: 'Team Leader',
  teamleader: 'Team Leader',
  'team leader': 'Team Leader',
  'team-leader': 'Team Leader',
  team_leader: 'Team Leader',
  manager: 'Manager',
  admin: 'Admin',
}

const getRoleLabel = (user) => {
  const role = getUserRole(user)
  return ROLE_LABELS[role] || role
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
  'Unnamed user'

const LeadDetails = () => {
  const dispatch = useDispatch()
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
    useState('Pending')

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

  // Update lead (status / details) - open to every role
  const [leadToUpdate, setLeadToUpdate] =
    useState(null)

  // Assign
  const [isAssignModalOpen, setIsAssignModalOpen] =
    useState(false)

  const [isAssigning, setIsAssigning] =
    useState(false)

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [targetCampaignId, setTargetCampaignId] = useState('')
  const [transferCount, setTransferCount] = useState('1')
  const [campaignOptions, setCampaignOptions] = useState([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  const transferMode = selectedLeadIds.length > 0 ? 'selected' : 'count'

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
          ? users.filter(isAssignableUser)
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

  useEffect(() => {
    if (!isTransferModalOpen || campaignOptions.length > 0) return undefined

    let active = true
    setCampaignsLoading(true)

    dispatch(apiGet('/campaigns'))
      .then((response) => {
        const candidates = [
          response?.campaigns,
          response?.data?.campaigns,
          response?.data,
          response,
        ]
        const list = candidates.find(Array.isArray) || []
        if (active) setCampaignOptions(list)
      })
      .catch((requestError) => {
        if (active) {
          toast.error(requestError.response?.data?.message || 'Failed to load campaigns.')
        }
      })
      .finally(() => {
        if (active) setCampaignsLoading(false)
      })

    return () => {
      active = false
    }
  }, [campaignOptions.length, dispatch, isTransferModalOpen])

  const fetchLeads = useCallback(async (signal) => {
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

      if (fromDate || toDate) {
        params.append(
          'dateField',
          'createdAt'
        )
      }

      // Picked dates are local days, and the Date column shows
      // local time - so send the exact local start / end of day.
      if (fromDate) {
        params.append(
          'fromDate',
          new Date(`${fromDate}T00:00:00`).toISOString()
        )
      }

      if (toDate) {
        params.append(
          'toDate',
          new Date(`${toDate}T23:59:59.999`).toISOString()
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
        signal,
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
        throw new Error('Invalid response received from server.')
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
      if (err?.name !== 'AbortError') {
        setError(
          err?.message ||
          'Something went wrong while fetching leads.'
        )
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
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
    const controller = new AbortController()
    const timer = setTimeout(
      () => fetchLeads(controller.signal),
      filterQuery ? 500 : 0
    )

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
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

  const handleTransferLeads = async (event) => {
    event.preventDefault()

    if (!targetCampaignId || targetCampaignId === campaignId) {
      toast.error('Choose a different destination campaign.')
      return
    }

    const payload = transferMode === 'selected'
      ? { targetCampaignId, leadIds: selectedLeadIds }
      : { targetCampaignId, count: Number(transferCount) }

    if (transferMode === 'selected' && selectedLeadIds.length === 0) {
      toast.error('Select at least one lead to transfer.')
      return
    }

    if (transferMode === 'count' && (
      !Number.isInteger(payload.count) ||
      payload.count < 1 ||
      payload.count > totalLeads
    )) {
      toast.error(`Enter a count between 1 and ${totalLeads}.`)
      return
    }

    setIsTransferring(true)

    try {
      const endpoint = transferMode === 'selected'
        ? `/campaigns/${campaignId}/leads/transfer`
        : `/campaigns/${campaignId}/leads/transfer-by-count`
      await dispatch(apiPost(endpoint, payload))

      const transferredCount = transferMode === 'selected'
        ? selectedLeadIds.length
        : payload.count
      const targetCampaign = campaignOptions.find((item) => (
        String(item._id || item.id || item.campaignId) === String(targetCampaignId)
      ))
      const targetName = targetCampaign?.title || targetCampaign?.name || targetCampaign?.campaignName || 'the selected campaign'

      setSelectedLeadIds([])
      setIsTransferModalOpen(false)
      setTransferCount('1')
      toast.success(`${transferredCount} ${transferredCount === 1 ? 'lead' : 'leads'} transferred to ${targetName}.`)
      await fetchLeads()
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || requestError.message || 'Failed to transfer leads.')
    } finally {
      setIsTransferring(false)
    }
  }


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

        const roleLabel =
          getRoleLabel(
            telecaller
          )

        return {
          id,
          name: roleLabel
            ? `${getUserName(telecaller)} (${roleLabel})`
            : getUserName(telecaller),
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
  const paginationItems = getPaginationItems(page, totalPages)
  return (
    <div className="flex min-w-0 flex-col gap-3 md:max-h-[calc(100vh-6.875rem)]">
      {/* PAGE HEADER */}
      <div className="flex min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="min-w-0 break-words text-xl font-bold capitalize tracking-tight text-[var(--text)]">
          {getCampaignTitle(
            campaign
          )}
        </h1>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">

          {/* IMPORT */}
          <button type="button" onClick={() => setIsImportModalOpen( true )}
            disabled={ isImporting}
            className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {isImporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
              )}

            {isImporting
              ? 'Importing...'
              : 'Import Leads'}
          </button>

          <Link to="/leads" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-alt)]">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">
              Back
            </span>
          </Link>
        </div>
      </div>

      {/* TOOLBAR: filters + actions + status tabs */}
      <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex min-w-0 flex-col gap-2 p-2.5 lg:flex-row lg:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3 lg:max-w-3xl">
            {/* SEARCH */}
            <div className="relative">
              <Search
                size={15}
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
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />
            </div>

            {/* FROM / TO DATE (date inputs can't show a placeholder, so label them inside) */}
            <label className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">
                From
              </span>
              <input
                type="date"
                aria-label="Created from date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  resetToFirstPage()
                }}
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] pl-14 pr-14 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />
              {fromDate && (
                <button
                  type="button"
                  aria-label="Clear from date"
                  title="Clear"
                  onClick={(e) => {
                    e.preventDefault()
                    setFromDate('')
                    resetToFirstPage()
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <label className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">
                To
              </span>
              <input
                type="date"
                aria-label="Created to date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => {
                  setToDate(e.target.value)
                  resetToFirstPage()
                }}
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] pl-10 pr-14 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />
              {toDate && (
                <button
                  type="button"
                  aria-label="Clear to date"
                  title="Clear"
                  onClick={(e) => {
                    e.preventDefault()
                    setToDate('')
                    resetToFirstPage()
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
                >
                  <X size={14} />
                </button>
              )}
            </label>
          </div>

          {!loading &&
            !error && (
              <div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:ml-auto lg:w-auto lg:justify-end">
                <div className="relative min-w-0 basis-full sm:basis-auto sm:flex-1 lg:flex-none">
                  <UserRound
                    size={15}
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
                    className="h-9 w-full min-w-0 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-9 text-sm font-medium text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-[11rem]"
                  >
                    <option value="">
                      {telecallersLoading
                        ? 'Loading TC...'
                        : 'All Users'}
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
                            {getRoleLabel(telecaller)
                              ? ` (${getRoleLabel(telecaller)})`
                              : ''}
                          </option>
                        ) : null
                      }
                    )}
                  </select>

                  <ChevronDown
                    size={14}
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
                    title="Clear user filter"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
                  >
                    <RotateCcw
                      size={14}
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTargetCampaignId('')
                    setTransferCount('1')
                    setIsTransferModalOpen(true)
                  }}
                  disabled={isTransferring}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--primary)] hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRightLeft size={15} />
                  Transfer Leads
                  {selectedLeadCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-1.5 py-px text-xs text-[var(--primary)]">
                      {selectedLeadCount}
                    </span>
                  )}
                </button>

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
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAssigning ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <UserPlus
                      size={15}
                    />
                  )}

                  <span>
                    {isAssigning
                      ? 'Assigning...'
                      : 'Assign'}
                  </span>

                  {selectedLeadCount >
                    0 && (
                      <span className="rounded-full bg-white/20 px-1.5 py-px text-xs">
                        {
                          selectedLeadCount
                        }
                      </span>
                    )}
                </button>
              </div>
            )}
        </div>

        {!loading &&
          !error && (
            <div className="flex min-w-0 flex-col gap-2 border-t border-[var(--border)] px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex max-w-full flex-wrap items-center gap-0.5 rounded-lg bg-[var(--surface-alt)] p-0.5">
                {STATUS_TABS.map(({ value, label }) => {
                  const isActive = statusFilter === value

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(value)
                        resetToFirstPage()
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${isActive
                          ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm ring-1 ring-[var(--border)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-[var(--muted)]">
                  Total {getStatusLabel(statusFilter)} Leads
                </p>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-sm font-bold tabular-nums text-[var(--primary)]">
                  {loading ? '...' : totalLeads}
                </span>
              </div>
            </div>
          )}
      </div>

      {!loading &&
        error && (
          <div className="shrink-0 rounded-xl border border-red-200 bg-[var(--surface)] px-6 py-8 text-center">

            <p className="text-sm font-semibold text-red-500">
              Failed to load leads
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchLeads()}
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
        <div className="app-table-card flex min-h-0 flex-col md:min-h-[16rem]">
          <div className={`max-w-full overflow-x-auto overscroll-x-contain md:min-h-0 md:flex-1 md:overflow-y-auto lead-table-scroll ${loading ? 'lead-table-loading' : ''}`}>
            <table className="lead-table app-table min-w-0 md:min-w-[64rem]">
              <thead className="md:sticky md:top-0 md:z-10 md:shadow-[0_1px_0_var(--border)]">
                <tr>
                  <th className="px-3 py-2.5">
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
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Date
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Name
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Mobile No
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Pin code
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Address
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    TC Name
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Last Activity
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`loading-${index}`} className="app-table-skeleton">
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-4 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-20 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-28 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-24 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-12 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-20 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-24 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-6 w-20 rounded-full" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-4 w-32 rounded" /></td>
                      <td className="px-3 py-2.5"><span className="lead-skeleton block h-7 w-14 rounded-lg" /></td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr className="lead-empty-row">
                    <td colSpan="10" className="px-6 py-12 text-center">
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
                        className={`transition-colors hover:bg-[var(--surface-alt)] ${isSelected
                            ? 'bg-[var(--primary)]/5'
                            : ''
                          }`}
                      >
                        <td data-label="Select" className="px-3 py-2 text-center">
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
                        <td data-label="Date" className="whitespace-nowrap px-3 py-2 text-[var(--muted)]">
                          {formatDate(
                            row.createdAt
                          )}
                        </td>
                        <td data-label="Name" className="px-3 py-2">
                          <span className="block max-w-[14rem] truncate font-semibold text-[var(--text)]" title={row.name || ''}>
                            {row.name ||
                              'N/A'}
                          </span>
                        </td>
                        <td data-label="Mobile No" className="whitespace-nowrap px-3 py-2 tabular-nums text-[var(--text)]">
                          {row.mobile ||
                            'N/A'}
                        </td>
                        <td data-label="Pin code" className="whitespace-nowrap px-3 py-2 text-[var(--muted)]">
                          {row.pincode ||
                            'N/A'}
                        </td>
                        <td
                          data-label="Address"
                          className="max-w-[14rem] truncate px-3 py-2 text-[var(--muted)]"
                          title={
                            row.address ||
                            ''
                          }
                        >
                          {row.address ||
                            'N/A'}
                        </td>
                        <td data-label="TC Name" className="whitespace-nowrap px-3 py-2">
                          {row.assignedTo
                            ?.name ? (
                            <div className="inline-flex items-center gap-1.5">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50">
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
                        <td data-label="Status" className="px-3 py-2">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClass(
                              row.status
                            )}`}
                          >
                            {getStatusLabel(
                              row.status
                            )}
                          </span>
                        </td>
                        <td data-label="Last Activity" className="whitespace-nowrap px-3 py-2 text-[var(--muted)]">
                          {formatDateTime(
                            row.activityAt ||
                            row.lastActivityAt ||
                            row.assignedAt ||
                            row.updatedAt ||
                            row.createdAt
                          )}
                          {row.lastUpdatedBy?.name && (
                            <div
                              className="mt-0.5 text-xs text-[var(--muted)]"
                              title={formatDateTime(row.lastUpdatedAt)}
                            >
                              Updated by{' '}
                              <span className="font-semibold text-[var(--text)]">
                                {row.lastUpdatedBy.name}
                              </span>{' '}
                              ({getRoleLabel(row.lastUpdatedBy)})
                            </div>
                          )}
                        </td>
                        <td data-label="Action" className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setLeadToUpdate(row)}
                            className="app-table-btn"
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

          <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-[var(--muted)]">
              {displayedRange}
            </span>
            <div className="flex max-w-full items-center gap-1 overflow-x-auto sm:justify-end">
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
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={15}
                />
              </button>
              {paginationItems.map((item) => item.type === 'ellipsis' ? (
                <span key={item.key} aria-hidden="true" className="flex h-8 min-w-6 items-center justify-center text-xs text-[var(--muted)]">
                  ...
                </span>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPage(item.value)}
                  aria-label={`Page ${item.value}`}
                  aria-current={page === item.value ? 'page' : undefined}
                  className={`h-8 min-w-8 rounded-md border px-2 text-xs font-semibold transition-colors ${page === item.value
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-alt)]'
                    }`}
                >
                  {item.value}
                </button>
              ))}
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
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight
                  size={15}
                />
              </button>

            </div>
          </div>
        </div>
      )}
      <LeadStatusUpdateModal
        isOpen={!!leadToUpdate}
        lead={leadToUpdate}
        onClose={() => setLeadToUpdate(null)}
        // fetchLeads takes an AbortSignal, so don't pass the response through
        onUpdateSuccess={() => fetchLeads()}
        campaignId={campaignId}
      />

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

      <Modal
        open={isTransferModalOpen}
        title="Transfer leads to another campaign"
        size="md"
        onClose={() => setIsTransferModalOpen(false)}
        isLoading={isTransferring}
      >
        <form onSubmit={handleTransferLeads} className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">
              {transferMode === 'selected' ? 'Transfer selected leads' : 'Transfer by count'}
            </p>
            <p className="mt-1 text-xs text-blue-800">
              {transferMode === 'selected'
                ? `${selectedLeadIds.length} selected ${selectedLeadIds.length === 1 ? 'lead' : 'leads'} will be transferred.`
                : `No leads are selected. Choose how many ${getStatusLabel(statusFilter).toLowerCase()} leads to transfer.`}
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
              Destination campaign
            </span>
            <select
              value={targetCampaignId}
              onChange={(event) => setTargetCampaignId(event.target.value)}
              disabled={campaignsLoading || isTransferring}
              required
              className="h-9 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {campaignsLoading ? 'Loading campaigns...' : 'Choose a campaign'}
              </option>
              {campaignOptions.map((item) => {
                const optionId = item._id || item.id || item.campaignId
                const optionName = item.title || item.name || item.campaignName || 'Untitled campaign'
                if (!optionId || String(optionId) === String(campaignId)) return null

                return (
                  <option key={optionId} value={optionId}>
                    {optionName}
                  </option>
                )
              })}
            </select>
            {!campaignsLoading && campaignOptions.filter((item) => (
              String(item._id || item.id || item.campaignId) !== String(campaignId)
            )).length === 0 && (
              <span className="mt-1 block text-xs text-amber-700">
                No other campaigns are available.
              </span>
            )}
          </label>

          {transferMode === 'selected' ? (
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-sm text-[var(--text)]">
              <UserPlus size={18} className="mt-0.5 shrink-0" />
              <p>
                {selectedLeadIds.length} selected {selectedLeadIds.length === 1 ? 'lead will' : 'leads will'} be moved from {getCampaignTitle(campaign)}.
              </p>
            </div>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                Number of leads
              </span>
              <input
                type="number"
                min="1"
                max={totalLeads}
                step="1"
                value={transferCount}
                onChange={(event) => setTransferCount(event.target.value)}
                disabled={isTransferring}
                required
                className="h-9 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:opacity-60"
              />
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Up to {totalLeads} leads are available in the {getStatusLabel(statusFilter).toLowerCase()} tab.
              </span>
            </label>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              disabled={isTransferring}
              className="h-9 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-alt)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTransferring || campaignsLoading || !targetCampaignId || (
                transferMode === 'selected' ? selectedLeadIds.length === 0 : totalLeads === 0
              )}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTransferring ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
              {isTransferring ? 'Transferring...' : 'Transfer leads'}
            </button>
          </div>
        </form>
      </Modal>

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
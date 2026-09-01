import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, AlertCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Link, useLocation, useParams } from 'react-router-dom'
import AssignModal from '../leadManagment/AssignModal'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'
const PAGE_SIZE = 10

const tabs = [
  { label: 'All', value: '' },
  { label: 'New', value: 'New' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Complete', value: 'Complete' },
  { label: 'Reject', value: 'Reject' },
  { label: 'Holding', value: 'Holding' },
  { label: 'Not connected', value: 'Not Connected' },
]

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const getLeadValue = (lead, keys, fallback = 'N/A') => {
  const key = keys.find((item) => lead?.[item] !== undefined && lead?.[item] !== null && lead?.[item] !== '')
  return key ? lead[key] : fallback
}

const formatDisplayValue = (value, fallback = 'N/A') => {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value !== 'object') return String(value)

  return String(value.title || value.name || value.label || value.value || value.email || value._id || fallback)
}

const getStatusBadgeClass = (status) => {
  const normalizedStatus = String(status).toLowerCase().replace(/[\s_-]+/g, '')

  const statusClasses = {
    new: 'bg-blue-50 text-blue-700',
    pending: 'bg-amber-50 text-amber-700',
    complete: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-emerald-50 text-emerald-700',
    reject: 'bg-red-50 text-red-700',
    rejected: 'bg-red-50 text-red-700',
    holding: 'bg-orange-50 text-orange-700',
    notconnected: 'bg-slate-100 text-slate-700',
  }

  return statusClasses[normalizedStatus] || 'bg-slate-100 text-slate-700'
}

const TcDetails = () => {
  const { id: telecallerId } = useParams()
  const location = useLocation()
  const telecaller = location.state?.telecaller
  const assignedTo = telecaller?.assignedTo || {}
  const [leads, setLeads] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLeadIds, setSelectedLeadIds] = useState([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    const fetchCampaigns = async () => {
      const token = Cookies.get('token')
      if (!token) return

      try {
        const response = await axios.get(`${API_URL}/campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const campaignList = response.data?.campaigns || response.data || []
        setCampaigns(Array.isArray(campaignList) ? campaignList : [])
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch campaigns.')
      }
    }

    fetchCampaigns()
  }, [])

  const fetchLeads = useCallback(async () => {
    const token = Cookies.get('token')
    if (!token) {
      setError('Authentication failed. Please log in again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const params = { page, limit: PAGE_SIZE }
      if (activeStatus) params.status = activeStatus
      if (selectedCampaign) params.campaignId = selectedCampaign
      const response = await axios.get(`${API_URL}/leads/user/${telecallerId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = response.data
      const pagination = payload?.pagination || payload?.meta || payload?.data?.pagination || payload?.data?.meta || {}
      const list = Array.isArray(payload)
        ? payload
        : payload?.data?.leads || payload?.leads || (Array.isArray(payload?.data) ? payload.data : [])
      const safeList = Array.isArray(list) ? list : []
      const responseTotal = Number(
        payload?.total ??
        payload?.data?.total ??
        pagination.total ??
        payload?.count ??
        safeList.length
      )
      const responsePages = Number(
        payload?.totalPages ??
        payload?.data?.totalPages ??
        pagination.totalPages ??
        pagination.pages ??
        Math.max(Math.ceil(responseTotal / PAGE_SIZE), 1)
      )
      setLeads(safeList)
      setTotal(responseTotal)
      setTotalPages(Math.max(responsePages, 1))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch telecaller leads.')
    } finally {
      setIsLoading(false)
    }
  }, [activeStatus, page, selectedCampaign, telecallerId])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const title = assignedTo.name || 'Telecaller details'
  const displayedRange = useMemo(() => {
    if (!total) return 'No leads found'
    return `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total}`
  }, [page, total])

  const handleTabChange = (status) => {
    setActiveStatus(status)
    setPage(1)
    setSelectedLeadIds([])
  }

  const handleCampaignChange = (event) => {
    setSelectedCampaign(event.target.value)
    setPage(1)
    setSelectedLeadIds([])
  }

  // const toggleLeadSelection = (leadId) => {
  //   if (!leadId) return

  //   setSelectedLeadIds((current) => (
  //     current.includes(leadId)
  //       ? current.filter((id) => id !== leadId)
  //       : [...current, leadId]
  //   ))
  // }

  // const visibleLeadIds = leads.map((lead) => lead._id || lead.id).filter(Boolean)
  // const allLeadsSelected = visibleLeadIds.length > 0 && visibleLeadIds.every((id) => selectedLeadIds.includes(id))

  // const toggleSelectAllRows = () => {
  //   setSelectedLeadIds((current) => (
  //     allLeadsSelected
  //       ? current.filter((id) => !visibleLeadIds.includes(id))
  //       : [...new Set([...current, ...visibleLeadIds])]
  //   ))
  // }

  const reassignLeads = async (count, userId, selectedIds = []) => {
    const token = Cookies.get('token')
    if (!token) throw new Error('Authentication failed. Please log in again.')

    setIsAssigning(true)
    try {
      const request = selectedIds.length > 0
        ? axios.patch(`${API_URL}/leads/reassign`, {
          fromUserId: telecallerId,
          userId,
          leadIds: selectedIds,
        }, { headers: { Authorization: `Bearer ${token}` } })
        : axios.patch(`${API_URL}/leads/reassign-by-count`, {
          fromUserId: telecallerId,
          userId,
          count: Number(count),
        }, { headers: { Authorization: `Bearer ${token}` } })

      await request
      setSelectedLeadIds([])
      setIsAssignModalOpen(false)
      await fetchLeads()
      return true
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to reassign leads.')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/telecallers" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)]"><ArrowLeft size={17} />Back to telecallers</Link>
          <h1 className="mt-4 text-2xl font-bold text-[var(--text)] sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{assignedTo.email || 'Lead assignment details'}</p>
        </div>
        <button type="button" onClick={fetchLeads} disabled={isLoading} aria-label="Refresh leads" className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-alt)] disabled:opacity-60"><RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />Refresh</button>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" /><span>{error}</span><button type="button" onClick={fetchLeads} className="ml-auto font-semibold underline">Try again</button></div>}

      {!isLoading && !error && <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-[var(--muted)]">{selectedLeadIds.length > 0 ? `${selectedLeadIds.length} lead${selectedLeadIds.length === 1 ? '' : 's'} selected` : `${total} leads available`}</span>
        <div className="flex items-center gap-3">
          {selectedLeadIds.length > 0 && <button type="button" onClick={() => setSelectedLeadIds([])} className="text-sm font-semibold text-[var(--primary)]">Clear selection</button>}
          {/* <button type="button" onClick={() => setIsAssignModalOpen(true)} disabled={leads.length === 0 || isAssigning} className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">Assign leads</button> */}
        </div>
      </div>}

      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => <button key={tab.value || 'all'} type="button" onClick={() => handleTabChange(tab.value)} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeStatus === tab.value ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'}`}>{tab.label}</button>)}
          </div>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <select value={selectedCampaign} onChange={handleCampaignChange} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-normal text-[var(--text)] outline-none focus:border-[var(--primary)]">
            <option value="">All campaigns</option>
            {campaigns.map((campaign) => {
              const campaignId = campaign._id || campaign.id
              return <option key={campaignId} value={campaignId}>{campaign.title || campaign.name || 'Untitled campaign'}</option>
            })}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full border-collapse text-left text-sm">
            <thead><tr className="border-b border-[var(--border)]"><th className="px-5 py-4">{/* <input type="checkbox" checked={allLeadsSelected} onChange={toggleSelectAllRows} disabled={leads.length === 0 || isLoading} aria-label="Select all leads on this page" className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]" /> */}</th>{['Lead', 'Phone', 'Email', 'Campaign', 'Status', 'Created', 'Last activity'].map((heading) => <th key={heading} className="px-5 py-4 font-semibold text-[var(--muted)]">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? <tr><td colSpan={7} className="py-14 text-center"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><Loader2 size={20} className="animate-spin" />Loading leads...</span></td></tr>
                : leads.length === 0 ? <tr><td colSpan={7} className="py-14 text-center text-[var(--muted)]">No leads found for this status.</td></tr>
                  : leads.map((lead, index) => {
                    const leadName = formatDisplayValue(getLeadValue(lead, ['name', 'fullName', 'leadName', 'customerName']))
                    const status = formatDisplayValue(getLeadValue(lead, ['status'], 'Unknown'), 'Unknown')
                    const leadId = lead._id || lead.id
                    return <tr key={leadId || index} className="hover:bg-[var(--surface-alt)]">
                      <td className="px-5 py-4">{/* <input type="checkbox" checked={Boolean(leadId && selectedLeadIds.includes(leadId))} onChange={() => toggleLeadSelection(leadId)} disabled={!leadId} aria-label={`Select ${leadName}`} className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]" /> */}</td>
                      <td className="px-5 py-4 font-semibold text-[var(--text)]">{leadName}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{formatDisplayValue(getLeadValue(lead, ['phone', 'mobile', 'phoneNumber']))}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{formatDisplayValue(getLeadValue(lead, ['email']))}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{formatDisplayValue(lead.campaign || lead.campaignName || getLeadValue(lead, ['campaign'], 'N/A'))}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(status)}`}>{status}</span></td>
                      <td className="px-5 py-4 text-[var(--muted)]">{formatDate(lead.createdAt || lead.createdDate)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-[var(--muted)]">{formatDateTime(lead.activityAt || lead.lastActivityAt || lead.assignedAt || lead.updatedAt || lead.createdAt || lead.createdDate)}</td>
                    </tr>
                  })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>{displayedRange}</span>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1 || isLoading} aria-label="Previous page" className="rounded-lg border border-[var(--border)] p-2 text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button><span className="min-w-20 text-center font-medium text-[var(--text)]">Page {page} of {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page >= totalPages || isLoading} aria-label="Next page" className="rounded-lg border border-[var(--border)] p-2 text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button></div>
        </div>
      </div>

      <AssignModal
        open={isAssignModalOpen}
        onClose={() => !isAssigning && setIsAssignModalOpen(false)}
        leadsCount={total}
        onAssign={reassignLeads}
        isAssigning={isAssigning}
        selectedLeadIds={selectedLeadIds}
      />
    </div>
  )
}

export default TcDetails

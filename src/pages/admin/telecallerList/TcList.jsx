import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, Loader2, RefreshCw, Search, Users } from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Link } from 'react-router-dom'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

const TcList = () => {
  const [telecallers, setTelecallers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAssignmentSummary = useCallback(async () => {
    const token = Cookies.get('token')

    if (!token) {
      setError('Authentication failed. Please log in again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await axios.get(`${API_URL}/leads/assignment-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = response.data
      const list = payload?.data || payload?.assignmentSummary || payload?.users || payload
      setTelecallers(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch telecaller summary.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignmentSummary()
  }, [fetchAssignmentSummary])

  const filteredTelecallers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()

    return telecallers.filter((telecaller) => {
      const name = telecaller.assignedTo?.name || ''
      const email = telecaller.assignedTo?.email || ''
      return `${name} ${email}`.toLowerCase().includes(query)
    })
  }, [searchTerm, telecallers])

  const getCount = (telecaller, status) => {
    return Number(telecaller.statusCount?.[status] || 0)
  }

  const totalLeads = telecallers.reduce((sum, telecaller) => sum + Number(telecaller.totalLeads || 0), 0)
  const completedLeads = telecallers.reduce((sum, telecaller) => sum + getCount(telecaller, 'complete'), 0)

  const summaryCards = [
    { label: 'Telecallers', value: telecallers.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Assigned leads', value: totalLeads, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Completed leads', value: completedLeads, icon: CheckCircle2, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Team overview</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Telecaller list</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Track lead assignments and progress across your telecaller team.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search telecallers..." aria-label="Search telecallers" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <button type="button" onClick={fetchAssignmentSummary} disabled={isLoading} aria-label="Refresh telecaller list" className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)] transition hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <span className={`rounded-xl p-3 ${color}`}><Icon size={21} /></span>
            <div><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-1 text-2xl font-bold text-[var(--text)]">{value.toLocaleString()}</p></div>
          </article>
        ))}
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" /><span>{error}</span><button type="button" onClick={fetchAssignmentSummary} className="ml-auto font-semibold underline">Try again</button></div>}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full border-collapse text-left text-sm">
            <thead><tr className="border-b border-[var(--border)]">
              {['Telecaller', 'Campaigns', 'New', 'Pending', 'Completed', 'Not connected', 'Holding', 'Rejected', 'Total', 'Action'].map((heading) => <th key={heading} className="px-5 py-4 font-semibold text-[var(--muted)]">{heading}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? <tr>
                <td colSpan={10} className="py-14 text-center"><span className="inline-flex items-center gap-2 text-[var(--muted)]"><Loader2 size={20} className="animate-spin" />Loading telecallers...</span></td></tr>
                : filteredTelecallers.length === 0 ? <tr><td colSpan={10} className="py-14 text-center text-[var(--muted)]">{searchTerm ? 'No telecallers match your search.' : 'No telecaller assignments found.'}</td></tr>
                  : filteredTelecallers.map((telecaller, index) => {
                    const name = telecaller.assignedTo?.name || 'Unknown telecaller'
                    const email = telecaller.assignedTo?.email || ''
                    const campaigns = telecaller.campaigns || []
                    return <tr key={telecaller.assignedTo?.userId || index} className="transition hover:bg-[var(--surface-alt)]">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">{name.charAt(0).toUpperCase()}</span><div><Link to={`/telecallers/${telecaller.assignedTo?.userId}`} state={{ telecaller }} className="font-semibold text-[var(--text)] hover:text-[var(--primary)]">{name}{email && <p className="text-xs text-[var(--muted)]">{email}</p>}</Link></div></div></td>
                      <td className="max-w-[250px] px-5 py-4"><div className="flex max-w-[240px] items-center gap-1.5"><span className="truncate text-[var(--text)]">{campaigns.length > 0 ? campaigns.slice(0, 2).map((campaign) => campaign.name).join(', ') : 'No campaigns'}</span>{campaigns.length > 2 && <span className="shrink-0 text-xs font-semibold text-[var(--primary)]">...</span>}</div></td>
                      <td className="px-5 py-4 text-[var(--muted)]">{getCount(telecaller, 'new')}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{getCount(telecaller, 'pending')}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{getCount(telecaller, 'complete')}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{getCount(telecaller, 'notConnected')}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{getCount(telecaller, 'holding')}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{getCount(telecaller, 'reject')}</td>
                      <td className="px-5 py-4"><span className="inline-flex rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">{Number(telecaller.totalLeads || 0)}</span></td>
                      <td className="px-5 py-4"><Link to={`/telecallers/${telecaller.assignedTo?.userId}`} state={{ telecaller }} aria-label={`View ${name}`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"><Eye size={16} /><span>View</span></Link></td>
                    </tr>
                  })}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredTelecallers.length > 0 && <p className="border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--muted)]">Showing {filteredTelecallers.length} of {telecallers.length} telecallers</p>}
      </div>
    </div>
  )
}

export default TcList

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, RefreshCw, Search, Users } from 'lucide-react'
import TableSkeleton from '../../../components/table/TableSkeleton'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Link } from 'react-router-dom'
import ReportsToCell, { getId } from '../users/ReportsToCell'
import { useAuth } from '../../../hooks/useAuth'

const API_URL = process.env.REACT_APP_API_URL

const filterSelectClassName = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none sm:w-52'

const TcList = () => {
  const { role } = useAuth()
  const currentRole = String(role || '').toLowerCase()
  const isAdmin = currentRole === 'admin'
  // TL only ever sees their own TCs - nothing to filter
  const canFilterByTeamLeader = isAdmin || currentRole === 'manager'

  const [telecallers, setTelecallers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters: '' = all, 'none' = no manager / no team leader
  const [managerFilter, setManagerFilter] = useState('')
  const [teamLeaderFilter, setTeamLeaderFilter] = useState('')
  const [teamUsers, setTeamUsers] = useState([])

  // Filter options come from /users, which is already team-scoped
  useEffect(() => {
    if (!canFilterByTeamLeader) return

    const token = Cookies.get('token')
    if (!token) return

    axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setTeamUsers(Array.isArray(response.data?.users) ? response.data.users : []))
      .catch(() => setTeamUsers([]))
  }, [canFilterByTeamLeader])

  const managerOptions = useMemo(() => teamUsers.filter((user) => user.role === 'manager'), [teamUsers])

  const teamLeaderOptions = useMemo(() => teamUsers.filter((user) => {
    if (user.role !== 'tl') return false
    if (!isAdmin || !managerFilter) return true
    return managerFilter === 'none' ? !getId(user.manager) : getId(user.manager) === managerFilter
  }), [teamUsers, isAdmin, managerFilter])

  const fetchAssignmentSummary = useCallback(async (signal) => {
    const token = Cookies.get('token')

    if (!token) {
      setError('Authentication failed. Please log in again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    const params = {}
    if (isAdmin && managerFilter) params.managerId = managerFilter
    if (canFilterByTeamLeader && teamLeaderFilter) params.teamLeaderId = teamLeaderFilter

    try {
      const response = await axios.get(`${API_URL}/leads/assignment-summary`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      const payload = response.data
      const list = payload?.data || payload?.assignmentSummary || payload?.users || payload
      setTelecallers(Array.isArray(list) ? list : [])
    } catch (err) {
      if (axios.isCancel(err)) return
      setError(err.response?.data?.message || err.message || 'Failed to fetch telecaller summary.')
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [isAdmin, canFilterByTeamLeader, managerFilter, teamLeaderFilter])

  // Refetch on filter change; drop the older response if filters change mid-request
  useEffect(() => {
    const controller = new AbortController()
    fetchAssignmentSummary(controller.signal)
    return () => controller.abort()
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

  const showTeamColumn = canFilterByTeamLeader
  const headings = ['Telecaller', ...(showTeamColumn ? ['Team'] : []), 'Campaigns', 'New', 'Pending', 'Completed', 'Not connected', 'Holding', 'Rejected', 'Total', 'Action']
  const isFiltered = Boolean(searchTerm || managerFilter || teamLeaderFilter)

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
        <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:flex-nowrap">
          {isAdmin && (
            <select
              value={managerFilter}
              onChange={(event) => {
                setManagerFilter(event.target.value)
                // TL list depends on the manager
                setTeamLeaderFilter('')
              }}
              aria-label="Filter by manager"
              className={filterSelectClassName}
            >
              <option value="">All managers</option>
              <option value="none">Directly under Admin</option>
              {managerOptions.map((manager) => <option key={getId(manager)} value={getId(manager)}>{manager.name}</option>)}
            </select>
          )}
          {canFilterByTeamLeader && (
            <select
              value={teamLeaderFilter}
              onChange={(event) => setTeamLeaderFilter(event.target.value)}
              aria-label="Filter by team leader"
              className={filterSelectClassName}
            >
              <option value="">All team leaders</option>
              <option value="none">No team leader</option>
              {teamLeaderOptions.map((teamLeader) => <option key={getId(teamLeader)} value={getId(teamLeader)}>{teamLeader.name}{isAdmin && !managerFilter && teamLeader.manager?.name ? ` (${teamLeader.manager.name})` : ''}</option>)}
            </select>
          )}
          <div className="relative min-w-0 flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search telecallers..." aria-label="Search telecallers" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <button type="button" onClick={() => fetchAssignmentSummary()} disabled={isLoading} aria-label="Refresh telecaller list" className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)] transition hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-60">
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

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" /><span>{error}</span><button type="button" onClick={() => fetchAssignmentSummary()} className="ml-auto font-semibold underline">Try again</button></div>}

      <div className="app-table-card">
        <div className="overflow-x-auto">
          <table className="app-table min-w-[60rem]">
            <thead><tr>
              {headings.map((heading) => <th key={heading}>{heading}</th>)}
            </tr></thead>
            <tbody>
              {isLoading ? <TableSkeleton columns={headings.length} />
                : filteredTelecallers.length === 0 ? <tr><td colSpan={headings.length} className="py-14 text-center text-[var(--muted)]">{isFiltered ? 'No telecallers match these filters.' : 'No telecallers in your team yet.'}</td></tr>
                  : filteredTelecallers.map((telecaller, index) => {
                    const name = telecaller.assignedTo?.name || 'Unknown telecaller'
                    const email = telecaller.assignedTo?.email || ''
                    const campaigns = telecaller.campaigns || []
                    return <tr key={telecaller.assignedTo?.userId || index} >
                      <td><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{name.charAt(0).toUpperCase()}</span><div><Link to={`/telecallers/${telecaller.assignedTo?.userId}`} state={{ telecaller }} className="font-semibold text-[var(--text)] hover:text-[var(--primary)]">{name}{telecaller.assignedTo?.isActive === false && <span className="ml-2 rounded-full bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">Inactive</span>}{email && <p className="text-xs text-[var(--muted)]">{email}</p>}</Link></div></div></td>
                      {showTeamColumn && <td><ReportsToCell user={{ role: 'tc', manager: telecaller.manager, teamLeader: telecaller.teamLeader }} /></td>}
                      <td className="max-w-[15rem]"><div className="flex max-w-[14rem] items-center gap-1.5"><span className="truncate text-[var(--text)]">{campaigns.length > 0 ? campaigns.slice(0, 2).map((campaign) => campaign.name).join(', ') : 'No campaigns'}</span>{campaigns.length > 2 && <span className="shrink-0 text-xs font-semibold text-[var(--primary)]">...</span>}</div></td>
                      <td className="tabular-nums text-[var(--muted)]">{getCount(telecaller, 'new')}</td>
                      <td className="tabular-nums text-[var(--muted)]">{getCount(telecaller, 'pending')}</td>
                      <td className="tabular-nums text-[var(--muted)]">{getCount(telecaller, 'complete')}</td>
                      <td className="tabular-nums text-[var(--muted)]">{getCount(telecaller, 'notConnected')}</td>
                      <td className="tabular-nums text-[var(--muted)]">{getCount(telecaller, 'holding')}</td>
                      <td className="tabular-nums text-[var(--muted)]">{getCount(telecaller, 'reject')}</td>
                      <td><span className="app-table-count">{Number(telecaller.totalLeads || 0)}</span></td>
                      <td><Link to={`/telecallers/${telecaller.assignedTo?.userId}`} state={{ telecaller }} aria-label={`View ${name}`} className="app-table-btn"><Eye size={14} /><span>View</span></Link></td>
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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { Link, Navigate } from 'react-router-dom'
import { AlertCircle, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, RefreshCw, Search } from 'lucide-react'
import TableSkeleton from '../../../components/table/TableSkeleton'
import { useAuth } from '../../../hooks/useAuth'

const API_URL = process.env.REACT_APP_API_URL

const ROLE_META = {
  admin: { label: 'Admin', dot: 'bg-slate-500' },
  manager: { label: 'Manager', dot: 'bg-violet-500' },
  tl: { label: 'Team Leader', dot: 'bg-sky-500' },
  tc: { label: 'Tele Caller', dot: 'bg-emerald-500' },
}

const STATUS_COLUMNS = [
  { key: 'new', label: 'New' },
  { key: 'pending', label: 'Pending' },
  { key: 'complete', label: 'Completed' },
  { key: 'notConnected', label: 'Not connected' },
  { key: 'holding', label: 'Holding' },
  { key: 'reject', label: 'Rejected' },
]

const COLUMN_COUNT = STATUS_COLUMNS.length + 3

const controlClassName = 'h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none'
const buttonClassName = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-50'

const getNodeId = (node) => String(node.userId)

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN')

const getCompletion = (counts) =>
  counts.total > 0 ? Math.round((counts.complete / counts.total) * 100) : 0

// Ids of every node that has children (for "Expand all")
const collectParentIds = (node, ids = new Set()) => {
  if (node.children.length > 0) ids.add(getNodeId(node))
  node.children.forEach((child) => collectParentIds(child, ids))
  return ids
}

const addSubtree = (node, ids) => {
  ids.add(getNodeId(node))
  node.children.forEach((child) => addSubtree(child, ids))
}

// Search keeps a match, its whole team below it, and the path above it
const collectMatches = (node, query, ids) => {
  if (`${node.name} ${node.email}`.toLowerCase().includes(query)) {
    addSubtree(node, ids)
    return true
  }

  let childMatched = false
  node.children.forEach((child) => {
    if (collectMatches(child, query, ids)) childMatched = true
  })

  if (childMatched) ids.add(getNodeId(node))
  return childMatched
}

// Tree -> visible table rows
const flattenTree = (node, depth, isOpen, rows = []) => {
  rows.push({ node, depth })
  if (isOpen(node)) {
    node.children.forEach((child) => flattenTree(child, depth + 1, isOpen, rows))
  }
  return rows
}

const filterTree = (node, ids) =>
  ids.has(getNodeId(node))
    ? { ...node, children: node.children.map((child) => filterTree(child, ids)).filter(Boolean) }
    : null

// One slim cell of the stats strip
const StatTile = ({ label, value, note }) => (
  <div className="min-w-[8.5rem] flex-1 px-4 py-2">
    <p className="whitespace-nowrap text-xs text-[var(--muted)]">{label}</p>
    <p className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-lg font-semibold text-[var(--text)]">{value}</span>
      {note && <span className="text-xs text-[var(--muted)]">{note}</span>}
    </p>
  </div>
)

// Single ratio -> meter: blue fill on a lighter blue track, % as text
const CompletionMeter = ({ counts }) => {
  const percent = getCompletion(counts)

  return (
    <div className="flex items-center gap-2" title={`${formatNumber(counts.complete)} of ${formatNumber(counts.total)} completed`}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-blue-100" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Completion">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-[var(--text)]">{percent}%</span>
    </div>
  )
}

const TeamReport = () => {
  const { role } = useAuth()
  const currentRole = String(role || '').toLowerCase()

  const [report, setReport] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [campaignId, setCampaignId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const hasInitialExpand = useRef(false)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) return

    axios.get(`${API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setCampaigns(Array.isArray(response.data?.campaigns) ? response.data.campaigns : []))
      .catch(() => setCampaigns([]))
  }, [])

  const fetchReport = useCallback(async (signal) => {
    const token = Cookies.get('token')

    if (!token) {
      setError('Authentication failed. Please log in again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await axios.get(`${API_URL}/leads/team-report`, {
        params: campaignId ? { campaignId } : {},
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })

      const data = response.data
      setReport(data)

      // First load: open the viewer and their direct reports
      if (data?.tree && !hasInitialExpand.current) {
        hasInitialExpand.current = true
        setExpanded(new Set([getNodeId(data.tree), ...data.tree.children.map(getNodeId)]))
      }
    } catch (err) {
      if (axios.isCancel(err)) return
      setError(err.response?.data?.message || err.message || 'Failed to load report.')
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    const controller = new AbortController()
    fetchReport(controller.signal)
    return () => controller.abort()
  }, [fetchReport])

  const tree = report?.tree || null
  const query = searchTerm.toLowerCase().trim()

  const rows = useMemo(() => {
    if (!tree) return []

    if (!query) {
      return flattenTree(tree, 0, (node) => expanded.has(getNodeId(node)))
    }

    // While searching, show every matching branch fully opened
    const ids = new Set()
    collectMatches(tree, query, ids)
    const visibleTree = filterTree(tree, ids)
    return visibleTree ? flattenTree(visibleTree, 0, () => true) : []
  }, [tree, expanded, query])

  const toggleNode = (nodeId) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const expandAll = () => tree && setExpanded(collectParentIds(tree))
  const collapseAll = () => tree && setExpanded(new Set([getNodeId(tree)]))

  if (currentRole === 'tc') {
    return <Navigate to="/" replace />
  }

  const totals = tree?.team
  const isAdmin = currentRole === 'admin'

  const statTiles = totals ? [
    { label: 'Assigned leads', value: formatNumber(totals.total) },
    { label: 'Completed', value: formatNumber(totals.complete), note: `${getCompletion(totals)}%` },
    { label: 'Pending', value: formatNumber(totals.pending) },
    { label: 'Team members', value: formatNumber(tree.members) },
    ...(isAdmin && report?.unassigned !== null && report?.unassigned !== undefined
      ? [{ label: 'Not yet assigned (pool)', value: formatNumber(report.unassigned) }]
      : []),
  ] : []

  return (
    <div className="space-y-3">
      {/* TITLE + FILTERS - one row, scopes everything below */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <h1 className="shrink-0 text-xl font-bold tracking-tight text-[var(--text)] lg:mr-2">Team lead report</h1>

        <select
          value={campaignId}
          onChange={(event) => setCampaignId(event.target.value)}
          aria-label="Filter by campaign"
          className={`${controlClassName} w-full px-3 lg:w-52`}
        >
          <option value="">All campaigns</option>
          {campaigns.map((campaign) => <option key={campaign._id} value={campaign._id}>{campaign.title}</option>)}
        </select>

        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
          <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name or email..." aria-label="Search team members" className={`${controlClassName} w-full pl-9 pr-3 placeholder:text-[var(--muted)]`} />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={expandAll} disabled={!tree || Boolean(query)} className={`${buttonClassName} flex-1 lg:flex-none`}>
            <ChevronsUpDown size={15} />Expand all
          </button>
          <button type="button" onClick={collapseAll} disabled={!tree || Boolean(query)} className={`${buttonClassName} flex-1 lg:flex-none`}>
            <ChevronsDownUp size={15} />Collapse all
          </button>
          <button type="button" onClick={() => fetchReport()} disabled={isLoading} aria-label="Refresh report" title="Refresh" className={`${buttonClassName} shrink-0`}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* STATS - one slim strip */}
      {statTiles.length > 0 && (
        <div className="flex divide-x divide-[var(--border)] overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          {statTiles.map((tile) => <StatTile key={tile.label} {...tile} />)}
        </div>
      )}

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" /><span>{error}</span><button type="button" onClick={() => fetchReport()} className="ml-auto font-semibold underline">Try again</button></div>}

      <div className="app-table-card">
        <div className="overflow-x-auto">
          <table className="app-table min-w-[64rem]">
            <thead>
              <tr>
                <th>Team member</th>
                <th>Assigned</th>
                {STATUS_COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !tree ? <TableSkeleton columns={COLUMN_COUNT} />
                : rows.length === 0 ? <tr><td colSpan={COLUMN_COUNT} className="py-14 text-center text-[var(--muted)]">{query ? 'No one matches your search.' : 'No report data.'}</td></tr>
                  : rows.map(({ node, depth }) => {
                    const nodeId = getNodeId(node)
                    const hasChildren = node.children.length > 0
                    const isOpen = query ? true : expanded.has(nodeId)
                    const meta = ROLE_META[node.role] || { label: node.role, dot: 'bg-slate-400' }
                    const isViewer = depth === 0

                    return (
                      <tr key={nodeId} className={isViewer ? 'bg-[var(--surface-alt)]' : ''}>
                        <td>
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.5}rem` }}>
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => toggleNode(nodeId)}
                                disabled={Boolean(query)}
                                aria-expanded={isOpen}
                                aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${node.name}'s team`}
                                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-alt)] hover:text-[var(--text)] disabled:cursor-default"
                              >
                                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            ) : <span className="w-6 shrink-0" />}

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                              {String(node.name || '?').charAt(0).toUpperCase()}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {node.role === 'tc' && !isViewer ? (
                                  <Link to={`/telecallers/${nodeId}`} state={{ telecaller: { assignedTo: { userId: node.userId, name: node.name, email: node.email } } }} className="truncate font-semibold text-[var(--text)] hover:text-[var(--primary)]">{node.name}</Link>
                                ) : (
                                  <span className="truncate font-semibold text-[var(--text)]">{node.name}</span>
                                )}
                                {isViewer && <span className="text-xs font-medium text-[var(--muted)]">(You)</span>}
                                {node.isActive === false && <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">Inactive</span>}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                                <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
                                <span>{meta.label}</span>
                                {node.members > 0 && <span>· {node.members} {node.members === 1 ? 'member' : 'members'}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="font-semibold tabular-nums text-[var(--text)]">{formatNumber(node.team.total)}</span>
                          {hasChildren && node.own.total > 0 && (
                            <p className="mt-0.5 whitespace-nowrap text-xs text-[var(--muted)]" title="Assigned to this person and not passed down to the team yet">
                              {formatNumber(node.own.total)} held directly
                            </p>
                          )}
                        </td>

                        {STATUS_COLUMNS.map((column) => (
                          <td key={column.key} className="tabular-nums text-[var(--muted)]">{formatNumber(node.team[column.key])}</td>
                        ))}

                        <td><CompletionMeter counts={node.team} /></td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
        {tree && (
          <p className="border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--muted)]">
            Numbers on a manager or team leader row include everyone below them. &quot;Held directly&quot; = leads still assigned to that person, not yet passed down.
          </p>
        )}
      </div>
    </div>
  )
}

export default TeamReport

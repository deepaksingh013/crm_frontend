import React, { useState, useEffect, useCallback } from 'react'
import { Eye, AlertCircle, Search } from 'lucide-react'
import TableSkeleton from '../../../components/table/TableSkeleton'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.REACT_APP_API_URL

const Leadmanagment = () => {
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    setError('')

    const token = Cookies.get('token')

    if (!token) {
      setError('Authentication failed. Please log in again.')
      setIsLoading(false)
      return
    }

    try {
      const response = await axios.get(
        `${API_URL}/campaigns/lead-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const campaignList = response.data?.data || []
      setCampaigns(Array.isArray(campaignList) ? campaignList : [])
    } catch (err) {
      setError( err.response?.data?.message || err.message || 'Failed to fetch campaigns.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.campaignName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Lead Management
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View campaign performance and manage individual leads.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={20}/>
          <input type="text" placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-11 pr-4 text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"/>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <div>
            <span>{error}</span>
            <button type="button" onClick={fetchCampaigns} className="ml-2 cursor-pointer font-semibold underline"     >
              Try again
            </button>
          </div>
        </div>
      )}
      <div className="app-table-card">
        <div className="overflow-x-auto">
          <table className="app-table min-w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th>
                  Campaign
                </th>
                <th>
                  New leads
                </th>
                <th>
                  Pending
                </th>
                <th>
                  Not contacted
                </th>
                <th>
                  Completed
                </th>
                <th>
                  Holding
                </th>
                <th>
                  Rejected
                </th>
                <th>
                  Total
                </th>
                <th>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton columns={9} />
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-red-500">
                    Could not load campaigns.
                  </td>
                </tr>
              ) : filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign) => {
                  const statusCount = campaign.statusCount || {}
                  const newLeads = statusCount.new || 0
                  const pending = statusCount.pending || 0
                  const complete = statusCount.complete || 0
                  const reject = statusCount.reject || 0
                  const holding = statusCount.holding || 0
                  const notConnected = statusCount.notConnected || 0

                  return (
                    <tr key={campaign.campaignId}>
                      <td>
                        <Link to={`/leads/${campaign.campaignId}`} state={{ campaignName: campaign.campaignName,}}
                          className="font-medium text-[var(--text)] hover:text-[var(--primary)]">
                          {campaign.campaignName}
                        </Link>
                      </td>
                      <td className="tabular-nums text-[var(--muted)]">
                        {newLeads}
                      </td>
                      <td className="tabular-nums text-[var(--muted)]">
                        {pending}
                      </td>
                      <td className="tabular-nums text-[var(--muted)]">
                        {notConnected}
                      </td>
                      <td className="tabular-nums text-[var(--muted)]">
                        {complete}
                      </td>
                      <td className="tabular-nums text-[var(--muted)]">
                        {holding}
                      </td>
                      <td className="tabular-nums text-[var(--muted)]">
                        {reject}
                      </td>
                      <td>
                        <span className="app-table-count">
                          {campaign.totalLeads || 0}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/leads/${campaign.campaignId}`}
                          state={{
                            campaignName: campaign.campaignName,
                          }}
                          aria-label={`View ${campaign.campaignName}`}
                          className="app-table-btn focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--muted)]"> 
                    {searchTerm? 'No campaigns match your search.' : 'No campaigns found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Leadmanagment
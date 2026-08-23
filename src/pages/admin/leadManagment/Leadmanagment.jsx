import React, { useState, useEffect, useCallback } from 'react'
import { Eye, Loader2, AlertCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

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
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Campaign
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  New leads
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Pending
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Not contacted
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Completed
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Holding
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Rejected
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Total
                </th>
                <th className="px-6 py-4 font-semibold text-[var(--muted)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-[var(--muted)]">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading campaigns...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-red-500">
                    Could not load campaigns.
                  </td>
                </tr>
              ) : filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((campaign) => {
                  const statusCount = campaign.statusCount || {}
                  const complete = statusCount.complete || 0
                  const reject = statusCount.reject || 0
                  const holding = statusCount.holding || 0
                  const notConnected = statusCount.notConnected || 0
                  const newLeads = 0
                  const pending = 0

                  return (
                    <tr key={campaign.campaignId} className="hover:bg-[var(--surface-alt)]">
                      <td className="px-6 py-4">
                        <Link to={`/leads/${campaign.campaignId}`} state={{ campaignName: campaign.campaignName,}}
                          className="font-medium text-[var(--text)] hover:text-[var(--primary)]">
                          {campaign.campaignName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {newLeads}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {pending}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {notConnected}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {complete}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {holding}
                      </td>
                      <td className="px-6 py-4 text-[var(--muted)]">
                        {reject}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-[rgba(11,116,255,0.12)] px-3 py-1 text-sm font-semibold text-[var(--primary)]">
                          {campaign.totalLeads || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/leads/${campaign.campaignId}`}
                          state={{
                            campaignName: campaign.campaignName,
                          }}
                          aria-label={`View ${campaign.campaignName}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <Eye size={16} />
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
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Search, UserRound, Users } from 'lucide-react'
import TableSkeleton from '../../../components/table/TableSkeleton'
import { apiGet } from '../../../redux/apiMethods'

const getLeadRows = (response) => {
  const possibleLists = [
    response?.leads,
    response?.results,
    response?.data?.leads,
    response?.data?.results,
    response?.data?.data,
    response?.result?.data,
    response?.data,
    response,
  ]
  const rows = possibleLists.find(Array.isArray)

  if (rows) return rows.filter((row) => row && typeof row === 'object')

  const possibleLead = response?.lead || response?.data?.lead
  if (possibleLead && typeof possibleLead === 'object') return [possibleLead]

  return []
}

const flattenLead = (lead, prefix = '', values = {}) => {
  Object.entries(lead).forEach(([key, value]) => {
    const field = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      flattenLead(value, field, values)
    } else if (Array.isArray(value)) {
      values[field] = value.map((item) => (
        item && typeof item === 'object' ? JSON.stringify(item) : String(item ?? '')
      )).join(', ')
    } else {
      values[field] = value
    }
  })

  return values
}

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const LEAD_COLUMNS = [
  { label: 'Created Date', keys: ['createdAt', 'createdDate', 'createdOn', 'dateCreated'] },
  { label: 'Campaign Name', keys: ['campaignName', 'campaign.name', 'campaign.title', 'campaign.campaignName', 'campaign'] },
  { label: 'Mobile', keys: ['mobile', 'phone', 'phoneNumber', 'contact', 'number'] },
  { label: 'Alternate Number', keys: ['alternateNumber', 'alternatePhone', 'alternateMobile', 'secondaryPhone', 'altPhone'] },
  { label: 'City', keys: ['city', 'town'] },
  { label: 'Pincode', keys: ['pincode', 'pinCode', 'postalCode', 'zipCode'] },
  { label: 'Address', keys: ['address', 'customerAddress', 'fullAddress', 'location', 'address.line1', 'address.addressLine', 'address.street'] },
  { label: 'TC Name', keys: ['tcName', 'telecallerName', 'assignedTo.name', 'assignedTo.fullName', 'telecaller.name', 'tc.name', 'assignedUser.name'] },
  { label: 'Status', keys: ['status', 'leadStatus', 'state', 'lead_state'] },
]

const getLeadField = (lead, aliases) => {
  const fields = Object.keys(lead)

  for (const alias of aliases) {
    const matchingKey = fields.find((field) => (
      field.toLowerCase().replace(/[^a-z0-9]/g, '') ===
      alias.toLowerCase().replace(/[^a-z0-9]/g, '')
    ))

    if (matchingKey && lead[matchingKey] !== null && lead[matchingKey] !== undefined && lead[matchingKey] !== '') {
      return lead[matchingKey]
    }
  }

  if (aliases.includes('address')) {
    const addressParts = fields
      .filter((field) => /^address\./i.test(field) && lead[field])
      .map((field) => lead[field])
    if (addressParts.length) return addressParts.join(', ')
  }

  if (aliases.includes('assignedTo.name')) {
    const telecallerName = fields.find((field) => (
      /(?:assigned|telecaller|^tc)\./i.test(field) && /\.name$/i.test(field)
    ))
    if (telecallerName) return lead[telecallerName]
  }

  return null
}

const formatCreatedDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatValue(value)

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const GlobalLeadSearch = () => {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const number = searchParams.get('number') || ''
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!number) {
      setLeads([])
      setError('')
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    setError('')

    dispatch(apiGet(`/leads/search?number=${encodeURIComponent(number)}`))
      .then((response) => {
        if (active) setLeads(getLeadRows(response))
      })
      .catch((requestError) => {
        if (active) {
          setLeads([])
          setError(
            requestError.response?.data?.message ||
            requestError.message ||
            'Unable to search leads right now.'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [dispatch, number])

  const flattenedLeads = useMemo(() => leads.map((lead) => flattenLead(lead)), [leads])

  return (
    <section className="space-y-6">
      <div className="border-b border-[var(--border)] pb-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
            <UserRound size={17} />
            Lead lookup
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            Search results
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Find every lead associated with a mobile number.
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Search failed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="app-table-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">Matching leads</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {number ? `Mobile number: ${number}` : 'Search using a mobile number'}
            </p>
          </div>
          {!loading && !error && leads.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Users size={14} />
              {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
            </span>
          )}
        </div>

        <div className="max-h-[65vh] overflow-auto">
          <table className="app-table min-w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[var(--border)]">
                {LEAD_COLUMNS.map((column) => (
                  <th key={column.label}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={LEAD_COLUMNS.length} />
              ) : error ? (
                <tr>
                  <td colSpan={LEAD_COLUMNS.length} className="px-4 py-14 text-center text-sm text-[var(--muted)]">
                    No results to display.
                  </td>
                </tr>
              ) : flattenedLeads.length > 0 ? (
                flattenedLeads.map((lead, index) => (
                  <tr key={lead._id || lead.id || index}>
                    {LEAD_COLUMNS.map((column) => {
                      const value = getLeadField(lead, column.keys)
                      const displayValue = column.label === 'Created Date'
                        ? formatCreatedDate(value)
                        : formatValue(value)

                      return (
                      <td key={column.label} className="max-w-[22rem] whitespace-nowrap text-slate-700">
                        <span title={displayValue} className="block truncate">
                          {displayValue}
                        </span>
                      </td>
                      )
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={LEAD_COLUMNS.length} className="px-4 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500">
                        <Search size={20} />
                      </span>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {number ? 'No leads found' : 'Enter a mobile number to begin'}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {number ? 'Try another number or check the digits and search again.' : 'Matching lead records will appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default GlobalLeadSearch
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import LeadStatusUpdateModal from './LeadStatusUpdateModal';
import {createSalesManagementRoute, DEFAULT_SALES_STATUS, normalizeSalesStatus, resolveSalesManagementTarget, SALES_STATUS_LABELS,} from './salesManagementRoutes';

const API_URL ='https://crm-backend-5-iocr.onrender.com/api';

const formatDate = (value) => {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusLabel = (status) => {
  const normalized = normalizeSalesStatus(status);

  return SALES_STATUS_LABELS[normalized] || 'Pending';
};

const getStatusStyle = (status) => {
  const normalized = normalizeSalesStatus(status);

  const styles = {
    connected:
      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected:
      'bg-rose-50 text-rose-700 border border-rose-200',
    hold:
      'bg-amber-50 text-amber-700 border border-amber-200',
    notConnected:
      'bg-slate-100 text-slate-700 border border-slate-200',
    pending:
      'bg-blue-50 text-blue-700 border border-blue-200',
    all:
      'bg-violet-50 text-violet-700 border border-violet-200',
  };

  return styles[normalized] || styles.pending;
};

const getApiStatusParam = (status) => {
  const normalized = normalizeSalesStatus(status || DEFAULT_SALES_STATUS);

  if (normalized === 'all') {
    return null;
  }

  const statusMap = {
    pending: 'Pending',
    connected: 'Complete',
    rejected: 'Reject',
    hold: 'Holding',
    notConnected: 'Not Connected',
  };

  return statusMap[normalized] || 'Pending';
};

const SalesManagment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const target = useMemo(
    () => resolveSalesManagementTarget(location.pathname),
    [location.pathname]
  );

  const { campaignId, status, showCampaignPicker } = target;

  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const getLeadValue = useCallback(
    (lead, keys, fallback = 'N/A') => {
      for (const key of keys) {
        if (
          lead?.[key] !== undefined &&
          lead?.[key] !== null &&
          lead?.[key] !== ''
        ) {
          return lead[key];
        }
      }

      return fallback;
    },
    []
  );

  const fetchCampaigns = useCallback(async () => {
    const token = Cookies.get('token');

    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/campaigns/lead-summary/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = response.data;
      const campaignList = Array.isArray(responseData?.campaignWiseSummary)
        ? responseData.campaignWiseSummary
        : [];

      setCampaigns(
        campaignList.map((item) => {
          const statusCount = item.statusCount || item.statusCounts || {};

          return {
            id: item._id ?? item.id ?? item.campaignId ?? item.campaign_id,
            name:
              item.title ??
              item.name ??
              item.campaignName ??
              item.campaign_name ??
              'Unnamed Campaign',
            pending:
              item.pending ??
              item.pendingLeads ??
              item.pending_leads ??
              statusCount.pending ??
              statusCount.new ??
              statusCount.newLeads ??
              0,
            complete:
              item.complete ??
              item.completed ??
              item.completeLeads ??
              item.completedLeads ??
              item.complete_leads ??
              statusCount.complete ??
              statusCount.completed ??
              0,
            rejected:
              item.rejected ??
              item.rejectedLeads ??
              item.rejected_leads ??
              statusCount.rejected ??
              statusCount.reject ??
              0,
            holding:
              item.holding ??
              item.holdingLeads ??
              item.holding_leads ??
              statusCount.holding ??
              statusCount.hold ??
              0,
            notConnected:
              item.notConnected ??
              item.not_connected ??
              item.notConnectedLeads ??
              item.not_connected_leads ??
              statusCount.notConnected ??
              statusCount.not_connected ??
              0,
            totalLeads:
              item.totalLeads ??
              item.total_leads ??
              item.total ??
              item.totalLead ??
              Object.values(statusCount).reduce(
                (sum, count) => sum + Number(count || 0),
                0
              ),
          };
        })
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to load campaigns.';

      setError(message);
      setCampaigns([]);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setError('');

    const token = Cookies.get('token');

    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const apiStatus = getApiStatusParam(status);
      const url = apiStatus
        ? `${API_URL}/campaigns/${campaignId}/leads/my?status=${encodeURIComponent(apiStatus)}`
        : `${API_URL}/campaigns/${campaignId}/leads/my`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = response.data;
      let leadList = [];

      if (Array.isArray(responseData)) {
        leadList = responseData;
      } else if (Array.isArray(responseData?.leads)) {
        leadList = responseData.leads;
      } else if (Array.isArray(responseData?.data)) {
        leadList = responseData.data;
      } else if (Array.isArray(responseData?.data?.leads)) {
        leadList = responseData.data.leads;
      } else if (Array.isArray(responseData?.result)) {
        leadList = responseData.result;
      }

      setLeads(leadList);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to load campaign leads.';

      setError(message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, status]);

  useEffect(() => {
    if (showCampaignPicker) {
      setLoading(true);
      setError('');
      setLeads([]);
      fetchCampaigns();
      return;
    }

    if (!campaignId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    fetchCampaigns();
    fetchLeads();
  }, [campaignId, fetchCampaigns, fetchLeads, showCampaignPicker]);

  const selectedCampaign = useMemo(() => {
    if (!campaignId || campaigns.length === 0) {
      return null;
    }

    return (
      campaigns.find(
        (campaign) =>
          String(campaign.id) === String(campaignId) ||
          String(campaign.id) === decodeURIComponent(campaignId)
      ) || null
    );
  }, [campaignId, campaigns]);

  const openStatusModal = (lead) => {
    setSelectedLead(lead);
    setError('');
    setIsModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  const openCampaign = (campaign) => {
    const campaignIdFromItem =
      campaign?.id ?? campaign?._id ?? campaign?.campaignId ?? campaign?.campaign_id;

    if (!campaignIdFromItem) {
      setError('Unable to open campaign: campaign id is missing.');
      return;
    }

    navigate(createSalesManagementRoute(campaignIdFromItem, DEFAULT_SALES_STATUS));
  };

  if (showCampaignPicker) {
    return (
      <main className="min-h-screen bg-[#f5f7fa]">
        <div className="mx-auto min-h-screen w-full max-w-[1400px] px-3 py-5 sm:px-5 sm:py-7 md:px-7 lg:px-10">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl">
              Select Campaign
            </h1>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Choose a campaign to view the relevant sales leads.
            </p>
          </div>

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-red-700">
                    Unable to load campaigns
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-red-600">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchCampaigns}
                  disabled={loading}
                  className="shrink-0 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && campaigns.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm sm:px-8">
              <h2 className="mt-4 text-base font-semibold text-gray-700">No campaigns found</h2>
              <p className="mt-1 text-sm text-gray-400">There are no campaigns available right now.</p>
            </div>
          )}

          {campaigns.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => openCampaign(campaign)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-teal-700 to-purple-600" />
                  <div className="p-5 sm:p-6">
                    <h2 className="truncate pr-2 text-base font-bold text-gray-800 sm:text-lg">
                      {campaign.name}
                    </h2>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-bold leading-none text-teal-700 sm:text-[32px]">
                        {campaign.totalLeads ?? 0}
                      </span>
                      <span className="text-xs text-gray-400 sm:text-sm">Total Leads</span>
                    </div>
                    <div className="my-4 border-t border-gray-100" />
                    <div className="grid grid-cols-2 gap-2">
                      <StatusBox label="Pending" count={campaign.pending} className="border-sky-100 bg-sky-50 text-sky-700" />
                      <StatusBox label="Complete" count={campaign.complete} className="border-green-100 bg-green-50 text-green-700" />
                      <StatusBox label="Rejected" count={campaign.rejected} className="border-red-100 bg-red-50 text-red-700" />
                      <StatusBox label="Holding" count={campaign.holding} className="border-cyan-100 bg-cyan-50 text-cyan-700" />
                    </div>
                    <div className="mt-2">
                      <StatusBox label="Not Connected" count={campaign.notConnected} className="border-gray-100 bg-gray-50 text-gray-700" />
                    </div>
                    <div className="my-4 border-t border-gray-100" />
                    <div className="text-center text-xs text-gray-400 transition-colors group-hover:text-teal-700">
                      Click to view sales management
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa]">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Sales Management
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-800 sm:text-3xl">
                {selectedCampaign?.name || 'Campaign Sales'}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {status ? `Showing ${getStatusLabel(status)} leads` : 'Manage and update your campaign leads.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/sales-management')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Change Campaign
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Lead Details</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(SALES_STATUS_LABELS).map(([statusKey, label]) => {
                const isActive = normalizeSalesStatus(status) === statusKey;

                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => navigate(createSalesManagementRoute(campaignId, statusKey))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {!loading && error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <span className="font-bold">!</span>
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-0.5 text-xs">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <p className="mt-3 text-sm text-gray-500">Loading leads...</p>
            </div>
          )}

          {!loading && !error && leads.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400">—</div>
              <p className="mt-3 text-sm font-semibold text-gray-600">No {getStatusLabel(status)} leads found</p>
              <p className="mt-1 text-xs text-gray-400">
                There are no {getStatusLabel(status).toLowerCase()} leads available for this campaign.
              </p>
            </div>
          )}

          {!loading && leads.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">Date</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">Name</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">Phone</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">Pincode</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold">Status</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leads.map((lead, index) => {
                      const leadStatus = getLeadValue(lead, ['status', 'leadStatus', 'state', 'lead_state'], 'pending');
                      const leadName = getLeadValue(lead, ['name', 'fullName', 'customerName', 'leadName']);
                      const leadPhone = getLeadValue(lead, ['phone', 'mobile', 'phoneNumber', 'contact']);
                      const leadPincode = getLeadValue(lead, ['pincode', 'pinCode', 'postalCode', 'zipCode']);
                      const leadDate = getLeadValue(lead, ['createdAt', 'created_at', 'updatedAt', 'date', 'leadDate'], '');
                      const leadId = lead._id || lead.id || index;

                      return (
                        <tr key={leadId} className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600">{formatDate(leadDate)}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
                                {String(leadName)
                                  .split(' ')
                                  .map((word) => word[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-800">{leadName}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600">{leadPhone}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-gray-600">{leadPincode}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(leadStatus)}`}>
                              {getStatusLabel(leadStatus)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openStatusModal(lead)}
                              className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <LeadStatusUpdateModal
        isOpen={isModalOpen}
        lead={selectedLead}
        onClose={closeStatusModal}
        onUpdateSuccess={fetchLeads}
        campaignId={campaignId}
      />
    </main>
  );
};

function StatusBox({ label, count, className }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide">{label}</span>
        <span className="text-base font-bold">{count ?? 0}</span>
      </div>
    </div>
  );
}
export default SalesManagment;

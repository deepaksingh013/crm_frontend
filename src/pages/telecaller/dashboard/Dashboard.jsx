import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import CampaingCard from "./CampaingCard"

const API_URL =
  "https://crm-backend-5-iocr.onrender.com/api";

export default function TcDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const summaryCards = [
    {
      title: "Total Campaigns",
      value: campaigns.length,
      subtitle: "Active campaigns",
      accent: "from-sky-500 to-cyan-500",
      icon: "🎯",
    },
    {
      title: "Total Leads",
      value: campaigns.reduce(
        (sum, campaign) =>
          sum + Number(campaign.totalLeads ?? 0),
        0
      ),
      subtitle: "Across all campaigns",
      accent: "from-violet-500 to-purple-500",
      icon: "📊",
    },
    {
      title: "Pending",
      value: campaigns.reduce(
        (sum, campaign) =>
          sum + Number(campaign.pending ?? 0),
        0
      ),
      subtitle: "Follow-up needed",
      accent: "from-amber-500 to-orange-500",
      icon: "⏳",
    },
    {
      title: "Completed",
      value: campaigns.reduce(
        (sum, campaign) =>
          sum + Number(campaign.complete ?? 0),
        0
      ),
      subtitle: "Successful calls",
      accent: "from-emerald-500 to-green-500",
      icon: "✅",
    },
  ];

  const getAuthHeaders = () => {
    const token = Cookies.get("token");

    if (!token) {
      throw new Error(
        "Authentication token not found. Please log in again."
      );
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const config = getAuthHeaders();

      const response = await axios.get(
        `${API_URL}/campaigns`,
        config
      );

      console.log(
        "Campaign API Response:",
        response.data
      );

      /*
       * Backend response:
       *
       * {
       *   campaigns: [...]
       * }
       *
       * OR
       *
       * [...]
       *
       * OR
       *
       * {
       *   data: [...]
       * }
       */

      const responseData = response.data;

      let campaignList = [];

      if (Array.isArray(responseData)) {
        campaignList = responseData;
      } else if (
        Array.isArray(responseData?.campaigns)
      ) {
        campaignList = responseData.campaigns;
      } else if (
        Array.isArray(responseData?.data)
      ) {
        campaignList = responseData.data;
      } else if (
        Array.isArray(responseData?.results)
      ) {
        campaignList = responseData.results;
      }

      console.log(
        "Campaign List:",
        campaignList
      );

      /*
       * Normalize campaign data
       */
      const normalizedCampaigns =
        campaignList.map((item) => ({
          id:
            item._id ??
            item.id ??
            item.campaignId ??
            item.campaign_id,

          name:
            item.title ??
            item.name ??
            item.campaignName ??
            item.campaign_name ??
            "Unnamed Campaign",

          totalLeads:
            item.totalLeads ??
            item.total_leads ??
            item.total ??
            item.totalLead ??
            0,

          pending:
            item.pending ??
            item.pendingLeads ??
            item.pending_leads ??
            0,

          complete:
            item.complete ??
            item.completed ??
            item.completeLeads ??
            item.completedLeads ??
            item.complete_leads ??
            0,

          rejected:
            item.rejected ??
            item.rejectedLeads ??
            item.rejected_leads ??
            0,

          holding:
            item.holding ??
            item.holdingLeads ??
            item.holding_leads ??
            0,

          notConnected:
            item.notConnected ??
            item.not_connected ??
            item.notConnectedLeads ??
            item.not_connected_leads ??
            0,

          originalData: item,
        }));

      console.log(
        "Normalized Campaigns:",
        normalizedCampaigns
      );

      setCampaigns(normalizedCampaigns);
    } catch (err) {
      console.error(
        "Campaign API Error:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Unauthorized. Your session may have expired. Please login again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load campaigns."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <main className="min-h-screen bg-[#f5f7fa]">
      <div className="mx-auto min-h-screen w-full max-w-[1400px] px-3 py-5 sm:px-5 sm:py-7 md:px-7 lg:px-10">

        {/* ================= HEADER ================= */}

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl">
            Campaign Details
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Overview of all campaign leads and
            their status
          </p>
        </div>

        {!loading && !error && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <DashboardStatCard
                key={card.title}
                {...card}
              />
            ))}
          </div>
        )}

        {loading && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <DashboardCardSkeleton
                  key={index}
                />
              )
            )}
          </div>
        )}

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <CampaignSkeleton
                  key={index}
                />
              )
            )}
          </div>
        )}

        {/* ================= ERROR ================= */}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-red-700">
                  Unable to load campaigns
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error}
                </p>
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

        {/* ================= EMPTY ================= */}

        {!loading &&
          !error &&
          campaigns.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm sm:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 13h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h6l4 4v12a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <h2 className="mt-4 text-base font-semibold text-gray-700">
                No campaigns found
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                There are no campaigns available
                right now.
              </p>
            </div>
          )}

        {/* ================= CAMPAIGNS ================= */}

        {!loading &&
          !error &&
          campaigns.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
              {campaigns.map(
                (campaign, index) => (
                  <CampaingCard
                    key={
                      campaign.id ??
                      `campaign-${index}`
                    }
                    campaign={campaign}
                  />
                )
              )}
            </div>
          )}
      </div>
    </main>
  );
}

function DashboardStatCard({ title, value, subtitle, accent, icon }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />

      <div className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
            {title}
          </p>
          <h3 className="mt-3 text-2xl font-bold text-gray-800 sm:text-3xl">
            {value}
          </h3>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xl shadow-sm`}>
          {icon}
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500 sm:px-5">
        {subtitle}
      </div>
    </div>
  );
}

/* ================= SKELETON ================= */

function DashboardCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-1.5 animate-pulse bg-gray-200" />

      <div className="p-4 sm:p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />

        <div className="mt-4 h-8 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

function CampaignSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-[3px] animate-pulse bg-gray-200" />

      <div className="p-5 sm:p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

        <div className="mt-3 flex items-end gap-2">
          <div className="h-9 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="my-5 border-t border-gray-100" />

        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-12 animate-pulse rounded-lg bg-gray-200" />
        </div>

        <div className="mt-2 h-12 animate-pulse rounded-lg bg-gray-200" />

        <div className="my-5 border-t border-gray-100" />

        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

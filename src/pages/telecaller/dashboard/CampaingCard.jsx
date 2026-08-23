import { useNavigate } from "react-router-dom";
import {
  createSalesManagementRoute,
} from "../salesManagment/salesManagementRoutes";

const CampaignCard = ({ campaign }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!campaign.id) {
      console.error("Campaign ID not found:", campaign);
      return;
    }

    navigate(createSalesManagementRoute(campaign.id, "pending"));
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Top Gradient */}
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-teal-700 to-purple-600" />

      <div className="p-5 sm:p-6">

        {/* Campaign Name */}
        <h2 className="truncate pr-2 text-base font-bold text-gray-800 sm:text-lg">
          {campaign.name}
        </h2>

        {/* Total Leads */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold leading-none text-teal-700 sm:text-[32px]">
            {campaign.totalLeads}
          </span>

          <span className="text-xs text-gray-400 sm:text-sm">
            Total Leads
          </span>
        </div>

        <div className="my-4 border-t border-gray-100" />

        {/* Status */}
        <div className="grid grid-cols-2 gap-2">
          <StatusBox
            label="Pending"
            count={campaign.pending}
            className="border-sky-100 bg-sky-50 text-sky-700"
          />

          <StatusBox
            label="Complete"
            count={campaign.complete}
            className="border-green-100 bg-green-50 text-green-700"
          />

          <StatusBox
            label="Rejected"
            count={campaign.rejected}
            className="border-red-100 bg-red-50 text-red-700"
          />

          <StatusBox
            label="Holding"
            count={campaign.holding}
            className="border-cyan-100 bg-cyan-50 text-cyan-700"
          />
        </div>

        {/* Not Connected */}
        <div className="mt-2">
          <StatusBox
            label="Not Connected"
            count={campaign.notConnected}
            className="border-gray-100 bg-gray-50 text-gray-700"
          />
        </div>

        <div className="my-4 border-t border-gray-100" />

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 transition-colors group-hover:text-teal-700">
          Click to view sales management
        </div>
      </div>
    </div>
  );
};

function StatusBox({
  label,
  count,
  className,
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>

        <span className="text-base font-bold">
          {count ?? 0}
        </span>
      </div>
    </div>
  );
}

export default CampaignCard;

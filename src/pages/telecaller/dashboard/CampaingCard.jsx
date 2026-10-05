import { useNavigate } from "react-router-dom";
import {createSalesManagementRoute,} from "../salesManagment/salesManagementRoutes";

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
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-teal-700 to-purple-600" />

      <div className="p-3.5">

        <h2 className="truncate pr-2 text-sm font-bold capitalize text-gray-800">
          {campaign.name}
        </h2>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold leading-none text-teal-700">
            {campaign.totalLeads}
          </span>

          <span className="text-xs text-gray-400">
            Total Leads
          </span>
        </div>

        <div className="my-2.5 border-t border-gray-100" />

        <div className="grid grid-cols-2 gap-1.5">
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
        <div className="mt-1.5">
          <StatusBox
            label="Not Connected"
            count={campaign.notConnected}
            className="border-gray-100 bg-gray-50 text-gray-700"
          />
        </div>

        <div className="my-2.5 border-t border-gray-100" />

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
      className={`rounded-md border px-2.5 py-1.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>

        <span className="text-sm font-bold">
          {count ?? 0}
        </span>
      </div>
    </div>
  );
}

export default CampaignCard;

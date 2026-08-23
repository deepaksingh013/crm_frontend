import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-8">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[var(--primary)] opacity-[0.08] blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[var(--accent)] opacity-[0.08] blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-bold text-[var(--text)]">
          Access Denied
        </h1>

        <p className="mb-8 text-[var(--muted)]">
          You don't have permission to access this page. Please contact your administrator.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const getDashboardRoute = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "/users";

      case "manager":
        return "/commingsoon";

      case "tl":
        return "/commingsoon";

      case "tc":
        return "/tc/dashboard";

      default:
        return null;
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");

    if (!token || !role) {
      return;
    }

    const dashboardRoute = getDashboardRoute(role);

    if (dashboardRoute) {
      navigate(dashboardRoute, {
        replace: true,
      });
    } else {
      // Invalid role
      Cookies.remove("token");
      Cookies.remove("role");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple requests
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const toastId = toast.loading("Signing in...");

    try {
      const response = await axios.post(
        "https://crm-backend-5-iocr.onrender.com/api/auth/login",
        {
          email: trimmedEmail,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
        }
      );

      const data = response.data;

      if (!data?.success || !data?.token) {
        toast.error(
          data?.message ||
            data?.error ||
            "Invalid email or password.",
          {
            id: toastId,
          }
        );

        return;
      }
      const userRole = data?.user.role?.toLowerCase();

      console.log("User Role:", userRole);

      if (!userRole) {
        toast.error("User role not found.", {
          id: toastId,
        });

        return;
      }
      const dashboardRoute = getDashboardRoute(userRole);

      if (!dashboardRoute) {
        toast.error("Invalid user role.", {
          id: toastId,
        });

        return;
      }
      Cookies.set("token", data.token, {
        expires: 7,
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });
      Cookies.set("role", userRole, {
        expires: 7,
        secure: window.location.protocol === "https:",
        sameSite: "lax",
      });
      toast.success("Login successful!", {
        id: toastId,
      });
      navigate(dashboardRoute, {
        replace: true,
      });
    } catch (error) {
      console.error("Login Error:", error);

      let message = "Login failed. Please try again.";

      // Request timeout
      if (error.code === "ECONNABORTED") {
        message = "Request timed out. Please try again.";
      }

      // Backend response error
      else if (error.response) {
        message =
          error.response.data?.message ||
          error.response.data?.error ||
          "Invalid email or password.";
      }

      // Request sent but no response
      else if (error.request) {
        message =
          "Unable to connect to the server. Please check your internet connection.";
      }

      else {
        message =
          error.message ||
          "Login failed. Please try again.";
      }

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className=" absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[var(--primary)] opacity-[0.08] blur-3xl animate-[pulse_5s_ease-in-out_infinite]" />
        <div className=" absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[var(--accent)] opacity-[0.08] blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className=" absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)] opacity-[0.025] blur-3xl"/>
      </div>
      <div className=" relative z-10 w-full max-w-md animate-[fadeInUp_0.7s_ease-out] ">
        {/* Glow */}
        <div className=" absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] opacity-10 blur-xl"/>

        <form
          onSubmit={handleSubmit}
          className="
            relative
            overflow-hidden
            rounded-[2rem]
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-6
            shadow-[0_25px_80px_rgba(15,23,36,0.12)]
            backdrop-blur-xl
            transition-all
            duration-500
            hover:shadow-[0_30px_90px_rgba(15,23,36,0.16)]
            sm:p-8
          "
        >
          <div className="mb-4 text-center">
            <div className=" mx-auto mb-3 flex h-16 w-[140px] items-center justify-center transition-transform duration-300 hover:scale-105">
              <img
                src="/final_logo.png"
                alt="Apna India logo"
                className="object-contain"
              />
            </div>

            <div className="mb-2 flex items-center justify-center gap-2">
              <Sparkles
                size={15}
                className="text-[var(--primary)]"
              />

              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.25em]
                  text-[var(--primary)]
                "
              >
                Welcome Back
              </p>

              <Sparkles
                size={15}
                className="text-[var(--primary)]"
              />
            </div>

            <h1
              className="
                mt-3
                text-3xl
                font-bold
                tracking-tight
                text-[var(--text)]
              "
            >
              Sign in to your account
            </h1>

            <p
              className="
                mx-auto
                mt-3
                max-w-sm
                text-sm
                leading-6
                text-[var(--muted)]
              "
            >
              Enter your credentials to securely access your dashboard.
            </p>
          </div>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-[var(--text)]
              "
            >
              Email address
            </label>

            <div className="group relative">
              <Mail
                size={19}
                strokeWidth={1.8}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[var(--muted)]
                  transition-colors
                  duration-200
                  group-focus-within:text-[var(--primary)]
                "
              />

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                disabled={loading}
                className="
                  w-full
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface-alt)]
                  py-3.5
                  pl-12
                  pr-4
                  text-sm
                  text-[var(--text)]
                  placeholder:text-[var(--muted)]
                  outline-none
                  transition-all
                  duration-200
                  focus:border-[var(--primary)]
                  focus:bg-[var(--surface)]
                  focus:ring-4
                  focus:ring-[var(--primary)]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />
            </div>
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-[var(--text)]
              "
            >
              Password
            </label>

            <div className="group relative">
              <LockKeyhole
                size={19}
                strokeWidth={1.8}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-[var(--muted)]
                  transition-colors
                  duration-200
                  group-focus-within:text-[var(--primary)]
                "
              />

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={loading}
                className="
                  w-full
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface-alt)]
                  py-3.5
                  pl-12
                  pr-12
                  text-sm
                  text-[var(--text)]
                  placeholder:text-[var(--muted)]
                  outline-none
                  transition-all
                  duration-200
                  focus:border-[var(--primary)]
                  focus:bg-[var(--surface)]
                  focus:ring-4
                  focus:ring-[var(--primary)]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                disabled={loading}
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-xl
                  text-[var(--muted)]
                  transition-all
                  duration-200
                  hover:bg-[var(--surface)]
                  hover:text-[var(--primary)]
                  disabled:cursor-not-allowed
                "
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="
              group
              relative
              flex
              w-full
              items-center
              justify-center
              gap-2
              overflow-hidden
              rounded-2xl
              bg-[var(--primary)]
              px-5
              py-3.5
              text-sm
              font-bold
              text-white
              shadow-lg
              shadow-[var(--primary)]/20
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:bg-[var(--primary-hover)]
              hover:shadow-xl
              hover:shadow-[var(--primary)]/25
              active:translate-y-0
              disabled:cursor-not-allowed
              disabled:opacity-70
              disabled:hover:translate-y-0
            "
          >
            {/* Shine */}
            {!loading && (
              <span
                className="
                  absolute
                  inset-0
                  -translate-x-full
                  bg-gradient-to-r
                  from-transparent
                  via-white/15
                  to-transparent
                  transition-transform
                  duration-700
                  group-hover:translate-x-full
                "
              />
            )}

            {loading ? (
              <>
                <span
                  className="
                    h-5
                    w-5
                    animate-spin
                    rounded-full
                    border-2
                    border-white/30
                    border-t-white
                  "
                />

                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>

                <ArrowRight
                  size={18}
                  className="
                    transition-transform
                    duration-300
                    group-hover:translate-x-1
                  "
                />
              </>
            )}
          </button>
          <div className="mt-6 flex items-center justify-center gap-2">
            <LockKeyhole
              size={14}
              className="text-[var(--success)]"
            />

            <span className="text-xs text-[var(--muted)]">
              Your login is protected and secure
            </span>
          </div>

          {/* Decorative Line */}
          <div
            className="
              mx-auto
              mt-6
              h-px
              w-20
              bg-gradient-to-r
              from-transparent
              via-[var(--primary)]
              to-transparent
              opacity-40
            "
          />
        </form>
        <p
          className="
            mt-5
            text-center
            text-xs
            text-[var(--muted)]
            animate-[fadeIn_1s_ease-out_0.3s_both]
          "
        >
          © {new Date().getFullYear()} CRM Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Auth;

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {Search, ChevronDown, Menu} from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

const Header = ({
  sidebarOpen,
  toggleSidebar,
}) => {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('token')

      if (!token) {
        setLoading(false)
        navigate('/login')
        return
      }

      try {
        const response = await axios.get(
          `${API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (
          response.data?.success &&
          response.data?.user
        ) {
          setUser(response.data.user)
        }
      } catch (error) {
        console.error(
          'Failed to fetch user:',
          error.response?.data || error.message
        )

        if (error.response?.status === 401) {
          Cookies.remove('token')
          navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  // const handleLogout = () => {
  //   Cookies.remove('token')
  //   setUser(null)
  //   setShowUserMenu(false)
  //   navigate('/login')
  // }

  const userName =
    user?.name ||
    user?.email?.split('@')[0] ||
    'User'

  const userEmail = user?.email || ''
  const userRole = user?.role || 'User'
  const userInitial = userName
    .charAt(0)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 w-full shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-8">
      <div className="flex min-h-[56px] w-full items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Mobile menu */}
          <button
            type="button"
            aria-label={
              sidebarOpen
                ? 'Close menu'
                : 'Open menu'
            }
            onClick={toggleSidebar}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          {/* <div className="hidden w-full max-w-[520px] sm:block">
            <div className="header-search flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5">
              <Search
                size={18}
                className="shrink-0 text-slate-400"
              />

              <input
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                type="search"
                placeholder="Search users, reports, tasks..."
              />

              <div className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:flex">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </div> */}

          {/* Mobile title */}
          <div className="min-w-0 sm:hidden">
            <div className="truncate text-sm font-bold text-slate-800">
              ApnaIndia
            </div>

            <div className="text-[10px] text-slate-400">
              Admin Panel
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Mobile search */}
          <button
            type="button"
            aria-label="Search"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:hidden"
          >
            <Search size={18} />
          </button>

          {/* Notifications */}
          {/* <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Bell size={18} />

            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[8px] font-bold text-white">
              3
            </span>
          </button> */}

          {/* Divider */}
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          {/* User */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowUserMenu((prev) => !prev)
              }
              className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-slate-50 sm:gap-3"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
                {loading ? '...' : userInitial}
              </div>
              <div className="hidden text-left sm:block">
                <div className="max-w-[130px] truncate text-[13px] font-semibold capitalize text-slate-700">
                  {loading
                    ? 'Loading...'
                    : userName}
                </div>
                <div className="max-w-[130px] truncate text-[10px] capitalize text-slate-400">
                  {loading ? '...' : userRole}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  showUserMenu
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full z-50 mt-3 w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-md">
                      {userInitial}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold capitalize text-slate-800">
                        {userName}
                      </div>

                      <div className="truncate text-xs text-slate-500">
                        {userEmail}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-2 py-2">
                  <div className="px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Account
                    </div>

                    <div className="mt-1 text-xs font-medium capitalize text-blue-600">
                      {userRole}
                    </div>
                  </div>

                  {/* <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50">
                      <LogOut size={16} />
                    </span>

                    Logout
                  </button> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

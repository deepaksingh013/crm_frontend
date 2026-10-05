import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {Search, ChevronDown, Menu} from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.REACT_APP_API_URL

const Header = ({
  sidebarOpen,
  sidebarCollapsed,
  toggleSidebar,
}) => {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState('')

  const handleLeadSearch = () => {
    const number = searchQuery.replace(/\D/g, '')

    if (number.length < 7 || number.length > 15) {
      setSearchError('Enter a phone number with 7 to 15 digits.')
      return
    }

    setSearchError('')
    navigate(`/lead-search?number=${encodeURIComponent(number)}`)
  }

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
    <header
      className={`fixed inset-x-0 top-0 z-20 shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-2 backdrop-blur-xl transition-[left,width] duration-300 sm:px-6 md:px-8 ${
        sidebarCollapsed
          ? 'md:left-[5.125rem] md:w-[calc(100%-5.125rem)]'
          : 'md:left-[17rem] md:w-[calc(100%-17rem)]'
      }`}
    >
      <div className="flex min-h-[3rem] w-full items-center justify-between gap-4">
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
          <div className="relative w-full max-w-[32.5rem]">
            <div role="search" className="header-search flex h-10 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-blue-300 focus-within:bg-white sm:px-4">
              <Search
                size={18}
                className="shrink-0 text-slate-400"
              />

              <input
                className="w-full appearance-none border-0 bg-transparent text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
                type="tel"
                inputMode="tel"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setSearchError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleLeadSearch()
                  }
                }}
                aria-label="Search leads by mobile number"
                aria-invalid={Boolean(searchError)}
                aria-describedby={searchError ? 'lead-search-error' : undefined}
                placeholder="Search leads by mobile number..."
              />

              <button
                type="button"
                onClick={handleLeadSearch}
                aria-label="Search leads"
                title="Search leads"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Search size={17} />
              </button>
            </div>
            {searchError && (
              <p id="lead-search-error" role="alert" className="absolute left-0 top-full z-30 mt-1 rounded-md bg-white px-2 py-1 text-xs text-red-600 shadow">
                {searchError}
              </p>
            )}
          </div>

        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
              <div className="absolute right-0 top-full z-50 mt-3 w-[17.5rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
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

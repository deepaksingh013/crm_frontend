import React, { useEffect, useMemo, useState } from 'react'
import {
  NavLink,
  useLocation,
} from 'react-router-dom'
import {
  Users2,
  ListCheck,
  Podium,
  X,
  ChevronLeft,
  ChevronRight,
  MonitorCog,
  LogOut,
} from 'lucide-react'
import axios from 'axios'
import Cookies from 'js-cookie'
import ConfirmationModal from './ConfirmationModal'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

const ADMIN_MENU = [
  {
    label: 'User Management',
    path: '/users',
    icon: Users2,
    permission: 'users',
  },
  {
    label: 'Campaigns',
    path: '/campaigns',
    icon: Podium,
    permission: 'campaigns',
  },
  {
    label: 'Leads',
    path: '/leads',
    icon: ListCheck,
    permission: 'leads',
  },
  {
    label: 'Device Management',
    path: '/devices',
    icon: MonitorCog,
    permission: 'devices',
  },
]

const MANAGER_MENU = [
  {
    label: 'User Management',
    path: '/commingsoon',
    icon: Users2,
    permission: 'users',
  },
  {
    label: 'Campaigns',
    path: '/commingsoon',
    icon: Podium,
    permission: 'campaigns',
  },
  {
    label: 'Leads',
    path: '/commingsoon',
    icon: ListCheck,
    permission: 'leads',
  },
  {
    label: 'Device Management',
    path: '/commingsoon',
    icon: MonitorCog,
    permission: 'devices',
  },
]

const TL_MENU = [
  {
    label: 'Campaigns',
    path: '/commingsoon',
    icon: Podium,
    permission: 'campaigns',
  },
  {
    label: 'Leads',
    path: '/commingsoon',
    icon: ListCheck,
    permission: 'leads',
  },
]

const SALES_STATUS_MENU = [
  { id: 'pending', name: 'Pending', value: 'pending' },
  { id: 'complete', name: 'Complete', value: 'complete' },
  { id: 'reject', name: 'Rejected', value: 'rejected' },
  { id: 'hold', name: 'Holding', value: 'hold' },
  { id: 'not-connected', name: 'Not Connected', value: 'notConnected' },
]

const AGENT_MENU = [
  {
    label: 'Dashboard',
    path: '/tc/dashboard',
    icon: Podium,
    permission: 'dashboard',
  },
  {
    label: 'Sales Management',
    path: '/sales-management',
    icon: ListCheck,
    permission: 'leads',
  },
]

const ROLE_MENUS = {
  admin: ADMIN_MENU,
  manager: MANAGER_MENU,
  tl: TL_MENU,
  agent: AGENT_MENU,
  tc: AGENT_MENU,
}

const Sidebar = ({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}) => {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [salesMenuOpen, setSalesMenuOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('token')

      if (!token) {
        return
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

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
      }
    }

    fetchUser()
  }, [])

  const salesTarget = useMemo(() => {
    const match = location.pathname.match(/^\/sales-management\/([^/]+)(?:\/([^/]+))?$/)

    if (!match) {
      return { campaignId: null, status: 'pending' }
    }

    const [, campaignId, status] = match

    return {
      campaignId: decodeURIComponent(campaignId),
      status: status || 'pending',
    }
  }, [location.pathname])

  useEffect(() => {
    if (salesTarget.campaignId) {
      setSalesMenuOpen(true)
    }
  }, [salesTarget.campaignId])

  // Menu based on user role
  const navItems = useMemo(() => {
    const role = user?.role?.toLowerCase()

    if (role === 'admin') {
      return ADMIN_MENU
    }

    if (role === 'manager') {
      return MANAGER_MENU
    }

    if (role === 'tl') {
      return TL_MENU
    }

    if (role === 'tc' || role === 'agent') {
      return AGENT_MENU.map((item) => {
        if (item.label !== 'Sales Management') {
          return item
        }

        return {
          ...item,
          children: SALES_STATUS_MENU.map((statusItem) => ({
            ...statusItem,
            path: salesTarget.campaignId
              ? `/sales-management/${encodeURIComponent(salesTarget.campaignId)}/${statusItem.value}`
              : '/sales-management',
          })),
        }
      })
    }

    return ROLE_MENUS[role] || []
  }, [salesTarget.campaignId, user?.role])

  // Logout
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)

    const token = Cookies.get('token')

    try {
      if (token) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      Cookies.remove('token')
      setIsLoggingOut(false)
      setIsLogoutModalOpen(false)

      window.location.href = '/login'
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] transition-all duration-300 md:hidden ${
          open
            ? 'pointer-events-auto visible opacity-100'
            : 'pointer-events-none invisible opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          sidebar-container
          fixed
          left-0
          top-0
          z-40
          flex
          h-screen
          shrink-0
          flex-col
          border-r
          border-slate-200
          bg-white
          transition-[width,transform]
          duration-300
          ease-in-out
          w-[280px]

          ${open ? 'translate-x-0' : '-translate-x-full'}

          md:translate-x-0

          ${collapsed ? 'md:w-[82px]' : 'md:w-[280px]'}
        `}
      >
        <div className="flex h-full flex-col px-4 py-5">

          {/* Header */}
          <div
            className={`flex shrink-0 items-center ${
              collapsed
                ? 'justify-center'
                : 'justify-between'
            }`}
          >
            <div
              className={`flex items-center ${
                collapsed
                  ? 'justify-center'
                  : 'gap-3'
              }`}
            >
              {/* Logo */}
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20">
                AI
              </div>

              {/* Logo Text */}
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-bold tracking-tight text-slate-800">
                    ApnaIndia
                  </div>

                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {user?.role
                      ? `${user.role} panel`
                      : 'Admin panel'}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-5 grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
            >
              <X size={19} />
            </button>
          </div>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
            className="
              absolute
              -right-3
              top-[68px]
              z-50
              hidden
              h-7
              w-7
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-slate-500
              shadow-md
              transition-all
              hover:border-blue-200
              hover:bg-blue-50
              hover:text-blue-600
              md:flex
            "
          >
            {collapsed ? (
              <ChevronRight
                size={15}
                strokeWidth={2.5}
              />
            ) : (
              <ChevronLeft
                size={15}
                strokeWidth={2.5}
              />
            )}
          </button>

          {/* Navigation */}
          <nav className="mt-9 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">

            {!collapsed && (
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Menu
              </div>
            )}

            {navItems.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No menu available
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon

              const hasDropdownItems =
                Array.isArray(item.children) &&
                item.children.length > 0
              if (hasDropdownItems) {
                return (
                  <div key={item.label} className="flex flex-col gap-1" >
                    <button
                      type="button"
                      onClick={() =>
                        setSalesMenuOpen(
                          (prev) => !prev
                        )
                      }
                      title={
                        collapsed
                          ? item.label
                          : undefined
                      }
                      className={`
                        group
                        relative
                        flex
                        min-h-[46px]
                        shrink-0
                        items-center
                        rounded-xl
                        text-[13px]
                        font-medium
                        transition-all
                        duration-200
                        ${
                          collapsed
                            ? 'justify-center px-0'
                            : 'gap-3 px-3'
                        }
                        text-slate-500
                        hover:bg-slate-50
                        hover:text-slate-800
                      `}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-transparent text-slate-400 group-hover:text-blue-500">
                        <Icon
                          size={18}
                          strokeWidth={2}
                        />
                      </span>

                      {!collapsed && (
                        <span className="min-w-0 flex-1 truncate text-left text-base">
                          {item.label}
                        </span>
                      )}

                      {/* Arrow ONLY for submenu */}
                      {!collapsed && (
                        <ChevronRight
                          size={15}
                          className={`shrink-0 transition-transform ${
                            salesMenuOpen
                              ? 'rotate-90'
                              : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {!collapsed &&
                      salesMenuOpen && (
                        <div className="ml-8 space-y-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1.5">

                          {item.children.map(
                            (submenu) => (
                              <NavLink
                                key={submenu.id}
                                to={submenu.path}
                                onClick={onClose}
                                className={({
                                  isActive,
                                }) =>
                                  `block rounded-lg px-3 py-2 text-sm transition ${
                                    isActive
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-600 hover:bg-white hover:text-slate-800'
                                  }`
                                }
                              >
                                {submenu.name}
                              </NavLink>
                            )
                          )}

                        </div>
                      )}
                  </div>
                )
              }
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={({ isActive }) =>
                    `
                    group
                    relative
                    flex
                    min-h-[46px]
                    shrink-0
                    items-center
                    rounded-xl
                    text-[13px]
                    font-medium
                    transition-all
                    duration-200

                    ${
                      collapsed
                        ? 'justify-center px-0'
                        : 'gap-3 px-3'
                    }

                    ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }
                  `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Icon */}
                      <span
                        className={`
                          grid
                          h-9
                          w-9
                          shrink-0
                          place-items-center
                          rounded-lg
                          transition

                          ${
                            isActive
                              ? 'bg-white/15 text-white'
                              : 'bg-transparent text-slate-400 group-hover:text-blue-500'
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          strokeWidth={
                            isActive
                              ? 2.3
                              : 2
                          }
                        />
                      </span>

                      {/* Label */}
                      {!collapsed && (
                        <span className="min-w-0 flex-1 truncate text-base">
                          {item.label}
                        </span>
                      )}

                      {/* NO ARROW HERE */}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className="mt-5 shrink-0 border-t border-slate-100 pt-4">

            {/* User Info */}
            <div
              className={`
                mb-2
                flex
                items-center
                rounded-xl
                bg-slate-50
                ${
                  collapsed
                    ? 'justify-center p-2'
                    : 'gap-3 px-3 py-3'
                }
              `}
            >
              {/* Avatar */}
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                {user?.name
                  ? user.name
                      .charAt(0)
                      .toUpperCase()
                  : user?.email
                    ? user.email
                        .charAt(0)
                        .toUpperCase()
                    : 'A'}
              </div>

              {/* User Details */}
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-700">
                    {user?.name ||
                      user?.email?.split(
                        '@'
                      )[0] ||
                      'Admin'}
                  </div>

                  <div className="truncate text-[10px] text-slate-400">
                    {user?.email ||
                      'Admin account'}
                  </div>

                  {user?.role && (
                    <div className="mt-0.5 text-[10px] font-medium capitalize text-blue-500">
                      {user.role}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={() =>
                setIsLogoutModalOpen(true)
              }
              title={
                collapsed
                  ? 'Logout'
                  : undefined
              }
              className={`
                group
                flex
                w-full
                items-center
                rounded-xl
                py-3
                text-[13px]
                font-medium
                text-slate-500
                transition
                hover:bg-red-50
                hover:text-red-500

                ${
                  collapsed
                    ? 'justify-center px-0'
                    : 'gap-3 px-3'
                }
              `}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-red-100 group-hover:text-red-500">
                <LogOut size={17} />
              </span>

              {!collapsed && (
                <span>Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() =>
          setIsLogoutModalOpen(false)
        }
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        isSubmitting={isLoggingOut}
      />
    </>
  )
}

export default Sidebar
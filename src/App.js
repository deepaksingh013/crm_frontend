import './App.css'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Auth from './components/login/Auth'
import NotFound from './components/NotFound'
import Unauthorized from './components/Unauthorized'

import Sidebar from './components/sidebar/Sidebar'
import Header from './components/header/Header'

import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/shared/users/UserManagement'
import CampaignManagment from './pages/shared/campaigns/CampaignManagment'
import LeadDetails from './pages/shared/leads/LeadDetails'
import Leadmanagment from './pages/shared/leads/Leadmanagment'
import GlobalLeadSearch from './pages/shared/leads/GlobalLeadSearch'
import Report from './pages/shared/reports/Report'

import { setUserFromCookies } from './features/auth/authSlice'
import CommingSoon from './components/CommingSoon'
import TcDashboard from './pages/telecaller/dashboard/Dashboard'
import SalesManagment from './pages/telecaller/sales-management/SalesManagment'
import TcList from './pages/shared/telecallers/TcList'
import TcDetails from './pages/shared/telecallers/TcDetails'
import UserApproval from './pages/shared/user-approval/UserApproval'
import ManagerDashboard from './pages/manager/Dashboard'
import TeamLeaderDashboard from './pages/team-leader/Dashboard'
import { useAuth } from './hooks/useAuth'

const RoleDashboard = () => {
  const { role } = useAuth()

  switch (role?.toLowerCase()) {
    case 'manager':
      return <ManagerDashboard />
    case 'tl':
    case 'teamleader':
    case 'team leader':
      return <TeamLeaderDashboard />
    case 'tc':
    case 'telecaller':
    case 'tele caller':
    case 'tele-caller':
    case 'agent':
      return <TcDashboard />
    default:
      return <Dashboard />
  }
}

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)} />
      <div className={`flex min-h-screen min-w-0 flex-col bg-[var(--bg)] transition-[margin] duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[5.125rem]' : 'md:ml-[17rem]'}`}>
        <Header
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={() =>
            setSidebarOpen((prev) => !prev)
          }
        />

        <main className="layout-main min-w-0 flex-1 px-3 pb-4 pt-[5.5rem] sm:px-5 md:px-6 md:pb-5 md:pt-[5.75rem]">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setUserFromCookies())
  }, [dispatch])

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full bg-[var(--bg)]">
        <Routes>
          <Route
            path="/login"
            element={<Auth />}
          />

          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />
          <Route
            path="/"
            element={
              <MainLayout>
                <RoleDashboard />
              </MainLayout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <RoleDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/manager/dashboard"
            element={
              <MainLayout>
                <RoleDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/tl/dashboard"
            element={
              <MainLayout>
                <RoleDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/users"
            element={
              <MainLayout>
                <UserManagement />
              </MainLayout>
            }
          />
          <Route
            path="/campaigns"
            element={
              <MainLayout>
                <CampaignManagment />
              </MainLayout>
            }
          />
          <Route
            path="/leads"
            element={
              <MainLayout>
                <Leadmanagment />
              </MainLayout>
            }
          />
          <Route
            path="/lead-search"
            element={
              <MainLayout>
                <GlobalLeadSearch />
              </MainLayout>
            }
          />
          <Route
            path="/telecallers"
            element={
              <MainLayout>
                <TcList />
              </MainLayout>
            }
          />
          <Route
            path="/telecallers/:id"
            element={
              <MainLayout>
                <TcDetails />
              </MainLayout>
            }
          />
          <Route
            path="/leads/:id"
            element={
              <MainLayout>
                <LeadDetails />
              </MainLayout>
            }
          />
          <Route
            path="/user-approval"
            element={
              <MainLayout>
                <UserApproval />
              </MainLayout>
            }
          />
          <Route
            path="/devices"
            element={<Navigate to="/user-approval" replace />}
          />
          <Route
            path="/reports"
            element={
              <MainLayout>
                <Report />
              </MainLayout>
            }
          />
          <Route
            path="/tc/dashboard"
            element={
              <MainLayout>
                <TcDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/sales-management"
            element={
              <MainLayout>
                <SalesManagment />
              </MainLayout>
            }
          />
          <Route
            path="/sales-management/:campaignId"
            element={
              <MainLayout>
                <SalesManagment />
              </MainLayout>
            }
          />
          <Route
            path="/sales-management/:campaignId/:status"
            element={
              <MainLayout>
                <SalesManagment />
              </MainLayout>
            }
          />
          <Route
            path="/tc/sales-management"
            element={<Navigate to="/sales-management" replace />}
          />

          <Route
            path="*"
            element={<NotFound />}
          />
          <Route
            path="/commingsoon"
            element={
              <MainLayout>
                <CommingSoon />
              </MainLayout>
            }
          />
        </Routes>
      </div>
    </BrowserRouter >
  )
}

export default App

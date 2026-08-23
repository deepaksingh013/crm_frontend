import './App.css'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Auth from './components/login/Auth'
import NotFound from './components/NotFound'
import Unauthorized from './components/Unauthorized'

import Sidebar from './components/sidebar/Sidebar'
import Header from './components/header/Header'

import Dashboard from './pages/admin/dashboard/Dashboard'
import UserManagement from './pages/admin/userManagment/UserManagement'
import CampaignManagment from './pages/admin/campaignManagment/CampaignManagment'
import LeadDetails from './pages/admin/leadManagment/LeadDetails'
import Leadmanagment from './pages/admin/leadManagment/Leadmanagment'
import Report from './pages/admin/reports/Report'

import { setUserFromCookies } from './features/auth/authSlice'
import DeviceManagment from './pages/deviceManagment/DeviceManagment'
import CommingSoon from './components/CommingSoon'
import TcDashboard from './pages/telecaller/dashboard/Dashboard'
import SalesManagment from './pages/telecaller/salesManagment/SalesManagment'

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)} />
      <div className={`flex min-h-screen min-w-0 flex-col bg-[var(--bg)] transition-[margin] duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[82px]' : 'md:ml-[280px]'}`}>
        <Header
          sidebarOpen={sidebarOpen}
          toggleSidebar={() =>
            setSidebarOpen((prev) => !prev)
          }
        />

        <main className="layout-main min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-7">
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
                <Dashboard />
              </MainLayout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
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
            path="/leads/:id"
            element={
              <MainLayout>
                <LeadDetails />
              </MainLayout>
            }
          />
          <Route
            path="/devices"
            element={
              <MainLayout>
                <DeviceManagment />
              </MainLayout>
            }
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

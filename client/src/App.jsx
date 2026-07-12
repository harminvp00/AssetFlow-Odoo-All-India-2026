import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Features (Auth components and pages)
import {
  LoginPage,
  SignupPage,
  OAuthSuccessPage,
  ProtectedRoute,
  GuestRoute,
  RoleRoute,
  refreshUserToken,
  getCurrentUser,
  syncToken,
  clearAuth,
} from './features/auth';

import { DashboardPage } from './features/dashboard';
import { AssetsPage } from './features/assets';
import { EmployeesPage } from './features/employees';
import { DepartmentsPage } from './features/departments';
import { LocationsPage } from './features/locations';
import { CategoriesPage } from './features/categories';
import { AllocationsPage } from './features/allocations';
import { TransfersPage } from './features/transfers';
import { BookingsPage } from './features/bookings';
import { NotificationsPage } from './features/notifications';
import { SettingsPage } from './features/settings';
import { LogsPage } from './features/logs';
import { AttachmentsPage } from './features/attachments';
import { AuditsPage, AuditDetailsPage } from './features/audits';
import { MaintenancePage } from './features/maintenance';
import { ReportsPage } from './features/reports';

function App() {
  const dispatch = useDispatch();
  const { isInitializing } = useSelector((state) => state.auth);

  // 1. Silent Token Refresh & Load Profile on boot
  useEffect(() => {
    const initializeAuth = async () => {
      const result = await dispatch(refreshUserToken());
      if (refreshUserToken.fulfilled.match(result)) {
        dispatch(getCurrentUser());
      }
    };
    initializeAuth();
  }, [dispatch]);

  // 2. Register Interceptor Events Listener for real-time Token changes
  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      dispatch(syncToken(e.detail));
    };

    const handleSessionExpired = () => {
      dispatch(clearAuth());
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth-token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth-session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth-token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, [dispatch]);

  // Render a clean loader while restoring credentials
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-500" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
            Loading AssetFlow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth / Guest Layout & Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignupPage />
            </GuestRoute>
          }
        />
        {/* Google OAuth Success Redirect Landing */}
        <Route path="/auth/success" element={<OAuthSuccessPage />} />
      </Route>

      {/* Main / Protected Layout & App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Feature Modules */}
        <Route path="/employees" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']}><EmployeesPage /></RoleRoute>} />
        <Route path="/departments" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']}><DepartmentsPage /></RoleRoute>} />
        <Route path="/locations" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']}><LocationsPage /></RoleRoute>} />
        <Route path="/categories" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><CategoriesPage /></RoleRoute>} />
        <Route path="/assets" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><AssetsPage /></RoleRoute>} />
        <Route path="/attachments" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR']}><AttachmentsPage /></RoleRoute>} />
        <Route path="/allocations" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><AllocationsPage /></RoleRoute>} />
        <Route path="/transfers" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><TransfersPage /></RoleRoute>} />
        <Route path="/bookings" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><BookingsPage /></RoleRoute>} />
        <Route path="/maintenance" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><MaintenancePage /></RoleRoute>} />
        <Route path="/audits" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><AuditsPage /></RoleRoute>} />
        <Route path="/audits/:id" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><AuditDetailsPage /></RoleRoute>} />
        <Route path="/notifications" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR']}><NotificationsPage /></RoleRoute>} />
        <Route path="/reports" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER']}><ReportsPage /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER', 'VENDOR']}><SettingsPage /></RoleRoute>} />
        <Route path="/logs" element={<RoleRoute allowedRoles={['ADMIN', 'MANAGER']}><LogsPage /></RoleRoute>} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

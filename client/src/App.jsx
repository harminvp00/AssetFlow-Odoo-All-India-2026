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
import { MaintenancePage } from './features/maintenance';
import { AuditsPage } from './features/audits';
import { AttachmentsPage } from './features/attachments';
import { NotificationsPage } from './features/notifications';
import { ReportsPage } from './features/reports';
import { SettingsPage } from './features/settings';
import { LogsPage } from './features/logs';

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
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/attachments" element={<AttachmentsPage />} />
        <Route path="/allocations" element={<AllocationsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audits" element={<AuditsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/logs" element={<LogsPage />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

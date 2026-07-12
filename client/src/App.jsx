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

import { AllocationsPage } from './features/allocations';
import { TransfersPage } from './features/transfers';
import { NotificationsPage } from './features/notifications';
import { LogsPage } from './features/logs';
import { AttachmentsPage } from './features/attachments';
import { AuditsPage, AuditDetailsPage } from './features/audits';
import { MaintenancePage } from './features/maintenance';
import { ReportsPage } from './features/reports';

// Feature Placeholder Pages
const DashboardPlaceholder = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      <span className="text-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1 rounded-full font-semibold">
        Active Session
      </span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { title: 'Total Assets', val: '1,280', color: 'border-l-emerald-500' },
        { title: 'Active Allocations', val: '840', color: 'border-l-teal-500' },
        { title: 'Pending Maintenance', val: '18', color: 'border-l-amber-500' },
        { title: 'System Health', val: '99.8%', color: 'border-l-cyan-500' },
      ].map((card, idx) => (
        <div
          key={idx}
          className={`p-6 bg-white dark:bg-slate-900 border-l-4 ${card.color} rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/60`}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{card.title}</p>
          <p className="text-2xl font-bold mt-2 text-slate-800 dark:text-white">{card.val}</p>
        </div>
      ))}
    </div>
  </div>
);

const FallbackPage = ({ name }) => (
  <div className="p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/60">
    <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">{name} Module</h2>
    <p className="text-slate-500 dark:text-slate-400 text-sm">
      This feature module is successfully initialized and ready for development.
    </p>
  </div>
);

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
        <Route path="/dashboard" element={<DashboardPlaceholder />} />

        {/* Feature Modules */}
        <Route path="/employees" element={<FallbackPage name="Employees" />} />
        <Route path="/departments" element={<FallbackPage name="Departments" />} />
        <Route path="/locations" element={<FallbackPage name="Locations" />} />
        <Route path="/categories" element={<FallbackPage name="Categories" />} />
        <Route path="/assets" element={<FallbackPage name="Assets" />} />
        <Route path="/attachments" element={<AttachmentsPage />} />
        <Route path="/allocations" element={<AllocationsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/bookings" element={<FallbackPage name="Bookings" />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audits" element={<AuditsPage />} />
        <Route path="/audits/:id" element={<AuditDetailsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<FallbackPage name="Settings" />} />
        <Route path="/logs" element={<LogsPage />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

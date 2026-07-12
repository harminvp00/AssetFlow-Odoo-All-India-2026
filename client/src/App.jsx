import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Direct Page Placeholders
const LoginPlaceholder = () => (
  <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-dark-900 rounded-lg shadow-xl max-w-md w-full">
    <h2 className="text-2xl font-bold mb-4">AssetFlow Sign In</h2>
    <p className="text-slate-500 mb-6 text-center text-sm">
      Enterprise Asset & Resource Management System
    </p>
    <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
      Sign in with Google
    </button>
  </div>
);

const DashboardPlaceholder = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      <span className="text-sm bg-brand-100 text-brand-700 px-3 py-1 rounded-full font-medium">
        Active Session
      </span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { title: 'Total Assets', val: '1,280', color: 'border-l-brand-500' },
        { title: 'Active Allocations', val: '840', color: 'border-l-blue-500' },
        { title: 'Pending Maintenance', val: '18', color: 'border-l-amber-500' },
        { title: 'System Health', val: '99.8%', color: 'border-l-violet-500' },
      ].map((card, idx) => (
        <div
          key={idx}
          className={`p-6 bg-white dark:bg-dark-900 border-l-4 ${card.color} rounded-lg shadow-sm`}
        >
          <p className="text-sm text-slate-500 font-medium">{card.title}</p>
          <p className="text-2xl font-bold mt-2">{card.val}</p>
        </div>
      ))}
    </div>
  </div>
);

const FallbackPage = ({ name }) => (
  <div className="p-8 bg-white dark:bg-dark-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
    <h2 className="text-2xl font-bold mb-2">{name} Module</h2>
    <p className="text-slate-500">
      This feature module is successfully initialized and ready for development.
    </p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPlaceholder />} />
      </Route>

      {/* App routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPlaceholder />} />

        {/* Core feature routing placeholders */}
        <Route path="/employees" element={<FallbackPage name="Employees" />} />
        <Route path="/departments" element={<FallbackPage name="Departments" />} />
        <Route path="/locations" element={<FallbackPage name="Locations" />} />
        <Route path="/categories" element={<FallbackPage name="Categories" />} />
        <Route path="/assets" element={<FallbackPage name="Assets" />} />
        <Route path="/attachments" element={<FallbackPage name="Attachments" />} />
        <Route path="/allocations" element={<FallbackPage name="Allocations" />} />
        <Route path="/transfers" element={<FallbackPage name="Transfers" />} />
        <Route path="/bookings" element={<FallbackPage name="Bookings" />} />
        <Route path="/maintenance" element={<FallbackPage name="Maintenance" />} />
        <Route path="/audits" element={<FallbackPage name="Audits" />} />
        <Route path="/notifications" element={<FallbackPage name="Notifications" />} />
        <Route path="/reports" element={<FallbackPage name="Reports" />} />
        <Route path="/settings" element={<FallbackPage name="Settings" />} />
        <Route path="/logs" element={<FallbackPage name="Activity Logs" />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

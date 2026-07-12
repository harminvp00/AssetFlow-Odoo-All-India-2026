import React from 'react';
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-950 to-brand-900 p-4">
      <Outlet />
    </div>
  );
}

export default AuthLayout;

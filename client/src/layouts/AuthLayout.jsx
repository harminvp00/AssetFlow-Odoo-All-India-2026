import React from 'react';
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950">
      <Outlet />
    </div>
  );
}

export default AuthLayout;

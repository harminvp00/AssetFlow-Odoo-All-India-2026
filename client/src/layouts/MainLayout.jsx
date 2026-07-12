import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  Tags,
  Laptop,
  Paperclip,
  CheckSquare,
  ArrowLeftRight,
  Bookmark,
  Wrench,
  ShieldCheck,
  Bell,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';

function MainLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Assets', href: '/assets', icon: Laptop },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Departments', href: '/departments', icon: Building2 },
    { name: 'Locations', href: '/locations', icon: MapPin },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Allocations', href: '/allocations', icon: CheckSquare },
    { name: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
    { name: 'Bookings', href: '/bookings', icon: Bookmark },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Audits', href: '/audits', icon: ShieldCheck },
    { name: 'Attachments', href: '/attachments', icon: Paperclip },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </span>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
              AssetFlow
            </span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/10 dark:text-brand-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">{/* Search, etc can go here */}</div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold">Harmin Vekariya</span>
              <span className="text-xs text-slate-500">System Admin</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
              HV
            </div>
          </div>
        </header>

        {/* Page contents */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

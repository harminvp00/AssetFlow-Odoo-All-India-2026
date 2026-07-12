import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CheckSquare, Wrench, ShieldCheck, Laptop } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAllocations: 0,
    pendingMaintenance: 0,
    activeAudits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/dashboard');
        if (response.data && response.data.success) {
          const dataArray = response.data.data;
          const statsMap = {};
          dataArray.forEach(item => {
            statsMap[item.key] = item.value;
          });
          setStats({
            totalAssets: statsMap.totalAssets || 0,
            activeAllocations: statsMap.activeAllocations || 0,
            pendingMaintenance: statsMap.pendingMaintenance || 0,
            activeAudits: statsMap.activeAudits || 0,
          });
        }
      } catch (err) {
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cardDetails = [
    { title: 'Total Assets', val: stats.totalAssets, icon: Laptop },
    { title: 'Active Allocations', val: stats.activeAllocations, icon: CheckSquare },
    { title: 'Pending Maintenance', val: stats.pendingMaintenance, icon: Wrench },
    { title: 'Active Audits', val: stats.activeAudits, icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8" />
          Dashboard Overview
        </h1>
        <span className="text-xs bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
          Live System
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cardDetails.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <p className="text-3xl font-extrabold mt-2 text-slate-950 dark:text-white">
                  {card.val}
                </p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-950 dark:text-white">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick shortcuts block */}
      <div className="p-6 bg-slate-950 text-white rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-lg font-bold">Need to register a new physical asset?</h3>
          <p className="text-slate-400 text-xs mt-1">
            Register new laptops, mobile devices, monitors or any other equipment quickly.
          </p>
        </div>
        <a
          href="/assets"
          className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
        >
          Go to Assets
        </a>
      </div>
    </div>
  );
}

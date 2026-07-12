import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [utilizationData, setUtilizationData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const [summaryRes, utilizationRes, maintenanceRes] = await Promise.all([
        apiClient.get('/reports/summary'),
        apiClient.get('/reports/utilization'),
        apiClient.get('/reports/maintenance')
      ]);

      if (summaryRes.data?.success) {
        setSummaryData(summaryRes.data.data);
      }
      if (utilizationRes.data?.success) {
        setUtilizationData(utilizationRes.data.data);
      }
      if (maintenanceRes.data?.success) {
        setMaintenanceData(maintenanceRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports and analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!summaryData) return;

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Assets', summaryData.kpis?.totalAssets || 0],
      ['Allocated Assets', summaryData.kpis?.allocatedAssets || 0],
      ['Available Assets', summaryData.kpis?.availableAssets || 0],
      ['Under Maintenance', summaryData.kpis?.maintenanceAssets || 0],
      ['Active Bookings', summaryData.kpis?.activeBookings || 0],
      ['Total Discrepancies', summaryData.kpis?.totalDiscrepancies || 0],
      ['Utilization Rate (%)', `${summaryData.kpis?.utilizationRate || 0}%`],
    ];

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetFlow_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Summary report exported to CSV!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-emerald-600 rounded-full" />
      </div>
    );
  }

  const kpis = summaryData?.kpis || {};
  const mostUsed = summaryData?.mostUsed || [];
  const idle = summaryData?.idle || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Analytics & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Analyze asset utilization, system performance, and maintenance frequencies.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Assets', value: kpis.totalAssets || 0, color: 'border-l-emerald-500' },
          { title: 'Utilization Rate', value: `${kpis.utilizationRate || 0}%`, color: 'border-l-teal-500' },
          { title: 'Under Maintenance', value: kpis.maintenanceAssets || 0, color: 'border-l-amber-500' },
          { title: 'Active Bookings', value: kpis.activeBookings || 0, color: 'border-l-cyan-500' },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`p-6 bg-white dark:bg-slate-900 border-l-4 ${card.color} rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/60`}
          >
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{card.title}</p>
            <p className="text-2xl font-bold mt-2 text-slate-800 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Department Utilization Rate (%)</h3>
          <div className="h-[250px] w-full">
            {utilizationData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">No utilization data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="department" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                    }}
                  />
                  <Bar dataKey="utilizationRate" fill="#10B981" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Maintenance Frequency Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Maintenance Tickets (Last 6 Months)</h3>
          <div className="h-[250px] w-full">
            {maintenanceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">No maintenance trends available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={maintenanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Most Used / Idle Assets Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Assets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Most Active Assets</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-500 uppercase text-xs">
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Allocations</th>
                </tr>
              </thead>
              <tbody>
                {mostUsed.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">No assets allocated yet.</td>
                  </tr>
                ) : (
                  mostUsed.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/40">
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {item.name} <span className="text-xs text-slate-400">({item.tag})</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{item.category}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700 dark:text-slate-300">{item.allocationCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Idle Assets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Idle Assets (No allocations)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-500 uppercase text-xs">
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Acquired Date</th>
                </tr>
              </thead>
              <tbody>
                {idle.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">No idle assets in database.</td>
                  </tr>
                ) : (
                  idle.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/40">
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {item.name} <span className="text-xs text-slate-400">({item.tag})</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{item.category}</td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {new Date(item.acquisitionDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Search, 
  AlertTriangle, 
  Send, 
  Calendar, 
  History, 
  User, 
  Building2, 
  CheckCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock Data
const MOCK_ASSETS = [
  { 
    id: 'AF-0114', 
    name: 'AF-0114 - Dell Laptop', 
    status: 'ALLOCATED', 
    currentHolder: 'Priya Shah', 
    currentDepartment: 'Engineering',
    history: [
      { date: 'Mar 12', action: 'Allocated to Priya Shah - Engineering' },
      { date: 'Jan 04', action: 'Returned by Arjun Nair - condition: good' }
    ]
  },
  { 
    id: 'AF-0115', 
    name: 'AF-0115 - Apple MacBook Pro', 
    status: 'AVAILABLE', 
    currentHolder: null, 
    currentDepartment: null,
    history: [
      { date: 'Feb 15', action: 'Returned by Rohan Sharma - condition: excellent' }
    ]
  },
  { 
    id: 'AF-0116', 
    name: 'AF-0116 - Samsung Monitor', 
    status: 'ALLOCATED', 
    currentHolder: 'Arjun Nair', 
    currentDepartment: 'Marketing',
    history: [
      { date: 'Apr 01', action: 'Allocated to Arjun Nair - Marketing' },
      { date: 'Jan 10', action: 'Returned by Aditi Verma - condition: good' }
    ]
  },
  { 
    id: 'AF-0117', 
    name: 'AF-0117 - Logitech MX Master 3', 
    status: 'AVAILABLE', 
    currentHolder: null, 
    currentDepartment: null,
    history: []
  }
];

const MOCK_EMPLOYEES = [
  { name: 'Priya Shah', department: 'Engineering' },
  { name: 'Arjun Nair', department: 'Marketing' },
  { name: 'Rohan Sharma', department: 'Product' },
  { name: 'Aditi Verma', department: 'Design' }
];

const MOCK_DEPARTMENTS = ['Engineering', 'Marketing', 'Product', 'Design', 'Finance'];

export default function AllocationsPage() {
  const { user } = useSelector((state) => state.auth);
  
  // Role Authorization Guard: Allow ADMIN, MANAGER, and PROCUREMENT_OFFICER
  const hasAccess = user && ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'].includes(user.role);

  // Component States
  const [assets, setAssets] = useState(MOCK_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState(MOCK_ASSETS[0].id);
  const [targetEmployee, setTargetEmployee] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!targetEmployee) {
      toast.error('Please select a target employee for transfer.');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      // Simulate successful transfer request submission
      const newHistoryEntry = {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        action: `Transfer requested from ${selectedAsset.currentHolder || `${selectedAsset.currentDepartment} Department`} to ${targetEmployee}`
      };

      setAssets(prevAssets => 
        prevAssets.map(a => {
          if (a.id === selectedAsset.id) {
            return {
              ...a,
              history: [newHistoryEntry, ...a.history]
            };
          }
          return a;
        })
      );

      toast.success(`Transfer request for ${selectedAsset.id} submitted!`);
      setTargetEmployee('');
      setReason('');
      setLoading(false);
    }, 800);
  };

  const handleAllocationSubmit = (e) => {
    e.preventDefault();
    if (!targetEmployee && !targetDepartment) {
      toast.error('Please select either an employee or a department.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const destination = targetEmployee 
        ? `${targetEmployee} (${MOCK_EMPLOYEES.find(emp => emp.name === targetEmployee)?.department || 'Staff'})`
        : `${targetDepartment} Department`;

      const newHistoryEntry = {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        action: `Allocated to ${destination}`
      };

      setAssets(prevAssets => 
        prevAssets.map(a => {
          if (a.id === selectedAsset.id) {
            return {
              ...a,
              status: 'ALLOCATED',
              currentHolder: targetEmployee || null,
              currentDepartment: targetDepartment || null,
              history: [newHistoryEntry, ...a.history]
            };
          }
          return a;
        })
      );

      toast.success(`Successfully allocated ${selectedAsset.id}!`);
      setTargetEmployee('');
      setTargetDepartment('');
      setLoading(false);
    }, 800);
  };

  // Render Access Denied View if not authorized
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm max-w-2xl mx-auto my-12">
        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center mb-5">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md leading-relaxed">
          The Allocation & Transfer module is restricted to Procurement Officers, Managers, and System Admins. You are currently logged in as a <strong>{user?.role || 'Guest'}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Asset Allocation & Transfer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Allocate available stock or initiate transfers for occupied devices.
          </p>
        </div>
        <span className="text-xs bg-slate-950 dark:bg-white dark:text-slate-950 text-white font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Procurement Console
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main interactive form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Asset
            </label>
            <div className="relative">
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setTargetEmployee('');
                  setTargetDepartment('');
                  setReason('');
                }}
                className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all cursor-pointer text-sm font-medium"
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Warn banner if already allocated (mockup block) */}
            {selectedAsset.status === 'ALLOCATED' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-medium leading-relaxed">
                  <p className="font-bold">
                    Already Allocated to {selectedAsset.currentHolder || `${selectedAsset.currentDepartment} Department`}
                  </p>
                  <p className="text-red-600/90 dark:text-red-400/80 mt-0.5">
                    Direct re-allocation is blocked - submit a transfer request below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions depending on current Asset Status */}
          {selectedAsset.status === 'ALLOCATED' ? (
            /* Transfer Form */
            <form 
              onSubmit={handleTransferSubmit}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6"
            >
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Transfer Request
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From Holder (Disabled) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    From
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={selectedAsset.currentHolder || `${selectedAsset.currentDepartment} Department`}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* To Target Holder */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    To
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    <select
                      value={targetEmployee}
                      onChange={(e) => setTargetEmployee(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all cursor-pointer text-sm font-medium"
                    >
                      <option value="">Select Employee...</option>
                      {MOCK_EMPLOYEES.filter(emp => emp.name !== selectedAsset.currentHolder).map((emp) => (
                        <option key={emp.name} value={emp.name}>
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Reason
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Justify why this device transfer is required..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all text-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold py-3 px-6 rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Submit Request</span>
              </button>
            </form>
          ) : (
            /* Allocation Form */
            <form 
              onSubmit={handleAllocationSubmit}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6"
            >
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                New Allocation
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option A: Select Employee */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Allocate to Employee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <select
                      value={targetEmployee}
                      onChange={(e) => {
                        setTargetEmployee(e.target.value);
                        setTargetDepartment(''); // Exclusive selection
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all cursor-pointer text-sm font-medium"
                    >
                      <option value="">Select Employee...</option>
                      {MOCK_EMPLOYEES.map((emp) => (
                        <option key={emp.name} value={emp.name}>
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Option B: Select Department */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Allocate to Department (exclusive)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <select
                      value={targetDepartment}
                      onChange={(e) => {
                        setTargetDepartment(e.target.value);
                        setTargetEmployee(''); // Exclusive selection
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all cursor-pointer text-sm font-medium"
                    >
                      <option value="">Select Department...</option>
                      {MOCK_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold py-3 px-6 rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Allocate Asset</span>
              </button>
            </form>
          )}
        </div>

        {/* Sidebar history */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <History className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Allocation History
              </h2>
            </div>

            {selectedAsset.history.length > 0 ? (
              <div className="space-y-4">
                {selectedAsset.history.map((log, idx) => (
                  <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                    <div className="min-w-[45px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {log.date}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {log.action}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-600 text-xs">
                No prior allocation records for this asset.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

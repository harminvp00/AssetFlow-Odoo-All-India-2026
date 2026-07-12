import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  ArrowRight, 
  Check, 
  X, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ShieldAlert,
  Laptop,
  User,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock Data
const INITIAL_ASSETS = [
  { id: 'AF-0114', name: 'AF-0114 - Dell Laptop', currentHolder: 'Priya Shah', currentDepartment: 'Engineering' },
  { id: 'AF-0116', name: 'AF-0116 - Samsung Monitor', currentHolder: 'Arjun Nair', currentDepartment: 'Marketing' },
  { id: 'AF-0118', name: 'AF-0118 - iPad Pro', currentHolder: 'Rohan Sharma', currentDepartment: 'Product' }
];

const INITIAL_TRANSFERS = [
  {
    id: 'TR-104',
    assetId: 'AF-0114',
    assetName: 'AF-0114 - Dell Laptop',
    fromUser: 'Priya Shah',
    toUser: 'Arjun Nair',
    reason: 'Arjun needs this laptop for testing the local client production builds.',
    status: 'PENDING',
    date: 'Jul 12'
  },
  {
    id: 'TR-103',
    assetId: 'AF-0116',
    assetName: 'AF-0116 - Samsung Monitor',
    fromUser: 'Arjun Nair',
    toUser: 'Aditi Verma',
    reason: 'Aditi requires a dual monitor setup for UI design layouts.',
    status: 'APPROVED',
    date: 'Jul 10'
  },
  {
    id: 'TR-102',
    assetId: 'AF-0118',
    assetName: 'AF-0118 - iPad Pro',
    fromUser: 'Rohan Sharma',
    toUser: 'Priya Shah',
    reason: 'Testing responsiveness of charts on mobile devices.',
    status: 'REJECTED',
    date: 'Jul 08'
  }
];

const MOCK_EMPLOYEES = [
  { name: 'Priya Shah', department: 'Engineering' },
  { name: 'Arjun Nair', department: 'Marketing' },
  { name: 'Rohan Sharma', department: 'Product' },
  { name: 'Aditi Verma', department: 'Design' }
];

export default function TransfersPage() {
  const { user } = useSelector((state) => state.auth);
  
  // Role Authorization Guard: Allow ADMIN, MANAGER, and PROCUREMENT_OFFICER
  const hasAccess = user && ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'].includes(user.role);

  // Component States
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [selectedAssetId, setSelectedAssetId] = useState(INITIAL_ASSETS[0].id);
  const [targetEmployee, setTargetEmployee] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const handleCreateTransfer = (e) => {
    e.preventDefault();
    if (!targetEmployee) {
      toast.error('Please select a destination employee.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please state a reason for this transfer request.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newTransfer = {
        id: `TR-${transfers.length + 105}`,
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        fromUser: selectedAsset.currentHolder,
        toUser: targetEmployee,
        reason: reason,
        status: 'PENDING',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      };

      setTransfers([newTransfer, ...transfers]);
      toast.success('Transfer request submitted successfully!');
      
      setTargetEmployee('');
      setReason('');
      setLoading(false);
    }, 600);
  };

  const handleResolveTransfer = (transferId, newStatus) => {
    setTransfers(prevTransfers => 
      prevTransfers.map(tr => {
        if (tr.id === transferId) {
          // If approved, update the asset owner in local state
          if (newStatus === 'APPROVED') {
            setAssets(prevAssets => 
              prevAssets.map(a => {
                if (a.id === tr.assetId) {
                  return {
                    ...a,
                    currentHolder: tr.toUser,
                    currentDepartment: MOCK_EMPLOYEES.find(e => e.name === tr.toUser)?.department || 'Staff'
                  };
                }
                return a;
              })
            );
          }
          return { ...tr, status: newStatus };
        }
        return tr;
      })
    );
    
    if (newStatus === 'APPROVED') {
      toast.success(`Transfer ${transferId} Approved! Asset owner updated.`);
    } else {
      toast.error(`Transfer ${transferId} Rejected.`);
    }
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
          The Transfer Workflow module is restricted to Procurement Officers, Managers, and System Admins. You are currently logged in as a <strong>{user?.role || 'Guest'}</strong>.
        </p>
      </div>
    );
  }

  // Stats calculation
  const pendingCount = transfers.filter(t => t.status === 'PENDING').length;
  const approvedCount = transfers.filter(t => t.status === 'APPROVED').length;
  const rejectedCount = transfers.filter(t => t.status === 'REJECTED').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Asset Transfer Workflow
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Initiate, review, and approve device ownership transfers between employees.
          </p>
        </div>
        <span className="text-xs bg-slate-950 dark:bg-white dark:text-slate-950 text-white font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Transfer Controller
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Handover</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{approvedCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Transfers</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{rejectedCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected Requests</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transfer Requests Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
              Active Handovers Queue
            </h2>

            {transfers.length > 0 ? (
              <div className="space-y-6">
                {transfers.map((tr) => (
                  <div 
                    key={tr.id} 
                    className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Asset Header */}
                      <div className="flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {tr.assetName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          ({tr.id})
                        </span>
                      </div>

                      {/* Handoff path */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {tr.fromUser}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-2 py-0.5 rounded">
                          {tr.toUser}
                        </span>
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        &ldquo;{tr.reason}&rdquo;
                      </p>
                    </div>

                    {/* Status Actions */}
                    <div className="flex items-center gap-2.5 self-end md:self-center">
                      {tr.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleResolveTransfer(tr.id, 'REJECTED')}
                            className="h-8 w-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/20 flex items-center justify-center cursor-pointer transition-all"
                            title="Reject Request"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResolveTransfer(tr.id, 'APPROVED')}
                            className="h-8 w-8 rounded-lg bg-slate-950 text-white hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-all"
                            title="Approve & Handover"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                          tr.status === 'APPROVED'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400'
                            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400'
                        }`}>
                          {tr.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 dark:text-slate-600 text-sm">
                No active transfer requests found.
              </div>
            )}
          </div>
        </div>

        {/* Initiate Transfer Form */}
        <div className="space-y-6">
          <form 
            onSubmit={handleCreateTransfer}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Initiate Transfer
            </h2>

            {/* Asset Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setTargetEmployee('');
                  setReason('');
                }}
                className="w-full pl-3 pr-10 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all cursor-pointer text-sm font-medium"
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* From Holder (Read-only) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Current Holder
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

            {/* To Target Employee */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Target Employee
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

            {/* Reason */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Transfer Reason
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for device handover..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all text-sm"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold py-3 px-6 rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Submit Request</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

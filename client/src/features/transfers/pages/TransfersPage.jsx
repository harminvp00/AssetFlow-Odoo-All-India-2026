import React, { useEffect, useState } from 'react';
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
  User
} from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function TransfersPage() {
  const { user } = useSelector((state) => state.auth);
  
  // Role Authorization Guard: Allow ADMIN, MANAGER, and PROCUREMENT_OFFICER
  const hasAccess = user && ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'].includes(user.role);

  // Component States
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [transfers, setTransfers] = useState([]);
  
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      const [allocationsRes, employeesRes, transfersRes] = await Promise.all([
        apiClient.get('/allocations', { params: { status: 'ACTIVE' } }),
        apiClient.get('/employees'),
        apiClient.get('/transfers'),
      ]);

      const activeAllocs = allocationsRes.data.success ? allocationsRes.data.data : [];
      // Filter out allocations that don't have an asset
      const validAllocs = activeAllocs.filter(a => a.asset);
      setActiveAllocations(validAllocs);

      if (validAllocs.length > 0) {
        setSelectedAssetId(validAllocs[0].assetId);
      } else {
        setSelectedAssetId('');
      }

      if (employeesRes.data.success) {
        setEmployees(employeesRes.data.data);
      }

      if (transfersRes.data.success) {
        setTransfers(transfersRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load transfers workflow data.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess]);

  const selectedAlloc = activeAllocations.find(a => a.assetId === selectedAssetId);
  const selectedAsset = selectedAlloc?.asset;
  const currentHolderText = selectedAlloc
    ? (selectedAlloc.employee
        ? (selectedAlloc.employee.name || `${selectedAlloc.employee.firstName || ''} ${selectedAlloc.employee.lastName || ''}`.trim())
        : (selectedAlloc.department ? `${selectedAlloc.department.name} Department` : 'N/A'))
    : 'N/A';

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select an active asset to transfer.');
      return;
    }
    if (!targetEmployeeId) {
      toast.error('Please select a destination employee.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please state a reason for this transfer request.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/transfers', {
        assetId: selectedAssetId,
        toEmployeeId: targetEmployeeId,
        reason: reason.trim(),
      });

      if (response.data.success) {
        toast.success('Transfer request submitted successfully!');
        setReason('');
        setTargetEmployeeId('');
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit transfer request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTransfer = async (transferId, newStatus) => {
    try {
      setLoading(true);
      const endpoint = `/transfers/${transferId}/${newStatus.toLowerCase()}`;
      const response = await apiClient.patch(endpoint);
      if (response.data.success) {
        toast.success(`Transfer ${newStatus === 'APPROVED' ? 'Approved' : 'Rejected'} successfully!`);
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${newStatus.toLowerCase()} transfer request.`);
    } finally {
      setLoading(false);
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

  if (pageLoading && transfers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-t-white" />
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
                {transfers.map((tr) => {
                  const assetName = tr.asset ? `${tr.asset.tag} - ${tr.asset.name}` : `Asset (${tr.assetId})`;
                  const fromUser = tr.fromEmployee
                    ? (tr.fromEmployee.name || tr.fromEmployee.email)
                    : (tr.fromDepartment ? `${tr.fromDepartment.name} Department` : 'N/A');
                  const toUser = tr.toEmployee
                    ? (tr.toEmployee.name || tr.toEmployee.email)
                    : (tr.toDepartment ? `${tr.toDepartment.name} Department` : 'N/A');

                  return (
                    <div 
                      key={tr.id} 
                      className="p-5 border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-3">
                        {/* Asset Header */}
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {assetName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            ({tr.id.substring(0, 8)})
                          </span>
                        </div>

                        {/* Handoff path */}
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {fromUser}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-2 py-0.5 rounded">
                            {toUser}
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
                  );
                })}
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
                  setTargetEmployeeId('');
                  setReason('');
                }}
                className="w-full pl-3 pr-10 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all cursor-pointer text-sm font-medium"
              >
                <option value="">Select Asset...</option>
                {activeAllocations.map((alloc) => (
                  <option key={alloc.assetId} value={alloc.assetId}>
                    {alloc.asset ? `${alloc.asset.tag} - ${alloc.asset.name}` : `Asset (${alloc.assetId})`}
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
                  value={currentHolderText}
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
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 focus:outline-none focus:border-slate-950 dark:focus:border-white focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all cursor-pointer text-sm font-medium"
                >
                  <option value="">Select Employee...</option>
                  {employees
                    .filter((emp) => !selectedAlloc || emp.id !== selectedAlloc.employeeId)
                    .map((emp) => {
                      const deptName = emp.departments && emp.departments.length > 0 
                        ? emp.departments.map(d => d.name).join(', ') 
                        : 'Staff';
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} ({deptName})
                        </option>
                      );
                    })}
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

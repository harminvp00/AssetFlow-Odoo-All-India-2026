import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function AuditDetailsPage() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user && user.role === 'ADMIN';
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cycle, setCycle] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = async () => {
    try {
      const [cycleRes, detailsRes] = await Promise.all([
        apiClient.get(`/audits/${id}`),
        apiClient.get(`/audits/${id}/details`)
      ]);

      if (cycleRes.data?.success) {
        setCycle(cycleRes.data.data);
      }
      if (detailsRes.data?.success) {
        setAssets(detailsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit cycle details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleVerify = async (assetId, status, notes = '') => {
    try {
      const response = await apiClient.post(`/audits/${id}/verify`, {
        assetId,
        status,
        notes
      });

      if (response.data?.success) {
        toast.success(`Asset marked as ${status}`);
        fetchDetails(); // Reload data
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update asset verification status.');
    }
  };

  const handleCloseCycle = async () => {
    if (!window.confirm('Are you sure you want to close this audit cycle? All missing items will be updated to LOST status.')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.patch(`/audits/${id}/close`);
      if (response.data?.success) {
        toast.success('Audit cycle closed successfully! Discrepancy report compiled.');
        navigate('/audits');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to close audit cycle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCycle = async () => {
    try {
      const response = await apiClient.patch(`/audits/${id}/start`);
      if (response.data?.success) {
        toast.success('Audit cycle started successfully!');
        fetchDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start audit cycle.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-emerald-600 rounded-full" />
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Audit Cycle not found.</h3>
      </div>
    );
  }

  const discrepancyCount = assets.filter(a => a.status === 'MISSING' || a.status === 'DAMAGED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/audits')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">{cycle.name}</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm pl-9">
            Scope Location: {cycle.scopeLocation?.name || 'All'} • Department: {cycle.scopeDepartment?.name || 'All'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 pl-9 md:pl-0">
            {cycle.status === 'DRAFT' && (
              <button
                onClick={handleStartCycle}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                Start Cycle
              </button>
            )}

            {cycle.status === 'ACTIVE' && (
              <button
                onClick={handleCloseCycle}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Closing...' : 'Close Audit Cycle'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Discrepancy Banner */}
      {cycle.status === 'ACTIVE' && discrepancyCount > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
            {discrepancyCount} assets flagged as Missing or Damaged. Discrepancy report will compile automatically upon closing the cycle.
          </p>
        </div>
      )}

      {/* Assets Checklist Grid */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Verification Checklist</h2>

        {assets.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No assets match the scope of this audit cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Asset Details</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Expected Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{asset.name}</p>
                        <p className="text-xs text-slate-400">{asset.tag} • Serial: {asset.serialNumber}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{asset.condition}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{asset.location?.name || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        asset.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : asset.status === 'MISSING'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                          : asset.status === 'DAMAGED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {asset.status || 'UNAUDITED'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {cycle.status === 'ACTIVE' ? (
                        user && (user.role === 'ADMIN' || (cycle.auditors && cycle.auditors.some(a => a.id === user.id))) ? (
                          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950">
                            <button
                              onClick={() => handleVerify(asset.id, 'VERIFIED')}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                asset.status === 'VERIFIED'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:text-emerald-600'
                              }`}
                            >
                              Verified
                            </button>
                            <button
                              onClick={() => handleVerify(asset.id, 'DAMAGED')}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                asset.status === 'DAMAGED'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'text-slate-500 hover:text-amber-500'
                              }`}
                            >
                              Damaged
                            </button>
                            <button
                              onClick={() => handleVerify(asset.id, 'MISSING')}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                asset.status === 'MISSING'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:text-rose-600'
                              }`}
                            >
                              Missing
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Assigned auditors only</span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">Audit closed / inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

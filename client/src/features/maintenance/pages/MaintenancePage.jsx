import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Check, ShieldAlert } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'PREVENTIVE',
    description: '',
    startDate: '',
    cost: '',
  });

  const fetchData = async () => {
    try {
      const [maintRes, assetsRes] = await Promise.all([
        apiClient.get('/maintenance'),
        apiClient.get('/assets'),
      ]);

      if (maintRes.data.success) setMaintenance(maintRes.data.data);
      if (assetsRes.data.success) setAssets(assetsRes.data.data);
    } catch (err) {
      toast.error('Failed to load maintenance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.type || !formData.description || !formData.startDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/maintenance', {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
      });
      if (response.data.success) {
        toast.success('Maintenance scheduled successfully!');
        setIsModalOpen(false);
        setFormData({
          assetId: '',
          type: 'PREVENTIVE',
          description: '',
          startDate: '',
          cost: '',
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule maintenance.');
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setLoading(true);
      const response = await apiClient.patch(`/maintenance/${id}/status`, { status });
      if (response.data.success) {
        toast.success(`Maintenance status updated to ${status}`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
      setLoading(false);
    }
  };

  if (loading && maintenance.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
          <Wrench className="h-8 w-8" />
          Maintenance Registry
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Request Maintenance
        </button>
      </div>

      {maintenance.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <ShieldAlert className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Maintenance Scheduled</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Get started by scheduling maintenance for an asset.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {maintenance.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200">
                  <td className="px-6 py-4 font-bold">{m.asset?.name} ({m.asset?.tag})</td>
                  <td className="px-6 py-4">{m.type}</td>
                  <td className="px-6 py-4">{m.description}</td>
                  <td className="px-6 py-4 font-semibold">${m.cost?.toFixed(2)}</td>
                  <td className="px-6 py-4">{new Date(m.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : m.status === 'UNDER_MAINTENANCE'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {m.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleUpdateStatus(m.id, 'UNDER_MAINTENANCE')}
                        className="text-amber-500 hover:text-amber-700 font-bold mr-3 cursor-pointer"
                      >
                        Start
                      </button>
                    )}
                    {m.status === 'UNDER_MAINTENANCE' && (
                      <button
                        onClick={() => handleUpdateStatus(m.id, 'COMPLETED')}
                        className="text-emerald-500 hover:text-emerald-700 font-bold cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Schedule Maintenance
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Asset *</label>
                <select name="assetId" value={formData.assetId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required>
                  <option value="">Choose Asset</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Type *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required>
                    <option value="PREVENTIVE">Preventive</option>
                    <option value="CORRECTIVE">Corrective</option>
                    <option value="UPGRADE">Upgrade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Estimated Cost</label>
                  <input type="number" step="0.01" name="cost" placeholder="0.00" value={formData.cost} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Date *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description *</label>
                <textarea name="description" placeholder="e.g. Screen replacement for hardware repair" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" rows="3" required />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

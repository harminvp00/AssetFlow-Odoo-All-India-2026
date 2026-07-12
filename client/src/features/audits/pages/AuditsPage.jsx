import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Check, Eye, ShieldAlert } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function AuditsPage() {
  const [audits, setAudits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    locationId: '',
    scheduledDate: '',
  });

  const fetchData = async () => {
    try {
      const [auditsRes, locsRes] = await Promise.all([
        apiClient.get('/audits'),
        apiClient.get('/locations'),
      ]);

      if (auditsRes.data.success) setAudits(auditsRes.data.data);
      if (locsRes.data.success) setLocations(locsRes.data.data);
    } catch (err) {
      toast.error('Failed to load audits.');
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
    if (!formData.title || !formData.locationId || !formData.scheduledDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/audits', formData);
      if (response.data.success) {
        toast.success('Audit scheduled successfully!');
        setIsModalOpen(false);
        setFormData({
          title: '',
          locationId: '',
          scheduledDate: '',
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule audit.');
      setLoading(false);
    }
  };

  const handleStartAudit = async (id) => {
    try {
      setLoading(true);
      const response = await apiClient.patch(`/audits/${id}/status`, { status: 'IN_PROGRESS' });
      if (response.data.success) {
        toast.success('Audit started.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start audit.');
      setLoading(false);
    }
  };

  const handleCompleteAudit = async (id) => {
    if (!window.confirm('Are you sure you want to complete this audit?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.patch(`/audits/${id}/status`, { status: 'COMPLETED' });
      if (response.data.success) {
        toast.success('Audit completed.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete audit.');
      setLoading(false);
    }
  };

  const handleViewAudit = async (audit) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/audits/${audit.id}`);
      if (response.data.success) {
        setSelectedAudit(response.data.data);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load audit details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && audits.length === 0) {
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
          <ShieldCheck className="h-8 w-8" />
          Asset Audits
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Schedule Audit
        </button>
      </div>

      {audits.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <ShieldAlert className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Audits Scheduled</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Get started by scheduling an asset physical audit.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Audit Title</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Auditor</th>
                <th className="px-6 py-4">Scheduled Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {audits.map((audit) => (
                <tr key={audit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200">
                  <td className="px-6 py-4 font-bold">{audit.title}</td>
                  <td className="px-6 py-4">{audit.location?.name}</td>
                  <td className="px-6 py-4">{audit.auditor?.firstName ? `${audit.auditor.firstName} ${audit.auditor.lastName}` : (audit.auditor?.email || 'N/A')}</td>
                  <td className="px-6 py-4">{new Date(audit.scheduledDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      audit.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : audit.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <button
                      onClick={() => handleViewAudit(audit)}
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                    {audit.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleStartAudit(audit.id)}
                        className="text-amber-500 hover:text-amber-700 font-bold cursor-pointer"
                      >
                        Start
                      </button>
                    )}
                    {audit.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCompleteAudit(audit.id)}
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

      {/* Schedule Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Schedule Asset Audit
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Audit Title *</label>
                <input type="text" name="title" placeholder="e.g. Q3 Hardware Inspection" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Target Location *</label>
                <select name="locationId" value={formData.locationId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required>
                  <option value="">Select Location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Scheduled Date *</label>
                <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
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

      {/* View Audit Details Modal */}
      {isViewModalOpen && selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">{selectedAudit.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Location: {selectedAudit.location?.name} | Status: {selectedAudit.status}
                </p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm">
                Close
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Audited Items List</h3>
              {selectedAudit.items?.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No audited items recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 space-y-3 pt-2">
                  {selectedAudit.items?.map((item) => (
                    <div key={item.id} className="pt-3 flex justify-between items-start text-sm">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{item.asset?.name || 'Asset ID: ' + item.assetId}</p>
                        <p className="text-xs text-slate-500 mt-1">Condition: {item.condition} | Verified: {item.verified ? 'Yes' : 'No'}</p>
                      </div>
                      <p className="text-xs text-slate-400 italic">{item.notes || 'No notes'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

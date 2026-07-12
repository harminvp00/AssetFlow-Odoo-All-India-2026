import React, { useState, useEffect } from 'react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';
import FileUpload from '../../assets/components/FileUpload';

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  // New Request Form states
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [photoUrl, setPhotoUrl] = useState('');

  // Assign Technician states
  const [technicianId, setTechnicianId] = useState('');
  const [employees, setEmployees] = useState([]);

  // Resolution states
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/maintenance');
      if (response.data?.success) {
        const rawData = response.data.data;
        if (Array.isArray(rawData)) {
          setRequests(rawData);
        } else {
          const flat = [];
          Object.entries(rawData).forEach(([status, list]) => {
            list.forEach(item => flat.push({ ...item, status }));
          });
          setRequests(flat);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetsAndEmployees = async () => {
    try {
      const [assetRes, empRes] = await Promise.all([
        apiClient.get('/assets'),
        apiClient.get('/employees')
      ]);
      setAssets(assetRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAssetsAndEmployees();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedAssetId || !issueDescription) {
      toast.error('Please fill in required fields.');
      return;
    }

    try {
      const response = await apiClient.post('/maintenance', {
        assetId: selectedAssetId,
        issueDescription,
        priority,
        photoUrl: photoUrl || null
      });

      if (response.data?.success) {
        toast.success('Maintenance request raised successfully!');
        setShowModal(false);
        setIssueDescription('');
        setSelectedAssetId('');
        setPriority('MEDIUM');
        setPhotoUrl('');
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to raise request.');
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await apiClient.patch(`/maintenance/${id}/approve`);
      if (response.data?.success) {
        toast.success('Request approved successfully!');
        fetchRequests();
      }
    } catch (err) {
      toast.error('Failed to approve request.');
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await apiClient.patch(`/maintenance/${id}/reject`);
      if (response.data?.success) {
        toast.success('Request rejected successfully!');
        fetchRequests();
      }
    } catch (err) {
      toast.error('Failed to reject request.');
    }
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!technicianId) return;

    try {
      const response = await apiClient.patch(`/maintenance/${selectedReq.id}/assign-technician`, {
        technicianId
      });
      if (response.data?.success) {
        toast.success('Technician assigned successfully!');
        setShowAssignModal(false);
        setTechnicianId('');
        fetchRequests();
      }
    } catch (err) {
      toast.error('Failed to assign technician.');
    }
  };

  const handleStartWork = async (id) => {
    try {
      const response = await apiClient.patch(`/maintenance/${id}/start`);
      if (response.data?.success) {
        toast.success('Maintenance work started!');
        fetchRequests();
      }
    } catch (err) {
      toast.error('Failed to start work.');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionNotes) return;

    try {
      const response = await apiClient.patch(`/maintenance/${selectedReq.id}/resolve`, {
        resolutionNotes
      });
      if (response.data?.success) {
        toast.success('Maintenance request resolved!');
        setShowResolveModal(false);
        setResolutionNotes('');
        fetchRequests();
      }
    } catch (err) {
      toast.error('Failed to resolve maintenance.');
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400';
      case 'HIGH': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300';
    }
  };

  const renderColumn = (title, statusList) => {
    const colRequests = requests.filter(r => statusList.includes(r.status));

    return (
      <div className="flex flex-col bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 w-full min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">{title}</h3>
          <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs font-semibold text-slate-500">
            {colRequests.length}
          </span>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {colRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {req.asset?.tag || 'AF-ASSET'}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getPriorityColor(req.priority)}`}>
                  {req.priority}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {req.asset?.name || 'Asset Name'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {req.issueDescription}
                </p>
              </div>

              {req.photoUrl && (
                <img
                  src={req.photoUrl}
                  alt="Issue details"
                  className="w-full h-24 object-cover rounded-lg border border-slate-100 dark:border-slate-800"
                />
              )}

              {req.technician && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{req.technician.name || 'Technician'}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-end gap-2">
                {req.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-2 py-1 text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-2 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  </>
                )}

                {req.status === 'APPROVED' && !req.technicianId && (
                  <button
                    onClick={() => { setSelectedReq(req); setShowAssignModal(true); }}
                    className="w-full px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Assign Tech
                  </button>
                )}

                {req.status === 'APPROVED' && req.technicianId && (
                  <button
                    onClick={() => handleStartWork(req.id)}
                    className="w-full px-2 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Start Work
                  </button>
                )}

                {req.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => { setSelectedReq(req); setShowResolveModal(true); }}
                    className="w-full px-2 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    Resolve
                  </button>
                )}

                {req.status === 'RESOLVED' && (
                  <span className="text-[10px] text-slate-400 italic">Resolved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Maintenance Kanban</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Track asset repair workflows, approvals, and technician progress.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Raise Request
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-emerald-600 rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderColumn('Pending', ['PENDING'])}
          {renderColumn('Approved / Ready', ['APPROVED'])}
          {renderColumn('In Progress', ['IN_PROGRESS'])}
          {renderColumn('Resolved', ['RESOLVED'])}
        </div>
      )}

      {/* Raise Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Raise Maintenance Request</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Asset *</label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Asset...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Issue Description *</label>
                <textarea
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the problem with the asset..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Upload Photo Detail (Optional)</label>
                <FileUpload onUploadSuccess={(data) => setPhotoUrl(data.url)} />
                {photoUrl && (
                  <p className="text-xs text-emerald-600 mt-1">Photo uploaded successfully!</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Assign Technician</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Employee</label>
                <select
                  required
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Technician...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Request Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Resolve Maintenance</h2>
              <button onClick={() => setShowResolveModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Resolution Notes *</label>
                <textarea
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Provide details about the repair/resolution..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
                >
                  Resolve Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

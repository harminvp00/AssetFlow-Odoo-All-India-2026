import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function AuditsPage() {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [scopeDepartmentId, setScopeDepartmentId] = useState('');
  const [scopeLocationId, setScopeLocationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditorIds, setAuditorIds] = useState([]);

  // Data options
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);

  const fetchCycles = async () => {
    try {
      const response = await apiClient.get('/audits');
      if (response.data?.success) {
        setCycles(response.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit cycles.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [deptRes, locRes, empRes] = await Promise.all([
        apiClient.get('/departments'),
        apiClient.get('/locations'),
        apiClient.get('/employees')
      ]);
      setDepartments(deptRes.data?.data || []);
      setLocations(locRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCycles();
    fetchFormOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || auditorIds.length === 0) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const response = await apiClient.post('/audits', {
        name,
        scopeDepartmentId: scopeDepartmentId || null,
        scopeLocationId: scopeLocationId || null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        auditorIds
      });

      if (response.data?.success) {
        toast.success('Audit cycle created successfully!');
        setShowModal(false);
        // Reset form
        setName('');
        setScopeDepartmentId('');
        setScopeLocationId('');
        setStartDate('');
        setEndDate('');
        setAuditorIds([]);
        fetchCycles();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create audit cycle.');
    }
  };

  const handleAuditorChange = (id) => {
    setAuditorIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Audit Cycles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Configure, manage, and verify compliance audits for inventory assets.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Cycle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-emerald-600 rounded-full" />
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Audit Cycles</h3>
          <p className="text-slate-400 text-sm mt-1">Get started by creating your first inventory compliance audit cycle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              onClick={() => navigate(`/audits/${cycle.id}`)}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    cycle.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : cycle.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}>
                    {cycle.status}
                  </span>
                  <p className="text-xs text-slate-400">
                    Ends {new Date(cycle.endDate).toLocaleDateString()}
                  </p>
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{cycle.name}</h3>
                
                <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
                  <p>Scope Location: {cycle.scopeLocation?.name || 'All Locations'}</p>
                  <p>Scope Department: {cycle.scopeDepartment?.name || 'All Departments'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {cycle.auditors?.length || 0} Assigned Auditor(s)
                </span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  View Cycle
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 dark:border-slate-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Schedule Audit Cycle</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Cycle Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 IT Assets Audit"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Scope Department</label>
                  <select
                    value={scopeDepartmentId}
                    onChange={(e) => setScopeDepartmentId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Scope Location</label>
                  <select
                    value={scopeLocationId}
                    onChange={(e) => setScopeLocationId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">All Locations</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Assigned Auditors * (Select at least one)</label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-h-[150px] overflow-y-auto space-y-2">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={auditorIds.includes(emp.id)}
                        onChange={() => handleAuditorChange(emp.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{emp.name} ({emp.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

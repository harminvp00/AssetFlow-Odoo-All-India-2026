import React, { useEffect, useState } from 'react';
import { MapPin, Plus, ShieldAlert } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: true,
  });

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/locations');
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (err) {
      toast.error('Failed to load locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a location name.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/locations', formData);
      if (response.data.success) {
        toast.success('Location created successfully!');
        setIsModalOpen(false);
        setFormData({
          name: '',
          description: '',
          status: true,
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create location.');
      setLoading(false);
    }
  };

  if (loading && locations.length === 0) {
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
          <MapPin className="h-8 w-8" />
          Locations
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <ShieldAlert className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Locations Registered</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Get started by creating a new physical location.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Location Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Total Assets</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200">
                  <td className="px-6 py-4 font-bold">{loc.name}</td>
                  <td className="px-6 py-4">{loc.description || 'No Description'}</td>
                  <td className="px-6 py-4 font-semibold">{loc._count?.assets ?? 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      loc.status
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {loc.status ? 'Active' : 'Inactive'}
                    </span>
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
                <MapPin className="h-5 w-5" />
                Create New Location
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Location Name *</label>
                <input type="text" name="name" placeholder="e.g. Mumbai Office, Floor 3" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                <textarea name="description" placeholder="e.g. HQ main tech and device storage room" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" rows="3" />
              </div>

              <div className="flex items-center">
                <input type="checkbox" name="status" id="status" checked={formData.status} onChange={handleInputChange} className="h-4 w-4 border-slate-200 dark:border-slate-800 dark:bg-slate-950" />
                <label htmlFor="status" className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-500">Active Status</label>
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

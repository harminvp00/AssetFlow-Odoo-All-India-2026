import React, { useEffect, useState } from 'react';
import { Laptop, Plus, Tag, Layers, MapPin, Building2, ShieldAlert } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tag: '',
    name: '',
    serialNumber: '',
    acquisitionDate: '',
    acquisitionCost: '',
    condition: 'NEW',
    status: 'AVAILABLE',
    locationId: '',
    categoryId: '',
    departmentId: '',
    isSharedBookable: false,
  });

  const fetchData = async () => {
    try {
      const [assetsRes, catsRes, locsRes, deptsRes] = await Promise.all([
        apiClient.get('/assets'),
        apiClient.get('/categories'),
        apiClient.get('/locations'),
        apiClient.get('/departments'),
      ]);

      if (assetsRes.data.success) setAssets(assetsRes.data.data);
      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (locsRes.data.success) setLocations(locsRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
    } catch (err) {
      toast.error('Failed to load asset data.');
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
    if (!formData.tag || !formData.name || !formData.serialNumber || !formData.categoryId || !formData.locationId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/assets', formData);
      if (response.data.success) {
        toast.success('Asset registered successfully!');
        setIsModalOpen(false);
        setFormData({
          tag: '',
          name: '',
          serialNumber: '',
          acquisitionDate: '',
          acquisitionCost: '',
          condition: 'NEW',
          status: 'AVAILABLE',
          locationId: '',
          categoryId: '',
          departmentId: '',
          isSharedBookable: false,
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register asset.');
      setLoading(false);
    }
  };

  if (loading && assets.length === 0) {
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
          <Laptop className="h-8 w-8" />
          Assets Registry
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Register Asset
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <ShieldAlert className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Assets Registered</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Get started by registering a new organization asset.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Tag</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Serial Number</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200">
                  <td className="px-6 py-4 font-bold">{asset.tag}</td>
                  <td className="px-6 py-4">{asset.name}</td>
                  <td className="px-6 py-4 font-mono">{asset.serialNumber}</td>
                  <td className="px-6 py-4">{asset.category?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{asset.location?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800">
                      {asset.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      asset.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {asset.status}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                Register New Asset
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Asset Tag *</label>
                  <input type="text" name="tag" placeholder="e.g. AF-0120" value={formData.tag} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Serial Number *</label>
                  <input type="text" name="serialNumber" placeholder="e.g. SN-THINK-1122" value={formData.serialNumber} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Asset Name *</label>
                <input type="text" name="name" placeholder="e.g. Lenovo ThinkPad X1" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category *</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Location *</label>
                  <select name="locationId" value={formData.locationId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required>
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Department</label>
                  <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white">
                    <option value="">None</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Condition</label>
                  <select name="condition" value={formData.condition} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-955 text-slate-950 dark:text-white">
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Acquisition Cost</label>
                  <input type="number" step="0.01" name="acquisitionCost" placeholder="e.g. 1500.00" value={formData.acquisitionCost} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" />
                </div>
                <div className="flex items-center mt-6">
                  <input type="checkbox" name="isSharedBookable" id="isSharedBookable" checked={formData.isSharedBookable} onChange={handleInputChange} className="h-4 w-4 border-slate-200 dark:border-slate-800 dark:bg-slate-950" />
                  <label htmlFor="isSharedBookable" className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-500">Shared / Bookable</label>
                </div>
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

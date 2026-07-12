import React, { useEffect, useState } from 'react';
import { Settings, Save, ShieldAlert } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states representing configurable options
  const [formData, setFormData] = useState({
    systemName: 'Odoo All India Asset Management',
    defaultLocation: 'New Delhi HQ',
    maintenanceInterval: '30',
    notifyOnTransfer: true,
  });

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/settings');
      if (response.data.success && response.data.data.length > 0) {
        setSettings(response.data.data);
      }
    } catch (err) {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (settingName) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/settings', { name: settingName });
      if (response.data.success) {
        toast.success(`Setting '${settingName}' saved successfully!`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
          <Settings className="h-8 w-8" />
          System Settings
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              System Display Name
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                name="systemName"
                value={formData.systemName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white max-w-md"
              />
              <button
                onClick={() => handleSave(`systemName:${formData.systemName}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Default Asset Location
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                name="defaultLocation"
                value={formData.defaultLocation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white max-w-md"
              />
              <button
                onClick={() => handleSave(`defaultLocation:${formData.defaultLocation}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Maintenance Reminder Interval (Days)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                name="maintenanceInterval"
                value={formData.maintenanceInterval}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white max-w-md"
              />
              <button
                onClick={() => handleSave(`maintenanceInterval:${formData.maintenanceInterval}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between max-w-md">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Email Notifications</h3>
              <p className="text-xs text-slate-500 mt-1">Send alerts on asset transfers.</p>
            </div>
            <input
              type="checkbox"
              name="notifyOnTransfer"
              checked={formData.notifyOnTransfer}
              onChange={handleChange}
              className="h-4 w-4 text-slate-950 border-slate-200 rounded focus:ring-slate-950 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

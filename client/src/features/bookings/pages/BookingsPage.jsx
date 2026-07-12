import React, { useEffect, useState } from 'react';
import { Bookmark, Plus, X, Calendar, ShieldAlert } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    assetId: '',
    startTime: '',
    endTime: '',
  });

  const fetchData = async () => {
    try {
      const [bookingsRes, assetsRes] = await Promise.all([
        apiClient.get('/bookings'),
        apiClient.get('/assets'),
      ]);

      if (bookingsRes.data.success) setBookings(bookingsRes.data.data);
      if (assetsRes.data.success) {
        // Filter shared bookable assets
        const bookable = assetsRes.data.data.filter(a => a.isSharedBookable);
        setAssets(bookable);
      }
    } catch (err) {
      toast.error('Failed to load bookings.');
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
    if (!formData.assetId || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/bookings', formData);
      if (response.data.success) {
        toast.success('Resource booked successfully!');
        setIsModalOpen(false);
        setFormData({
          assetId: '',
          startTime: '',
          endTime: '',
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking.');
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this resource booking?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.patch(`/bookings/${id}/cancel`);
      if (response.data.success) {
        toast.success('Booking cancelled.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
      setLoading(false);
    }
  };

  if (loading && bookings.length === 0) {
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
          <Bookmark className="h-8 w-8" />
          Resource Bookings
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Book Resource
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <ShieldAlert className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Resource Bookings</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Get started by booking a shared organization asset.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Booked By</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200">
                  <td className="px-6 py-4 font-bold">{booking.asset?.name} ({booking.asset?.tag})</td>
                  <td className="px-6 py-4">{booking.user?.firstName ? `${booking.user.firstName} ${booking.user.lastName}` : (booking.user?.email || 'N/A')}</td>
                  <td className="px-6 py-4">{new Date(booking.startTime).toLocaleString()}</td>
                  <td className="px-6 py-4">{new Date(booking.endTime).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      booking.status === 'UPCOMING'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : booking.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {booking.status === 'UPCOMING' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Cancel
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
                <Bookmark className="h-5 w-5" />
                Book Shared Resource
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer font-bold text-sm">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Resource *</label>
                <select name="assetId" value={formData.assetId} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required>
                  <option value="">Choose Asset</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Time *</label>
                <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">End Time *</label>
                <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg dark:bg-slate-950 text-slate-950 dark:text-white" required />
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

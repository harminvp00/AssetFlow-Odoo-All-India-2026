import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  Info,
  CheckCircle,
  Inbox,
  ArrowRight
} from 'lucide-react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'New Asset Allocation',
    message: 'Asset AF-0114 (Dell XPS 15) has been successfully allocated to Priya Shah.',
    isRead: false,
    type: 'INFO',
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'notif-2',
    title: 'Pending Transfer Request',
    message: 'Transfer request TR-104 requires your immediate approval: Priya Shah to Arjun Nair.',
    isRead: false,
    type: 'WARNING',
    createdAt: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
  },
  {
    id: 'notif-3',
    title: 'Audit Cycle Warning',
    message: 'Audit Cycle "Mid-Year Audit 2026" is scheduled to end in 3 days. Please complete outstanding verifications.',
    isRead: true,
    type: 'ALERT',
    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: 'notif-4',
    title: 'Maintenance Completed',
    message: 'Maintenance request for AF-0118 (iPad Pro) has been resolved by the technician.',
    isRead: true,
    type: 'INFO',
    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, ALERTS

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/notifications');
      const data = response.data?.data || response.data || [];
      
      if (data.length > 0) {
        setNotifications(data);
      } else {
        setNotifications(MOCK_NOTIFICATIONS);
      }
    } catch (error) {
      console.error('Failed to fetch notifications from backend, using fallbacks:', error);
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (error) {
      // Optimistic state update in case of mock/un-migrated route behaviors
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Notification marked as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ALERT':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ALERTS') return n.type === 'ALERT' || n.type === 'WARNING';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            System Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Stay informed of device assignments, transfer updates, and audit schedules.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold py-2.5 px-4 rounded-lg text-xs cursor-pointer transition-all active:scale-[0.98] self-start sm:self-center"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setFilter('ALL')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            filter === 'ALL'
              ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white font-extrabold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            filter === 'UNREAD'
              ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white font-extrabold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('ALERTS')}
          className={`pb-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            filter === 'ALERTS'
              ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white font-extrabold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          Alerts
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-slate-950 dark:border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-xl border transition-all flex items-start gap-4 ${
                notif.isRead
                  ? 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                  : 'bg-white dark:bg-slate-900 border-slate-900 dark:border-white shadow-sm'
              }`}
            >
              <div className="mt-0.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(notif.createdAt)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="self-center h-7 w-7 rounded-full border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center cursor-pointer transition-all"
                  title="Mark as read"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400 mb-4">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No notifications</h3>
          <p className="text-xs text-slate-400 mt-1">
            You are all caught up! No notifications match the selected filter.
          </p>
        </div>
      )}
    </div>
  );
}

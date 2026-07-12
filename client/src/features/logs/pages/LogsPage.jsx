import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User, 
  ArrowLeftRight, 
  PlusCircle, 
  CheckSquare, 
  Filter
} from 'lucide-react';
import apiClient from '../../../api/apiClient';

const MOCK_LOGS = [
  {
    id: 'log-1',
    action: 'ALLOCATE',
    createdAt: new Date(Date.now() - 1200000).toISOString(), // 20 mins ago
    user: { name: 'System Admin' },
    asset: { tag: 'AF-0114', name: 'Dell XPS 15 Laptop' },
    details: {
      action: 'ALLOCATE',
      allocatedTo: 'Priya Shah',
      allocatedBy: 'System Admin',
      department: 'Engineering',
      expectedReturnDate: '2026-12-31'
    }
  },
  {
    id: 'log-2',
    action: 'TRANSFER_APPROVED',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    user: { name: 'System Admin' },
    asset: { tag: 'AF-0116', name: 'Samsung 32" Curved Monitor' },
    details: {
      action: 'TRANSFER_APPROVED',
      from: 'Arjun Nair',
      to: 'Aditi Verma',
      approvedBy: 'System Admin',
      originalRequestDate: '2026-07-11'
    }
  },
  {
    id: 'log-3',
    action: 'REGISTER_ASSET',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    user: { name: 'System Admin' },
    asset: { tag: 'AF-0120', name: 'Lenovo ThinkPad X1 Carbon' },
    details: {
      action: 'REGISTER_ASSET',
      name: 'Lenovo ThinkPad X1 Carbon',
      cost: '1800.00',
      serialNumber: 'SN-THINK-1122',
      location: 'Bangalore R&D Center'
    }
  },
  {
    id: 'log-4',
    action: 'LOGIN',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    user: { name: 'Priya Shah' },
    asset: null,
    details: {
      action: 'LOGIN',
      ipAddress: '192.168.1.42',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    }
  }
];

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/logs');
      const data = response.data?.data || response.data || [];
      if (data.length > 0) {
        setLogs(data);
      } else {
        setLogs(MOCK_LOGS);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs, using mocks:', error);
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'ALLOCATE':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'TRANSFER':
      case 'TRANSFER_APPROVED':
        return 'bg-slate-950 text-white border-slate-950';
      case 'REGISTER_ASSET':
        return 'bg-white text-slate-900 border-slate-800';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'ALLOCATE':
        return <CheckSquare className="h-4 w-4" />;
      case 'TRANSFER':
      case 'TRANSFER_APPROVED':
        return <ArrowLeftRight className="h-4 w-4" />;
      case 'REGISTER_ASSET':
        return <PlusCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.asset?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.asset?.tag || '').toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Activity Logs
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Complete chronological audit trail of all asset modifications, allocations, and requests.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, or asset tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all text-slate-900 dark:text-white"
          />
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">User Logins</option>
            <option value="REGISTER_ASSET">Asset Registrations</option>
            <option value="ALLOCATE">Asset Allocations</option>
            <option value="TRANSFER_APPROVED">Transfer Approvals</option>
          </select>
        </div>
      </div>

      {/* Timeline Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-slate-950 dark:border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div key={log.id} className="relative group">
                {/* Bullet node */}
                <div className="absolute -left-[35px] md:-left-[43px] top-1.5 h-6 w-6 md:h-8 md:w-8 rounded-full border border-slate-950 dark:border-white bg-white dark:bg-slate-950 flex items-center justify-center text-slate-950 dark:text-white group-hover:scale-105 transition-all">
                  {getActionIcon(log.action)}
                </div>

                {/* Log Content Panel */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-400 dark:hover:border-slate-700 transition-all space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                      {log.asset && (
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {log.asset.tag} — {log.asset.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(log.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Action performed by <span className="font-semibold text-slate-900 dark:text-white">{log.user?.name || 'Unknown User'}</span>.
                  </p>

                  {/* Expand Metadata Trigger */}
                  {log.details && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details</span>
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            <span>View Raw Details</span>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400 mb-4">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No logs found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No system actions matched your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}

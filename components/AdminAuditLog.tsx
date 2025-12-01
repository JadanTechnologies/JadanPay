import React, { useState, useEffect } from 'react';
import { MockDB } from '../services/mockDb';
import { AuditLog } from '../types';
import { History, Search, Calendar, X } from 'lucide-react';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await MockDB.getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resetFilters = () => {
      setSearchTerm('');
      setFilterStartDate('');
      setFilterEndDate('');
  };

  const filteredLogs = logs.filter(log => {
    const searchMatch =
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    const logDate = new Date(log.timestamp);
    const startDateMatch = filterStartDate === '' || logDate >= new Date(filterStartDate);
    const endDateMatch = filterEndDate === '' || logDate <= new Date(new Date(filterEndDate).setHours(23, 59, 59, 999));

    return searchMatch && startDateMatch && endDateMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <History size={24} className="text-green-600 dark:text-green-400" /> Audit Log
            </h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500"/>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Filter by Date:</span>
            </div>
            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 outline-none"/>
            <span className="text-gray-400">-</span>
            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 outline-none"/>
            <button onClick={resetFilters} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30">
                <X size={16}/>
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p>No audit logs found for the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 whitespace-nowrap text-xs text-gray-500">{formatDate(log.timestamp)}</td>
                    <td className="p-4 font-bold text-gray-800 dark:text-white">{log.adminName}</td>
                    <td className="p-4 font-mono text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20">{log.action}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{log.description}</td>
                    <td className="p-4 font-mono text-xs text-gray-500">{log.targetType ? `${log.targetType}:${log.targetId}` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
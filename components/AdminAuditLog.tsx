import React, { useState, useEffect } from 'react';
import { MockDB } from '../services/mockDb';
import { AuditLog } from '../types';
import { History, Search } from 'lucide-react';

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredLogs = logs.filter(log =>
    log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p>No audit logs found.</p>
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

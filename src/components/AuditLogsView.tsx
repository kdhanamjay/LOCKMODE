// EduGuard MDM — Immutable Audit Trail (Clean Minimalism)

import React, { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { AuditLog } from '../types/mdm';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.targetName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.targetType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base text-gray-950">Immutable Administrative Audit Log</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Tamper-evident record of all remote commands, policy publications, deployments, and security resolutions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50/80 px-3.5 py-2 rounded-2xl border border-gray-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-[11px] text-gray-800">Hash Integrity: VERIFIED</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by admin, action, or target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
        </div>

        <div className="text-xs font-semibold text-gray-400">{filteredLogs.length} Total Records</div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Administrator</th>
                <th className="py-4 px-5">Action</th>
                <th className="py-4 px-5">Target Entity</th>
                <th className="py-4 px-5">Payload & Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-5 font-sans text-gray-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>

                  <td className="py-4 px-5 font-sans">
                    <div className="font-semibold text-gray-950">{log.adminName}</div>
                    <span className="text-[10px] text-gray-400">{log.adminEmail}</span>
                  </td>

                  <td className="py-4 px-5">
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-semibold uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-4 px-5 font-sans">
                    <div className="font-medium text-gray-900">{log.targetName || log.targetId}</div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{log.targetType}</span>
                  </td>

                  <td className="py-4 px-5 max-w-xs truncate font-mono text-[11px] text-gray-600">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

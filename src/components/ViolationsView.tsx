// EduGuard MDM — Security Incidents & Policy Violations Console (Clean Minimalism)

import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
} from 'lucide-react';
import { PolicyViolation, Device } from '../types/mdm';

interface ViolationsViewProps {
  violations: PolicyViolation[];
  devices: Device[];
  onResolveViolation: (violationId: string, note?: string) => void;
  onOpenDevice: (device: Device) => void;
}

export const ViolationsView: React.FC<ViolationsViewProps> = ({
  violations,
  devices,
  onResolveViolation,
  onOpenDevice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedViolationForResolve, setSelectedViolationForResolve] = useState<PolicyViolation | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const filtered = violations.filter((v) => {
    const matchesSearch =
      v.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.studentName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedViolationForResolve) return;
    onResolveViolation(selectedViolationForResolve.id, resolutionNote);
    setSelectedViolationForResolve(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base text-gray-950">Security Incidents & Tamper Detection</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Automated alerts generated when students attempt policy bypasses, unauthorized app execution, or hardware tampering.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, device ID, or violation type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
        </div>

        <div className="flex items-center space-x-1 bg-gray-50/80 p-1 rounded-2xl border border-gray-100 text-xs font-medium">
          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              severityFilter === 'ALL' ? 'bg-white text-gray-950 font-semibold shadow-xs' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            All ({violations.length})
          </button>
          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              severityFilter === 'CRITICAL' ? 'bg-rose-50 text-rose-700 font-semibold shadow-xs' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setSeverityFilter('HIGH')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              severityFilter === 'HIGH' ? 'bg-amber-50 text-amber-800 font-semibold shadow-xs' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            High
          </button>
          <button
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              severityFilter === 'MEDIUM' ? 'bg-white text-gray-950 font-semibold shadow-xs' : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            Medium
          </button>
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-4 px-5">Severity & Timestamp</th>
                <th className="py-4 px-5">Incident Type</th>
                <th className="py-4 px-5">Target Device & Student</th>
                <th className="py-4 px-5">Description & Technical Details</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal">
              {filtered.map((v) => {
                const matchedDevice = devices.find((d) => d.id === v.deviceId);
                return (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Severity */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          v.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : v.severity === 'HIGH'
                            ? 'bg-amber-50 text-amber-800 border border-amber-100'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {v.severity}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Incident Type */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-950">{v.type.replace(/_/g, ' ')}</div>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {v.id.slice(0, 8)}</span>
                    </td>

                    {/* Target Device */}
                    <td className="py-4 px-5">
                      <div className="font-medium text-gray-950">{v.studentName || 'Student'}</div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center space-x-1 mt-0.5">
                        <span>{v.deviceId}</span>
                        {matchedDevice && (
                          <button
                            onClick={() => onOpenDevice(matchedDevice)}
                            className="text-gray-400 hover:text-gray-950 transition-colors"
                            title="Inspect Device"
                          >
                            <ExternalLink className="w-3 h-3 inline" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-gray-700">{v.description}</p>
                      {v.resolutionNote && (
                        <div className="mt-1.5 text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                          <span className="font-semibold">Resolved:</span> {v.resolutionNote}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      {v.isResolved ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                          RESOLVED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                          UNRESOLVED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      {!v.isResolved ? (
                        <button
                          onClick={() => setSelectedViolationForResolve(v)}
                          className="px-3 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400">Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedViolationForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs select-none">
          <form
            onSubmit={handleResolveSubmit}
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
          >
            <h3 className="font-semibold text-base text-gray-950">Resolve Security Incident</h3>
            <p className="text-xs text-gray-400">
              Mark violation <span className="font-semibold text-gray-900">{selectedViolationForResolve.type}</span> on device {selectedViolationForResolve.deviceId} as resolved.
            </p>

            <div>
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1.5">
                Resolution Note / Action Taken
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Student counseled; confirmed restricted app uninstalled."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full p-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 text-xs">
              <button
                type="button"
                onClick={() => setSelectedViolationForResolve(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-950 hover:bg-gray-50 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

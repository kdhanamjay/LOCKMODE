// EduGuard MDM — Device Detail Full Inspector Modal (Clean Minimalism)

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Lock,
  Unlock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  BatteryCharging,
  Battery,
  Wifi,
  CheckCircle2,
  Info,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Device, Application, DevicePolicy, AppUsageRecord, PolicyViolation } from '../types/mdm';

interface DeviceDetailModalProps {
  device: Device | null;
  onClose: () => void;
  onLock: (deviceId: string) => void;
  onUnlock: (deviceId: string) => void;
  onSync: (deviceId: string) => void;
  onReboot: (deviceId: string) => void;
  onDelete?: (deviceId: string) => void;
  policies: DevicePolicy[];
  applications: Application[];
  usageRecords: AppUsageRecord[];
  violations: PolicyViolation[];
}

type DetailTab = 'overview' | 'applications' | 'usage' | 'web_activity' | 'events' | 'policy' | 'deployments';

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  onClose,
  onLock,
  onUnlock,
  onSync,
  onReboot,
  onDelete,
  policies,
  applications,
  usageRecords,
  violations,
}) => {
  if (!device) return null;

  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const activePolicy = policies.find((p) => p.id === device.policyId) || policies[0];
  const deviceUsage = usageRecords.filter((u) => u.deviceId === device.id);
  const deviceViolations = violations.filter((v) => v.deviceId === device.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-950/40 backdrop-blur-xs select-none">
      <div className="bg-white w-full max-w-4xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Top Header */}
        <div className="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base text-gray-950">{device.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-mono font-semibold">
                  {device.deviceId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    device.isLocked
                      ? 'bg-gray-950 text-white'
                      : device.status === 'ONLINE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {device.isLocked ? 'LOCKED' : device.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                Assigned to <span className="text-gray-900 font-semibold">{device.assignedStudentName || 'Unassigned'}</span> ({device.className})
              </p>
            </div>
          </div>

          {/* Quick Remote Action Controls */}
          <div className="flex items-center space-x-2">
            {device.isLocked ? (
              <button
                onClick={() => onUnlock(device.id)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                title="Remotely Exit Kiosk & Unlock PC"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Exit Kiosk / Unlock PC</span>
              </button>
            ) : (
              <button
                onClick={() => onLock(device.id)}
                className="px-3.5 py-1.5 bg-gray-950 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Device</span>
              </button>
            )}

            <button
              onClick={() => onSync(device.id)}
              className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Sync Policy</span>
            </button>

            <button
              onClick={() => onReboot(device.id)}
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-950 rounded-lg border border-gray-200 transition-colors shadow-xs"
              title="Reboot Device"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg border border-gray-200 hover:border-rose-200 transition-colors shadow-xs cursor-pointer"
                title="Delete & Unenroll Device"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-950 rounded-lg hover:bg-gray-50 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Device Quick Stats Banner */}
        <div className="px-8 py-3 bg-gray-50/50 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs shrink-0">
          <div>
            <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-widest">Battery</span>
            <div className="flex items-center space-x-1.5 font-semibold text-gray-950 mt-0.5">
              {device.isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" /> : <Battery className="w-3.5 h-3.5 text-gray-500" />}
              <span>{device.batteryLevel}% {device.isCharging && '(Charging)'}</span>
            </div>
          </div>

          <div>
            <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-widest">Network</span>
            <div className="flex items-center space-x-1.5 font-semibold text-gray-950 mt-0.5">
              <Wifi className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{device.wifiSsid || 'Disconnected'}</span>
            </div>
          </div>

          <div>
            <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-widest">OS Version</span>
            <span className="font-semibold text-gray-950 block mt-0.5">{device.osVersion || 'Android 14'}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-widest">Agent / DPC</span>
            <span className="font-semibold text-gray-950 block mt-0.5">v{device.agentVersion} (Device Owner)</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-widest">Active Policy</span>
            <span className="font-semibold text-blue-600 block mt-0.5">v{device.policyVersion} (Synced)</span>
          </div>
        </div>

        {/* 7-Tab Navigation Bar */}
        <div className="px-8 border-b border-gray-100 flex space-x-6 text-xs font-semibold text-gray-500 shrink-0">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'applications', label: 'Applications' },
              { id: 'usage', label: 'App Usage' },
              { id: 'web_activity', label: 'Web Activity' },
              { id: 'events', label: 'Events & Telemetry' },
              { id: 'policy', label: 'Active Policy' },
              { id: 'deployments', label: 'Deployments' },
            ] as Array<{ id: DetailTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-gray-950 text-gray-950 font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Hardware & Spec Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                  <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                    <Info className="w-3.5 h-3.5 text-gray-500" />
                    <span>Hardware Specifications</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Manufacturer</span>
                      <span className="font-semibold text-gray-950">{device.manufacturer}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Model</span>
                      <span className="font-semibold text-gray-950">{device.model}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Serial Number</span>
                      <span className="font-mono font-semibold text-gray-950">{device.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">IP Address</span>
                      <span className="font-mono font-semibold text-gray-950">{device.ipAddress || '10.142.18.94'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                  <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hardware Security State</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-600">Google Play Integrity API</span>
                      <span className="font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASSED (STRONG_INTEGRITY)</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-600">Root & Bootloader Tamper Check</span>
                      <span className="font-bold text-emerald-600">CLEAN (Not Rooted)</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-600">Developer Options & USB Debug</span>
                      <span className="font-bold text-emerald-600">BLOCKED by Policy</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Cellular Calls & SMS (Telephony)</span>
                      <span className="font-bold text-emerald-600">BLOCKED (DISALLOW_CALLS)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage & Memory Bars */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Device Resource Telemetry</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <div className="flex justify-between mb-1.5 font-medium">
                      <span className="text-gray-600">Internal Storage ({device.storageUsedGb} GB / {device.storageTotalGb} GB)</span>
                      <span className="font-semibold text-gray-950">{Math.round((device.storageUsedGb / device.storageTotalGb) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${(device.storageUsedGb / device.storageTotalGb) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5 font-medium">
                      <span className="text-gray-600">RAM Allocation ({device.ramUsedGb} GB / {device.ramTotalGb} GB)</span>
                      <span className="font-semibold text-gray-950">{Math.round((device.ramUsedGb / device.ramTotalGb) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${(device.ramUsedGb / device.ramTotalGb) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <h4 className="font-semibold text-gray-950">Approved School Applications on Device</h4>
                <span className="text-gray-400 font-medium">{activePolicy.allowedApplications.length} Approved Packages</span>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white text-xs">
                {activePolicy.allowedApplications.map((pkg, idx) => {
                  const matchedApp = applications.find((a) => a.packageName === pkg);
                  return (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-700">
                          📦
                        </div>
                        <div>
                          <div className="font-semibold text-gray-950">{matchedApp?.name || pkg}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{pkg}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        ALLOWLISTED
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-xs text-gray-950">Application Screen Time Today</h4>
              <div className="space-y-2">
                {deviceUsage.map((u) => (
                  <div key={u.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-xs shadow-xs">
                    <div>
                      <div className="font-semibold text-gray-950">{u.applicationName}</div>
                      <div className="text-[11px] text-gray-400">{u.packageName} • {u.sessionCount} sessions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">{Math.floor(u.durationMinutes / 60)}h {u.durationMinutes % 60}m</div>
                      <span className="text-[10px] text-gray-400">Total Active Usage</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'web_activity' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-xs text-gray-950">DNS Sinkhole & Web Filter Log</h4>
              <div className="space-y-2">
                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <span className="font-semibold text-gray-950">classroom.google.com</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Matched Global Educational Allowlist</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold text-[9px] uppercase tracking-wider">
                    ALLOWED
                  </span>
                </div>

                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <span className="font-semibold text-gray-950">instagram.com</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">Blocked: Social Networking Policy Category</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full font-bold text-[9px] uppercase tracking-wider">
                    SINKHOLED
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-gray-950">Security & Operational Telemetry Events</h4>
              <div className="space-y-2 text-xs">
                {deviceViolations.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl border border-rose-100 bg-white shadow-xs flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-rose-600">{v.type}</div>
                      <p className="text-gray-700 mt-0.5">{v.description}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">{new Date(v.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full font-bold text-[9px] uppercase tracking-wider">
                      {v.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs">
                <h4 className="font-semibold text-gray-950 text-sm">{activePolicy.name} (v{activePolicy.version})</h4>
                <p className="text-gray-400 mt-1">{activePolicy.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold">Kiosk Lockdown Mode</span>
                  <span className="font-semibold text-gray-950 text-sm mt-1 block">{activePolicy.kioskMode}</span>
                </div>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-widest font-bold">Allowlist Mode</span>
                  <span className="font-semibold text-gray-950 text-sm mt-1 block">
                    {activePolicy.allowlistOnly ? 'Strict Allowlist Only' : 'Open'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deployments' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-gray-950">Package Rollout History</h4>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <div className="font-semibold text-gray-950">Python Interactive IDE (v2.1.0)</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Rollout to Class XII-A</div>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold text-[9px] uppercase tracking-wider">
                  INSTALLED
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs select-none">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center space-x-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-950 text-sm">Delete & Unenroll</h4>
                  <p className="text-[11px] text-gray-500">Fleet Inventory Removal</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{device.name}</span> ({device.deviceId})? The device will be unenrolled and any active kiosk lock will be dismissed.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete) {
                      onDelete(device.id);
                      setShowDeleteConfirm(false);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Device</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

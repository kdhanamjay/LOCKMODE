// EduGuard MDM — Managed Devices Inventory View (Clean Minimalism)

import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Tablet,
  Search,
  Lock,
  Unlock,
  RefreshCw,
  RotateCcw,
  BatteryCharging,
  Battery,
  Wifi,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  LockOpen,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Device, KioskExitRequest } from '../types/mdm';

interface DevicesViewProps {
  devices: Device[];
  onOpenDeviceDetail: (device: Device) => void;
  onLockDevice: (deviceId: string) => void;
  onUnlockDevice: (deviceId: string) => void;
  onSyncDevice: (deviceId: string) => void;
  onRebootDevice: (deviceId: string) => void;
  onDeleteDevice?: (deviceId: string) => void;
  onRefreshList: () => void;
  exitRequests?: KioskExitRequest[];
  onApproveExitRequest?: (requestId: string, note?: string) => void;
  onOpenExitRequestsModal?: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  onOpenDeviceDetail,
  onLockDevice,
  onUnlockDevice,
  onSyncDevice,
  onRebootDevice,
  onDeleteDevice,
  exitRequests = [],
  onApproveExitRequest,
  onOpenExitRequestsModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'LOCKED'>('ALL');
  const [selectedClass] = useState<string>('ALL');
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);

  const pendingExitCount = exitRequests.filter((r) => r.status === 'PENDING').length;

  const filteredDevices = devices.filter((device) => {
    const term = (searchTerm || '').toLowerCase().trim();
    const matchesSearch =
      !term ||
      (device.name || '').toLowerCase().includes(term) ||
      (device.deviceId || '').toLowerCase().includes(term) ||
      (device.assignedStudentName || '').toLowerCase().includes(term) ||
      (device.model || '').toLowerCase().includes(term) ||
      (device.ipAddress || '').toLowerCase().includes(term) ||
      (device.platform || '').toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ONLINE' && device.status === 'ONLINE' && !device.isLocked) ||
      (statusFilter === 'OFFLINE' && device.status === 'OFFLINE') ||
      (statusFilter === 'LOCKED' && device.isLocked);

    const matchesClass = selectedClass === 'ALL' || device.classId === selectedClass;

    return matchesSearch && matchesStatus && matchesClass;
  });

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'WINDOWS_PC':
        return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'ANDROID_TABLET':
      case 'IPAD':
        return <Tablet className="w-4 h-4 text-indigo-600" />;
      default:
        return <Smartphone className="w-4 h-4 text-gray-700" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by device ID (TAB-1024), student name, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 transition-all"
          />
        </div>

        {/* Status Filter Tabs & Exit Approvals */}
        <div className="flex items-center space-x-1 bg-gray-50/80 p-1 rounded-xl border border-gray-100 text-xs font-semibold flex-wrap gap-1">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-gray-950 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            All ({devices.length})
          </button>
          <button
            onClick={() => setStatusFilter('ONLINE')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ONLINE'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            Online ({devices.filter((d) => d.status === 'ONLINE' && !d.isLocked).length})
          </button>
          <button
            onClick={() => setStatusFilter('LOCKED')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === 'LOCKED'
                ? 'bg-white text-gray-950 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            Locked ({devices.filter((d) => d.isLocked).length})
          </button>
          <button
            onClick={() => setStatusFilter('OFFLINE')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === 'OFFLINE'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            Offline ({devices.filter((d) => d.status === 'OFFLINE').length})
          </button>

          {onOpenExitRequestsModal && (
            <button
              onClick={onOpenExitRequestsModal}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                pendingExitCount > 0
                  ? 'bg-amber-500 text-white shadow-xs font-bold animate-pulse hover:bg-amber-600'
                  : 'text-gray-500 hover:text-gray-950'
              }`}
            >
              <LockOpen className="w-3.5 h-3.5" />
              <span>Exit Approvals {pendingExitCount > 0 ? `(${pendingExitCount})` : ''}</span>
            </button>
          )}
        </div>
      </div>

      {/* Devices Table Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 border-collapse">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="py-4 px-6">Device Identity</th>
                <th className="py-4 px-6">Assigned Student</th>
                <th className="py-4 px-6">Hardware & OS</th>
                <th className="py-4 px-6">Status & DPC Mode</th>
                <th className="py-4 px-6">Battery & Network</th>
                <th className="py-4 px-6">Policy Sync</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredDevices.map((device) => {
                const pendingExitReq = exitRequests.find(
                  (r) =>
                    (r.deviceId === device.deviceId || r.deviceId === device.id) &&
                    r.status === 'PENDING'
                );

                return (
                <tr
                  key={device.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  onClick={() => onOpenDeviceDetail(device)}
                >
                  {/* Device Identity */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-bold shrink-0">
                        {getPlatformIcon(device.platform)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-950 flex items-center space-x-1.5">
                          <span>{device.deviceId}</span>
                          {device.isLocked && (
                            <span className="px-1.5 py-0.2 bg-gray-950 text-white rounded text-[8px] font-bold uppercase tracking-wider">
                              LOCKED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[160px]">{device.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Assigned Student */}
                  <td className="py-4 px-6">
                    <div className="font-semibold text-gray-900">{device.assignedStudentName || 'Unassigned'}</div>
                    <div className="text-[11px] text-gray-400">{device.className || 'General Pool'}</div>
                  </td>

                  {/* Hardware & OS */}
                  <td className="py-4 px-6">
                    <div className="text-gray-900 font-medium">{device.model}</div>
                    <div className="text-[11px] text-gray-400">{device.osVersion}</div>
                  </td>

                  {/* Status & DPC Mode */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {pendingExitReq ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenExitRequestsModal) onOpenExitRequestsModal();
                          }}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse hover:bg-amber-200 transition-colors cursor-pointer"
                          title={`Exit Requested: ${pendingExitReq.reason}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>EXIT REQ</span>
                        </button>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            device.isLocked
                              ? 'bg-gray-950 text-white'
                              : device.status === 'ONLINE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              device.isLocked
                                ? 'bg-rose-400'
                                : device.status === 'ONLINE'
                                ? 'bg-emerald-500'
                                : 'bg-gray-400'
                            }`}
                          />
                          {device.isLocked ? 'LOCKED' : device.status}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold block mt-1">
                      {device.managementMode}
                    </span>
                  </td>

                  {/* Battery & Network */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {device.isCharging ? (
                          <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Battery className="w-3.5 h-3.5 text-gray-500" />
                        )}
                        <span className="font-semibold text-gray-950">{device.batteryLevel}%</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Wifi className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px]">{device.wifiSsid ? 'Wi-Fi' : 'Offline'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-[10px] text-gray-400 font-mono">IP:</span>
                      <span className="text-[11px] font-mono font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/60">
                        {device.ipAddress || '127.0.0.1'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      App: {device.currentActiveApp?.split('.').pop() || 'Launcher'}
                    </div>
                  </td>

                  {/* Policy Sync */}
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>v{device.policyVersion}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {device.policySyncedAt ? new Date(device.policySyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Synced'}
                    </div>
                  </td>

                  {/* DPC Actions */}
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1.5">
                      {pendingExitReq ? (
                        <button
                          onClick={() => {
                            if (onApproveExitRequest) {
                              onApproveExitRequest(pendingExitReq.id);
                            } else {
                              onUnlockDevice(device.id);
                            }
                          }}
                          className="px-3 py-1 text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-all text-xs font-bold flex items-center space-x-1.5 cursor-pointer animate-pulse"
                          title={`Approve Kiosk Exit for ${pendingExitReq.studentName || device.deviceId}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Exit</span>
                        </button>
                      ) : device.isLocked ? (
                        <button
                          onClick={() => onUnlockDevice(device.id)}
                          className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-600 hover:text-white bg-emerald-50 rounded-lg border border-emerald-200 transition-all text-xs font-semibold flex items-center space-x-1 shadow-xs cursor-pointer"
                          title="Remotely Exit Kiosk & Unlock PC"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Exit Kiosk</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onLockDevice(device.id)}
                          className="p-1.5 text-gray-700 hover:bg-gray-100 bg-white rounded-lg border border-gray-200 transition-all shadow-xs cursor-pointer"
                          title="Remote Lock Device"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onSyncDevice(device.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 bg-white rounded-lg border border-blue-100 transition-all shadow-xs"
                        title="Sync Latest Policy"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onRebootDevice(device.id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-50 bg-white rounded-lg border border-gray-200 transition-all shadow-xs"
                        title="Reboot Device"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteDevice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeviceToDelete(device);
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                          title={`Delete & Unenroll ${device.deviceId}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDeviceDetail(device)}
                        className="p-1.5 text-gray-400 hover:text-gray-950 hover:bg-gray-50 rounded-lg transition-colors"
                        title="View Full Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Smartphone className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">No devices matched your search criteria.</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the filter or search query.</p>
          </div>
        )}
      </div>

      {/* Delete Device Confirmation Modal */}
      {deviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-950">Delete & Unenroll Device</h3>
                  <p className="text-xs text-gray-500">Fleet Inventory Removal</p>
                </div>
              </div>
              <button
                onClick={() => setDeviceToDelete(null)}
                className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Device Name:</span>
                <span className="font-semibold text-gray-900">{deviceToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Device ID:</span>
                <span className="font-mono font-semibold text-gray-900">{deviceToDelete.deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform:</span>
                <span className="font-semibold text-gray-900">{deviceToDelete.platform || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IP Address:</span>
                <span className="font-mono font-semibold text-gray-900">{deviceToDelete.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Assigned Student:</span>
                <span className="font-semibold text-gray-900">{deviceToDelete.assignedStudentName || 'Unassigned'}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete this device from the fleet? Deleting will unenroll it from management and immediately unlock any active kiosk lockdown on the PC, tablet, or mobile.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeviceToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDevice && deviceToDelete) {
                    onDeleteDevice(deviceToDelete.id);
                    setDeviceToDelete(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete & Unenroll</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

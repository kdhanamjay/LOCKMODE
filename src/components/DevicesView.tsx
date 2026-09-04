// EduGuard MDM — Managed Devices Inventory View (Clean Minimalism)

import React, { useState } from 'react';
import {
  Smartphone,
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
} from 'lucide-react';
import { Device } from '../types/mdm';

interface DevicesViewProps {
  devices: Device[];
  onOpenDeviceDetail: (device: Device) => void;
  onLockDevice: (deviceId: string) => void;
  onUnlockDevice: (deviceId: string) => void;
  onSyncDevice: (deviceId: string) => void;
  onRebootDevice: (deviceId: string) => void;
  onRefreshList: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  onOpenDeviceDetail,
  onLockDevice,
  onUnlockDevice,
  onSyncDevice,
  onRebootDevice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'LOCKED'>('ALL');
  const [selectedClass] = useState<string>('ALL');

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.assignedStudentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ONLINE' && device.status === 'ONLINE' && !device.isLocked) ||
      (statusFilter === 'OFFLINE' && device.status === 'OFFLINE') ||
      (statusFilter === 'LOCKED' && device.isLocked);

    const matchesClass = selectedClass === 'ALL' || device.classId === selectedClass;

    return matchesSearch && matchesStatus && matchesClass;
  });

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

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-gray-50/80 p-1 rounded-xl border border-gray-100 text-xs font-semibold">
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
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  onClick={() => onOpenDeviceDetail(device)}
                >
                  {/* Device Identity */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700 font-bold shrink-0">
                        <Smartphone className="w-4 h-4" />
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
                      {new Date(device.policySyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  {/* DPC Actions */}
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1.5">
                      {device.isLocked ? (
                        <button
                          onClick={() => onUnlockDevice(device.id)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 bg-white rounded-lg border border-emerald-200 transition-all shadow-xs"
                          title="Unlock Device"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onLockDevice(device.id)}
                          className="p-1.5 text-gray-700 hover:bg-gray-100 bg-white rounded-lg border border-gray-200 transition-all shadow-xs"
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
              ))}
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
    </div>
  );
};

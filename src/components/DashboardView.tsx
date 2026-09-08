// EduGuard MDM — Enterprise Dashboard View (Clean Minimalism)

import React from 'react';
import {
  Smartphone,
  CheckCircle2,
  Lock,
  LockOpen,
  ShieldAlert,
  Radio,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  QrCode,
  BatteryCharging,
  Download,
  Key,
} from 'lucide-react';
import { DashboardStats, Device, PolicyViolation } from '../types/mdm';
import { NavSection } from './Sidebar';
import { exportDeviceCredentialsCsv } from '../utils/exportCredentialsCsv';

interface DashboardViewProps {
  stats: DashboardStats;
  devices: Device[];
  violations: PolicyViolation[];
  onSelectSection: (section: NavSection) => void;
  onOpenDeviceDetail: (device: Device) => void;
  onQuickLock: (deviceId: string) => void;
  onQuickUnlock: (deviceId: string) => void;
  pendingExitRequestsCount?: number;
  onOpenExitRequestsModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  devices,
  violations,
  onSelectSection,
  onOpenDeviceDetail,
  pendingExitRequestsCount = 0,
  onOpenExitRequestsModal,
}) => {
  const onlinePercentage = Math.round((stats.onlineDevices / (stats.totalDevices || 1)) * 100);

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">Fleet Telemetry</p>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-950">System Overview</h1>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportDeviceCredentialsCsv(devices)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Download CSV file with all workstation passwords and student credentials"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Passwords (CSV)</span>
          </button>
          {onOpenExitRequestsModal && (
            <button
              onClick={onOpenExitRequestsModal}
              className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                pendingExitRequestsCount > 0
                  ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LockOpen className="w-3.5 h-3.5" />
              <span>Exit Approvals {pendingExitRequestsCount > 0 ? `(${pendingExitRequestsCount})` : ''}</span>
            </button>
          )}
          <button
            onClick={() => onSelectSection('enrollment')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition-all flex items-center space-x-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-gray-500" />
            <span>Enrollment QR</span>
          </button>
          <button
            onClick={() => onSelectSection('applications')}
            className="px-4 py-2 bg-gray-950 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-gray-800 transition-all flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Deploy App</span>
          </button>
        </div>
      </div>

      {/* Pending Kiosk Exit Requests Banner */}
      {pendingExitRequestsCount > 0 && (
        <div className="bg-amber-50/80 p-6 rounded-3xl border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm animate-pulse">
              <LockOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-gray-950">
                  {pendingExitRequestsCount} Student Workstation Exit Request{pendingExitRequestsCount > 1 ? 's' : ''} Awaiting Approval
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  PENDING
                </span>
              </div>
              <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                Students have entered their passwords and submitted exit requests to unlock their PC kiosks.
              </p>
            </div>
          </div>
          {onOpenExitRequestsModal && (
            <button
              onClick={onOpenExitRequestsModal}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Review & Approve ({pendingExitRequestsCount})</span>
            </button>
          )}
        </div>
      )}

      {/* Critical Violation Alert */}
      {stats.policyViolationsCount.critical > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-950">
                {stats.policyViolationsCount.critical} Critical Violations Detected
              </h4>
              <p className="text-xs text-gray-400 font-medium">
                Settings tampering or unauthorized app executions require administrative review.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectSection('violations')}
            className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-all"
          >
            Review Incidents
          </button>
        </div>
      )}

      {/* Primary 5-Card Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Devices */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Fleet</span>
            <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-light text-gray-950 tracking-tight">{stats.totalDevices}</div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Enrolled
            </span>
            <span className="text-[11px] text-gray-400 font-medium">100% policy bound</span>
          </div>
        </div>

        {/* Card 2: Online Devices */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Online & Active</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-light text-gray-950 tracking-tight">{stats.onlineDevices}</div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {onlinePercentage}%
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Active telemetry</span>
          </div>
        </div>

        {/* Card 3: Offline Devices */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Offline</span>
            <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-light text-gray-950 tracking-tight">{stats.offlineDevices}</div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[10px] font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Cached
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Room policy safe</span>
          </div>
        </div>

        {/* Card 4: Locked Devices */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Locked</span>
            <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center text-gray-950">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-light text-gray-950 tracking-tight">{stats.lockedDevices}</div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[10px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
              Kiosk PIN
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Secured</span>
          </div>
        </div>

        {/* Card 5: Policy Violations */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Violations</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-light text-rose-600 tracking-tight">{stats.policyViolationsCount.total}</div>
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {stats.policyViolationsCount.critical + stats.policyViolationsCount.high} Severe
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Logged</span>
          </div>
        </div>
      </div>

      {/* Main Row: Activity Stream & Device Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Activity Feed & Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
                  Audit Stream
                </span>
                <h3 className="text-lg font-medium text-gray-950">Recent Fleet Activity</h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">Real-time journal</span>
            </div>

            <div className="space-y-5">
              {stats.recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-4">
                  <div
                    className={`w-1 h-8 rounded-full shrink-0 mt-0.5 ${
                      act.type === 'VIOLATION'
                        ? 'bg-rose-500'
                        : act.type === 'COMMAND'
                        ? 'bg-gray-950'
                        : act.type === 'DEPLOYMENT'
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{act.description}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{act.timestamp}</p>
                  </div>
                  {act.type === 'VIOLATION' && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                      Blocked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clean Administrative Actions Box */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
                Quick Actions
              </span>
              <h4 className="text-base font-medium text-gray-950">Administrative Shortcuts</h4>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Execute fleet rollouts, configure restrictions, or generate tokens.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onSelectSection('policies')}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                <span>Policies</span>
              </button>
              <button
                onClick={() => onSelectSection('devices')}
                className="px-4 py-2 bg-gray-950 text-white hover:bg-gray-800 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>View Inventory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Battery Health & Model Distribution */}
        <div className="space-y-8">
          {/* Battery Telemetry Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
              Telemetry
            </span>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-950 flex items-center space-x-2">
                <span>Battery Status</span>
              </h3>
              <span className="text-xs text-gray-400 font-medium">Live</span>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-600">Optimal (&gt; 60%)</span>
                  <span className="text-gray-950 font-semibold">{stats.batteryDistribution.good} devices</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${(stats.batteryDistribution.good / (stats.totalDevices || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-600">Moderate (20% - 60%)</span>
                  <span className="text-gray-950 font-semibold">{stats.batteryDistribution.medium} devices</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${(stats.batteryDistribution.medium / (stats.totalDevices || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-600">Low (&lt; 20%)</span>
                  <span className="text-rose-600 font-semibold">{stats.batteryDistribution.low} devices</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-1.5 rounded-full"
                    style={{ width: `${(stats.batteryDistribution.low / (stats.totalDevices || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Mix Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
              Hardware
            </span>
            <h3 className="text-lg font-medium text-gray-950 mb-5">Model Distribution</h3>
            <div className="space-y-3">
              {stats.deviceModelBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium truncate max-w-[170px]">{item.model}</span>
                  <span className="font-semibold text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                    {item.count} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Devices In Focus */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">
                  Active Units
                </span>
                <h3 className="text-lg font-medium text-gray-950">Student Tablets</h3>
              </div>
              <button
                onClick={() => onSelectSection('devices')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
              >
                <span>All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {devices.slice(0, 3).map((device) => (
                <div
                  key={device.id}
                  onClick={() => onOpenDeviceDetail(device)}
                  className="p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-gray-900 truncate">{device.name}</div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      {device.deviceId} • {device.assignedStudentName}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

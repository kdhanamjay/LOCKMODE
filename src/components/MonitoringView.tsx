// EduGuard MDM — App Usage & Screen Time Monitoring (Clean Minimalism)

import React, { useState } from 'react';
import {
  Clock,
  Download,
  Smartphone,
  Layers,
} from 'lucide-react';
import { AppUsageRecord, Device } from '../types/mdm';

interface MonitoringViewProps {
  usageRecords: AppUsageRecord[];
  devices: Device[];
}

interface AppAggregate {
  name: string;
  packageName: string;
  durationMinutes: number;
  sessionCount: number;
  devices: Set<string>;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ usageRecords, devices }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | '7days' | '30days'>('today');

  const totalMinutes = usageRecords.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalSessions = usageRecords.reduce((acc, curr) => acc + curr.sessionCount, 0);

  // Group by application
  const appAggregates: Record<string, AppAggregate> = {};
  usageRecords.forEach((curr) => {
    if (!appAggregates[curr.applicationName]) {
      appAggregates[curr.applicationName] = {
        name: curr.applicationName,
        packageName: curr.packageName,
        durationMinutes: 0,
        sessionCount: 0,
        devices: new Set<string>(),
      };
    }
    appAggregates[curr.applicationName].durationMinutes += curr.durationMinutes;
    appAggregates[curr.applicationName].sessionCount += curr.sessionCount;
    appAggregates[curr.applicationName].devices.add(curr.deviceId);
  });

  const sortedApps: AppAggregate[] = Object.values(appAggregates).sort(
    (a, b) => b.durationMinutes - a.durationMinutes
  );

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Application,Package,DurationMinutes,Sessions,Devices\n' +
      sortedApps.map((a) => `"${a.name}","${a.packageName}",${a.durationMinutes},${a.sessionCount},${a.devices.size}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eduguard_app_usage_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base text-gray-950">Application Screen Time & Learning Engagement</h3>
          <p className="text-xs text-gray-400 mt-0.5">Aggregated telemetry collected via Android UsageStatsManager API.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-100/70 p-1 rounded-xl border border-gray-100 text-xs font-semibold">
            <button
              onClick={() => setSelectedTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTimeframe === 'today' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedTimeframe('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTimeframe === '7days' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTimeframe === '30days' ? 'bg-white text-gray-950 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Learning Time</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-950 mt-3">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
          </div>
          <p className="text-xs text-gray-400 mt-1">Across all student tablets</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">App Launch Sessions</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Layers className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-950 mt-3">{totalSessions.toLocaleString()}</div>
          <p className="text-xs text-gray-400 mt-1">Individual educational app sessions</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Devices</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-950 mt-3">{devices.length} Units</div>
          <p className="text-xs text-gray-400 mt-1">Reporting telemetry today</p>
        </div>
      </div>

      {/* App Usage Ranked Breakdown */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center text-xs">
          <span className="font-semibold text-gray-950">Application Screen-Time Leaderboard</span>
          <span className="text-gray-400 text-xs">Sorted by total student engagement</span>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          {sortedApps.map((app, idx) => {
            const percentage = Math.round((app.durationMinutes / (totalMinutes || 1)) * 100);
            return (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center space-x-3 w-1/3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-xs text-gray-700">
                    {idx + 1}
                  </div>
                  <div className="truncate">
                    <h4 className="font-semibold text-gray-950 truncate">{app.name}</h4>
                    <span className="font-mono text-[10px] text-gray-400 truncate block">{app.packageName}</span>
                  </div>
                </div>

                <div className="flex-1 px-6">
                  <div className="flex justify-between text-[11px] mb-1.5 font-medium text-gray-500">
                    <span>{app.sessionCount} Sessions</span>
                    <span>{percentage}% of fleet time</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gray-950 h-1.5 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>

                <div className="text-right w-32">
                  <div className="font-bold text-gray-950 text-sm">
                    {Math.floor(app.durationMinutes / 60)}h {app.durationMinutes % 60}m
                  </div>
                  <span className="text-[11px] text-gray-400">{app.devices.size} devices active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

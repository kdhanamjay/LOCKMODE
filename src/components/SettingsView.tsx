// EduGuard MDM — System Settings & Data Retention Lifecycles (Clean Minimalism)

import React, { useState } from 'react';
import { Save, Clock, Database } from 'lucide-react';
import { SystemRetentionSettings } from '../types/mdm';

interface SettingsViewProps {
  settings: SystemRetentionSettings;
  onUpdateSettings: (settings: Partial<SystemRetentionSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [heartbeatDays, setHeartbeatDays] = useState(settings.heartbeatLogsDays || 30);
  const [usageDays, setUsageDays] = useState(settings.appUsageDays || 90);
  const [violationsDays, setViolationsDays] = useState(settings.violationsDays || 180);
  const [auditDays, setAuditDays] = useState(settings.auditLogsDays || 365);
  const [offlineThresholdMin, setOfflineThresholdMin] = useState(settings.offlineThresholdMinutes || 15);
  const [autoLockOnTamper, setAutoLockOnTamper] = useState(settings.autoLockOnTamper ?? true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      heartbeatLogsDays: heartbeatDays,
      appUsageDays: usageDays,
      violationsDays: violationsDays,
      auditLogsDays: auditDays,
      offlineThresholdMinutes: offlineThresholdMin,
      autoLockOnTamper: autoLockOnTamper,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base text-gray-950">Telemetry Lifecycles & Retention Management</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure automated purge intervals and offline device state timeouts compliant with school data privacy standards.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Saved Successfully!' : 'Save Retention Policies'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Retention Sliders Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-900" />
            <span>Automated Telemetry Purge Intervals</span>
          </h4>

          <div className="space-y-6 text-xs">
            {/* Heartbeat Telemetry */}
            <div className="space-y-2">
              <div className="flex justify-between font-normal">
                <span className="text-gray-950 font-medium">Device Heartbeat Logs (Battery, Wi-Fi, Current App)</span>
                <span className="font-semibold text-gray-950">{heartbeatDays} Days</span>
              </div>
              <input
                type="range"
                min="7"
                max="90"
                step="1"
                value={heartbeatDays}
                onChange={(e) => setHeartbeatDays(Number(e.target.value))}
                className="w-full accent-gray-950"
              />
              <p className="text-[11px] text-gray-400">High frequency pings purged automatically after expiration.</p>
            </div>

            {/* App Usage */}
            <div className="space-y-2">
              <div className="flex justify-between font-normal">
                <span className="text-gray-950 font-medium">App Screen Time & Engagement Analytics</span>
                <span className="font-semibold text-gray-950">{usageDays} Days</span>
              </div>
              <input
                type="range"
                min="30"
                max="365"
                step="15"
                value={usageDays}
                onChange={(e) => setUsageDays(Number(e.target.value))}
                className="w-full accent-gray-950"
              />
            </div>

            {/* Policy Violations */}
            <div className="space-y-2">
              <div className="flex justify-between font-normal">
                <span className="text-gray-950 font-medium">Security Violations & Tamper Events</span>
                <span className="font-semibold text-gray-950">{violationsDays} Days</span>
              </div>
              <input
                type="range"
                min="60"
                max="730"
                step="30"
                value={violationsDays}
                onChange={(e) => setViolationsDays(Number(e.target.value))}
                className="w-full accent-gray-950"
              />
            </div>

            {/* Audit Logs */}
            <div className="space-y-2">
              <div className="flex justify-between font-normal">
                <span className="text-gray-950 font-medium">Administrative Audit Trail (Immutable)</span>
                <span className="font-semibold text-gray-950">{auditDays} Days</span>
              </div>
              <input
                type="range"
                min="180"
                max="1095"
                step="60"
                value={auditDays}
                onChange={(e) => setAuditDays(Number(e.target.value))}
                className="w-full accent-gray-950"
              />
            </div>
          </div>
        </div>

        {/* Security & Offline Thresholds Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-900" />
            <span>Offline Thresholds & Automated Controls</span>
          </h4>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">
                Offline Detection Threshold (Minutes without Heartbeat)
              </label>
              <input
                type="number"
                min="2"
                max="120"
                value={offlineThresholdMin}
                onChange={(e) => setOfflineThresholdMin(Number(e.target.value))}
                className="w-48 p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Device marked as OFFLINE in console if no ping received within this window.
              </p>
            </div>

            <label className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100/60 max-w-md transition-colors">
              <div>
                <span className="font-semibold text-gray-950 block">Automatic Lock on Tamper Detection</span>
                <span className="text-[11px] text-gray-400">
                  Immediately locks device if root or safe-boot bypass is detected
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoLockOnTamper}
                onChange={(e) => setAutoLockOnTamper(e.target.checked)}
                className="w-4 h-4 text-gray-950 rounded accent-gray-950"
              />
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

// EduGuard MDM — Policy & Kiosk Engine Configurator (Clean Minimalism)

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  PhoneOff,
  MessageSquareOff,
  CameraOff,
  Save,
} from 'lucide-react';
import { DevicePolicy, KioskMode } from '../types/mdm';

interface PoliciesViewProps {
  policies: DevicePolicy[];
  onPublishPolicy: (policyId: string, payload?: { restrictions?: any; kioskMode?: any }) => void;
  onCreatePolicy: (policy: Partial<DevicePolicy>) => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  onPublishPolicy,
}) => {
  const [selectedPolicy, setSelectedPolicy] = useState<DevicePolicy>(policies[0] || ({} as DevicePolicy));
  const [isPublishing, setIsPublishing] = useState(false);

  // Editable local state
  const [kioskMode, setKioskMode] = useState<KioskMode>(selectedPolicy.kioskMode || 'FULL_LOCKDOWN');
  const [disableCalls, setDisableCalls] = useState(selectedPolicy.restrictions?.disableCalls ?? true);
  const [disableSms, setDisableSms] = useState(selectedPolicy.restrictions?.disableSms ?? true);
  const [disableCamera, setDisableCamera] = useState(selectedPolicy.restrictions?.disableCamera ?? false);
  const [disableMicrophone, setDisableMicrophone] = useState(selectedPolicy.restrictions?.disableMicrophone ?? false);
  const [disableScreenCapture, setDisableScreenCapture] = useState(selectedPolicy.restrictions?.disableScreenCapture ?? false);
  const [disableUsb, setDisableUsb] = useState(selectedPolicy.restrictions?.disableUsbFileTransfer ?? true);
  const [disableBluetooth, setDisableBluetooth] = useState(selectedPolicy.restrictions?.disableBluetooth ?? false);
  const [disableFactoryReset, setDisableFactoryReset] = useState(selectedPolicy.restrictions?.disableFactoryReset ?? true);
  const [disableSafeBoot, setDisableSafeBoot] = useState(selectedPolicy.restrictions?.disableSafeBoot ?? true);
  const [disableStatusBar, setDisableStatusBar] = useState(selectedPolicy.restrictions?.disableStatusBar ?? true);

  // Sync state when selectedPolicy changes
  useEffect(() => {
    if (selectedPolicy) {
      setKioskMode(selectedPolicy.kioskMode || 'FULL_LOCKDOWN');
      setDisableCalls(selectedPolicy.restrictions?.disableCalls ?? true);
      setDisableSms(selectedPolicy.restrictions?.disableSms ?? true);
      setDisableCamera(selectedPolicy.restrictions?.disableCamera ?? false);
      setDisableMicrophone(selectedPolicy.restrictions?.disableMicrophone ?? false);
      setDisableScreenCapture(selectedPolicy.restrictions?.disableScreenCapture ?? false);
      setDisableUsb(selectedPolicy.restrictions?.disableUsbFileTransfer ?? true);
      setDisableBluetooth(selectedPolicy.restrictions?.disableBluetooth ?? false);
      setDisableFactoryReset(selectedPolicy.restrictions?.disableFactoryReset ?? true);
      setDisableSafeBoot(selectedPolicy.restrictions?.disableSafeBoot ?? true);
      setDisableStatusBar(selectedPolicy.restrictions?.disableStatusBar ?? true);
    }
  }, [selectedPolicy]);

  const handlePublish = () => {
    setIsPublishing(true);
    const updatedRestrictions = {
      ...(selectedPolicy.restrictions || {}),
      disableCalls,
      disableSms,
      disableCamera,
      disableMicrophone,
      disableScreenCapture,
      disableUsbFileTransfer: disableUsb,
      disableBluetooth,
      disableFactoryReset,
      disableSafeBoot,
      disableStatusBar,
    };

    onPublishPolicy(selectedPolicy.id, {
      kioskMode,
      restrictions: updatedRestrictions,
    });

    setTimeout(() => {
      setIsPublishing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
              POLICY VERSIONING
            </span>
            <span className="text-xs text-gray-400 font-mono">Current: v{selectedPolicy.version}</span>
          </div>
          <h3 className="font-semibold text-base text-gray-950 mt-1">{selectedPolicy.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{selectedPolicy.description}</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>{isPublishing ? 'Signing & Publishing...' : `Publish Policy v${selectedPolicy.version + 1}`}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Policy Selector & Kiosk Mode */}
        <div className="space-y-6">
          {/* Policy Profiles List */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-3">Policy Profiles</h4>
            <div className="space-y-2">
              {policies.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPolicy(p)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                    selectedPolicy.id === p.id
                      ? 'bg-gray-950 text-white border-gray-950 shadow-xs'
                      : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold truncate">{p.name}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        selectedPolicy.id === p.id ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      v{p.version}
                    </span>
                  </div>
                  <div className={`text-[11px] mt-1 ${selectedPolicy.id === p.id ? 'text-gray-400' : 'text-gray-400'}`}>
                    Mode: {p.kioskMode}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kiosk Mode Selector */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Kiosk Lockdown Mode</h4>
            <div className="space-y-2.5 text-xs">
              <label
                onClick={() => setKioskMode('FULL_LOCKDOWN')}
                className={`p-3.5 rounded-2xl border flex items-start space-x-3 cursor-pointer transition-all ${
                  kioskMode === 'FULL_LOCKDOWN'
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'border-gray-100 hover:bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  checked={kioskMode === 'FULL_LOCKDOWN'}
                  onChange={() => {}}
                  className="mt-0.5 text-gray-950 accent-gray-950"
                />
                <div>
                  <span className="font-semibold text-gray-950 block">Mode 1: Full Lockdown</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block leading-relaxed">
                    Pins device in LockTask mode. Only approved school apps are displayed. Home, Recents, and standard Phone/Dialer disabled.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setKioskMode('LIMITED_LOCKDOWN')}
                className={`p-3.5 rounded-2xl border flex items-start space-x-3 cursor-pointer transition-all ${
                  kioskMode === 'LIMITED_LOCKDOWN'
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'border-gray-100 hover:bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  checked={kioskMode === 'LIMITED_LOCKDOWN'}
                  onChange={() => {}}
                  className="mt-0.5 text-gray-950 accent-gray-950"
                />
                <div>
                  <span className="font-semibold text-gray-950 block">Mode 2: Limited Lockdown</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block leading-relaxed">
                    Approved apps plus selected standard system settings (Wi-Fi selector, display brightness).
                  </span>
                </div>
              </label>

              <label
                onClick={() => setKioskMode('CUSTOM')}
                className={`p-3.5 rounded-2xl border flex items-start space-x-3 cursor-pointer transition-all ${
                  kioskMode === 'CUSTOM'
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'border-gray-100 hover:bg-gray-50/50'
                }`}
              >
                <input
                  type="radio"
                  checked={kioskMode === 'CUSTOM'}
                  onChange={() => {}}
                  className="mt-0.5 text-gray-950 accent-gray-950"
                />
                <div>
                  <span className="font-semibold text-gray-950 block">Mode 3: Custom Profile</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block leading-relaxed">
                    Custom granular permission parameters tuned per department or grade level.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Hardware Restrictions & Allowlisted Apps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hardware & Security Restrictions Checklist */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              <span>Device Owner Hardware & Telephony Restrictions</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Disable Calls */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <PhoneOff className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-semibold text-gray-950 block">Disable Phone Calls (Telephony)</span>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Android DISALLOW_OUTGOING_CALLS; blocks dialer & voice calls
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={disableCalls}
                  onChange={(e) => setDisableCalls(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>

              {/* Disable SMS */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <MessageSquareOff className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-semibold text-gray-950 block">Disable SMS Messaging</span>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Android DISALLOW_SMS; blocks cellular text messages & MMS
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={disableSms}
                  onChange={(e) => setDisableSms(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>

              {/* Disable USB */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 block">Disable USB File Transfer</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Prevents MTP data extraction & ADB side-channel</span>
                </div>
                <input
                  type="checkbox"
                  checked={disableUsb}
                  onChange={(e) => setDisableUsb(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>

              {/* Disable Factory Reset */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 block">Disable Factory Reset</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Blocks student factory wipe in settings</span>
                </div>
                <input
                  type="checkbox"
                  checked={disableFactoryReset}
                  onChange={(e) => setDisableFactoryReset(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>

              {/* Disable Safe Boot */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 block">Disable Safe Boot</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Prevents bypassing DPC agent via safe mode</span>
                </div>
                <input
                  type="checkbox"
                  checked={disableSafeBoot}
                  onChange={(e) => setDisableSafeBoot(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>

              {/* Lock Status Bar */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 block">Lock Status Bar / Notifications</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Disables top notification pull-down shade</span>
                </div>
                <input
                  type="checkbox"
                  checked={disableStatusBar}
                  onChange={(e) => setDisableStatusBar(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>

              {/* Disable Camera */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 block">Disable Hardware Camera</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Disables camera hardware during exam mode</span>
                </div>
                <input
                  type="checkbox"
                  checked={disableCamera}
                  onChange={(e) => setDisableCamera(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>

              {/* Disable Bluetooth */}
              <label className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <span className="font-semibold text-gray-950 block">Disable Bluetooth</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Blocks untracked file transfers via Bluetooth</span>
                </div>
                <input
                  type="checkbox"
                  checked={disableBluetooth}
                  onChange={(e) => setDisableBluetooth(e.target.checked)}
                  className="w-4 h-4 text-gray-950 accent-gray-950 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Allowlisted Application Rules */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-xs text-gray-950">Application Allowlist Mode</h4>
                <p className="text-xs text-gray-400 mt-0.5">Strict Allowlist blocks everything by default except approved packages.</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider rounded-full">
                STRICT ALLOWLIST ENFORCED
              </span>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden text-xs">
              {selectedPolicy.allowedApplications?.map((pkg, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50/50">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="font-mono text-gray-900">{pkg}</span>
                  </div>
                  <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    APPROVED
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

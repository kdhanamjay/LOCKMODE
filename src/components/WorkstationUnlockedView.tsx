import React, { useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Monitor, LogOut, LockOpen } from 'lucide-react';

interface WorkstationUnlockedViewProps {
  deviceId?: string;
  studentName?: string;
  studentRoll?: string;
  unlockReason?: string;
  onReopenKiosk?: () => void;
}

export const WorkstationUnlockedView: React.FC<WorkstationUnlockedViewProps> = ({
  deviceId,
  studentName,
  studentRoll,
  unlockReason,
  onReopenKiosk,
}) => {
  // Attempt to automatically close the browser tab/window on mount
  useEffect(() => {
    const tryClose = () => {
      try {
        window.open('', '_self', '');
        window.close();
      } catch (e) {}
      try {
        window.close();
      } catch (e) {}
    };

    // First attempt immediately
    tryClose();

    // Second attempt after brief delay
    const t = setTimeout(tryClose, 1200);
    return () => clearTimeout(t);
  }, []);

  const handleManualClose = () => {
    try {
      window.open('', '_self', '');
      window.close();
    } catch (e) {}
    try {
      window.close();
    } catch (e) {}
  };

  const detectedId = deviceId || (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('device_id') || 'WIN-STATION';
  })();

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl shadow-emerald-950/40 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Success Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
            <LockOpen className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kiosk Exit Approved</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Workstation Unlocked</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The administrator has approved your exit request. All kiosk restrictions have been removed, and full access to your Windows desktop and applications has been restored.
          </p>
          {unlockReason && (
            <div className="mt-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-emerald-300/90">
              &ldquo;{unlockReason}&rdquo;
            </div>
          )}
        </div>

        {/* Station Details */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-left space-y-2 text-xs text-slate-400">
          <div className="flex justify-between items-center">
            <span className="flex items-center space-x-1.5">
              <Monitor className="w-3.5 h-3.5 text-slate-500" />
              <span>Workstation:</span>
            </span>
            <span className="font-mono font-bold text-slate-200">{detectedId}</span>
          </div>
          {(studentName || studentRoll) && (
            <div className="flex justify-between items-center">
              <span>Candidate:</span>
              <span className="font-medium text-slate-200">{studentName || 'Student'} ({studentRoll || 'PC-01'})</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span>Desktop Status:</span>
            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Standard Desktop Active</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          <button
            onClick={handleManualClose}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Close Kiosk Window (Alt+F4)</span>
          </button>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            If this window does not close automatically due to browser settings, you may press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Alt + F4</kbd> or switch to your desktop using <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Windows Key</kbd>.
          </p>

          {onReopenKiosk && (
            <button
              onClick={onReopenKiosk}
              className="text-xs text-slate-500 hover:text-slate-400 underline underline-offset-4 transition-colors cursor-pointer pt-1"
            >
              Re-enter Student Kiosk Workspace
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

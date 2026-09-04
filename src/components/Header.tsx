// EduGuard MDM — Enterprise Top Navigation Header (Clean Minimalism)

import React from 'react';
import { Radio, Bell, Tablet, Monitor, RefreshCw, LogOut, ExternalLink } from 'lucide-react';
import { NavSection } from './Sidebar';
import { AdminUser } from '../types/mdm';

interface HeaderProps {
  currentSection: NavSection;
  currentUser: AdminUser;
  onlineCount: number;
  totalCount: number;
  isSimulatorOpen: boolean;
  onToggleSimulator: () => void;
  onLaunchStudentWorkspace?: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  sseConnected: boolean;
  criticalViolationsCount: number;
  onSelectSection: (section: NavSection) => void;
  onLogout?: () => void;
}

const sectionTitles: Record<NavSection, { title: string; subtitle: string }> = {
  dashboard: { title: 'Fleet Overview', subtitle: 'Real-time telemetry and operational metrics across student hardware' },
  devices: { title: 'Managed Devices', subtitle: 'Central hardware inventory, battery health, and remote DPC actions' },
  study_materials: { title: 'Study Notes & PDFs', subtitle: 'Upload and distribute class-wise subject study materials and notes' },
  announcements: { title: 'Broadcast Notices', subtitle: 'Push real-time announcements, urgent exam instructions, and alerts to student tablets' },
  policies: { title: 'Policy Engine', subtitle: 'Immutable kiosk lockdown profiles and hardware security restrictions' },
  applications: { title: 'App Management', subtitle: 'Enterprise APK rollouts, Play Store catalog, and package deployments' },
  web_filter: { title: 'Web Filtering', subtitle: 'Local DNS sinkhole rules and safe browsing domain policies' },
  monitoring: { title: 'Usage & Analytics', subtitle: 'Student screen time metrics, active learning apps, and compliance logs' },
  violations: { title: 'Security Violations', subtitle: 'Tamper alerts, unauthorized app attempts, and access intercepts' },
  enrollment: { title: 'Device Enrollment', subtitle: 'Android Enterprise Zero-Touch QR payload and token generator' },
  schools_classes: { title: 'Schools & Campuses', subtitle: 'Educational organization structure and student tablet allocations' },
  audit_logs: { title: 'Audit Trail', subtitle: 'Tamper-evident logs of administrative actions and fleet changes' },
  settings: { title: 'Retention Settings', subtitle: 'Configure telemetry lifecycles, offline timers, and security thresholds' },
  simulator: { title: 'Student DPC Simulator', subtitle: 'Virtual Android tablet sandbox for live policy testing' },
};

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  currentUser,
  onlineCount,
  totalCount,
  isSimulatorOpen,
  onToggleSimulator,
  onLaunchStudentWorkspace,
  onRefreshData,
  isRefreshing,
  sseConnected,
  criticalViolationsCount,
  onSelectSection,
  onLogout,
}) => {
  const currentInfo = sectionTitles[currentSection] || { title: 'Management Console', subtitle: 'EduGuard MDM' };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0 select-none z-10">
      {/* Left Title & Breadcrumbs */}
      <div>
        <div className="flex items-center space-x-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-950 leading-none">
            {currentInfo.title}
          </h2>
          <div className="h-3 w-[1px] bg-gray-200" />
          <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 uppercase tracking-wider">
            {currentUser.schoolName}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 font-medium mt-1 leading-none">{currentInfo.subtitle}</p>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-3">
        {/* Real-time Connection Indicator */}
        <div
          className={`flex items-center space-x-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            sseConnected
              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100'
              : 'bg-amber-50/80 text-amber-700 border-amber-100'
          }`}
          title={sseConnected ? 'Real-time WebSocket/SSE channel active' : 'Connecting to real-time telemetry channel'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{sseConnected ? 'LIVE STREAM' : 'SYNCING'}</span>
        </div>

        {/* Fleet Online Ratio */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-gray-500 bg-gray-50/80 border border-gray-100 px-3 py-1.5 rounded-xl font-medium">
          <span className="font-semibold text-gray-900">{onlineCount}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400">{totalCount} Live</span>
        </div>

        <div className="h-6 w-[1px] bg-gray-100 mx-1 hidden sm:block" />

        {/* Refresh Button */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="p-2 text-gray-500 hover:text-gray-950 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all shadow-xs"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Security Incident Bell */}
        <button
          onClick={() => onSelectSection('violations')}
          className="relative p-2 text-gray-500 hover:text-gray-950 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all shadow-xs"
          title="Security Incidents"
        >
          <Bell className="w-3.5 h-3.5" />
          {criticalViolationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-bounce">
              {criticalViolationsCount}
            </span>
          )}
        </button>

        {/* Live Interactive Student Workspace Launcher (PC & Tablet) */}
        {onLaunchStudentWorkspace && (
          <button
            onClick={onLaunchStudentWorkspace}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-all"
            title="Launch Fullscreen Student Kiosk on this PC or Tablet"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Student PC / Kiosk</span>
          </button>
        )}

        {/* Live Interactive Student Tablet Sandbox */}
        <button
          onClick={onToggleSimulator}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
            isSimulatorOpen
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-950 text-white hover:bg-gray-800'
          }`}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span>{isSimulatorOpen ? 'Close Sandbox' : 'Tab Sandbox'}</span>
        </button>

        {/* Quick Log Out Action */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-gray-200 transition-all shadow-xs"
            title="Log Out of Console"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};

// EduGuard MDM — Enterprise Navigation Sidebar (Clean Minimalism)

import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  ShieldAlert,
  Globe,
  Layers,
  BarChart3,
  QrCode,
  Building2,
  History,
  Settings,
  ShieldCheck,
  Tablet,
  LogOut,
  Megaphone,
  BookOpen,
  LockOpen,
} from 'lucide-react';
import { AdminUser } from '../types/mdm';

export type NavSection =
  | 'dashboard'
  | 'devices'
  | 'study_materials'
  | 'announcements'
  | 'policies'
  | 'applications'
  | 'web_filter'
  | 'monitoring'
  | 'violations'
  | 'enrollment'
  | 'schools_classes'
  | 'audit_logs'
  | 'settings'
  | 'simulator';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser: AdminUser;
  onlineCount: number;
  lockedCount: number;
  violationCount: number;
  materialsCount?: number;
  isSimulatorOpen: boolean;
  onToggleSimulator: () => void;
  onLaunchStudentWorkspace?: () => void;
  onLogout?: () => void;
  pendingExitRequestsCount?: number;
  onOpenExitRequestsModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  currentUser,
  onlineCount,
  lockedCount,
  violationCount,
  materialsCount,
  isSimulatorOpen,
  onToggleSimulator,
  onLaunchStudentWorkspace,
  onLogout,
  pendingExitRequestsCount = 0,
  onOpenExitRequestsModal,
}) => {
  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'devices' as NavSection,
      label: 'Devices Inventory',
      icon: Smartphone,
      badge: onlineCount ? `${onlineCount} Live` : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-100/60',
    },
    {
      id: 'study_materials' as NavSection,
      label: 'Study Notes & PDFs',
      icon: BookOpen,
      badge: materialsCount ? `${materialsCount}` : undefined,
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-100/60 font-semibold',
    },
    { id: 'announcements' as NavSection, label: 'Broadcast Notices', icon: Megaphone },
    { id: 'policies' as NavSection, label: 'Policy & Kiosk Engine', icon: ShieldCheck },
    { id: 'applications' as NavSection, label: 'App Management', icon: Layers },
    { id: 'web_filter' as NavSection, label: 'Web & Safe Browsing', icon: Globe },
    { id: 'monitoring' as NavSection, label: 'Usage & Analytics', icon: BarChart3 },
    {
      id: 'violations' as NavSection,
      label: 'Security Violations',
      icon: ShieldAlert,
      badge: violationCount > 0 ? `${violationCount}` : undefined,
      badgeColor: 'bg-rose-50 text-rose-600 border border-rose-100 font-bold',
    },
    { id: 'enrollment' as NavSection, label: 'Enrollment (QR & PC)', icon: QrCode },
    { id: 'schools_classes' as NavSection, label: 'Schools & Students', icon: Building2 },
    { id: 'audit_logs' as NavSection, label: 'Audit Trail', icon: History },
    { id: 'settings' as NavSection, label: 'Retention & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white text-gray-700 flex flex-col h-screen border-r border-gray-100 select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gray-950 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-950 text-sm tracking-tighter leading-none">EDUGUARD</h1>
            <p className="text-[10px] text-gray-400 mt-1 font-medium tracking-wide uppercase">Android DPC</p>
          </div>
        </div>
        <span className="text-[9px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-100/60 uppercase tracking-wider">
          PROD
        </span>
      </div>

      {/* Organization Tenant Card */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/40">
        <div className="p-3 bg-white rounded-2xl border border-gray-100/80 shadow-xs">
          <span className="text-gray-400 block text-[9px] uppercase tracking-widest font-bold mb-0.5">
            Active Tenant
          </span>
          <span className="text-gray-900 font-semibold text-xs truncate block">{currentUser.schoolName}</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">
          Management
        </div>

        {onOpenExitRequestsModal && (
          <button
            onClick={onOpenExitRequestsModal}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all mb-1 cursor-pointer ${
              pendingExitRequestsCount > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold shadow-xs'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <LockOpen className={`w-4 h-4 ${pendingExitRequestsCount > 0 ? 'text-amber-600 animate-pulse' : 'text-gray-400'}`} />
              <span className="truncate">Exit Approvals</span>
            </div>
            {pendingExitRequestsCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500 text-white animate-pulse">
                {pendingExitRequestsCount} PENDING
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                Active
              </span>
            )}
          </button>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gray-950 text-white shadow-sm shadow-gray-200 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Student DPC Simulator Tile */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <button
          onClick={onToggleSimulator}
          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
            isSimulatorOpen
              ? 'bg-gray-950 border-gray-900 text-white shadow-sm shadow-gray-300'
              : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-xs'
          }`}
        >
          <div className="flex items-center space-x-2.5 text-left">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                isSimulatorOpen ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-tight">Student Simulator</div>
              <div className={`text-[9px] ${isSimulatorOpen ? 'text-gray-300' : 'text-gray-400'}`}>
                Virtual Android Tablet
              </div>
            </div>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              isSimulatorOpen ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'
            }`}
          />
        </button>
      </div>

      {/* Admin User Profile & Logout */}
      <div className="p-3.5 border-t border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
            {currentUser?.name
              ? currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
              : 'AD'}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-gray-900 truncate leading-tight">{currentUser?.name || 'Admin'}</div>
            <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
              {currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'ADMIN'}
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Log Out of Admin Console"
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

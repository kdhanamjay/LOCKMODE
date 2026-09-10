// EduGuard MDM — Application Management & Rollout Console
// Features dedicated "Show Applications" for locally installed PC software
// (Python IDLE, Microsoft Word, Excel, PowerPoint, VS Code, Notepad)
// with granular student login approval selection.

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Send,
  Laptop,
  CheckCircle2,
  XCircle,
  Play,
  CheckSquare,
  Square,
  ShieldCheck,
  Terminal,
  FileCode,
  FileText,
  Table,
  Presentation,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Application, Deployment, SchoolClass } from '../types/mdm';
import { SoftwarePracticeWorkspace } from './SoftwarePracticeWorkspace';

interface ApplicationsViewProps {
  applications: Application[];
  deployments: Deployment[];
  classes: SchoolClass[];
  onDeployApp: (appId: string, target: { targetType: string; targetId: string; targetName: string }) => void;
  onCreateApp: (app: Partial<Application>) => void;
  onToggleStudentAccess?: (appId: string, enabled?: boolean) => void;
  onBulkUpdateStudentAccess?: (appIds: string[], enabled: boolean) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  classes,
  onDeployApp,
  onCreateApp,
  onToggleStudentAccess,
  onBulkUpdateStudentAccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCatalogView, setActiveCatalogView] = useState<'PC_INSTALLED' | 'ALL_CATALOG'>('PC_INSTALLED');
  const [selectedAppForDeploy, setSelectedAppForDeploy] = useState<Application | null>(null);
  const [targetType, setTargetType] = useState<'CLASS' | 'ALL_DEVICES'>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-12-a');
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewApp, setPreviewApp] = useState<Application | null>(null);

  // New app form state
  const [newAppName, setNewAppName] = useState('');
  const [newPkgName, setNewPkgName] = useState('');
  const [newVersion, setNewVersion] = useState('1.0.0');
  const [newCategory, setNewCategory] = useState<'EDUCATION' | 'PRODUCTIVITY' | 'UTILITY'>('EDUCATION');
  const [newExePath, setNewExePath] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isDesktopType, setIsDesktopType] = useState(true);

  // Filter for PC installed applications
  const pcApps = applications.filter(
    (app) =>
      app.distributionType === 'WINDOWS_EXE' ||
      app.isDesktopApp ||
      app.packageName.includes('idle') ||
      app.packageName.includes('office') ||
      app.packageName.includes('vscode') ||
      app.packageName.includes('notepad') ||
      app.packageName.includes('calculator')
  );

  const displayedApps = (activeCatalogView === 'PC_INSTALLED' ? pcApps : applications).filter(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.exePath && app.exePath.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const studentApprovedCount = pcApps.filter((a) => a.isApprovedForStudent !== false && a.isApproved).length;

  const handleExecuteDeployment = () => {
    if (!selectedAppForDeploy) return;
    const targetClass = classes.find((c) => c.id === selectedClassId);
    onDeployApp(selectedAppForDeploy.id, {
      targetType: targetType,
      targetId: targetType === 'CLASS' ? selectedClassId : 'all',
      targetName: targetType === 'CLASS' ? targetClass?.name || 'Class XII-A' : 'All School Devices',
    });
    setSelectedAppForDeploy(null);
  };

  const handleCreateNewApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName) return;

    onCreateApp({
      name: newAppName,
      packageName: newPkgName || `com.workstation.${newAppName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      version: newVersion,
      category: newCategory,
      isApproved: true,
      isApprovedForStudent: true,
      isDesktopApp: isDesktopType,
      exePath: newExePath || `${newAppName.toLowerCase().replace(/[^a-z0-9]/g, '')}.exe`,
      description: newDescription || `Host PC application for student practical sessions.`,
      distributionType: isDesktopType ? 'WINDOWS_EXE' : 'PRIVATE_ENTERPRISE_APK',
    });

    setShowAddModal(false);
    setNewAppName('');
    setNewPkgName('');
    setNewExePath('');
    setNewDescription('');
  };

  const handleSelectAllForStudent = () => {
    if (onBulkUpdateStudentAccess) {
      const ids = pcApps.map((a) => a.id);
      onBulkUpdateStudentAccess(ids, true);
    } else if (onToggleStudentAccess) {
      pcApps.forEach((a) => {
        if (!a.isApprovedForStudent) onToggleStudentAccess(a.id, true);
      });
    }
  };

  const handleSelectOfficeAndPython = () => {
    const targetIds = pcApps
      .filter(
        (a) =>
          a.packageName.includes('python') ||
          a.packageName.includes('office') ||
          a.name.toLowerCase().includes('python') ||
          a.name.toLowerCase().includes('word') ||
          a.name.toLowerCase().includes('excel') ||
          a.name.toLowerCase().includes('powerpoint')
      )
      .map((a) => a.id);

    if (onBulkUpdateStudentAccess) {
      onBulkUpdateStudentAccess(targetIds, true);
    } else if (onToggleStudentAccess) {
      targetIds.forEach((id) => onToggleStudentAccess(id, true));
    }
  };

  const handleClearAllStudentAccess = () => {
    if (onBulkUpdateStudentAccess) {
      const ids = pcApps.map((a) => a.id);
      onBulkUpdateStudentAccess(ids, false);
    } else if (onToggleStudentAccess) {
      pcApps.forEach((a) => {
        if (a.isApprovedForStudent) onToggleStudentAccess(a.id, false);
      });
    }
  };

  const getAppIcon = (app: Application) => {
    const pkg = app.packageName.toLowerCase();
    const name = app.name.toLowerCase();
    if (pkg.includes('python') || name.includes('python')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-bold">
          🐍
        </div>
      );
    }
    if (pkg.includes('word') || name.includes('word')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center text-xl font-bold">
          📄
        </div>
      );
    }
    if (pkg.includes('excel') || name.includes('excel')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl font-bold">
          📊
        </div>
      );
    }
    if (pkg.includes('powerpoint') || name.includes('powerpoint')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-xl font-bold">
          📽️
        </div>
      );
    }
    if (pkg.includes('vscode') || name.includes('code')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center text-xl font-bold">
          💻
        </div>
      );
    }
    if (pkg.includes('notepad') || name.includes('notepad')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-gray-500/10 border border-gray-500/20 text-gray-400 flex items-center justify-center text-xl font-bold">
          📝
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-bold text-gray-700">
        📦
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & "Show Applications" Action Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-base text-gray-950">Application Management & Workstation Access</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              PC & Kiosk Controller
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Configure locally installed PC software (Python IDLE, MS Office) and manage student workstation visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary "Show Applications" Button Requested by User */}
          <button
            onClick={() => setActiveCatalogView(activeCatalogView === 'PC_INSTALLED' ? 'ALL_CATALOG' : 'PC_INSTALLED')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-all cursor-pointer ${
              activeCatalogView === 'PC_INSTALLED'
                ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-600/30'
                : 'bg-gray-950 hover:bg-gray-800 text-white'
            }`}
          >
            <Laptop className="w-4 h-4 text-white" />
            <span>{activeCatalogView === 'PC_INSTALLED' ? 'Showing PC Applications (Active)' : 'Show Applications'}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 font-mono">
              {pcApps.length}
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gray-600" />
            <span>Add PC Software (.exe)</span>
          </button>
        </div>
      </div>

      {/* Catalog Mode Selector & Quick Batch Actions Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle Tabs */}
        <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 text-xs font-semibold">
          <button
            onClick={() => setActiveCatalogView('PC_INSTALLED')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
              activeCatalogView === 'PC_INSTALLED'
                ? 'bg-white text-gray-950 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-blue-600" />
            <span>PC Installed Softwares ({pcApps.length})</span>
          </button>

          <button
            onClick={() => setActiveCatalogView('ALL_CATALOG')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
              activeCatalogView === 'ALL_CATALOG'
                ? 'bg-white text-gray-950 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            <span>All MDM Packages ({applications.length})</span>
          </button>
        </div>

        {/* Batch Quick Controls for Student Login */}
        {activeCatalogView === 'PC_INSTALLED' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-gray-500 font-medium mr-1">
              Permitted for Student:{' '}
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {studentApprovedCount} of {pcApps.length} Enabled
              </span>
            </span>

            <button
              onClick={handleSelectOfficeAndPython}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              title="Allow Python IDLE, Word, Excel, and PowerPoint on student login"
            >
              <Sparkles className="w-3 h-3" />
              <span>Allow Python & Office</span>
            </button>

            <button
              onClick={handleSelectAllForStudent}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Allow All</span>
            </button>

            <button
              onClick={handleClearAllStudentAccess}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Square className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeCatalogView === 'PC_INSTALLED'
                ? 'Search PC apps (e.g. Python, Word, Excel, PowerPoint)...'
                : 'Search all applications by name or package...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 transition-all"
          />
        </div>

        <div className="text-xs font-medium text-gray-400">
          Showing <span className="font-semibold text-gray-950">{displayedApps.length}</span> applications
        </div>
      </div>

      {/* Applications Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedApps.map((app) => {
          const isPermittedForStudent = app.isApprovedForStudent !== false && app.isApproved;

          return (
            <div
              key={app.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
                isPermittedForStudent
                  ? 'border-blue-200/80 shadow-blue-500/5 ring-1 ring-blue-500/20'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  {getAppIcon(app)}

                  <div className="flex flex-col items-end space-y-1">
                    {/* Platform Badge */}
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                      {app.distributionType === 'WINDOWS_EXE' ? 'PC SOFTWARE (.EXE)' : app.distributionType.replace(/_/g, ' ')}
                    </span>

                    {/* Student Login Status Badge */}
                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 ${
                        isPermittedForStudent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {isPermittedForStudent ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Student Login Active</span>
                        </>
                      ) : (
                        <span>Hidden From Student</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-bold text-sm text-gray-950 flex items-center space-x-1.5">
                    <span>{app.name}</span>
                  </h4>
                  <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">
                    {app.exePath || app.packageName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                    {app.description || `Installed software for academic practice and lab coursework.`}
                  </p>
                </div>

                {/* Technical / Executable Details */}
                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Version</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{app.version}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Target Executable</span>
                    <span className="font-mono text-gray-800 truncate block mt-0.5 text-[10px]">
                      {app.exePath || 'Default OS Handler'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action and Permission Controls */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col space-y-3">
                {/* Checkbox / Toggle for Student Login */}
                <div className="flex items-center justify-between bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-700">Allow on Student Login</span>

                  <button
                    onClick={() => onToggleStudentAccess && onToggleStudentAccess(app.id, !isPermittedForStudent)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isPermittedForStudent
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {isPermittedForStudent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Disabled</span>
                    )}
                  </button>
                </div>

                {/* Secondary Actions: Preview Practice & Deploy */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setPreviewApp(app)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Preview Practice</span>
                  </button>

                  {app.isApproved && (
                    <button
                      onClick={() => setSelectedAppForDeploy(app)}
                      className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-blue-600" />
                      <span>Deploy to Class</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment Modal */}
      {selectedAppForDeploy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-semibold text-base text-gray-950">Deploy {selectedAppForDeploy.name}</h3>
            <p className="text-xs text-gray-400">
              Select target classroom devices for package <span className="font-mono text-gray-800 font-semibold">{selectedAppForDeploy.packageName}</span>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1.5">Target Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('CLASS')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      targetType === 'CLASS'
                        ? 'bg-gray-950 text-white border-gray-950 shadow-xs'
                        : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Specific Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('ALL_DEVICES')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      targetType === 'ALL_DEVICES'
                        ? 'bg-gray-950 text-white border-gray-950 shadow-xs'
                        : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    All Devices (Fleet)
                  </button>
                </div>
              </div>

              {targetType === 'CLASS' && (
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1.5">Select School Class</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.section} — {cls.deviceCount} Devices)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedAppForDeploy(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeployment}
                className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>Initiate Push Deployment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs select-none">
          <form
            onSubmit={handleCreateNewApp}
            className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
          >
            <h3 className="font-bold text-base text-gray-950">Register Installed PC Software / Application</h3>
            <p className="text-xs text-gray-400">
              Add software installed on host workstation PCs/laptops (e.g. Python, Blender, Office, AutoCAD) for student practical use.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Application Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python IDLE or Blender 3D"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Executable (.exe) or Command</label>
                  <input
                    type="text"
                    placeholder="e.g. pythonw.exe or winword.exe"
                    value={newExePath}
                    onChange={(e) => setNewExePath(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>

                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    <option value="EDUCATION">Education & Science</option>
                    <option value="PRODUCTIVITY">Productivity & Office</option>
                    <option value="UTILITY">Utility & System</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Course Description & Practice Objectives</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Used for Grade 12 Computer Science programming practicals and file creation."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Register & Approve for Student Login
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Software Practice Workspace Preview (for Admin) */}
      {previewApp && (
        <SoftwarePracticeWorkspace
          app={previewApp}
          onClose={() => setPreviewApp(null)}
        />
      )}
    </div>
  );
};

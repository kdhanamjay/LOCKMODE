// EduGuard MDM — Application Management & Rollout Console (Clean Minimalism)

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Send,
} from 'lucide-react';
import { Application, Deployment, SchoolClass } from '../types/mdm';

interface ApplicationsViewProps {
  applications: Application[];
  deployments: Deployment[];
  classes: SchoolClass[];
  onDeployApp: (appId: string, target: { targetType: string; targetId: string; targetName: string }) => void;
  onCreateApp: (app: Partial<Application>) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  classes,
  onDeployApp,
  onCreateApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppForDeploy, setSelectedAppForDeploy] = useState<Application | null>(null);
  const [targetType, setTargetType] = useState<'CLASS' | 'ALL_DEVICES'>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-12-a');
  const [showAddModal, setShowAddModal] = useState(false);

  // New app form state
  const [newAppName, setNewAppName] = useState('');
  const [newPkgName, setNewPkgName] = useState('');
  const [newVersion, setNewVersion] = useState('1.0.0');
  const [newCategory, setNewCategory] = useState<'EDUCATION' | 'PRODUCTIVITY' | 'UTILITY'>('EDUCATION');

  const filteredApps = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.publisher.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (!newAppName || !newPkgName) return;
    onCreateApp({
      name: newAppName,
      packageName: newPkgName,
      version: newVersion,
      category: newCategory,
      isApproved: true,
      distributionType: 'PRIVATE_ENTERPRISE_APK',
    });
    setShowAddModal(false);
    setNewAppName('');
    setNewPkgName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base text-gray-950">Approved Application Catalog</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage Play Store enterprise distributions and private institutional APK rollouts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Application</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applications by name or package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 transition-all"
          />
        </div>

        <div className="text-xs font-medium text-gray-400">
          Showing <span className="font-semibold text-gray-950">{filteredApps.length}</span> applications
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-bold text-gray-700">
                  📦
                </div>

                <span
                  className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    app.isApproved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}
                >
                  {app.isApproved ? 'APPROVED' : 'RESTRICTED'}
                </span>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm text-gray-950">{app.name}</h4>
                <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">{app.packageName}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">Publisher: {app.publisher}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Version</span>
                  <span className="font-semibold text-gray-900 mt-0.5 block">v{app.version}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Distribution</span>
                  <span className="font-semibold text-gray-900 truncate block mt-0.5">
                    {app.distributionType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="text-[11px] text-gray-400 font-medium">
                <span className="font-semibold text-gray-950">{app.installedCount}</span> devices installed
              </div>

              {app.isApproved && (
                <button
                  onClick={() => setSelectedAppForDeploy(app)}
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3 h-3 text-blue-600" />
                  <span>Deploy</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Deployment Modal */}
      {selectedAppForDeploy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-semibold text-base text-gray-950">Deploy {selectedAppForDeploy.name}</h3>
            <p className="text-xs text-gray-400">
              Select rollout target for package <span className="font-mono text-gray-800 font-semibold">{selectedAppForDeploy.packageName}</span> (v{selectedAppForDeploy.version}).
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
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4"
          >
            <h3 className="font-semibold text-base text-gray-950">Register School Application</h3>
            <p className="text-xs text-gray-400">Add an institutional or approved third-party Android application.</p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Application Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science 3D Lab"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div>
                <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Android Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. com.edu.sciencelab"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Version</label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-gray-950"
                  >
                    <option value="EDUCATION">Education</option>
                    <option value="PRODUCTIVITY">Productivity</option>
                    <option value="UTILITY">Utility</option>
                  </select>
                </div>
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
                className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Save & Approve
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

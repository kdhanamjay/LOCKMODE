import React, { useState } from 'react';
import {
  LockOpen,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Monitor,
  AlertTriangle,
  RefreshCw,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { KioskExitRequest } from '../types/mdm';

interface KioskExitApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: KioskExitRequest[];
  onApprove: (requestId: string, note?: string) => Promise<void>;
  onReject: (requestId: string, reason?: string) => Promise<void>;
  onRefresh: () => void;
  isProcessing?: boolean;
}

export const KioskExitApprovalModal: React.FC<KioskExitApprovalModalProps> = ({
  isOpen,
  onClose,
  requests,
  onApprove,
  onReject,
  onRefresh,
  isProcessing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [rejectModalReqId, setRejectModalReqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Please complete your assigned class session before exiting.');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const historyRequests = requests.filter((r) => r.status !== 'PENDING');

  const handleApproveAction = async (req: KioskExitRequest) => {
    setActionLoadingId(req.id);
    try {
      await onApprove(req.id, 'Approved by Administrator');
      setFeedbackMessage(`✅ Approved Kiosk Exit for ${req.studentName} (${req.deviceName}). Device unlocked!`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: any) {
      alert(`Approval error: ${err.message || 'Failed to approve'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReqId) return;
    setActionLoadingId(rejectModalReqId);
    try {
      await onReject(rejectModalReqId, rejectReason);
      setFeedbackMessage(`❌ Rejected Kiosk Exit for request #${rejectModalReqId.slice(-4)}.`);
      setTimeout(() => setFeedbackMessage(null), 3500);
      setRejectModalReqId(null);
    } catch (err: any) {
      alert(`Rejection error: ${err.message || 'Failed to reject'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <LockOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
                  Kiosk Exit & Logout Approvals
                </h3>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                    {pendingRequests.length} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Review student workstation password unlocks & remote kiosk exit permissions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={isProcessing}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh Requests"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 text-xs text-emerald-800 font-semibold flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-6 border-b border-gray-100 flex items-center space-x-4 bg-white">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'PENDING'
                ? 'border-gray-950 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>Pending Approvals</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                pendingRequests.length > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {pendingRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-gray-950 text-gray-950'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>Decision History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-500">
              {historyRequests.length}
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'PENDING' ? (
            pendingRequests.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">No Pending Exit Requests</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  All student workstations are currently locked in secure educational kiosk mode. When a student enters their password to request logout, it will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 hover:border-amber-300 transition-all space-y-3 shadow-xs"
                  >
                    {/* Top line info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {req.studentName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-gray-900">{req.studentName}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-mono font-medium">
                              Roll: {req.studentRoll || 'N/A'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md font-medium">
                              {req.className}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-gray-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <Monitor className="w-3.5 h-3.5 text-gray-400" />
                              <strong className="text-gray-700">{req.deviceName}</strong> ({req.platform || 'WINDOWS_PC'})
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{new Date(req.requestedAt).toLocaleTimeString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          <span>Needs Approval</span>
                        </span>
                      </div>
                    </div>

                    {/* Reason given by student */}
                    <div className="p-3 bg-white rounded-xl border border-gray-100 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                          Student Reason & Password Verification
                        </span>
                        <p className="text-gray-800 font-medium mt-0.5">{req.reason}</p>
                        <span className="text-[10px] text-emerald-600 font-medium inline-flex items-center space-x-1 mt-1">
                          <Check className="w-3 h-3" />
                          <span>Student password successfully verified on station</span>
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-1 border-t border-amber-100/60">
                      <button
                        type="button"
                        disabled={actionLoadingId === req.id}
                        onClick={() => {
                          setRejectModalReqId(req.id);
                        }}
                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-gray-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Request</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === req.id}
                        onClick={() => handleApproveAction(req)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        {actionLoadingId === req.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Unlocking...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Unlock Kiosk</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : historyRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">No past exit decisions recorded in this session.</div>
          ) : (
            <div className="space-y-2.5">
              {historyRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {req.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{req.studentName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 font-mono">{req.deviceName}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {req.status === 'APPROVED' ? 'Unlocked by' : 'Rejected by'}{' '}
                        <strong className="text-gray-700">{req.reviewedBy || 'Administrator'}</strong> •{' '}
                        {new Date(req.reviewedAt || req.requestedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between text-xs text-gray-500">
          <span>Administrator: <strong>arvdexamsection@gmail.com</strong> (Super Admin)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Rejection Note Modal */}
      {rejectModalReqId && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">Reject Kiosk Exit Request</h4>
                <p className="text-xs text-gray-500">The student will remain locked in the workspace</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Rejection Reason (Transmitted to Student Screen)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:bg-white resize-none"
                placeholder="Explain why exit is not permitted at this time..."
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReqId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

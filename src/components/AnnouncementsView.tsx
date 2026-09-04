// EduGuard MDM — Admin Broadcast Messages & Announcements View (Clean Minimalism)

import React, { useState } from 'react';
import {
  Megaphone,
  Send,
  Bell,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  Building2,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AdminBroadcastMessage, SchoolClass, Device, AdminUser, MessagePriority } from '../types/mdm';
import { api } from '../lib/api';

interface AnnouncementsViewProps {
  messages: AdminBroadcastMessage[];
  classes: SchoolClass[];
  devices: Device[];
  currentUser: AdminUser;
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  messages,
  classes,
  devices,
  currentUser,
  onRefresh,
  onShowToast,
}) => {
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<MessagePriority>('INFO');
  const [targetType, setTargetType] = useState<'ALL' | 'CLASS' | 'DEVICE'>('ALL');
  const [targetId, setTargetId] = useState('');
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'URGENT' | 'CLASS'>('ALL');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      onShowToast('Please enter both announcement title and message body.');
      return;
    }

    let targetName = 'All Student Tablets';
    if (targetType === 'CLASS') {
      const cls = classes.find((c) => c.id === targetId);
      targetName = cls ? `${cls.name} (${cls.section})` : 'Selected Class';
    } else if (targetType === 'DEVICE') {
      const dev = devices.find((d) => d.id === targetId || d.deviceId === targetId);
      targetName = dev ? `${dev.name} (${dev.deviceId})` : 'Selected Device';
    }

    try {
      setIsSubmitting(true);
      await api.broadcastMessage({
        title: title.trim(),
        body: body.trim(),
        priority,
        targetType,
        targetId: targetId || undefined,
        targetName,
        requireAcknowledgment,
      });

      onShowToast(`Broadcast sent to ${targetName}. Online devices will alert immediately; offline devices will receive upon Wi-Fi reconnect.`);
      setTitle('');
      setBody('');
      setIsComposing(false);
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to broadcast message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (selectedFilter === 'URGENT') return msg.priority === 'URGENT' || msg.priority === 'EXAM';
    if (selectedFilter === 'CLASS') return msg.targetType === 'CLASS';
    return true;
  });

  const getPriorityBadge = (p: MessagePriority) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">Urgent Notice</span>;
      case 'EXAM':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">Exam Alert</span>;
      case 'WARNING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">Warning</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">General Info</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Offline/Online sync mechanics */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start space-x-3.5">
        <div className="p-2 bg-emerald-100/80 rounded-xl text-emerald-800 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-semibold text-emerald-950">Offline Resilience & Live Online Sync Engine</h4>
          <p className="text-emerald-800/90 leading-relaxed">
            Student tablets maintain <strong>100% kiosk lockdown & offline study tools</strong> even when Wi-Fi is disconnected or offline. When any tablet connects to Wi-Fi / Internet, it automatically syncs with the MDM server and displays pending admin announcements and urgent notices instantly.
          </p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Broadcasts ({messages.length})
          </button>
          <button
            onClick={() => setSelectedFilter('URGENT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              selectedFilter === 'URGENT'
                ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Urgent / Exam Notices
          </button>
          <button
            onClick={() => setSelectedFilter('CLASS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              selectedFilter === 'CLASS'
                ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Class-Specific
          </button>
        </div>

        <button
          onClick={() => setIsComposing(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>New Broadcast Announcement</span>
        </button>
      </div>

      {/* Compose Announcement Modal */}
      {isComposing && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-gray-100 rounded-xl text-gray-800">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">Push Broadcast to Student Tablets</h3>
                  <p className="text-[11px] text-gray-500">Delivered immediately or on next Wi-Fi connection</p>
                </div>
              </div>
              <button
                onClick={() => setIsComposing(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Exam Instructions: Keep Tablets in Kiosk Mode"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Message Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type the message for students to see on their screens..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MessagePriority)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
                  >
                    <option value="INFO">General Information</option>
                    <option value="URGENT">Urgent Announcement</option>
                    <option value="EXAM">Exam Session Notice</option>
                    <option value="WARNING">Security / Warning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as any);
                      setTargetId('');
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
                  >
                    <option value="ALL">All Student Tablets ({devices.length})</option>
                    <option value="CLASS">Specific Classroom</option>
                    <option value="DEVICE">Specific Student Tablet</option>
                  </select>
                </div>
              </div>

              {targetType === 'CLASS' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Classroom</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.section}) — {c.deviceCount} tablets
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'DEVICE' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Tablet</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
                  >
                    <option value="">-- Choose Student Tablet --</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.deviceId}) — {d.assignedStudentName || 'Unassigned'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireAcknowledgment}
                    onChange={(e) => setRequireAcknowledgment(e.target.checked)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span>Require Student "Acknowledge" Confirmation on Screen</span>
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast to Tablets'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-100 rounded-2xl">
            <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-gray-900">No Announcements Found</h4>
            <p className="text-xs text-gray-500 mt-1">Broadcast important school notices, instructions, or exam alerts to student devices.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const ackCount = msg.acknowledgedDeviceIds?.length || 0;
            return (
              <div
                key={msg.id}
                className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs hover:border-gray-200 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-gray-800">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-950">{msg.title}</h4>
                        {getPriorityBadge(msg.priority)}
                      </div>
                      <span className="text-[11px] text-gray-400 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Sent {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {msg.senderName} ({msg.senderRole})</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[11px] text-gray-600 font-medium">
                      Target: <strong>{msg.targetName || 'All Tablets'}</strong>
                    </div>

                    {msg.requireAcknowledgment && (
                      <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{ackCount} Acknowledged</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs text-gray-800 leading-relaxed">
                  {msg.body}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

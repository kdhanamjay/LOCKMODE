// EduGuard MDM — Administrator Console Authentication (Clean Minimalist Design)

import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, LogIn, School, AlertCircle, Monitor, ArrowRight, Sparkles } from 'lucide-react';
import { AdminUser } from '../types/mdm';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser, token: string) => void;
  onLaunchStudentWorkspace?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onLaunchStudentWorkspace }) => {
  const [email, setEmail] = useState('admin@greenwood-high.edu');
  const [password, setPassword] = useState('EduGuardSecure2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Invalid administrator credentials');
      }

      onLoginSuccess(json.data.user, json.data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('EduGuardSecure2026!');
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'EduGuardSecure2026!' }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'Invalid credentials');
      }

      onLoginSuccess(json.data.user, json.data.token);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center shadow-lg shadow-gray-200">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-gray-950">
          EduGuard MDM Console
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500 max-w-sm mx-auto">
          Android Enterprise Device Management & Student Tablet Kiosk Controller
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-4">
        {/* Student Mode Fast-Track Button for Student PCs/Labs */}
        {onLaunchStudentWorkspace && (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-5 shadow-xs flex flex-col space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-emerald-950">Running on a Student PC or Lab Station?</h3>
                <p className="text-[11px] text-emerald-800">Students do not need admin login credentials.</p>
              </div>
            </div>
            <button
              onClick={onLaunchStudentWorkspace}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Launch Locked Student Kiosk Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Admin Login Card */}
        <div className="bg-white py-7 px-6 sm:px-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Administrator Sign In</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
              School Staff
            </span>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                School Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@greenwood-high.edu"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Master Security Password
                </label>
                <span className="text-[10px] text-gray-400">Default: EduGuardSecure2026!</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-950 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gray-950 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to MDM Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo 1-Click Login Roles */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center flex items-center justify-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>1-Click Instant Sign In</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin@greenwood-high.edu')}
                className="p-2.5 text-left bg-gray-50 hover:bg-blue-50/80 hover:border-blue-200 rounded-xl border border-gray-200/60 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-gray-900 truncate">Sarah Jenkins</div>
                <div className="text-[9px] text-blue-600 uppercase font-bold mt-0.5">Super Admin (1-Click)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('marcus.vance@greenwood.edu')}
                className="p-2.5 text-left bg-gray-50 hover:bg-purple-50/80 hover:border-purple-200 rounded-xl border border-gray-200/60 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-gray-900 truncate">Marcus Vance</div>
                <div className="text-[9px] text-purple-600 uppercase font-bold mt-0.5">IT Lead (1-Click)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

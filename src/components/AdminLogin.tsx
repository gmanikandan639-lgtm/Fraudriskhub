/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BRAND } from '../assets/branding';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { AdminSession } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (session: AdminSession) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  // Authenticate against defined admin credentials
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setErrorMessage('Please enter your administrator username.');
      return;
    }

    if (!trimmedPassword) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);

    // Verify credentials with simulated security handshake
    setTimeout(() => {
      if (
        trimmedUsername === 'Manikandan@FRH' &&
        trimmedPassword === 'Manikandan@123'
      ) {
        setSuccessNotice(true);
        const newSession: AdminSession = {
          isAuthenticated: true,
          username: trimmedUsername,
          name: 'Manikandan',
          role: 'Administrator',
          system: 'Hunter Search Management',
          loginTime: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          token: `hs_auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        };

        setTimeout(() => {
          onLoginSuccess(newSession);
        }, 500);
      } else {
        setIsLoading(false);
        setErrorMessage('Invalid username or password. Please verify your administrator credentials.');
      }
    }, 600);
  };

  return (
    <div id="admin-login-page" className="min-h-[78vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Back to Public Search button */}
        <button
          id="login-back-btn"
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Hunter Search</span>
        </button>

        {/* Login Card Container */}
        <div
          id="admin-login-card"
          className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6 relative overflow-hidden"
        >
          {/* Top Decorative Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl shadow-indigo-950/40 p-1">
              <img
                src={BRAND.shieldIcon}
                alt="Fraud Risk Hub Logo"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200 mb-1">
                FRAUD RISK HUB • RCU / FCU
              </div>
              <h1 id="login-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Admin Authentication
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to access the Fraud Risk Hub Admin Dashboard
              </p>
            </div>
          </div>

          {/* Validation Feedback Messages */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successNotice && (
            <div
              id="login-success-alert"
              className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Authentication verified. Initializing Admin Dashboard...</span>
            </div>
          )}

          {/* Form */}
          <form id="admin-login-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Username field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-username-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <input
                  id="admin-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter administrator username"
                  autoComplete="username"
                  disabled={isLoading || successNotice}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 text-sm font-medium rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-indigo-600" />
                </div>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  disabled={isLoading || successNotice}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white text-slate-900 text-sm font-medium rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all placeholder:text-slate-400"
                />
                <button
                  id="toggle-password-visibility-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading || successNotice}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : successNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Login to Admin Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Authorized administrative personnel only. Session protected.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

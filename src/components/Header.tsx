/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveNavPage, AdminSession, VisitorStats, LiveSyncStatus } from '../types';
import { BRAND } from '../assets/branding';
import {
  Search,
  Info,
  CheckCircle,
  LogOut,
  Lock,
  LayoutDashboard,
  Users,
  Radio,
  PlusCircle,
  Clock,
} from 'lucide-react';

interface HeaderProps {
  activePage: ActiveNavPage;
  onSelectPage: (page: ActiveNavPage) => void;
  recordCount?: number;
  isDemoData?: boolean;
  adminSession: AdminSession | null;
  googleUser?: any | null;
  onLogout: () => void;
  visitorStats?: VisitorStats;
  liveSyncStatus?: LiveSyncStatus;
  onOpenUserSubmit?: () => void;
  pendingApprovalsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onSelectPage,
  adminSession,
  googleUser,
  onLogout,
  visitorStats,
  liveSyncStatus = 'connected',
  onOpenUserSubmit,
  pendingApprovalsCount = 0,
}) => {

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={() => onSelectPage('search')}
              className="flex items-center gap-3 group text-left focus:outline-hidden cursor-pointer"
            >
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md shadow-indigo-950/30 shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src={BRAND.shieldIcon}
                  alt="Fraud Risk Hub Shield Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>FRAUD RISK HUB</span>
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                    RCU / FCU
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 hidden sm:block uppercase">
                  Detect • Analyze • Prevent
                </p>
              </div>
            </button>
          </div>

          {/* Right: Visitor Counter, Live Sync Status & Admin session info */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Visitor Counter Badge */}
            {visitorStats && (
              <div
                id="header-visitor-counter"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs text-slate-700 transition-colors shadow-2xs"
                title={`Unique Visitors: ${visitorStats.totalVisits.toLocaleString()} | Unique Today: ${visitorStats.todayVisits.toLocaleString()}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="font-semibold text-[11px] text-slate-600">
                  Total Visitors: <strong className="font-mono font-bold text-slate-900">{visitorStats.totalVisits.toLocaleString()}</strong>
                </span>
              </div>
            )}


            {/* Google User Profile & Admin Badge / Sign Out */}
            {googleUser ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl bg-slate-50 border border-slate-200/90 text-left"
                  title={`Signed in as: ${googleUser.email || googleUser.displayName || 'Google User'}`}
                >
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {(googleUser.displayName || googleUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900 max-w-[120px] truncate">
                        {googleUser.displayName || googleUser.email?.split('@')[0] || 'Google User'}
                      </span>
                      <CheckCircle className="w-3 h-3 text-emerald-600 fill-emerald-100 shrink-0" />
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-600 block -mt-0.5">
                      {adminSession?.isAuthenticated ? 'Admin' : 'Google Auth'}
                    </span>
                  </div>
                </div>

                {adminSession?.isAuthenticated && (
                  <button
                    id="admin-dashboard-btn"
                    onClick={() => onSelectPage('admin')}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                )}

                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Sign Out of Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : adminSession?.isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="admin-profile-btn"
                  onClick={() => onSelectPage('admin')}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left group cursor-pointer"
                  title="Administrator: Manikandan"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    M
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        {adminSession.name}
                      </span>
                      <CheckCircle className="w-3 h-3 text-emerald-600 fill-emerald-100" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 block -mt-0.5">
                      {adminSession.role}
                    </span>
                  </div>
                </button>

                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Logout / Terminate Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => onSelectPage('login')}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto gap-1">
          <button
            id="mobile-nav-search"
            onClick={() => onSelectPage('search')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activePage === 'search'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          <button
            id="mobile-nav-about"
            onClick={() => onSelectPage('about')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activePage === 'about'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
          </button>
          {adminSession?.isAuthenticated ? (
            <button
              id="mobile-nav-admin"
              onClick={() => onSelectPage('admin')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap relative ${
                activePage === 'admin'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-indigo-600 bg-indigo-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>
          ) : (
            <button
              id="mobile-nav-login"
              onClick={() => onSelectPage('login')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activePage === 'login'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

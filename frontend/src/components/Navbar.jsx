import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, Award, Sparkles, Building2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Tri-color national accent bar */}
      <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-white to-emerald-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Portal Identity */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Gov<span className="text-blue-600">Assist</span> <span className="text-orange-500">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  SIH 2025 MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">
                National Government Scheme & Document Eligibility Portal
              </p>
            </div>
          </div>

          {/* User Status & Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {isAdmin ? '🛡️ Central Administrator' : '🇮🇳 Verified Citizen'}
                    </p>
                  </div>
                </div>

                {isAdmin ? (
                  <button
                    onClick={() => setActiveTab('admin-dashboard')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('schemes')}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>My Schemes</span>
                  </button>
                )}

                <button
                  onClick={logout}
                  title="Log out of session"
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

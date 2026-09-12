import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, Sparkles, User, ShieldAlert } from 'lucide-react';

export default function LoginPage({ setActiveTab, showToast }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      showToast(`Welcome back, ${res.user.full_name}!`, 'success');
      if (res.user.role === 'admin') {
        setActiveTab('admin-dashboard');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'citizen') {
      setEmail('citizen@govassist.in');
      setPassword('Citizen@123');
    } else {
      setEmail('admin@govassist.in');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to GovAssist AI
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your government scheme eligibility & document vault
          </p>
        </div>

        {/* Demo One-Click Fill Options */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 mr-1" />
              SIH Hackathon Demo Quick-Fill
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('citizen')}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center space-x-1 shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-purple-500 hover:text-purple-600 transition-all flex items-center justify-center space-x-1 shadow-2xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. citizen@govassist.in"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={() => setActiveTab('register')}
            className="font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Create Citizen Account
          </button>
        </div>
      </div>
    </div>
  );
}

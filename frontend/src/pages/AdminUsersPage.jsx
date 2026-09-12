import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { Users, Search, UserCheck, Shield, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AdminUsersPage({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const list = await adminApi.getUsers(search);
      setUsers(list || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading user directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Registered Citizens Directory</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
              {users.length} Citizens
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review citizen demographic profiles, socio-economic parameters, and document upload counts.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh user list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search citizens by full name or email address..."
          className="flex-1 text-xs border-none outline-hidden bg-transparent"
        />
      </div>

      {/* Citizens Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Citizen Name & Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">State</th>
                <th className="py-3.5 px-4">Occupation & Category</th>
                <th className="py-3.5 px-4">Income</th>
                <th className="py-3.5 px-4 text-center">Docs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading citizens...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No citizens match the search query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.profile?.age ? `${u.profile.age} yrs` : '—'} / {u.profile?.gender || '—'}
                    </td>
                    <td className="py-3 px-4">{u.profile?.state || 'National'}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{u.profile?.occupation || 'Other'}</div>
                      <div className="text-[10px] text-slate-400">{u.profile?.category || 'GEN'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      ₹{(u.profile?.annual_income || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold font-mono text-[10px]">
                        {u.documents_count}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

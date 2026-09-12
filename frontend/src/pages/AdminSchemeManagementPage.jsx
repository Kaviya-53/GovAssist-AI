import React, { useState, useEffect } from 'react';
import { schemeApi } from '../services/api';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Search,
  Check,
  X,
  Building,
  ExternalLink,
  Filter,
} from 'lucide-react';

const CATEGORIES = [
  'Agriculture',
  'Education',
  'Healthcare',
  'Women Welfare',
  'Employment',
  'Housing',
  'Social Welfare',
];

export default function AdminSchemeManagementPage({ showToast }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);

  const defaultForm = {
    name: '',
    code: '',
    ministry: '',
    category: 'Agriculture',
    description: '',
    benefits: '',
    required_documents: 'Aadhaar Card, Bank Account Details',
    application_process: '1. Visit official portal.\n2. Submit details & verify Aadhaar.',
    official_url: 'https://india.gov.in',
    is_active: true,
    min_age: '',
    max_age: '',
    gender: 'All',
    max_income: '',
    requires_farmer: false,
    requires_student: false,
    requires_disabled: false,
    requires_business: false,
    requires_bpl: false,
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    try {
      setLoading(true);
      const list = await schemeApi.list();
      setSchemes(list || []);
    } catch (e) {
      console.error(e);
      showToast('Error loading schemes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingScheme(null);
    setFormData(defaultForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.name,
      code: scheme.code,
      ministry: scheme.ministry,
      category: scheme.category,
      description: scheme.description,
      benefits: scheme.benefits,
      required_documents: Array.isArray(scheme.required_documents)
        ? scheme.required_documents.join(', ')
        : scheme.required_documents,
      application_process: scheme.application_process,
      official_url: scheme.official_url,
      is_active: scheme.is_active,
      min_age: scheme.criteria?.min_age ?? '',
      max_age: scheme.criteria?.max_age ?? '',
      gender: scheme.criteria?.gender ?? 'All',
      max_income: scheme.criteria?.max_income ?? '',
      requires_farmer: scheme.criteria?.requires_farmer ?? false,
      requires_student: scheme.criteria?.requires_student ?? false,
      requires_disabled: scheme.criteria?.requires_disabled ?? false,
      requires_business: scheme.criteria?.requires_business ?? false,
      requires_bpl: scheme.criteria?.requires_bpl ?? false,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this government scheme?')) return;
    try {
      await schemeApi.delete(id);
      showToast('Scheme deleted successfully', 'info');
      loadSchemes();
    } catch (e) {
      showToast('Failed to delete scheme', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docsArray = formData.required_documents
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        ministry: formData.ministry,
        category: formData.category,
        description: formData.description,
        benefits: formData.benefits,
        required_documents: docsArray,
        application_process: formData.application_process,
        official_url: formData.official_url,
        is_active: formData.is_active,
        criteria: {
          min_age: formData.min_age ? parseInt(formData.min_age) : null,
          max_age: formData.max_age ? parseInt(formData.max_age) : null,
          gender: formData.gender,
          max_income: formData.max_income ? parseFloat(formData.max_income) : null,
          allowed_categories: ['All'],
          allowed_states: ['All'],
          allowed_occupations: ['All'],
          requires_farmer: formData.requires_farmer,
          requires_student: formData.requires_student,
          requires_disabled: formData.requires_disabled,
          requires_business: formData.requires_business,
          requires_bpl: formData.requires_bpl,
        },
      };

      if (editingScheme) {
        await schemeApi.update(editingScheme.id, payload);
        showToast('Scheme updated successfully!', 'success');
      } else {
        await schemeApi.create(payload);
        showToast('New scheme published successfully!', 'success');
      }

      setModalOpen(false);
      loadSchemes();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to save scheme', 'error');
    }
  };

  const filtered = schemes.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.ministry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">
              Government Schemes Catalog Management
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
              Admin CRUD
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publish new welfare policies, tune eligibility criteria thresholds, or modify required documents.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Scheme</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter schemes by title, acronym, or ministry..."
          className="flex-1 text-xs border-none outline-hidden bg-transparent"
        />
        <span className="text-xs font-semibold text-slate-400">
          {filtered.length} scheme(s)
        </span>
      </div>

      {/* Schemes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Scheme & Code</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Ministry</th>
                <th className="py-3.5 px-4">Income Limit</th>
                <th className="py-3.5 px-4">Age Window</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Loading scheme catalog...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No matching schemes found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] font-mono text-purple-600 font-bold">{s.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={s.ministry}>
                      {s.ministry}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {s.criteria?.max_income ? `≤ ₹${s.criteria.max_income.toLocaleString('en-IN')}` : 'No limit'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {s.criteria?.min_age || s.criteria?.max_age
                        ? `${s.criteria.min_age || 0} - ${s.criteria.max_age || '∞'} yrs`
                        : 'Any'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit scheme"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete scheme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Scheme */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingScheme ? `Edit Scheme: ${editingScheme.code}` : 'Publish New Government Scheme'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Scheme Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pradhan Mantri Kisan Samman Nidhi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Scheme Code / Acronym *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. PM-KISAN"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ministry / Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ministry}
                    onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                    placeholder="e.g. Ministry of Agriculture"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of the government scheme..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Key Benefits & Subsidies *
                </label>
                <input
                  type="text"
                  required
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="e.g. ₹6,000 per year in three installments"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Required Documents (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.required_documents}
                  onChange={(e) => setFormData({ ...formData, required_documents: e.target.value })}
                  placeholder="Aadhaar Card, Income Certificate, Bank Passbook"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Step-by-Step Application Process
                </label>
                <textarea
                  rows={2}
                  value={formData.application_process}
                  onChange={(e) => setFormData({ ...formData, application_process: e.target.value })}
                  placeholder="1. Visit portal...\n2. Fill application form..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Official Application URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.official_url}
                  onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              {/* Criteria Thresholds */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase">
                  Rule-Based Engine Criteria Thresholds
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Min Age</label>
                    <input
                      type="number"
                      value={formData.min_age}
                      onChange={(e) => setFormData({ ...formData, min_age: e.target.value })}
                      placeholder="e.g. 18"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Max Age</label>
                    <input
                      type="number"
                      value={formData.max_age}
                      onChange={(e) => setFormData({ ...formData, max_age: e.target.value })}
                      placeholder="e.g. 60"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="All">All Genders</option>
                      <option value="Female">Female Only</option>
                      <option value="Male">Male Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Max Income (₹)</label>
                    <input
                      type="number"
                      value={formData.max_income}
                      onChange={(e) => setFormData({ ...formData, max_income: e.target.value })}
                      placeholder="e.g. 250000"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_farmer}
                      onChange={(e) => setFormData({ ...formData, requires_farmer: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Requires Farmer</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_student}
                      onChange={(e) => setFormData({ ...formData, requires_student: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Requires Student</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_disabled}
                      onChange={(e) => setFormData({ ...formData, requires_disabled: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Requires Disability</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_business}
                      onChange={(e) => setFormData({ ...formData, requires_business: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Requires Business</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_bpl}
                      onChange={(e) => setFormData({ ...formData, requires_bpl: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Requires BPL</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
                >
                  {editingScheme ? 'Save Changes' : 'Publish Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

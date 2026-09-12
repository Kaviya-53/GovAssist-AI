import React, { useState, useEffect } from 'react';
import { profileApi } from '../services/api';
import { Save, UserCheck, ShieldCheck, Sparkles, MapPin, IndianRupee, Briefcase, GraduationCap } from 'lucide-react';

const INDIAN_STATES = [
  'National', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];

export default function ProfilePage({ showToast, onTriggerEligibilityCheck }) {
  const [profile, setProfile] = useState({
    age: '',
    gender: 'Male',
    state: 'National',
    district: '',
    occupation: 'Other',
    annual_income: '',
    category: 'GEN',
    education_level: '12th Pass',
    is_disabled: false,
    disability_percentage: 0,
    is_farmer: false,
    land_holding_hectares: 0,
    is_student: false,
    is_business_owner: false,
    marital_status: 'Single',
    bpl_card_holder: false,
    phone_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.get();
      setProfile({
        age: data.age ?? '',
        gender: data.gender ?? 'Male',
        state: data.state ?? 'National',
        district: data.district ?? '',
        occupation: data.occupation ?? 'Other',
        annual_income: data.annual_income ?? '',
        category: data.category ?? 'GEN',
        education_level: data.education_level ?? '12th Pass',
        is_disabled: data.is_disabled ?? false,
        disability_percentage: data.disability_percentage ?? 0,
        is_farmer: data.is_farmer ?? false,
        land_holding_hectares: data.land_holding_hectares ?? 0,
        is_student: data.is_student ?? false,
        is_business_owner: data.is_business_owner ?? false,
        marital_status: data.marital_status ?? 'Single',
        bpl_card_holder: data.bpl_card_holder ?? false,
        phone_number: data.phone_number ?? '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      showToast('Error loading profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...profile,
        age: profile.age ? parseInt(profile.age) : null,
        annual_income: profile.annual_income ? parseFloat(profile.annual_income) : 0.0,
        disability_percentage: profile.disability_percentage ? parseFloat(profile.disability_percentage) : 0.0,
        land_holding_hectares: profile.land_holding_hectares ? parseFloat(profile.land_holding_hectares) : 0.0,
      };
      await profileApi.update(payload);
      showToast('Citizen profile updated & schemes recalculated!', 'success');
      if (onTriggerEligibilityCheck) {
        onTriggerEligibilityCheck();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Citizen Profile Management</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
              Live Evaluation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Keep your socio-economic details accurate to receive maximum matching government benefits.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save & Recalculate'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>1. Personal & Demographic Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Age (in Years) *
              </label>
              <input
                type="number"
                name="age"
                min="0"
                max="120"
                value={profile.age}
                onChange={handleChange}
                placeholder="e.g. 28"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Marital Status
              </label>
              <select
                name="marital_status"
                value={profile.marital_status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                <option value="Single">Single / Unmarried</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Highest Education Level
              </label>
              <select
                name="education_level"
                value={profile.education_level}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                <option value="Below 8th">Below 8th Class</option>
                <option value="10th Pass">10th Class (Secondary)</option>
                <option value="12th Pass">12th Class (Senior Secondary)</option>
                <option value="Diploma">Diploma / ITI</option>
                <option value="Graduate">Graduate (Degree)</option>
                <option value="Post Graduate">Post Graduate / PhD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>2. Domicile & Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State / Union Territory *
              </label>
              <select
                name="state"
                value={profile.state}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                District Name
              </label>
              <input
                type="text"
                name="district"
                value={profile.district}
                onChange={handleChange}
                placeholder="e.g. Varanasi, Pune, Patna"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Socio-Economic & Income */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <IndianRupee className="w-4 h-4 text-orange-500" />
            <span>3. Socio-Economic & Category Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Annual Family Income (₹ INR) *
              </label>
              <input
                type="number"
                name="annual_income"
                value={profile.annual_income}
                onChange={handleChange}
                placeholder="e.g. 180000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used for income caps (e.g. &lt; ₹2.5L for scholarships/PMAY)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Social Category *
              </label>
              <select
                name="category"
                value={profile.category}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                <option value="GEN">General (Open)</option>
                <option value="OBC">Other Backward Class (OBC)</option>
                <option value="SC">Scheduled Caste (SC)</option>
                <option value="ST">Scheduled Tribe (ST)</option>
                <option value="EWS">Economically Weaker Section (EWS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Occupation *
              </label>
              <select
                name="occupation"
                value={profile.occupation}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              >
                <option value="Farmer">Farmer / Agriculture Cultivator</option>
                <option value="Student">Student (Enrolled)</option>
                <option value="Daily Wage">Daily Wage Laborer (Rural/Urban)</option>
                <option value="Vendor">Street Vendor / Hawkers</option>
                <option value="Business">Small Business / MSME Owner</option>
                <option value="Self-Employed">Self-Employed Professional</option>
                <option value="Unemployed">Unemployed Citizen</option>
                <option value="Private Sector">Private Sector Employee</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Specific Welfare Eligibility Flags */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>4. Special Beneficiary Criteria Flags</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Farmer checkbox */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3">
              <input
                type="checkbox"
                id="is_farmer"
                name="is_farmer"
                checked={profile.is_farmer}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="is_farmer" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Agricultural Cultivator / Landholding Farmer
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Qualifies for PM-KISAN, Kisan Credit Card (KCC), crop insurance.
                </p>
                {profile.is_farmer && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Total Land Holding (in Hectares)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="land_holding_hectares"
                      value={profile.land_holding_hectares}
                      onChange={handleChange}
                      placeholder="e.g. 1.5"
                      className="w-32 mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Student checkbox */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3">
              <input
                type="checkbox"
                id="is_student"
                name="is_student"
                checked={profile.is_student}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="is_student" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Enrolled Student
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Qualifies for Central & State scholarships (Post-Matric, NMMSS).
                </p>
              </div>
            </div>

            {/* Business owner */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3">
              <input
                type="checkbox"
                id="is_business_owner"
                name="is_business_owner"
                checked={profile.is_business_owner}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="is_business_owner" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Micro-Enterprise / Small Business Owner
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Qualifies for PM Mudra Yojana, PM SVANidhi loans, Stand-Up India.
                </p>
              </div>
            </div>

            {/* BPL card holder */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3">
              <input
                type="checkbox"
                id="bpl_card_holder"
                name="bpl_card_holder"
                checked={profile.bpl_card_holder}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="bpl_card_holder" className="text-xs font-bold text-slate-800 cursor-pointer">
                  BPL / Antyodaya Ration Card Holder
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Qualifies for Ayushman Bharat PM-JAY, PMAY-G, and Ujjwala Yojana.
                </p>
              </div>
            </div>

            {/* Disability */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3 col-span-1 sm:col-span-2">
              <input
                type="checkbox"
                id="is_disabled"
                name="is_disabled"
                checked={profile.is_disabled}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="is_disabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Person with Disability (Divyangjan)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Qualifies for NSAP Disability Pension, assistive aids, and reservations.
                </p>
                {profile.is_disabled && (
                  <div className="mt-2 flex items-center space-x-3">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Disability Percentage (min 40% for benchmark schemes):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="disability_percentage"
                      value={profile.disability_percentage}
                      onChange={handleChange}
                      placeholder="e.g. 50"
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <span className="text-xs font-bold text-slate-700">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile & Run Eligibility'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

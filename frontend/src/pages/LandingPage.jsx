import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Cpu,
  HeartHandshake,
  CheckCircle,
  Wheat,
  GraduationCap,
  HeartPulse,
  Home,
  Briefcase,
  Users,
} from 'lucide-react';

export default function LandingPage({ setActiveTab, onQuickDemoLogin }) {
  const sectors = [
    { name: 'Agriculture & Farmers', icon: Wheat, schemes: 'PM-KISAN, Kisan Credit Card', color: 'bg-emerald-50 text-emerald-700' },
    { name: 'Healthcare & Wellness', icon: HeartPulse, schemes: 'Ayushman Bharat PM-JAY', color: 'bg-rose-50 text-rose-700' },
    { name: 'Education & Scholarships', icon: GraduationCap, schemes: 'Post-Matric Scholarship, NMMSS', color: 'bg-blue-50 text-blue-700' },
    { name: 'Women & Child Welfare', icon: Users, schemes: 'Sukanya Samriddhi, PMMVY, Ujjwala', color: 'bg-purple-50 text-purple-700' },
    { name: 'Rural & Urban Housing', icon: Home, schemes: 'PMAY-Gramin, PMAY-Urban', color: 'bg-amber-50 text-amber-700' },
    { name: 'Employment & MSME Loans', icon: Briefcase, schemes: 'PM Mudra, PM SVANidhi, MGNREGA', color: 'bg-indigo-50 text-indigo-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24">
        {/* Background decorative subtle patterns */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Smart India Hackathon (SIH) MVP Prototype</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Intelligent Government Scheme & <br />
            <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">
              Document Assistant
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            GovAssist AI bridges the information gap for 1.4 billion Indian citizens. Upload your certificates for instant OCR intelligence and get transparent, explainable eligibility evaluations across Central & State initiatives.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveTab('register')}
              className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onQuickDemoLogin('citizen')}
              className="px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>1-Click Demo Citizen (Ramesh)</span>
            </button>

            <button
              onClick={() => onQuickDemoLogin('admin')}
              className="px-6 py-3.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 shadow-md flex items-center space-x-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Login (Chief Officer)</span>
            </button>
          </div>

          {/* Highlights bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-100 pt-8">
            <div className="text-center">
              <p className="text-2xl font-black text-blue-600">16+</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Central Schemes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-600">100%</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Explainable Rules</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-purple-600">Local OCR</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Document Parsing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-orange-500">₹0 Cost</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">No Paid API Keys</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How GovAssist AI Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Automated, end-to-end verification without complex bureaucracy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Create Profile</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter basic details like age, gender, occupation, land holding, annual family income, and social category.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Document OCR</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload Aadhaar, Income, or Caste certificates. Our OCR engine automatically extracts and cross-validates records.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Explainable AI</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The eligibility engine calculates match % scores, showing exact reasons why you qualify or what document is missing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 font-black flex items-center justify-center mb-4">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Apply & Assist</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Access step-by-step guidance, official government portal links, and chat with our local AI assistant anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Scheme Sectors */}
      <section className="bg-slate-100 py-16 border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Covered Sectors & Welfare Schemes
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Cross-sector coverage designed for rural, peri-urban, and urban citizens
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sectors.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-start space-x-4">
                  <div className={`p-3 rounded-lg shrink-0 ${sec.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{sec.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{sec.schemes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">GovAssist AI</span>
            <span>— Developed for Smart India Hackathon & AI Governance</span>
          </div>
          <div>
            Built with React, Vite, FastAPI, SQLite & Local Explainable AI
          </div>
        </div>
      </footer>
    </div>
  );
}

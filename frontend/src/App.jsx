import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import DocumentAnalysisPage from './pages/DocumentAnalysisPage';
import SchemeRecommendationsPage from './pages/SchemeRecommendationsPage';
import SchemeDetailsPage from './pages/SchemeDetailsPage';
import EligibilityResultsPage from './pages/EligibilityResultsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSchemeManagementPage from './pages/AdminSchemeManagementPage';
import AdminUsersPage from './pages/AdminUsersPage';

import { eligibilityApi } from './services/api';

function AppContent() {
  const { user, login, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [initialChatQuery, setInitialChatQuery] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Default redirect on auth state change
  useEffect(() => {
    if (user && activeTab === 'landing') {
      setActiveTab(user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } else if (!user && activeTab !== 'login' && activeTab !== 'register' && activeTab !== 'landing') {
      setActiveTab('landing');
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 4500);
  };

  const handleQuickDemoLogin = async (role) => {
    try {
      if (role === 'citizen') {
        await login('citizen@govassist.in', 'Citizen@123');
        showToast('Logged in as Demo Citizen (Ramesh Kumar Sharma)', 'success');
        setActiveTab('dashboard');
      } else {
        await login('admin@govassist.in', 'Admin@123');
        showToast('Logged in as Central Administrator', 'success');
        setActiveTab('admin-dashboard');
      }
    } catch (e) {
      console.error(e);
      showToast('Demo login failed. Make sure backend is running.', 'error');
    }
  };

  const handleTriggerEligibilityCheck = async () => {
    setIsEvaluating(true);
    try {
      const res = await eligibilityApi.check();
      showToast(`AI Eligibility calculated across ${res.results.length} schemes!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to calculate eligibility', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAskAboutScheme = (scheme) => {
    setInitialChatQuery(`What are the key benefits and required documents for ${scheme.name} (${scheme.code})?`);
    setActiveTab('chatbot');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            GovAssist AI Initializing...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Render Sidebar only when authenticated and not on landing/auth */}
        {user && activeTab !== 'landing' && activeTab !== 'login' && activeTab !== 'register' && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onTriggerEligibilityCheck={handleTriggerEligibilityCheck}
            isEvaluating={isEvaluating}
          />
        )}

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'landing' && (
            <LandingPage
              setActiveTab={setActiveTab}
              onQuickDemoLogin={handleQuickDemoLogin}
            />
          )}

          {activeTab === 'login' && (
            <LoginPage setActiveTab={setActiveTab} showToast={showToast} />
          )}

          {activeTab === 'register' && (
            <RegisterPage setActiveTab={setActiveTab} showToast={showToast} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onSelectScheme={setSelectedScheme}
              showToast={showToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              showToast={showToast}
              onTriggerEligibilityCheck={handleTriggerEligibilityCheck}
            />
          )}

          {activeTab === 'upload-doc' && (
            <DocumentUploadPage
              setActiveTab={setActiveTab}
              onSelectDocForAnalysis={setSelectedDocId}
              showToast={showToast}
            />
          )}

          {activeTab === 'doc-analysis' && (
            <DocumentAnalysisPage
              selectedDocId={selectedDocId}
              setActiveTab={setActiveTab}
              showToast={showToast}
              onTriggerEligibilityCheck={handleTriggerEligibilityCheck}
            />
          )}

          {activeTab === 'schemes' && (
            <SchemeRecommendationsPage
              setActiveTab={setActiveTab}
              onSelectScheme={setSelectedScheme}
              showToast={showToast}
              onTriggerEligibilityCheck={handleTriggerEligibilityCheck}
              isEvaluating={isEvaluating}
            />
          )}

          {activeTab === 'scheme-details' && (
            <SchemeDetailsPage
              scheme={selectedScheme}
              onBack={() => setActiveTab('schemes')}
              setActiveTab={setActiveTab}
              onAskAboutScheme={handleAskAboutScheme}
            />
          )}

          {activeTab === 'eligibility' && (
            <EligibilityResultsPage
              setActiveTab={setActiveTab}
              onSelectScheme={setSelectedScheme}
              showToast={showToast}
              onTriggerEligibilityCheck={handleTriggerEligibilityCheck}
              isEvaluating={isEvaluating}
            />
          )}

          {activeTab === 'chatbot' && (
            <AIAssistantPage
              onSelectScheme={setSelectedScheme}
              setActiveTab={setActiveTab}
              initialQuery={initialChatQuery}
            />
          )}

          {activeTab === 'history' && <HistoryPage showToast={showToast} />}

          {/* Admin Pages */}
          {activeTab === 'admin-dashboard' && (
            <AdminDashboardPage setActiveTab={setActiveTab} showToast={showToast} />
          )}

          {activeTab === 'admin-schemes' && (
            <AdminSchemeManagementPage showToast={showToast} />
          )}

          {activeTab === 'admin-users' && (
            <AdminUsersPage showToast={showToast} />
          )}
        </main>
      </div>

      {/* Global Toast */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

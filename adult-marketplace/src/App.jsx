import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import HomePage from './pages/HomePage';
import CreatorPage from './pages/Creator/CreatorPage';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatorRegisterPage from './pages/Creator/CreatorRegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import CreatorDashboardPage from './pages/Creator/CreatorDashboardPage';
import CreatorPostsPage from './pages/Creator/CreatorPostsPage';
import UploadContentPage from './pages/Creator/UploadContentPage';

import AgeGate from './components/AgeGate';
import ProtectedRoute from './components/ProtectedRoute';

// Static Pages
import TermsPage from './pages/Static/TermsPage';
import PrivacyPage from './pages/Static/PrivacyPage';
import SupportPage from './pages/Static/SupportPage';

// Creator Pages
import CreatorProfilePage from './pages/Creator/CreatorProfilePage';
import CreatorMessagesPage from './pages/Creator/CreatorMessagesPage';
import CreatorEarningsPage from './pages/Creator/CreatorEarningsPage';
import CreatorSubscribersPage from './pages/Creator/CreatorSubscribersPage';
import CreatorNotificationsPage from './pages/Creator/CreatorNotificationsPage';
import CreatorPostEditPage from './pages/Creator/CreatorPostEditPage';
import CreatorSettingsPage from './pages/Creator/creatorSettingsPage.jsx';


function App() {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('adultVerified') === 'true';
    setIsVerified(verified);
  }, []);

  if (!isVerified) {
    return <AgeGate onVerify={() => setIsVerified(true)} />;
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Público */}
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/creator/:id" element={<CreatorPage />} />

          {/* Autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Criador - registro */}
          <Route path="/creator-register" element={<CreatorRegisterPage />} />

          {/* ========================================
              REDIRECTS - Old Routes to New Routes
              /creator-* → /creator/*
              ======================================== */}
          <Route path="/creator-dashboard" element={<Navigate to="/creator/dashboard" replace />} />
          <Route path="/creator-posts" element={<Navigate to="/creator/posts" replace />} />
          <Route path="/creator-upload" element={<Navigate to="/creator/upload" replace />} />
          <Route path="/creator-earnings" element={<Navigate to="/creator/earnings" replace />} />
          <Route path="/creator-messages" element={<Navigate to="/creator/messages" replace />} />
          <Route path="/creator-subscribers" element={<Navigate to="/creator/subscribers" replace />} />
          <Route path="/creator-analytics" element={<Navigate to="/creator/analytics" replace />} />
          <Route path="/creator-notifications" element={<Navigate to="/creator/notifications" replace />} />
          <Route path="/creator-settings" element={<Navigate to="/creator/settings" replace />} />
          <Route path="/creator-profile" element={<Navigate to="/creator/profile" replace />} />

          {/* ========================================
              CREATOR ROUTES - Protected
              Pattern: /creator/*
              ======================================== */}
          <Route 
            path="/creator/dashboard" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/posts" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorPostsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/upload" 
            element={
              <ProtectedRoute requireCreator>
                <UploadContentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/earnings" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorEarningsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/messages" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorMessagesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/subscribers" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorSubscribersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/notifications" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorNotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/profile" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/settings" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorSettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/creator/posts/:id/edit" 
            element={
              <ProtectedRoute requireCreator>
                <CreatorPostEditPage />
              </ProtectedRoute>
            } 
          />
  
          {/* ========================================
              STATIC / LEGAL PAGES
              ======================================== */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* ========================================
              SUBSCRIBER ROUTES - TODO: Create pages
              ======================================== */}
          <Route path="/profile" element={<div>Profile Page (TODO)</div>} />
          <Route path="/explore" element={<div>Explore Page (TODO)</div>} />
          <Route path="/my-subscriptions" element={<div>My Subscriptions (TODO)</div>} />
          <Route path="/messages" element={<div>Messages Page (TODO)</div>} />
          <Route path="/favorites" element={<div>Favorites Page (TODO)</div>} />
          <Route path="/settings" element={<div>Settings Page (TODO)</div>} />
          <Route path="/notifications" element={<div>Notifications Page (TODO)</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
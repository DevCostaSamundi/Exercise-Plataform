import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// Placeholders (ver seções abaixo; você pode criar os arquivos correspondentes)
import TermsPage from './pages/Static/TermsPage';
import PrivacyPage from './pages/Static/PrivacyPage';
import SupportPage from './pages/Static/SupportPage';

import CreatorProfilePage from './pages/Creator/CreatorProfilePage';
import CreatorMessagesPage from './pages/Creator/CreatorMessagesPage';
import CreatorEarningsPage from './pages/Creator/CreatorEarningsPage';
import CreatorSubscribersPage from './pages/Creator/CreatorSubscribersPage';
import CreatorNotificationsPage from './pages/Creator/CreatorNotificationsPage';
import CreatorPostEditPage from './pages/Creator/CreatorPostEditPage';

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

          {/* Criador - registro + área logada */}
          <Route path="/creator-register" element={<CreatorRegisterPage />} />
          <Route path="/creator/dashboard" element={<CreatorDashboardPage />} />
          <Route path="/creator/posts" element={<CreatorPostsPage />} />
          <Route path="/creator/upload" element={<UploadContentPage />} />

          {/* Criador - páginas auxiliares (placeholders) */}
          <Route path="/creator/profile" element={<CreatorProfilePage />} />
          <Route path="/creator/messages" element={<CreatorMessagesPage />} />
          <Route path="/creator/earnings" element={<CreatorEarningsPage />} />
          <Route path="/creator/subscribers" element={<CreatorSubscribersPage />} />
          <Route path="/creator/notifications" element={<CreatorNotificationsPage />} />
          <Route path="/creator/posts/:id/edit" element={<CreatorPostEditPage />} />

          {/* Estático / institucional */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
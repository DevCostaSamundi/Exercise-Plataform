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
import HelpPage from './pages/HelpPage';
import SafetyPage from './pages/SafetyPage';

// Public Pages
import TrendingPage from './pages/TrendingPage';
import ExplorePage from './pages/ExplorePage';
import FavoritesPage from './pages/FavoritesPage';
import MySubscriptionsPage from './pages/MySubscriptionsPage';

// Subscriber Pages
import PostView from './pages/subscriber/PostView';
import Settings from './pages/subscriber/Settings';
import Profile from './pages/subscriber/Profile';
import Notifications from './pages/subscriber/Notifications';

// Creator Pages
import CreatorProfilePage from './pages/Creator/CreatorProfilePage';
import CreatorMessagesPage from './pages/Creator/CreatorMessagesPage';
import CreatorEarningsPage from './pages/Creator/CreatorEarningsPage';
import CreatorSubscribersPage from './pages/Creator/CreatorSubscribersPage';
import CreatorNotificationsPage from './pages/Creator/CreatorNotificationsPage';
import CreatorPostEditPage from './pages/Creator/CreatorPostEditPage';
import CreatorSettingsPage from './pages/Creator/creatorSettingsPage.jsx';
import CreatorAnalyticsPage from './pages/Creator/CreatorAnalyticsPage';

import CreatorStorePage from './pages/Creator/CreatorStorePage';
import CreatorOrdersPage from './pages/Creator/CreatorOrdersPage';

import MessagesPage from './pages/subscriber/MessagesPage.jsx';
import Chat from './pages/subscriber/Chat.jsx';
import Wallet from './pages/subscriber/Wallet.jsx';
import Transactions from './pages/subscriber/Transactions.jsx';
import OrdersPage from './pages/subscriber/OrdersPage.jsx';
import Deposit from './pages/Deposit.jsx';
import PaymentStatus from './pages/PaymentStatus.jsx';

// AI Pages
import AiCatalogPage from './pages/AiCatalogPage.jsx';
import AiCompanionProfilePage from './pages/AiCompanionProfilePage.jsx';
import AiChatPage from './pages/subscriber/AiChatPage.jsx';
import AiCreatePage from './pages/Creator/AiCreatePage.jsx';

import { UIProvider } from './contexts/UIContext';
import { NotificationProvider } from './contexts/NotificationContext';

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
    <UIProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/post/:postId" element={<PostView />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/creator-register" element={<CreatorRegisterPage />} />

              {/* Redirects — rotas antigas */}
              <Route path="/creator-dashboard" element={<Navigate to="/creator/dashboard" replace />} />
              <Route path="/creator-posts" element={<Navigate to="/creator/posts" replace />} />
              <Route path="/creator-upload" element={<Navigate to="/creator/upload" replace />} />
              <Route path="/creator-earnings" element={<Navigate to="/creator/earnings" replace />} />
              <Route path="/creator-subscribers" element={<Navigate to="/creator/subscribers" replace />} />
              <Route path="/creator-analytics" element={<Navigate to="/creator/analytics" replace />} />
              <Route path="/creator-notifications" element={<Navigate to="/creator/notifications" replace />} />
              <Route path="/creator-settings" element={<Navigate to="/creator/settings" replace />} />
              <Route path="/creator-profile" element={<Navigate to="/creator/profile" replace />} />

              {/* ── Creator Routes (protegidas) ──────────────────────────────────
                ⚠️  Rotas estáticas ANTES de /creator/:id para evitar conflito   */}

              <Route path="/creator/store" element={<ProtectedRoute requireCreator><CreatorStorePage /></ProtectedRoute>} />
              <Route path="/creator/orders" element={<ProtectedRoute requireCreator><CreatorOrdersPage /></ProtectedRoute>} />

              <Route path="/creator/dashboard"
                element={<ProtectedRoute requireCreator><CreatorDashboardPage /></ProtectedRoute>} />
              <Route path="/creator/posts"
                element={<ProtectedRoute requireCreator><CreatorPostsPage /></ProtectedRoute>} />
              <Route path="/creator/posts/:id/edit"
                element={<ProtectedRoute requireCreator><CreatorPostEditPage /></ProtectedRoute>} />
              <Route path="/creator/upload"
                element={<ProtectedRoute requireCreator><UploadContentPage /></ProtectedRoute>} />
              <Route path="/creator/earnings"
                element={<ProtectedRoute requireCreator><CreatorEarningsPage /></ProtectedRoute>} />
              <Route path="/creator/messages"
                element={<ProtectedRoute requireCreator><CreatorMessagesPage /></ProtectedRoute>} />
              <Route path="/creator/subscribers"
                element={<ProtectedRoute requireCreator><CreatorSubscribersPage /></ProtectedRoute>} />
              <Route path="/creator/analytics"
                element={<ProtectedRoute requireCreator><CreatorAnalyticsPage /></ProtectedRoute>} />
              <Route path="/creator/notifications"
                element={<ProtectedRoute requireCreator><CreatorNotificationsPage /></ProtectedRoute>} />
              <Route path="/creator/profile"
                element={<ProtectedRoute requireCreator><CreatorProfilePage /></ProtectedRoute>} />
              <Route path="/creator/settings"
                element={<ProtectedRoute requireCreator><CreatorSettingsPage /></ProtectedRoute>} />

              {/* /creator/:id — SEMPRE por último */}
              <Route path="/creator/:id" element={<CreatorPage />} />

              {/* ── Subscriber Routes (protegidas) ───────────────────────────── */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/messages/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
              <Route path="/payment-status/:paymentId" element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />

              {/* ── Public Pages ─────────────────────────────────────────────── */}
              <Route path="/ai" element={<AiCatalogPage />} />
              <Route path="/ai/:idOrSlug" element={<AiCompanionProfilePage />} />

              {/* ── AI Protected Routes ────────────────────────────────────────── */}
              <Route path="/ai/:companionId/chat" element={<ProtectedRoute><AiChatPage /></ProtectedRoute>} />
              <Route path="/creator/ai/new" element={<ProtectedRoute><AiCreatePage /></ProtectedRoute>} />

              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/my-subscriptions" element={<MySubscriptionsPage />} />

              {/* ── Static / Legal ───────────────────────────────────────────── */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/safety" element={<SafetyPage />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </UIProvider>
  );
}

export default App;
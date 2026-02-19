import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileBottomNav from './components/MobileBottomNav';
import HomePage from './pages/HomePage';
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

// Launchpad Pages
import CreateTokenPage from './pages/CreateTokenPage';
import TokenDetailPage from './pages/TokenDetailPage';
import MyPortfolioPage from './pages/MyPortfolioPage';
import CreatorDashboard from './pages/CreatorDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />

              {/* ========================================
              LAUNCHPAD ROUTES
              ======================================== */}
              <Route path="/launch" element={<CreateTokenPage />} />
              <Route path="/token/:tokenAddress" element={<TokenDetailPage />} />
              <Route
                path="/portfolio"
                element={
                  <ProtectedRoute>
                    <MyPortfolioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/creator"
                element={
                  <ProtectedRoute>
                    <CreatorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ========================================
              PUBLIC PAGES
              ======================================== */}
              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/explore" element={<ExplorePage />} />

              <Route path="/admin" element={<AdminDashboard />} />

              {/* ========================================
              STATIC / LEGAL PAGES
              ======================================== */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/safety" element={<SafetyPage />} />
        </Routes>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/Creator/CreatorPage';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatorRegisterPage from './pages/Creator/CreatorRegisterPage';
import AgeGate from './components/AgeGate';
import CreatorPostsPage from './pages/Creator/CreatorPostsPage';
import UploadContentPage from './pages/Creator/UploadContentPage';
import { useState, useEffect } from 'react';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CreatorDashboardPage from './pages/Creator/CreatorDashboardPage';


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
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/creator/:id" element={<CreatorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/creator-register" element={<CreatorRegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/creator-dashboard" element={<CreatorDashboardPage />} />
          <Route path="/upload-content" element={<UploadContentPage />} />
          <Route path="/creator-posts" element={<CreatorPostsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
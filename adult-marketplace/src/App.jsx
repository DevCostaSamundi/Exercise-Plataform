import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreatorPage from './pages/CreatorPage';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatorRegisterPage from './pages/CreatorRegisterPage';
import AgeGate from './components/AgeGate';
import { useState, useEffect } from 'react';

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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
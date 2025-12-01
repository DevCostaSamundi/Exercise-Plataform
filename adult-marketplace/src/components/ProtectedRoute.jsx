import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, requireCreator = false }) {
  const location = useLocation();
  
  // Pegar token e usuário do localStorage
  const authToken = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  
  // Debug
  console.log('🔐 ProtectedRoute - Token existe? ', !!authToken);
  console. log('🔐 ProtectedRoute - User string:', userStr);
  
  // Se não tem token OU não tem dados de usuário, redireciona para login
  if (!authToken || !userStr) {
    console.warn('❌ Sem autenticação - redirecionando para /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  let user = null;
  try {
    user = JSON.parse(userStr);
    console.log('👤 ProtectedRoute - User parsed:', user);
  } catch (error) {
    console. error('❌ Erro ao parsear user do localStorage:', error);
    // Se falhar ao parsear, limpa e redireciona
    localStorage. removeItem('authToken');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Se a rota requer criador, verifica se é criador
  if (requireCreator) {
    const isCreator = 
      user?.role?. toLowerCase() === 'creator' || 
      user?.isCreator === true;
    
    console.log('🎭 ProtectedRoute - Requer criador?', requireCreator);
    console.log('🎭 ProtectedRoute - É criador?', isCreator);
    console.log('🎭 ProtectedRoute - Role:', user?.role);
    
    if (!isCreator) {
      console.warn('❌ Não é criador - redirecionando para /');
      return <Navigate to="/" replace />;
    }
  }
  
  console.log('✅ ProtectedRoute - Autorizado!  Renderizando children');
  return children;
}
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * OwnerRoute - Protege rotas exclusivas do OWNER_WALLET
 * Se não for owner, redireciona para home
 */
export default function OwnerRoute({ children }) {
  const { isConnected, isConnecting, isOwner } = useAuth();

  // Aguardar conexão
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  // Não conectado ou não é owner → redireciona silenciosamente
  if (!isConnected || !isOwner) {
    return <Navigate to="/" replace />;
  }

  return children;
}

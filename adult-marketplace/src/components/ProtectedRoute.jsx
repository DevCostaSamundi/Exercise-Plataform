import { Navigate, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';

/**
 * ProtectedRoute - Web3 Pure
 * Só precisa verificar se a carteira está conectada
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isConnected, isConnecting } = useAccount();

  // Aguardar conexão (evitar flash)
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Verificando carteira...</p>
        </div>
      </div>
    );
  }

  // Se não conectado, redireciona para home (onde pode conectar)
  if (!isConnected) {
    console.warn('❌ Carteira não conectada - redirecionando para home');
    return <Navigate to="/" state={{ from: location, connectWallet: true }} replace />;
  }

  return children;
}

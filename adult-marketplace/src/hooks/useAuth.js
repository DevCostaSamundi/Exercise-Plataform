/**
 * Hook customizado para usar Autenticação
 * Re-export do AuthContext para facilitar uso
 *
 * Uso:
 *   import { useAuth } from '../hooks/useAuth';
 *   const { user, login, logout, isAuthenticated } = useAuth();
 */

export { useAuth } from '../contexts/AuthContext';
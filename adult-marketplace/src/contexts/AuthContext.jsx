import { createContext, useContext, useMemo } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

const AuthContext = createContext();

// Owner wallet - quem tem acesso admin
const OWNER_WALLET = (import.meta.env.VITE_OWNER_WALLET || '').toLowerCase();

/**
 * AuthProvider - Web3 Pure Authentication
 * No email, no password, no backend - just wallet
 */
export function AuthProvider({ children }) {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Verifica se a wallet conectada é do OWNER
  const isOwner = useMemo(() => {
    if (!address || !OWNER_WALLET) return false;
    return address.toLowerCase() === OWNER_WALLET;
  }, [address]);

  // Em Web3, o endereço da carteira É a identidade
  const user = isConnected ? {
    address,
    displayName: `${address?.slice(0, 6)}...${address?.slice(-4)}`,
    isOwner,
  } : null;

  const logout = () => {
    disconnect();
  };

  const value = {
    // Wallet info
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    
    // Owner check
    isOwner,
    
    // User (derivado do address)
    user,
    
    // Loading state
    loading: isConnecting,
    
    // Actions
    logout,
    
    // Deprecated (mantido para compatibilidade, mas sempre null/false)
    userType: null,
    isAuthenticated: isConnected,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { createContext, useContext } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

const AuthContext = createContext();

/**
 * AuthProvider - Web3 Pure Authentication
 * No email, no password, no backend - just wallet
 */
export function AuthProvider({ children }) {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Em Web3, o endereço da carteira É a identidade
  const user = isConnected ? {
    address,
    displayName: `${address?.slice(0, 6)}...${address?.slice(-4)}`,
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

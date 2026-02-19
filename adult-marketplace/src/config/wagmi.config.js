import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Determine which chain to use
const isProduction = import.meta.env.VITE_NETWORK === 'base' || import.meta.env.NODE_ENV === 'production';
const currentChain = isProduction ? base : baseSepolia;

// RPC URLs
const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org';
const baseSepoliaRpcUrl = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

console.log('🚀 Wagmi Config:', {
  network: isProduction ? 'Base Mainnet' : 'Base Sepolia Testnet',
  chainId: currentChain.id,
  rpcUrl: isProduction ? baseRpcUrl : baseSepoliaRpcUrl,
});

export const wagmiConfig = createConfig({
  chains: [currentChain],
  connectors: [
    injected({ 
      shimDisconnect: true,
    }),
    walletConnect({ 
      projectId,
      showQrModal: true,
    }),
    coinbaseWallet({ 
      appName: 'Launchpad 2.0',
      appLogoUrl: 'https://launchpad2.com/logo.png',
    }),
  ],
  transports: {
    [base.id]: http(baseRpcUrl),
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
  },
  ssr: false,
});
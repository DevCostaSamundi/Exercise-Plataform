import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Determine which chain to use
const isProduction = import.meta.env.VITE_NETWORK === 'polygon' || import.meta.env.NODE_ENV === 'production';
const currentChain = isProduction ? polygon : polygonAmoy;

// RPC URLs
const polygonRpcUrl = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com';
const amoyRpcUrl = import.meta.env.VITE_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';

console.log('🔧 Wagmi Config:', {
  network: isProduction ? 'Polygon Mainnet' : 'Polygon Amoy Testnet',
  chainId: currentChain.id,
  rpcUrl: isProduction ? polygonRpcUrl : amoyRpcUrl,
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
      appName: 'FlowConnect',
      appLogoUrl: 'https://prideconnect.com/logo.png',
    }),
  ],
  transports: {
    [polygon.id]: http(polygonRpcUrl),
    [polygonAmoy.id]: http(amoyRpcUrl),
  },
  ssr: false,
});
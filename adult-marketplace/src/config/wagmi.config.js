import { createConfig, http, fallback } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Determine which chain to use
const isProduction = import.meta.env.VITE_NETWORK === 'base';
const currentChain = isProduction ? base : baseSepolia;

// RPC URLs — múltiplos fallbacks para maior fiabilidade
const customSepoliaRpc = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL;
const customBaseRpc = import.meta.env.VITE_BASE_RPC_URL;

// Base Sepolia — RPCs públicos ordenados por velocidade/fiabilidade
const baseSepoliaTransport = fallback([
  ...(customSepoliaRpc ? [http(customSepoliaRpc)] : []),
  http('https://base-sepolia-rpc.publicnode.com'),
  http('https://base-sepolia.blockpi.network/v1/rpc/public'),
  http('https://sepolia.base.org'),
], { rank: false });

// Base Mainnet fallbacks
const baseMainnetTransport = fallback([
  ...(customBaseRpc ? [http(customBaseRpc)] : []),
  http('https://base-rpc.publicnode.com'),
  http('https://base.blockpi.network/v1/rpc/public'),
  http('https://mainnet.base.org'),
], { rank: false });

console.log('🚀 Wagmi Config:', {
  network: isProduction ? 'Base Mainnet' : 'Base Sepolia Testnet',
  chainId: currentChain.id,
  rpcs: isProduction ? 'base mainnet (3 fallbacks)' : 'base sepolia (3 fallbacks)',
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
    [base.id]: baseMainnetTransport,
    [baseSepolia.id]: baseSepoliaTransport,
  },
  ssr: false,
});
import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// ✅ CORRIGIDO: import.meta.env.NODE_ENV não existe no Vite — usar import.meta.env.PROD
const isProduction = import.meta.env.VITE_NETWORK === 'polygon' || import.meta.env.PROD;
const currentChain = isProduction ? polygon : polygonAmoy;

const polygonRpcUrl = import.meta.env.VITE_POLYGON_RPC_URL     || 'https://polygon-rpc.com';
const amoyRpcUrl    = import.meta.env.VITE_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';

// ✅ CORRIGIDO: console.log removido — expunha config em produção

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
      appName: import.meta.env.VITE_APP_NAME || 'FlowConnect',
      // ✅ CORRIGIDO: URL antiga 'prideconnect.com' substituída por env var
      appLogoUrl: import.meta.env.VITE_FRONTEND_URL
        ? `${import.meta.env.VITE_FRONTEND_URL}/logo.png`
        : `${window.location.origin}/logo.png`,
    }),
  ],
  transports: {
    [polygon.id]:     http(polygonRpcUrl),
    [polygonAmoy.id]: http(amoyRpcUrl),
  },
  ssr: false,
});
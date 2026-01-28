import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
    chains: [
        process.env.NODE_ENV === 'production' ? polygon : polygonAmoy,
    ],
    connectors: [
        injected(), // MetaMask, etc
        walletConnect({ projectId }), // WalletConnect
        coinbaseWallet({ appName: 'PrideConnect' }), // Coinbase Wallet
    ],
    transports: {
        [polygon.id]: http(import.meta.env.VITE_POLYGON_RPC_URL),
        [polygonAmoy.id]: http(import.meta.env.VITE_MUMBAI_RPC_URL),
    },
});
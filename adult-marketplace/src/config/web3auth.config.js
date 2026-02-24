import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

// Determine if mainnet or testnet
const isMainnet = import.meta.env.VITE_NETWORK === 'polygon';
const isTestnet = import.meta.env.VITE_NETWORK === 'polygon-amoy';

// Chain configuration
const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: isMainnet ? '0x89' : '0x13882', // Polygon Mainnet: 137, Amoy: 80002
    rpcTarget: import.meta.env.VITE_RPC_URL || 'https://polygon-amoy-bor-rpc.publicnode.com', // Fallback RPC
    displayName: isMainnet ? 'Polygon Mainnet' : 'Polygon Amoy Testnet',
    blockExplorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://amoy.polygonscan.com',
    ticker: 'MATIC',
    tickerName: 'MATIC',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
};

console.log('🔧 Web3Auth Config:', {
    network: import.meta.env.VITE_NETWORK,
    chainId: chainConfig.chainId,
    rpcTarget: chainConfig.rpcTarget,
    clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID?.slice(0, 10) + '...',
});

// Validate configuration
if (!chainConfig.rpcTarget) {
    console.error('❌ RPC Target is not configured. Please set VITE_RPC_URL in .env file. Using fallback.');
}

if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
    console.warn('⚠️ Web3Auth Client ID is not configured. Web3Auth will be disabled.');
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
});

export const web3AuthConfig = {
    clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
    web3AuthNetwork: import.meta.env.VITE_WEB3AUTH_NETWORK || WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    chainConfig,
    privateKeyProvider,
    uiConfig: {
        appName: import.meta.env.VITE_APP_NAME || 'FlowConnect',
        appUrl: import.meta.env.VITE_FRONTEND_URL || window.location.origin,
        theme: {
            primary: import.meta.env.VITE_PRIMARY_COLOR || '#9333ea',
        },
        logoLight: 'https://web3auth.io/images/web3authlog.png',
        logoDark: 'https://web3auth.io/images/web3authlogodark.png',
        defaultLanguage: 'en',
        mode: 'auto',
        useLogoLoader: true,
    },
};

export const createWeb3AuthInstance = () => {
    try {
        const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;

        if (!clientId) {
            console.warn('⚠️ VITE_WEB3AUTH_CLIENT_ID not set');
            return null;
        }

        const web3auth = new Web3Auth({
            clientId,
            web3AuthNetwork: import.meta.env.VITE_WEB3AUTH_NETWORK === 'sapphire_mainnet'
                ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
                : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
            chainConfig,
            privateKeyProvider,
        });

        return web3auth;
    } catch (err) {
        console.error('❌ Error creating Web3Auth instance:', err);
        return null;
    }
};
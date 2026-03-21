import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';

const isMainnet = import.meta.env.VITE_NETWORK === 'polygon';

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: isMainnet ? '0x89' : '0x13882',
    rpcTarget: import.meta.env.VITE_RPC_URL || 'https://polygon-amoy-bor-rpc.publicnode.com',
    displayName: isMainnet ? 'Polygon Mainnet' : 'Polygon Amoy Testnet',
    blockExplorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://amoy.polygonscan.com',
    ticker: 'POL',
    tickerName: 'POL',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
};

const getNetwork = () => {
    const network = import.meta.env.VITE_WEB3AUTH_NETWORK;
    if (network === 'sapphire_mainnet') return WEB3AUTH_NETWORK.SAPPHIRE_MAINNET;
    return WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;
};

export const createWeb3AuthInstance = () => {
    try {
        const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;
        const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

        if (!clientId) {
            if (import.meta.env.DEV) {
                console.warn('⚠️ VITE_WEB3AUTH_CLIENT_ID not set');
            }
            return null;
        }

        console.log('🔧 Creating Web3Auth instance with:');
        console.log('  - Client ID:', clientId.substring(0, 20) + '...');
        console.log('  - Network:', getNetwork());
        console.log('  - Frontend URL:', frontendUrl);

        // ✅ v10 Modal: NÃO passar privateKeyProvider para EIP155!
        // O modal v10 cria internamente um wsEmbedInstance para EIP155/SOLANA.
        // Passar privateKeyProvider faz com que ele pule a criação do wsEmbedInstance,
        // causando o erro "loginWithSessionId" null.
        const web3auth = new Web3Auth({
            clientId,
            web3AuthNetwork: getNetwork(),
            chainConfig,
            uiConfig: {
                appName: import.meta.env.VITE_APP_NAME || 'FlowConnect',
                appUrl: frontendUrl,
                theme: {
                    primary: import.meta.env.VITE_PRIMARY_COLOR || '#9333ea',
                },
                logoLight: 'https://web3auth.io/images/web3authlog.png',
                logoDark: 'https://web3auth.io/images/web3authlogodark.png',
                defaultLanguage: 'en',
                mode: 'light',
                useLogoLoader: true,
                loginGridCols: 2,
                uxMode: 'popup',
            },
            redirectUrl: frontendUrl,
            enableLogging: true,
            sessionTime: 86400,
        });

        console.log('✅ Web3Auth instance created successfully');
        return web3auth;
    } catch (err) {
        if (import.meta.env.DEV) {
            console.error('❌ Error creating Web3Auth instance:', err);
        }
        return null;
    }
};
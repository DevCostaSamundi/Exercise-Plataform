import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: import.meta.env.VITE_NETWORK === 'mainnet' ? '0x89' : '0x13882', // Polygon or Amoy
    rpcTarget: import.meta.env.VITE_NETWORK === 'mainnet'
        ? import.meta.env.VITE_POLYGON_RPC_URL
        : import.meta.env.VITE_POLYGON_AMOY_RPC_URL,
    displayName: import.meta.env.VITE_NETWORK === 'mainnet' ? 'Polygon Mainnet' : 'Polygon Amoy Testnet',
    blockExplorerUrl: import.meta.env.VITE_NETWORK === 'mainnet'
        ? 'https://polygonscan.com'
        : 'https://amoy.polygonscan.com',
    ticker: 'MATIC',
    tickerName: 'MATIC',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
});

export const web3AuthConfig = {
    clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
    web3AuthNetwork: import.meta.env.VITE_WEB3AUTH_NETWORK || WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    chainConfig,
    privateKeyProvider,
    uiConfig: {
        appName: 'PrideConnect',
        appUrl: import.meta.env.VITE_FRONTEND_URL,
        theme: {
            primary: '#7c3aed', // Purple
        },
        logoLight: 'https://yourdomain.com/logo-light.png',
        logoDark: 'https://yourdomain.com/logo-dark.png',
        defaultLanguage: 'en',
        mode: 'light',
        useLogoLoader: true,
    },
};

export const createWeb3AuthInstance = () => {
    return new Web3Auth(web3AuthConfig);
};
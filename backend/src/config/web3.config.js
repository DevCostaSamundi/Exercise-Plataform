import dotenv from 'dotenv';
dotenv.config();

/**
 * Web3 Configuration
 * Settings for blockchain interaction, Web3Auth, and Transak
 */

export const web3Config = {
    // Polygon Network Configuration
    polygon: {
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        chainId: 137,
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        blockExplorer: 'https://polygonscan.com',
    },

    // Mumbai Testnet Configuration
    mumbai: {
        rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
        chainId: 80001,
        chainName: 'Polygon Mumbai',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        blockExplorer: 'https://mumbai.polygonscan.com',
    },

    // Smart Contract Configuration
    contract: {
        address: process.env.PAYMENT_CONTRACT_ADDRESS,
        // ABI will be loaded from artifacts
    },

    // USDC Token Configuration
    usdc: {
        polygon: {
            address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            decimals: 6,
            symbol: 'USDC',
        },
        mumbai: {
            address: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
            decimals: 6,
            symbol: 'USDC',
        },
    },

    // Platform Wallet
    platformWallet: process.env.PLATFORM_WALLET_ADDRESS,

    // Web3Auth Configuration
    web3auth: {
        clientId: process.env.WEB3AUTH_CLIENT_ID,
        network: process.env.WEB3AUTH_NETWORK || 'mainnet', // 'mainnet' | 'testnet' | 'cyan'
        chainConfig: {
            chainNamespace: 'eip155',
            chainId: '0x89', // Polygon (137 in hex)
            rpcTarget: process.env.POLYGON_RPC_URL,
            displayName: 'Polygon Mainnet',
            blockExplorer: 'https://polygonscan.com',
            ticker: 'MATIC',
            tickerName: 'Polygon',
        },
    },

    // Transak Configuration
    transak: {
        apiKey: process.env.TRANSAK_API_KEY,
        environment: process.env.TRANSAK_ENV || 'PRODUCTION', // 'STAGING' | 'PRODUCTION'
        webhookSecret: process.env.TRANSAK_WEBHOOK_SECRET,
        apiUrl:
            process.env.TRANSAK_ENV === 'STAGING'
                ? 'https://api-stg.transak.com/api/v1'
                : 'https://api.transak.com/api/v1',
        widgetUrl:
            process.env.TRANSAK_ENV === 'STAGING'
                ? 'https://global-stg.transak.com'
                : 'https://global.transak.com',

        // Default configuration
        defaultCrypto: 'USDC',
        defaultNetwork: 'polygon',
        defaultFiat: 'USD',

        // Supported payment methods
        paymentMethods: ['credit_debit_card', 'pix', 'bank_transfer', 'google_pay', 'apple_pay'],
    },

    // Blockchain Monitoring
    monitoring: {
        confirmationsRequired: parseInt(process.env.CONFIRMATIONS_REQUIRED || '2'),
        pollingInterval: parseInt(process.env.POLLING_INTERVAL || '30000'), // 30 seconds
        maxRetries: parseInt(process.env.MAX_RETRIES || '5'),
    },

    // Payment Settings
    payment: {
        minAmount: parseFloat(process.env.MIN_PAYMENT_AMOUNT || '1'), // $1 USD minimum
        maxAmount: parseFloat(process.env.MAX_PAYMENT_AMOUNT || '10000'), // $10,000 USD maximum
        platformFeePercent: 10, // 10% platform fee
        expirationMinutes: parseInt(process.env.PAYMENT_EXPIRATION_MINUTES || '15'), // 15 minutes
    },
};

// Validate required configuration
export function validateWeb3Config() {
    const required = [
        'POLYGON_RPC_URL',
        'PAYMENT_CONTRACT_ADDRESS',
        'PLATFORM_WALLET_ADDRESS',
        'WEB3AUTH_CLIENT_ID',
        'TRANSAK_API_KEY',
        'TRANSAK_WEBHOOK_SECRET',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required Web3 configuration: ${missing.join(', ')}\n` +
            'Please check your .env file.'
        );
    }

    // Validate addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;

    if (!addressRegex.test(process.env.PAYMENT_CONTRACT_ADDRESS)) {
        throw new Error('Invalid PAYMENT_CONTRACT_ADDRESS format');
    }

    if (!addressRegex.test(process.env.PLATFORM_WALLET_ADDRESS)) {
        throw new Error('Invalid PLATFORM_WALLET_ADDRESS format');
    }

    console.log('✅ Web3 configuration validated successfully');
}

// Get current network configuration
export function getCurrentNetwork() {
    const env = process.env.NODE_ENV;
    return env === 'production' ? web3Config.polygon : web3Config.mumbai;
}

// Get USDC configuration for current network
export function getUSDCConfig() {
    const env = process.env.NODE_ENV;
    return env === 'production' ? web3Config.usdc.polygon : web3Config.usdc.mumbai;
}

export default web3Config;

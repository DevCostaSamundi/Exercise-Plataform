import dotenv from 'dotenv';
dotenv.config();

/**
 * Web3 Configuration
 * 100% Crypto Native - No Fiat On-Ramp, No Intermediaries
 * Settings for blockchain interaction and Web3Auth
 */

export const web3Config = {
    // Polygon Mainnet Configuration
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

    // Polygon Amoy Testnet Configuration
    amoy: {
        rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
        chainId: 80002,
        chainName: 'Polygon Amoy Testnet',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        blockExplorer: 'https://amoy.polygonscan.com',
    },

    // Smart Contract Configuration
    contract: {
        address: process.env.PAYMENT_CONTRACT_ADDRESS,
        // ABI will be loaded from artifacts
    },

    // USDC Token Configuration
    usdc: {
        polygon: {
            address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC on Polygon
            decimals: 6,
            symbol: 'USDC',
        },
        amoy: {
            address: process.env.USDC_ADDRESS_POLYGON || '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
            decimals: 6,
            symbol: 'USDC',
        },
    },

    // Platform Wallet (receives 10% fees)
    platformWallet: process.env.PLATFORM_WALLET_ADDRESS,

    // Web3Auth Configuration (Social Login → Wallet)
    web3auth: {
        clientId: process.env.WEB3AUTH_CLIENT_ID,
        network: process.env.WEB3AUTH_NETWORK || 'sapphire_mainnet',
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

    // Alchemy Configuration (RPC + Webhooks)
    alchemy: {
        apiKey: process.env.ALCHEMY_API_KEY,
        webhookSecret: process.env.ALCHEMY_SIGNING_KEY,
        webhookId: process.env.ALCHEMY_WEBHOOK_ID,
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
        platformFeePercent: 10, // 10% platform fee (hardcoded in smart contract)
        expirationMinutes: parseInt(process.env.PAYMENT_EXPIRATION_MINUTES || '30'), // 30 minutes
    },
};

/**
 * Validate required configuration
 */
export function validateWeb3Config() {
    // Core required for crypto payments
    const requiredCore = [
        'POLYGON_RPC_URL',
        'PAYMENT_CONTRACT_ADDRESS',
        'PLATFORM_WALLET_ADDRESS',
    ];

    // Optional but recommended
    const recommended = [
        'WEB3AUTH_CLIENT_ID',
        'ALCHEMY_API_KEY',
        'ALCHEMY_SIGNING_KEY',
    ];

    const missingCore = requiredCore.filter((key) => !process.env[key]);

    if (missingCore.length > 0) {
        throw new Error(
            `❌ Missing required Web3 configuration: ${missingCore.join(', ')}\n` +
            'Please update your .env file with these values.\n' +
            'See .env.example for details.'
        );
    }

    // Warn about missing recommended config
    const missingRecommended = recommended.filter((key) => !process.env[key]);
    if (missingRecommended.length > 0) {
        console.warn(`⚠️  Optional configuration missing: ${missingRecommended.join(', ')}`);
        console.warn('   Some features may have limited functionality.');
    }

    // Validate address format
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;

    if (!addressRegex.test(process.env.PAYMENT_CONTRACT_ADDRESS)) {
        throw new Error('❌ Invalid PAYMENT_CONTRACT_ADDRESS format. Must be a valid Ethereum address.');
    }

    if (!addressRegex.test(process.env.PLATFORM_WALLET_ADDRESS)) {
        throw new Error('❌ Invalid PLATFORM_WALLET_ADDRESS format. Must be a valid Ethereum address.');
    }

    console.log('✅ Web3 configuration validated successfully');
    console.log(`📍 Network: ${process.env.NODE_ENV === 'production' ? 'Polygon Mainnet' : 'Polygon Amoy Testnet'}`);
    console.log(`📄 Contract: ${process.env.PAYMENT_CONTRACT_ADDRESS}`);
    console.log(`💰 Platform Wallet: ${process.env.PLATFORM_WALLET_ADDRESS}`);
}

/**
 * Get current network configuration
 */
export function getCurrentNetwork() {
    const env = process.env.NODE_ENV;
    const network = process.env.NETWORK || 'amoy';
    
    if (network === 'polygon' || env === 'production') {
        return web3Config.polygon;
    }
    
    return web3Config.amoy;
}

/**
 * Get USDC configuration for current network
 */
export function getUSDCConfig() {
    const env = process.env.NODE_ENV;
    const network = process.env.NETWORK || 'amoy';
    
    if (network === 'polygon' || env === 'production') {
        return web3Config.usdc.polygon;
    }
    
    return web3Config.usdc.amoy;
}

/**
 * Get contract address for current network
 */
export function getContractAddress() {
    return process.env.PAYMENT_CONTRACT_ADDRESS;
}

/**
 * Get platform wallet address
 */
export function getPlatformWallet() {
    return process.env.PLATFORM_WALLET_ADDRESS;
}

/**
 * Check if Web3Auth is configured
 */
export function isWeb3AuthEnabled() {
    return !!(process.env.WEB3AUTH_CLIENT_ID && 
              process.env.WEB3AUTH_CLIENT_ID !== 'your_web3auth_client_id');
}

/**
 * Check if Alchemy webhooks are configured
 */
export function isAlchemyWebhookEnabled() {
    return !!(process.env.ALCHEMY_WEBHOOK_ID && 
              process.env.ALCHEMY_SIGNING_KEY);
}

export default web3Config;
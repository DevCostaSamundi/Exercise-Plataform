import dotenv from 'dotenv';
dotenv.config();

/**
 * Web3 Configuration — FlowConnect
 * 100% Crypto Native · Gasless Transactions · Fiat On-Ramp
 */

export const web3Config = {
    // Polygon Mainnet
    polygon: {
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        chainId: 137,
        chainName: 'Polygon',
        nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
        blockExplorer: 'https://polygonscan.com',
    },

    // Polygon Amoy Testnet
    amoy: {
        rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
        chainId: 80002,
        chainName: 'Polygon Amoy (Testnet)',
        nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
        blockExplorer: 'https://amoy.polygonscan.com',
    },

    // Smart Contract
    contract: {
        address: process.env.PAYMENT_CONTRACT_ADDRESS,
        // ABI completa em /contracts/artifacts/PaymentSplitter.json
    },

    // USDC Token
    usdc: {
        polygon: {
            address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC
            decimals: 6,
            symbol: 'USDC',
        },
        amoy: {
            address: process.env.USDC_ADDRESS_POLYGON || '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
            decimals: 6,
            symbol: 'USDC',
        },
    },

    // Gasless Transactions (EIP-2771 / Biconomy / OpenGSN)
    gasless: {
        enabled: process.env.GASLESS_ENABLED === 'true',

        // Biconomy (recomendado para Polygon)
        biconomy: {
            apiKey: process.env.BICONOMY_API_KEY,
            // Paymaster — quem paga o gas em nome do usuário
            paymasterUrl: process.env.BICONOMY_PAYMASTER_URL,
        },

        // Fallback: Gelato Relay
        gelato: {
            apiKey: process.env.GELATO_API_KEY,
            relayUrl: 'https://relay.gelato.digital',
        },

        // Endereço do Trusted Forwarder (ERC2771)
        // Biconomy Mainnet: 0x84a0856b038eaAd1cC7E297cF34A7e72685A8693
        // Biconomy Amoy:    0x69fb8Dca8067A5D38703b9e8b39cf2D51473E4b4
        trustedForwarder: process.env.TRUSTED_FORWARDER_ADDRESS,
    },

    // Fiat On-Ramp (Comprar USDC com cartão/PIX)
    fiatOnRamp: {
        // Moonpay — integração via widget
        moonpay: {
            enabled: process.env.MOONPAY_ENABLED === 'true',
            apiKey: process.env.MOONPAY_API_KEY,
            secretKey: process.env.MOONPAY_SECRET_KEY, // Para assinar URLs
            widgetUrl: 'https://buy.moonpay.com',
            defaultCurrency: 'usdc_polygon',
        },

        // Transak — alternativa com suporte a PIX
        transak: {
            enabled: process.env.TRANSAK_ENABLED === 'true',
            apiKey: process.env.TRANSAK_API_KEY,
            environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'STAGING',
            widgetUrl: process.env.NODE_ENV === 'production'
                ? 'https://global.transak.com'
                : 'https://global-stg.transak.com',
            defaultCryptoCurrency: 'USDC',
            defaultNetwork: 'polygon',
        },
    },

    // Carteira da plataforma (recebe 10% de fee)
    platformWallet: process.env.PLATFORM_WALLET_ADDRESS,

    // Web3Auth (Login social → carteira automática)
    web3auth: {
        clientId: process.env.WEB3AUTH_CLIENT_ID,
        network: process.env.WEB3AUTH_NETWORK || 'sapphire_mainnet',
        chainConfig: {
            chainNamespace: 'eip155',
            chainId: '0x89', // Polygon (137 em hex)
            rpcTarget: process.env.POLYGON_RPC_URL,
            displayName: 'Polygon',
            blockExplorer: 'https://polygonscan.com',
            ticker: 'POL',
            tickerName: 'Polygon',
        },
    },

    // Alchemy (RPC + Webhooks)
    alchemy: {
        apiKey: process.env.ALCHEMY_API_KEY,
        webhookSecret: process.env.ALCHEMY_SIGNING_KEY,
        webhookId: process.env.ALCHEMY_WEBHOOK_ID,
    },

    // Monitoramento de Blockchain
    monitoring: {
        confirmationsRequired: parseInt(process.env.CONFIRMATIONS_REQUIRED || '2'),
        pollingInterval: parseInt(process.env.POLLING_INTERVAL || '15000'), // 15 segundos
        maxRetries: parseInt(process.env.MAX_RETRIES || '5'),
        webhookTimeoutMs: 30000, // 30 segundos
    },

    // Configurações de Pagamento
    payment: {
        minAmount: parseFloat(process.env.MIN_PAYMENT_AMOUNT || '1'),       // $1 mínimo
        maxAmount: parseFloat(process.env.MAX_PAYMENT_AMOUNT || '10000'),   // $10.000 máximo
        platformFeePercent: 10,                                               // 10% (hardcoded no contrato)
        expirationMinutes: parseInt(process.env.PAYMENT_EXPIRATION_MINUTES || '30'),
    },

    // Renovação de Assinaturas
    subscriptions: {
        // Dias antes do vencimento para enviar lembrete
        reminderDaysBeforeExpiry: [7, 3, 1],
        // Janela de graça após vencimento (em horas)
        gracePeriodHours: 24,
        // Máximo de tentativas de cobrança automática (se carteira habilitada)
        maxRenewalAttempts: 3,
    },
};

// ============================================
// VALIDAÇÃO DE CONFIGURAÇÃO
// ============================================

export function validateWeb3Config() {
    const requiredCore = [
        'POLYGON_RPC_URL',
        'PAYMENT_CONTRACT_ADDRESS',
        'PLATFORM_WALLET_ADDRESS',
    ];

    const recommended = [
        'WEB3AUTH_CLIENT_ID',
        'ALCHEMY_API_KEY',
        'ALCHEMY_SIGNING_KEY',
        'TRUSTED_FORWARDER_ADDRESS',
    ];

    const missingCore = requiredCore.filter((k) => !process.env[k]);
    if (missingCore.length > 0) {
        throw new Error(
            `❌ Configurações Web3 obrigatórias faltando: ${missingCore.join(', ')}\n` +
            'Atualize seu arquivo .env. Veja .env.example para detalhes.'
        );
    }

    const missingRecommended = recommended.filter((k) => !process.env[k]);
    if (missingRecommended.length > 0) {
        console.warn(`⚠️  Configurações opcionais faltando: ${missingRecommended.join(', ')}`);
        console.warn('   Algumas funcionalidades podem ser limitadas.');
    }

    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(process.env.PAYMENT_CONTRACT_ADDRESS)) {
        throw new Error('❌ PAYMENT_CONTRACT_ADDRESS inválido. Use um endereço Ethereum válido.');
    }
    if (!addressRegex.test(process.env.PLATFORM_WALLET_ADDRESS)) {
        throw new Error('❌ PLATFORM_WALLET_ADDRESS inválido. Use um endereço Ethereum válido.');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const network = isProduction ? 'Polygon Mainnet' : 'Polygon Amoy Testnet';

    console.log('✅ Configuração Web3 validada com sucesso');
    console.log(`📍 Rede: ${network}`);
    console.log(`📄 Contrato: ${process.env.PAYMENT_CONTRACT_ADDRESS}`);
    console.log(`💰 Carteira da Plataforma: ${process.env.PLATFORM_WALLET_ADDRESS}`);
    console.log(`⛽ Gasless: ${web3Config.gasless.enabled ? 'Ativado' : 'Desativado'}`);
}

// ============================================
// HELPERS
// ============================================

export function getCurrentNetwork() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.NETWORK === 'polygon';
    return isProd ? web3Config.polygon : web3Config.amoy;
}

export function getUSDCConfig() {
    const isProd = process.env.NODE_ENV === 'production' || process.env.NETWORK === 'polygon';
    return isProd ? web3Config.usdc.polygon : web3Config.usdc.amoy;
}

export function getContractAddress() {
    return process.env.PAYMENT_CONTRACT_ADDRESS;
}

export function getPlatformWallet() {
    return process.env.PLATFORM_WALLET_ADDRESS;
}

export function isGaslessEnabled() {
    return web3Config.gasless.enabled && !!web3Config.gasless.trustedForwarder;
}

export function isWeb3AuthEnabled() {
    return !!(process.env.WEB3AUTH_CLIENT_ID &&
        process.env.WEB3AUTH_CLIENT_ID !== 'your_web3auth_client_id');
}

export function isAlchemyWebhookEnabled() {
    return !!(process.env.ALCHEMY_WEBHOOK_ID && process.env.ALCHEMY_SIGNING_KEY);
}

export function getFiatOnRampConfig() {
    return {
        moonpay: web3Config.fiatOnRamp.moonpay,
        transak: web3Config.fiatOnRamp.transak,
        anyEnabled:
            web3Config.fiatOnRamp.moonpay.enabled ||
            web3Config.fiatOnRamp.transak.enabled,
    };
}

export default web3Config;
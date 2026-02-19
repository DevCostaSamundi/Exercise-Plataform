/**
 * Launchpad 2.0 - Application Constants
 * Centralized configuration for the token launchpad on Base Network
 */

// ========== App Info ==========
export const APP_NAME = 'Launchpad 2.0';
export const APP_DESCRIPTION = 'Launch memecoins on Base Network with bonding curves and yield distribution';
export const APP_VERSION = '1.0.0';

// ========== Network Configuration ==========
export const NETWORK_CONFIG = {
  // Testnet (Base Sepolia)
  testnet: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  // Mainnet (Base)
  mainnet: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Current network (change to 'mainnet' for production)
export const CURRENT_NETWORK = 'testnet';
export const NETWORK = NETWORK_CONFIG[CURRENT_NETWORK];

// ========== Smart Contract Addresses ==========
// TODO: Update after deploying to Base Sepolia
export const CONTRACTS = {
  TOKEN_FACTORY: '0x0000000000000000000000000000000000000000',
  BONDING_CURVE: '0x0000000000000000000000000000000000000000',
  LIQUIDITY_LOCKER: '0x0000000000000000000000000000000000000000',
  YIELD_DISTRIBUTOR: '0x0000000000000000000000000000000000000000',
  CREATOR_REGISTRY: '0x0000000000000000000000000000000000000000',
  FEE_COLLECTOR: '0x0000000000000000000000000000000000000000',
};

// ========== API Configuration ==========
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const API = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 15000,
  VERSION: 'v1',
  ENDPOINTS: {
    TOKENS: '/api/tokens',
    CREATORS: '/api/creators',
    TRADES: '/api/trades',
    STATS: '/api/stats',
  },
};

// ========== UI Theme ==========
export const COLORS = {
  // Primary colors (Amarelo Base/Bitcoin)
  primary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308', // Main - Amarelo vibrante
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  // Secondary colors (Laranja energia)
  secondary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c', // Main - Laranja vibrante
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  // Accent colors (Azul elétrico)
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Main - Azul elétrico
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Status colors
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// ========== Routes ==========
export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  TRENDING: '/trending',
  CREATE: '/launch',
  PORTFOLIO: '/portfolio',
  TOKEN: '/token/:address',
  CREATOR: '/creator/:address',
  HELP: '/help',
  SAFETY: '/safety',
  // Web3 routes
  DEPOSIT: '/deposit',
  PAYMENT_STATUS: '/payment-status',
};

// ========== Token Configuration ==========
export const TOKEN_CONFIG = {
  // Limits
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 50,
  MIN_SYMBOL_LENGTH: 2,
  MAX_SYMBOL_LENGTH: 10,
  MIN_SUPPLY: 1_000_000, // 1M
  MAX_SUPPLY: 1_000_000_000, // 1B
  
  // Fees
  LAUNCH_FEE_ETH: '0.001', // 0.001 ETH
  TRADING_FEE_PERCENT: 1, // 1%
  
  // Bonding Curve
  BASE_PRICE: '0.000001', // Starting price
  SLIPPAGE_TOLERANCE: 5, // 5%
  MAX_SLIPPAGE: 15, // 15%
};

// ========== Creator Configuration ==========
export const CREATOR_CONFIG = {
  MAX_NAME_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  MAX_WEBSITE_LENGTH: 100,
  MAX_TWITTER_LENGTH: 50,
  MAX_TELEGRAM_LENGTH: 50,
  
  // Ratings
  MIN_RATING: 1,
  MAX_RATING: 5,
};

// ========== Pagination ==========
export const PAGINATION = {
  TOKENS_PER_PAGE: 20,
  CREATORS_PER_PAGE: 12,
  TRADES_PER_PAGE: 50,
  INFINITE_SCROLL_THRESHOLD: 0.8, // Load more at 80% scroll
};

// ========== Time Formats ==========
export const TIME_FORMATS = {
  FULL_DATE: 'MMM DD, YYYY HH:mm',
  SHORT_DATE: 'MMM DD, YYYY',
  TIME_ONLY: 'HH:mm:ss',
  RELATIVE: 'relative', // "2 hours ago"
};

// ========== Number Formats ==========
export const NUMBER_FORMATS = {
  // Format large numbers (1.5K, 2.3M, 1.2B)
  COMPACT: {
    notation: 'compact',
    compactDisplay: 'short',
  },
  // Currency format
  CURRENCY: {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  },
  // Percentage
  PERCENT: {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  },
  // Token amount
  TOKEN: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
};

// ========== Local Storage Keys ==========
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'wallet_address',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_TOKENS: 'recent_tokens',
  FAVORITES: 'favorites',
  SLIPPAGE_TOLERANCE: 'slippage_tolerance',
};

// ========== WebSocket Events ==========
export const SOCKET_EVENTS = {
  // Token events
  TOKEN_CREATED: 'token:created',
  TOKEN_TRADED: 'token:traded',
  PRICE_UPDATED: 'price:updated',
  
  // Creator events
  CREATOR_REGISTERED: 'creator:registered',
  CREATOR_RATED: 'creator:rated',
  
  // Yield events
  YIELD_DISTRIBUTED: 'yield:distributed',
  YIELD_CLAIMED: 'yield:claimed',
  
  // System events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
};

// ========== Transaction States ==========
export const TX_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  FAILED: 'failed',
};

// ========== UI Constants ==========
export const UI = {
  // Breakpoints (Tailwind defaults)
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Animation durations (ms)
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Toast notification duration (ms)
  TOAST_DURATION: 5000,
  
  // Debounce delays (ms)
  DEBOUNCE: {
    SEARCH: 300,
    INPUT: 500,
    SCROLL: 100,
  },
};

// ========== Error Messages ==========
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  WRONG_NETWORK: `Please switch to ${NETWORK.name}`,
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TRANSACTION_REJECTED: 'Transaction rejected by user',
  TRANSACTION_FAILED: 'Transaction failed',
  INVALID_INPUT: 'Invalid input',
  TOKEN_NOT_FOUND: 'Token not found',
  CREATOR_NOT_FOUND: 'Creator not found',
  NETWORK_ERROR: 'Network error. Please try again',
};

// ========== Success Messages ==========
export const SUCCESS_MESSAGES = {
  TOKEN_CREATED: 'Token created successfully!',
  TRADE_COMPLETED: 'Trade completed successfully!',
  YIELD_CLAIMED: 'Yield claimed successfully!',
  CREATOR_REGISTERED: 'Creator profile registered!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  RATING_SUBMITTED: 'Rating submitted successfully!',
};

// ========== Feature Flags ==========
export const FEATURES = {
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_WALLET_CONNECT: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: false, // Disable for MVP
  ENABLE_CHARTS: true,
  ENABLE_DARK_MODE_TOGGLE: false, // Only dark mode for MVP
};

// ========== External Links ==========
export const EXTERNAL_LINKS = {
  DOCS: 'https://docs.launchpad2.xyz',
  TWITTER: 'https://twitter.com/launchpad2',
  TELEGRAM: 'https://t.me/launchpad2',
  DISCORD: 'https://discord.gg/launchpad2',
  GITHUB: 'https://github.com/launchpad2',
  BASE_BRIDGE: 'https://bridge.base.org',
  BASE_FAUCET: 'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet',
};

// ========== Chart Configuration ==========
export const CHART_CONFIG = {
  DEFAULT_TIMEFRAME: '24h',
  TIMEFRAMES: ['1h', '6h', '24h', '7d', '30d', 'all'],
  COLORS: {
    up: COLORS.success,
    down: COLORS.danger,
    volume: COLORS.primary[500],
  },
  HEIGHT: {
    MOBILE: 300,
    DESKTOP: 400,
  },
};

// ========== Social Media Patterns ==========
export const SOCIAL_PATTERNS = {
  TWITTER: /^@?[a-zA-Z0-9_]{1,15}$/,
  TELEGRAM: /^@?[a-zA-Z0-9_]{5,32}$/,
  WEBSITE: /^https?:\/\/.+\..+$/,
};

// ========== Export all for convenience ==========
export default {
  APP_NAME,
  APP_DESCRIPTION,
  NETWORK,
  CONTRACTS,
  API,
  COLORS,
  ROUTES,
  TOKEN_CONFIG,
  CREATOR_CONFIG,
  PAGINATION,
  STORAGE_KEYS,
  SOCKET_EVENTS,
  TX_STATUS,
  UI,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURES,
  EXTERNAL_LINKS,
  CHART_CONFIG,
  SOCIAL_PATTERNS,
};

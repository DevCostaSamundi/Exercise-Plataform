/**
 * Application Constants
 * Centralized configuration values used throughout the application
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Socket URL
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 15000, // 15 seconds
  VERSION: 'v1',
};

// Currency Configuration
export const CURRENCY = {
  // Conversion rate from USD to BRL (Brazilian Real)
  // This should ideally come from a currency API in production
  USD_TO_BRL: 5.5,
  
  // Currency symbols
  USD_SYMBOL: '$',
  BRL_SYMBOL: 'R$',
};

// Upload limits
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_IMAGES_PER_POST = 10;

// File Upload
export const UPLOAD = {
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
};

// Tipos de conteúdo
export const CONTENT_TYPES = {
  ALL: 'all',
  PHOTOS: 'photos',
  VIDEOS: 'videos',
  LIVES: 'lives',
};

// Status de pagamento
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Métodos de pagamento
export const PAYMENT_METHODS = {
  PIX: 'pix',
  CREDIT_CARD: 'credit_card',
  CRYPTO: 'crypto',
};

// Tipos de transação
export const TRANSACTION_TYPES = {
  SUBSCRIPTION: 'subscription',
  PPV_POST: 'ppv_post',
  PPV_MESSAGE: 'ppv_message',
  TIP: 'tip',
};

// Status de assinatura
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAUSED: 'paused',
};

// Tipos de notificação
export const NOTIFICATION_TYPES = {
  NEW_POST: 'new_post',
  NEW_PPV: 'new_ppv',
  NEW_MESSAGE: 'new_message',
  COMMENT_REPLY: 'comment_reply',
  COMMENT_LIKE: 'comment_like',
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  PAYMENT_FAILED: 'payment_failed',
  LIVE_STARTED: 'live_started',
};

// Períodos de trending
export const TRENDING_PERIODS = {
  DAY: '24h',
  WEEK: '7d',
  MONTH: '30d',
};

// Ordenação
export const SORT_OPTIONS = {
  RECENT: 'recent',
  POPULAR: 'popular',
  ALPHABETICAL: 'alphabetical',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high',
};

// Breakpoints responsivos
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Paginação
export const PAGE_SIZE = 20;
export const INFINITE_SCROLL_THRESHOLD = 0.8;

// Limites de texto
export const TEXT_LIMITS = {
  BIO: 500,
  POST_CAPTION: 2000,
  COMMENT: 500,
  MESSAGE: 1000,
  USERNAME: 20,
};

// Regex patterns
export const PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_]+$/,
  HASHTAG: /#[\w\u0080-\uFFFF]+/g,
  MENTION: /@[\w\u0080-\uFFFF]+/g,
  URL: /(https?:\/\/[^\s]+)/g,
};

// Cores de status
export const STATUS_COLORS = {
  success: 'text-green-600 bg-green-100',
  warning: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
  info: 'text-blue-600 bg-blue-100',
  pending: 'text-gray-600 bg-gray-100',
};

// Ícones de notificação (React Icons)
export const NOTIFICATION_ICONS = {
  new_post: 'FiImage',
  new_ppv: 'FiLock',
  new_message: 'FiMail',
  comment_reply: 'FiMessageCircle',
  comment_like: 'FiHeart',
  subscription_renewal: 'FiClock',
  subscription_renewed: 'FiCheckCircle',
  payment_failed: 'FiAlertCircle',
  live_started: 'FiVideo',
};

// Minimum withdrawal amount in USD
export const MIN_WITHDRAWAL_AMOUNT = 100;

// Platform fee percentage
export const PLATFORM_FEE_PERCENTAGE = 20;

// Error Messages (can be externalized to i18n later)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  UNAUTHORIZED: 'Sua sessão expirou. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente mais tarde.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
};

// Mensagens de sucesso padrão
export const SUCCESS_MESSAGES = {
  POST_LIKED: 'Post curtido! ',
  POST_UNLIKED: 'Curtida removida.',
  COMMENT_POSTED: 'Comentário publicado! ',
  SUBSCRIBED: 'Assinatura realizada com sucesso!',
  UNSUBSCRIBED: 'Assinatura cancelada.',
  MESSAGE_SENT: 'Mensagem enviada! ',
  PROFILE_UPDATED: 'Perfil atualizado! ',
  SETTINGS_SAVED: 'Configurações salvas!',
  PPV_UNLOCKED: 'Conteúdo desbloqueado!',
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD de MMMM de YYYY',
  WITH_TIME: 'DD/MM/YYYY HH:mm',
};

// Tempos de cache (em milissegundos)
export const CACHE_TIMES = {
  FEED: 5 * 60 * 1000, // 5 minutos
  PROFILE: 10 * 60 * 1000, // 10 minutos
  NOTIFICATIONS: 1 * 60 * 1000, // 1 minuto
};

// Debounce times (em milissegundos)
export const DEBOUNCE_TIMES = {
  SEARCH: 500,
  INPUT: 300,
  SCROLL: 200,
};

// LocalStorage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'pride_connect_token',
  USER_DATA: 'pride_connect_user',
  THEME: 'pride_connect_theme',
  LANGUAGE: 'pride_connect_lang',
};

// Temas
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Idiomas suportados
export const LANGUAGES = {
  PT_BR: 'pt-BR',
  EN_US: 'en-US',
  ES_ES: 'es-ES',
};

// App Metadata
export const APP_INFO = {
  NAME: import.meta.env.VITE_APP_NAME || 'PrideConnect',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  LAST_UPDATED: new Date().toISOString().split('T')[0], // YYYY-MM-DD
};

/**
 * Currency Formatter
 * Converts USD to BRL and formats the currency
 * @deprecated Use formatters.js formatCurrency instead
 */
export const formatCurrency = (usdAmount, currency = 'BRL') => {
  const amount = currency === 'BRL' ? usdAmount * CURRENCY.USD_TO_BRL : usdAmount;
  const symbol = currency === 'BRL' ? CURRENCY.BRL_SYMBOL : CURRENCY.USD_SYMBOL;
  
  return `${symbol} ${amount.toFixed(2).replace('.', ',')}`;
};

/**
 * Date Formatter
 * Formats date to Brazilian locale
 * @deprecated Use formatters.js formatDate instead
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  API,
  CURRENCY,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  MAX_IMAGES_PER_POST,
  UPLOAD,
  CONTENT_TYPES,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  SUBSCRIPTION_STATUS,
  NOTIFICATION_TYPES,
  TRENDING_PERIODS,
  SORT_OPTIONS,
  BREAKPOINTS,
  PAGINATION,
  PAGE_SIZE,
  INFINITE_SCROLL_THRESHOLD,
  TEXT_LIMITS,
  PATTERNS,
  STATUS_COLORS,
  NOTIFICATION_ICONS,
  MIN_WITHDRAWAL_AMOUNT,
  PLATFORM_FEE_PERCENTAGE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DATE_FORMATS,
  CACHE_TIMES,
  DEBOUNCE_TIMES,
  STORAGE_KEYS,
  THEMES,
  LANGUAGES,
  APP_INFO,
  formatCurrency,
  formatDate,
};

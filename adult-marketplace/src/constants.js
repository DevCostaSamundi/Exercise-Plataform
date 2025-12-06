/**
 * Application Constants
 * Centralized configuration values used throughout the application
 */

// Currency Configuration
export const CURRENCY = {
  // Conversion rate from USD to BRL (Brazilian Real)
  // This should ideally come from a currency API in production
  USD_TO_BRL: 5.5,
  
  // Currency symbols
  USD_SYMBOL: '$',
  BRL_SYMBOL: 'R$',
};

// API Configuration
export const API = {
  TIMEOUT: 15000, // 15 seconds
  VERSION: 'v1',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// File Upload
export const UPLOAD = {
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
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
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD de MMMM de YYYY',
  WITH_TIME: 'DD/MM/YYYY HH:mm',
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
 */
export const formatCurrency = (usdAmount, currency = 'BRL') => {
  const amount = currency === 'BRL' ? usdAmount * CURRENCY.USD_TO_BRL : usdAmount;
  const symbol = currency === 'BRL' ? CURRENCY.BRL_SYMBOL : CURRENCY.USD_SYMBOL;
  
  return `${symbol} ${amount.toFixed(2).replace('.', ',')}`;
};

/**
 * Date Formatter
 * Formats date to Brazilian locale
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export default {
  CURRENCY,
  API,
  PAGINATION,
  UPLOAD,
  MIN_WITHDRAWAL_AMOUNT,
  PLATFORM_FEE_PERCENTAGE,
  ERROR_MESSAGES,
  DATE_FORMATS,
  APP_INFO,
  formatCurrency,
  formatDate,
};

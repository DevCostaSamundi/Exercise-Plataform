/**
 * Application Constants
 * Centralized configuration values used throughout the application
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Socket URL
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const API = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 15000, // 15 seconds
  VERSION: 'v1',
};

// Currency Configuration
export const CURRENCY = {
  USD_TO_BRL: 5.5,
  USD_SYMBOL: '$',
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

// Error Messages
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
  LAST_UPDATED: new Date().toISOString().split('T')[0],
};

// ============================================
// ✅ UTILITY FUNCTIONS
// ============================================

/**
 * Currency Formatter
 * Formats amounts with proper currency symbol and formatting
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code ('USD' or 'BRL')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }

  if (currency === 'BRL') {
    const brlAmount = amount * CURRENCY.USD_TO_BRL;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(brlAmount);
  }

  // Default to USD
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Date Formatter
 * Formats date to Brazilian locale
 * @param {string|Date} dateString - Date to format
 * @param {string} format - Optional format ('short', 'long', 'time')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'short') => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (format === 'long') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  if (format === 'time') {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Default:  short format
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Format date with time
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string with time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

/**
 * Format date only (no time)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}m atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay < 7) return `${diffDay}d atrás`;

  return formatDate(dateString);
};

/**
 * Format number with K/M suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }

  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} Is valid username
 */
export const isValidUsername = (username) => {
  return PATTERNS.USERNAME.test(username);
};

/**
 * Get file extension
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Check if file is an image
 * @param {File|string} file - File object or filename
 * @returns {boolean} Is image
 */
export const isImageFile = (file) => {
  const ext = typeof file === 'string' ? getFileExtension(file) : file.type;
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExts.some(e => ext.includes(e));
};

/**
 * Check if file is a video
 * @param {File|string} file - File object or filename
 * @returns {boolean} Is video
 */
export const isVideoFile = (file) => {
  const ext = typeof file === 'string' ? getFileExtension(file) : file.type;
  const videoExts = ['mp4', 'webm', 'mov', 'avi'];
  return videoExts.some(e => ext.includes(e));
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// ============================================
// ✅ DEFAULT EXPORT
// ============================================

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
  // Utility Functions
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateOnly,
  formatRelativeTime,
  formatNumber,
  truncateText,
  isValidEmail,
  isValidUsername,
  getFileExtension,
  isImageFile,
  isVideoFile,
  formatFileSize,
  generateId,
  sleep,
  copyToClipboard,
  getInitials,
};
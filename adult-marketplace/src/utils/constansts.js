/**
 * Constantes da plataforma PrideConnect
 */

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Socket URL
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Upload limits
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_IMAGES_PER_POST = 10;

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

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Você precisa estar autenticado.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
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
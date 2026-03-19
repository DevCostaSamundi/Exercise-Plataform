/**
 * Backend Constants — PLATAFORMA
 * Configuração centralizada de toda a plataforma
 * Inclui: Marketplace, NFTs, Escrow, Moderação, Pagamentos
 */

// ============================================================
// PLATAFORMA — TAXAS E LIMITES FINANCEIROS
// ============================================================

export const PLATFORM_FEE_PERCENTAGE = 10; // 10% sobre todas as transações da loja

export const MIN_WITHDRAWAL_AMOUNT = 100;  // Mínimo para saque em USD

export const PLATFORM_WALLET_ADDRESS = process.env.PLATFORM_WALLET_ADDRESS || '';
// Endereço Polygon da plataforma para receber os 10% de taxa

// ============================================================
// ESCROW — Custódia de Fundos On-Chain
// ============================================================

export const ESCROW = {
  // Prazo para aprovação automática após entrega (em horas)
  AUTO_RELEASE_HOURS_DIGITAL:  72,   // 72h para digital e custom
  AUTO_RELEASE_HOURS_PHYSICAL: 120,  // 120h (5 dias) para físico

  // Prazo para a criadora entregar após confirmação do pagamento (em horas)
  CREATOR_DELIVERY_DEADLINE_HOURS_DIGITAL:  168,  // 7 dias para digital/custom
  CREATOR_DELIVERY_DEADLINE_HOURS_PHYSICAL: 336,  // 14 dias para físico

  // Prazo para fa confirmar recebimento de físico (em dias)
  BUYER_CONFIRM_DEADLINE_DAYS: 5,

  // Prazo para abrir disputa após entrega (em horas)
  DISPUTE_WINDOW_HOURS_DIGITAL:  48,  // 48h para digital/custom
  DISPUTE_WINDOW_HOURS_PHYSICAL: 120, // 120h para físico
  DISPUTE_WINDOW_HOURS_SERVICE:  48,  // 48h para serviço

  // Prazo para mediação da plataforma resolver disputa (em dias úteis)
  DISPUTE_RESOLUTION_BUSINESS_DAYS: 5,

  // Contrato de escrow Polygon
  CONTRACT_ADDRESS: process.env.ESCROW_CONTRACT_ADDRESS || '',
  NETWORK: 'polygon',
  CURRENCY: 'USDC',
};

// ============================================================
// NFT — Configurações On-Chain
// ============================================================

export const NFT = {
  // Royalties
  MIN_ROYALTY_PERCENT: 5,
  MAX_ROYALTY_PERCENT: 15,
  DEFAULT_ROYALTY_PERCENT: 10,

  // Rede
  NETWORK: 'polygon',
  CURRENCY: 'USDC',

  // Contratos (endereços configurados via env)
  ERC721_CONTRACT:  process.env.NFT_ERC721_CONTRACT  || '',  // Edições únicas (1/1)
  ERC1155_CONTRACT: process.env.NFT_ERC1155_CONTRACT || '',  // Edições múltiplas
  ROYALTY_STANDARD: 'ERC-2981',                              // Royalties on-chain

  // Armazenamento
  ARWEAVE_GATEWAY: process.env.ARWEAVE_GATEWAY || 'https://arweave.net',

  // Tipos de NFT
  TYPES: {
    DIGITAL_CONTENT:  'DIGITAL_CONTENT',
    ACCESS_PASS:      'ACCESS_PASS',
    PHYSICAL_AUTH:    'PHYSICAL_AUTH',
    ACHIEVEMENT:      'ACHIEVEMENT',
    CUSTOM_CONTENT:   'CUSTOM_CONTENT',
    COLLECTION:       'COLLECTION',
  },

  // Gatilhos de mint
  MINT_TRIGGERS: {
    DIGITAL_PURCHASE:   'digital_purchase',   // Compra de digital — mint imediato
    CUSTOM_APPROVED:    'custom_approved',    // Custom aprovado pelo fa
    PHYSICAL_DELIVERED: 'physical_delivered', // Item físico confirmado
    ACCESS_PURCHASE:    'access_purchase',    // Compra de passe de acesso
    ACHIEVEMENT:        'achievement',        // Marco especial — sem pagamento
  },
};

// ============================================================
// MARKETPLACE — Configurações da Loja
// ============================================================

export const MARKETPLACE = {
  // Moderação por avaliações negativas
  NEGATIVE_REVIEW_MAX_RATING:          2,   // 1 ou 2 estrelas = avaliação negativa
  ALERT_THRESHOLD:                     5,   // 5 negativas → alerta + email
  SUSPENSION_THRESHOLD:                10,  // 10 negativas → suspensão automática
  SUSPENSION_CONTEST_WINDOW_DAYS:      7,   // 7 dias para contestar suspensão

  // Prazos de entrega para produtos físicos
  PHYSICAL_DELIVERY_DAYS_OPTIONS: [3, 7, 14],
  DEFAULT_DELIVERY_DAYS:          7,

  // Tracking obrigatório (em horas após confirmação do pedido)
  TRACKING_DEADLINE_HOURS:             72,  // 3 dias para inserir código de rastreio

  // Itens físicos — limite de cancelamentos automáticos (30 dias)
  MAX_FAILED_SHIPMENTS_30_DAYS:        3,   // 3 não-envios em 30 dias = suspensão

  // NFT — edições
  MAX_EDITION_SIZE:                    10000,
  MIN_FLOOR_PRICE_USD:                 1,

  // Custom
  MAX_CUSTOM_DEADLINE_DAYS:            7,
  CUSTOM_INSTRUCTION_MAX_CHARS:        2000,

  // Fotos do produto
  MAX_PRODUCT_IMAGES:                  10,
  MAX_VIDEO_PROOF_SECONDS:             30,

  // Categorias de produto permitidas
  CATEGORIES: {
    PHYSICAL_ITEM:    'PHYSICAL_ITEM',
    DIGITAL_CONTENT:  'DIGITAL_CONTENT',
    CUSTOM:           'CUSTOM',
    EXPERIENCE:       'EXPERIENCE',
    NFT_COLLECTION:   'NFT_COLLECTION',
    BUNDLE:           'BUNDLE',
    MERCHANDISE:      'MERCHANDISE',
    OTHER:            'OTHER',
  },

  TYPES: {
    PHYSICAL: 'PHYSICAL',
    DIGITAL:  'DIGITAL',
    SERVICE:  'SERVICE',
    HYBRID:   'HYBRID',
    CUSTOM:   'CUSTOM',
  },
};

// ============================================================
// PRIVACIDADE — Endereço do Comprador
// ============================================================

export const PRIVACY = {
  // Algoritmo de criptografia do endereço de entrega
  ADDRESS_ENCRYPTION_ALGO: 'AES-256-GCM',
  ADDRESS_KEY_ENV:          'SHIPPING_ADDRESS_ENCRYPTION_KEY',

  // Código anônimo de drop para a criadora
  DROP_CODE_LENGTH:         8,
  DROP_CODE_CHARS:          'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Sem caracteres ambíguos

  // A criadora NUNCA recebe: endereço completo, nome real do fa, email do fa
  // A criadora recebe: código de drop + etiqueta gerada pela plataforma
};

// ============================================================
// STORE STATUS
// ============================================================

export const STORE_STATUS = {
  ACTIVE:    'ACTIVE',
  WARNING:   'WARNING',
  SUSPENDED: 'SUSPENDED',
  BANNED:    'BANNED',
  PAUSED:    'PAUSED',
};

// ============================================================
// ORDER STATUS
// ============================================================

export const ORDER_STATUS = {
  PENDING:           'PENDING',
  CONFIRMED:         'CONFIRMED',
  PROCESSING:        'PROCESSING',
  SHIPPED:           'SHIPPED',
  DELIVERED:         'DELIVERED',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  COMPLETED:         'COMPLETED',
  DISPUTED:          'DISPUTED',
  CANCELLED:         'CANCELLED',
  REFUNDED:          'REFUNDED',
};

export const ESCROW_STATUS = {
  PENDING:  'PENDING',
  HELD:     'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED',
};

export const SHIPMENT_STATUS = {
  AWAITING_SHIPMENT: 'AWAITING_SHIPMENT',
  SHIPPED:           'SHIPPED',
  IN_TRANSIT:        'IN_TRANSIT',
  OUT_FOR_DELIVERY:  'OUT_FOR_DELIVERY',
  DELIVERED:         'DELIVERED',
  FAILED_DELIVERY:   'FAILED_DELIVERY',
  RETURNED:          'RETURNED',
  LOST:              'LOST',
};

export const DISPUTE_RESOLUTION = {
  FAVOR_BUYER:   'FAVOR_BUYER',
  FAVOR_CREATOR: 'FAVOR_CREATOR',
  SPLIT:         'SPLIT',
};

// ============================================================
// PAYMENT
// ============================================================

export const PAYMENT_STATUS = {
  PENDING:       'PENDING',
  WAITING:       'WAITING',
  CONFIRMING:    'CONFIRMING',
  COMPLETED:     'COMPLETED',
  FAILED:        'FAILED',
  EXPIRED:       'EXPIRED',
  PARTIALLY_PAID:'PARTIALLY_PAID',
  REFUNDED:      'REFUNDED',
  CANCELLED:     'CANCELLED',
};

export const PAYMENT_TYPE = {
  SUBSCRIPTION:         'SUBSCRIPTION',
  SUBSCRIPTION_RENEWAL: 'SUBSCRIPTION_RENEWAL',
  PPV_MESSAGE:          'PPV_MESSAGE',
  PPV_POST:             'PPV_POST',
  TIP:                  'TIP',
  WALLET_DEPOSIT:       'WALLET_DEPOSIT',
  GIFT:                 'GIFT',
  MARKETPLACE_PURCHASE: 'MARKETPLACE_PURCHASE',
  ESCROW_HOLD:          'ESCROW_HOLD',
  ESCROW_RELEASE:       'ESCROW_RELEASE',
  NFT_ROYALTY:          'NFT_ROYALTY',
};

export const PAYMENT_GATEWAY = {
  WEB3_DIRECT:            'WEB3_DIRECT',
  CRYPTO_DIRECT:          'CRYPTO_DIRECT',
  BALANCE:                'BALANCE',
  MANUAL:                 'MANUAL',
  SMART_CONTRACT_ESCROW:  'SMART_CONTRACT_ESCROW',
};

export const PAYMENT_METHODS = {
  CRYPTO:  'crypto',
  BALANCE: 'balance',
};

// ============================================================
// SUBSCRIPTION
// ============================================================

export const SUBSCRIPTION_STATUS = {
  ACTIVE:    'ACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED:   'EXPIRED',
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const NOTIFICATION_TYPES = {
  // Plataforma geral
  SUBSCRIBER:           'SUBSCRIBER',
  COMMENT:              'COMMENT',
  TIP:                  'TIP',
  LIKE:                 'LIKE',
  MESSAGE:              'MESSAGE',
  PAYMENT:              'PAYMENT',
  MILESTONE:            'MILESTONE',
  SYSTEM:               'SYSTEM',
  WARNING:              'WARNING',

  // Marketplace
  NEW_ORDER:             'NEW_ORDER',
  ORDER_DELIVERED:       'ORDER_DELIVERED',
  ORDER_APPROVED:        'ORDER_APPROVED',
  ORDER_DISPUTED:        'ORDER_DISPUTED',
  DISPUTE_RESOLVED:      'DISPUTE_RESOLVED',
  NFT_MINTED:            'NFT_MINTED',
  NFT_ROYALTY_RECEIVED:  'NFT_ROYALTY_RECEIVED',
  STORE_WARNING:         'STORE_WARNING',
  STORE_SUSPENDED:       'STORE_SUSPENDED',
  ESCROW_RELEASED:       'ESCROW_RELEASED',
  SHIPMENT_UPDATE:       'SHIPMENT_UPDATE',
  REVIEW_RECEIVED:       'REVIEW_RECEIVED',
};

// ============================================================
// ROLES & CONTENT
// ============================================================

export const USER_ROLES = {
  USER:    'USER',
  CREATOR: 'CREATOR',
  ADMIN:   'ADMIN',
};

export const CONTENT_TYPES = {
  ALL:    'all',
  PHOTOS: 'photos',
  VIDEOS: 'videos',
};

// ============================================================
// UPLOAD LIMITS
// ============================================================

export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE_MB:       5,
  MAX_VIDEO_SIZE_MB:       100,
  MAX_IMAGES_PER_POST:     10,
  MAX_PRODUCT_IMAGES:      10,
  MAX_VIDEO_PROOF_SECONDS: 30,
  MAX_ARWEAVE_FILE_SIZE_MB:500, // Limite para upload permanente no Arweave
};

// ============================================================
// PAGINATION
// ============================================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE:     100,
};

// ============================================================
// HTTP STATUS
// ============================================================

export const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  INTERNAL_SERVER_ERROR: 500,
};

// ============================================================
// RATE LIMITING
// ============================================================

export const RATE_LIMITS = {
  WINDOW_MS:            15 * 60 * 1000,
  MAX_REQUESTS:         100,
  // Limites específicos para marketplace (mais restritivos)
  MARKETPLACE_WINDOW_MS:    60 * 1000,
  MARKETPLACE_MAX_REQUESTS: 20,
};

// ============================================================
// CURRENCY
// ============================================================

export const CURRENCY = {
  USD_TO_BRL: 5.5,
  DEFAULT:    'USDC',
  NETWORK:    'polygon',
};

// ============================================================
// BLOCKCHAIN — Polygon
// ============================================================

export const BLOCKCHAIN = {
  NETWORK:       'polygon',
  CHAIN_ID:      137,
  CHAIN_ID_TEST: 80001, // Mumbai testnet
  RPC_URL:       process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  USDC_ADDRESS:  process.env.POLYGON_USDC_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  EXPLORER:      'https://polygonscan.com',
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
  PLATFORM_FEE_PERCENTAGE,
  MIN_WITHDRAWAL_AMOUNT,
  PLATFORM_WALLET_ADDRESS,
  ESCROW,
  NFT,
  MARKETPLACE,
  PRIVACY,
  STORE_STATUS,
  ORDER_STATUS,
  ESCROW_STATUS,
  SHIPMENT_STATUS,
  DISPUTE_RESOLUTION,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYMENT_GATEWAY,
  PAYMENT_METHODS,
  SUBSCRIPTION_STATUS,
  NOTIFICATION_TYPES,
  USER_ROLES,
  CONTENT_TYPES,
  UPLOAD_LIMITS,
  PAGINATION,
  HTTP_STATUS,
  RATE_LIMITS,
  CURRENCY,
  BLOCKCHAIN,
};
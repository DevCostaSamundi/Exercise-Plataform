/**
 * Services Barrel Export
 * Centralizes all service modules for easier importing
 */

export { default as api }                from './api';
export { default as authAPI }            from './authAPI';
export { default as categoriesAPI }      from './categoriesAPI';
export { default as creatorPostService } from './creatorPostService';
export { default as creatorService }     from './creatorService';
export { default as creatorsAPI }        from './creatorsAPI';
export { default as favoriteService }    from './favoriteService';
export { default as feedService }        from './feedService';
export { default as loginAPI }           from './loginAPI';
export { default as marketplaceService } from './marketplaceService';
export { default as messageService }     from './messageService';
export { default as notificationService} from './notificationService';
export { default as orderService }       from './orderService';
export { default as paymentService }     from './paymentService';
export { default as postService }        from './postService';
export { default as subscriptionService} from './subscriptionService';
export { default as transactionService } from './transactionService';
export { default as trendingService }    from './trendingService';
export { default as walletService }      from './walletService';
export { default as withdrawalService }  from './withdrawalService';

// ✅ CORRIGIDO: walletService e withdrawalService existem agora (ficheiros recebidos)
// ✅ ADICIONADO: orderService (estava ausente, usado em OrdersPage)
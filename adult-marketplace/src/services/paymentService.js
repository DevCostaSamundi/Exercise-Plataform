import api from './api';

/**
 * paymentService — FlowConnect
 * Serviço de pagamentos: crypto, saldo, fiat on-ramp e assinaturas
 */
const paymentService = {

    // ============================================
    // PAGAMENTOS CRYPTO
    // ============================================

    /**
     * Cria ordem de pagamento crypto
     * Retorna dados para o frontend executar a transação
     */
    createCryptoOrder: async (data) => {
        const response = await api.post('/payments/crypto/create-order', data);
        return response.data;
    },

    /**
     * Verifica transação após envio pelo usuário
     */
    verifyCryptoPayment: async ({ paymentId, txHash }) => {
        const response = await api.post('/payments/crypto/verify', { paymentId, txHash });
        return response.data;
    },

    /**
     * Status do pagamento (usado no polling)
     */
    getCryptoPaymentStatus: async (paymentId) => {
        const response = await api.get(`/payments/crypto/${paymentId}/status`);
        return response.data;
    },

    /**
     * Preço/conversão de USDC
     */
    getUSDCPrice: async ({ amount, currency = 'BRL' } = {}) => {
        const response = await api.get('/payments/crypto/price', { params: { amount, currency } });
        return response.data;
    },

    // ============================================
    // PAGAMENTOS VIA SALDO
    // ============================================

    /**
     * Paga usando saldo interno da plataforma
     */
    payWithBalance: async (data) => {
        const response = await api.post('/payments/balance/create-payment', data);
        return response.data;
    },

    // ============================================
    // FIAT ON-RAMP
    // ============================================

    /**
     * Gera URL assinada para compra de USDC
     * @param {string} provider - 'moonpay' | 'transak'
     * @param {number} amountUSD - Valor em USD
     * @param {string} walletAddress - Endereço da carteira destino
     */
    getOnRampUrl: async ({ provider = 'moonpay', amountUSD, walletAddress } = {}) => {
        const response = await api.get('/payments/crypto/onramp-url', {
            params: { provider, amountUSD, walletAddress },
        });
        return response.data;
    },

    // ============================================
    // CRIADORES
    // ============================================

    /**
     * Saldo do criador (on-chain + off-chain)
     */
    getCreatorBalance: async () => {
        const response = await api.get('/payments/creators/balance');
        return response.data;
    },

    // ============================================
    // HISTÓRICO
    // ============================================

    /**
     * Pagamentos do usuário
     */
    getUserPayments: async (params = {}) => {
        const response = await api.get('/payments', { params });
        return response.data;
    },

    /**
     * Detalhes de um pagamento específico
     */
    getPayment: async (paymentId) => {
        const response = await api.get(`/payments/${paymentId}`);
        return response.data;
    },

    // ============================================
    // ASSINATURAS
    // ============================================

    /**
     * Assinaturas ativas do usuário
     */
    getActiveSubscriptions: async () => {
        const response = await api.get('/subscriptions/active');
        return response.data;
    },

    /**
     * Status de uma assinatura específica
     */
    getSubscriptionStatus: async (creatorId) => {
        const response = await api.get(`/subscriptions/status/${creatorId}`);
        return response.data;
    },
};

export default paymentService;
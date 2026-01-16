export default {
  nowPayments: {
    apiKey: process.env.NOWPAYMENTS_API_KEY,
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
    
    // ✅ Permitir forçar sandbox via variável
    sandbox: process.env.NOWPAYMENTS_SANDBOX === 'true' || process.env.NODE_ENV === 'development',
    
    // ✅ Detectar automaticamente a URL
    apiUrl: (() => {
      // Se tem "sandbox" na key, usar sandbox
      if (process.env.NOWPAYMENTS_API_KEY?. includes('SANDBOX')) {
        return 'https://api-sandbox.nowpayments.io/v1';
      }
      // Se NODE_ENV é production, usar produção
      if (process.env.NODE_ENV === 'production') {
        return 'https://api.nowpayments.io/v1';
      }
      // Padrão:  sandbox
      return 'https://api-sandbox.nowpayments.io/v1';
    })(),
    
    acceptedCurrencies: ['usdttrc20', 'usdtbep20', 'usdcmatic', 'usdtmatic'],
    baseCurrency: 'USD'
  },

  general: {
    webhookUrl: process.env.API_URL || 'http://localhost:5000',
    successUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/success',
    cancelUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/cancel',
  }
};
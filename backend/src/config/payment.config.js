export default {
  web3: {
    rpcUrl: process.env.WEB3_RPC_URL || 'https://rpc.ankr.com/polygon',
    confirmationsRequired: 3,
  },

  paymentGateway: {
    
    acceptedCurrencies: ['usdttrc20', 'usdtbep20', 'usdcmatic', 'usdtmatic'],
    baseCurrency: 'USD'
  },

  general: {
    webhookUrl: process.env.API_URL || 'http://localhost:5000',
    successUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/success',
    cancelUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/payment/cancel',
  }
};
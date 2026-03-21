// Teste rápido para identificar qual import está quebrado
// Executar: node debug-routes.js

console.log('Testing route imports...\n');

const routes = [
  { name: 'authRoutes',              path: './src/routes/auth.routes.js' },
  { name: 'userRoutes',              path: './src/routes/user.routes.js' },
  { name: 'creatorRoutes',           path: './src/routes/creator.routes.js' },
  { name: 'creatorPostRoutes',       path: './src/routes/creatorPost.routes.js' },
  { name: 'creatorSettingsRoutes',   path: './src/routes/creatorSettings.routes.js' },
  { name: 'creatorDashboardRoutes',  path: './src/routes/creatorDashboard.routes.js' },
  { name: 'creatorSubscribersRoutes',path: './src/routes/creatorSubscribers.routes.js' },
  { name: 'postRoutes',              path: './src/routes/post.routes.js' },
  { name: 'commentRoutes',           path: './src/routes/comment.routes.js' },
  { name: 'likeRoutes',              path: './src/routes/like.routes.js' },
  { name: 'favoriteRoutes',          path: './src/routes/favorite.routes.js' },
  { name: 'trendingRoutes',          path: './src/routes/trending.routes.js' },
  { name: 'messageRoutes',           path: './src/routes/message.routes.js' },
  { name: 'chatRoutes',              path: './src/routes/chat.routes.js' },
  { name: 'notificationRoutes',      path: './src/routes/notification.routes.js' },
  { name: 'subscriptionRoutes',      path: './src/routes/subscription.routes.js' },
  { name: 'transactionRoutes',       path: './src/routes/transaction.routes.js' },
  { name: 'uploadRoutes',            path: './src/routes/upload.routes.js' },
  { name: 'marketplaceRoutes',       path: './src/routes/marketplace.routes.js' },
  { name: 'shippingRoutes',          path: './src/routes/shipping.routes.js' },
  { name: 'web3authRoutes',          path: './src/routes/web3auth.routes.js' },
  { name: 'cryptoPaymentRoutes',     path: './src/routes/crypto-payment.routes.js' },
];

let passed = 0;
let failed = 0;

for (const route of routes) {
  try {
    const imported = await import(route.path);
    const exported = imported.default;
    const isFunction = typeof exported === 'function';
    const hasUse     = exported && typeof exported.use === 'function';
    const isRouter   = isFunction || hasUse;

    if (isRouter) {
      console.log(`✅ ${route.name.padEnd(32)} - OK`);
      passed++;
    } else {
      console.log(`❌ ${route.name.padEnd(32)} - Not a valid Express router`);
      console.log(`   Export keys: ${Object.keys(exported || {}).join(', ')}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${route.name.padEnd(32)} - ERROR: ${error.message}`);
    failed++;
  }
}

console.log(`\n──────────────────────────────────────`);
console.log(`✅ Passed: ${passed}  ❌ Failed: ${failed}`);
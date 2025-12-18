// Teste rápido para identificar qual import está quebrado

console.log('Testing route imports...\n');

const routes = [
  { name: 'authRoutes', path: './src/routes/auth.routes. js' },
  { name:  'userRoutes', path:  './src/routes/user.routes.js' },
  { name: 'creatorRoutes', path: './src/routes/creator.routes.js' },
  { name: 'postRoutes', path: './src/routes/post.routes.js' },
  { name: 'chatRoutes', path: './src/routes/chat.routes.js' },
  { name: 'liveRoutes', path: './src/routes/live.routes.js' },
  { name: 'creatorSettingsRoutes', path: './src/routes/creatorSettings.routes.js' },
  { name: 'creatorPostRoutes', path: './src/routes/creatorPost.routes. js' },
  { name:  'messageRoutes', path: './src/routes/message.routes.js' },
  { name: 'paymentRoutes', path: './src/routes/payment.routes.js' },
  { name: 'withdrawalRoutes', path: './src/routes/withdrawal.routes.js' },
  { name: 'subscriptionRoutes', path: './src/routes/subscription.routes.js' },
  { name: 'creatorDashboardRoutes', path: './src/routes/creatorDashboard.routes.js' },
  { name: 'commentRoutes', path: './src/routes/comment.routes.js' },
  { name: 'likeRoutes', path: './src/routes/like.routes.js' },
  { name: 'favoriteRoutes', path: './src/routes/favorite.routes.js' },
  { name: 'trendingRoutes', path: './src/routes/trending.routes. js' },
  { name: 'transactionRoutes', path: './src/routes/transaction.routes.js' },
];

for (const route of routes) {
  try {
    const imported = await import(route.path);
    const exported = imported.default;
    const type = typeof exported;
    const isFunction = typeof exported === 'function';
    const hasUse = exported && typeof exported.use === 'function';
    
    const status = (isFunction || hasUse) ? '✅' : '❌';
    console.log(`${status} ${route.name. padEnd(30)} - Type: ${type}, isRouter: ${hasUse}`);
    
    if (! isFunction && !hasUse) {
      console.log(`   ⚠️  PROBLEM: This is not a valid Express router! `);
      console.log(`   Export keys: `, Object.keys(exported || {}));
    }
  } catch (error) {
    console.log(`❌ ${route.name.padEnd(30)} - ERROR: ${error.message}`);
  }
}
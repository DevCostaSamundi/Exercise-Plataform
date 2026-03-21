// Falhar explicitamente em produção se JWT_SECRET não estiver configurado
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key') {
    throw new Error('❌ JWT_SECRET não configurado. Defina um valor seguro no .env');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-refresh-secret-key') {
    throw new Error('❌ JWT_REFRESH_SECRET não configurado. Defina um valor seguro no .env');
  }
}

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
};

export default jwtConfig;
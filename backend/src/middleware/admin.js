/**
 * Admin Middleware
 * Ensures only platform owner can access admin routes
 */

export const isAdmin = (req, res, next) => {
  // Check if user is admin (owner of platform)
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admin is determined by:
  // 1. User role is 'admin'
  // 2. OR wallet address matches ADMIN_WALLET env variable
  const isAdminRole = req.user.role === 'admin';
  const isAdminWallet = req.user.walletAddress?.toLowerCase() === process.env.ADMIN_WALLET?.toLowerCase();

  if (!isAdminRole && !isAdminWallet) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  next();
};

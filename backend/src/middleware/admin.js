/**
 * Admin Middleware
 * Verifica se a wallet conectada é a OWNER_WALLET (carteira de deployment)
 */

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  const ownerWallet = process.env.OWNER_WALLET?.toLowerCase();
  const userWallet = req.user.web3Wallet?.toLowerCase();

  if (!ownerWallet) {
    return res.status(500).json({ 
      success: false,
      message: 'OWNER_WALLET not configured' 
    });
  }

  if (userWallet !== ownerWallet) {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required - Only platform owner can access this resource' 
    });
  }

  // User is owner - grant access
  req.isOwner = true;
  next();
};

/**
 * Simple Admin Check via Wallet Header
 * For routes that don't need full JWT auth but need admin access
 * Frontend sends wallet address in X-Wallet-Address header
 */
export const isAdminByWallet = (req, res, next) => {
  const ownerWallet = process.env.OWNER_WALLET?.toLowerCase();
  
  if (!ownerWallet) {
    return res.status(500).json({ 
      success: false,
      message: 'OWNER_WALLET not configured' 
    });
  }

  // Check wallet from header OR from JWT user
  const headerWallet = req.headers['x-wallet-address']?.toLowerCase();
  const jwtWallet = req.user?.web3Wallet?.toLowerCase();
  const walletToCheck = headerWallet || jwtWallet;

  if (!walletToCheck) {
    return res.status(401).json({ 
      success: false,
      message: 'Wallet address required. Send X-Wallet-Address header.' 
    });
  }

  if (walletToCheck !== ownerWallet) {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required - Only platform owner can access this resource' 
    });
  }

  // User is owner - grant access
  req.isOwner = true;
  req.ownerWallet = walletToCheck;
  next();
};

import express from 'express';
import {
    web3AuthLogin,
    linkWallet,
    getWalletInfo,
} from '../controllers/web3auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Web3Auth login/register
router.post('/web3auth/login', web3AuthLogin);

// ============================================
// PROTECTED ROUTES
// ============================================

router.use(authenticate);

// Wallet management
router.get('/web3auth/wallet', getWalletInfo);
router.post('/web3auth/link-wallet', linkWallet);

export default router;
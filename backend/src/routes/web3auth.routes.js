import express from 'express';
import {
  web3AuthLogin,
  linkWallet,
  getWalletInfo,
} from '../controllers/web3auth.controller.js';
import {
  getDepositAddress,
  getDepositHistory,
  getWalletBalance,
  checkBalance,
} from '../controllers/deposit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { saveWalletAddress } from '../controllers/wallet.controller.js';

const router = express.Router();

// ── Públicas ──────────────────────────────────────────────────────────────────

// Web3Auth login/register — não requer autenticação prévia
router.post('/web3auth/login', web3AuthLogin);

// ── Protegidas ────────────────────────────────────────────────────────────────

router.use(authenticate);

// Guardar wallet após lazy creation — requer JWT para associar ao utilizador correcto
// ⚠️  CORRIGIDO: estava antes do authenticate → qualquer pessoa podia associar wallets
router.patch('/wallet', saveWalletAddress);

// Wallet management
router.get ('/web3auth/wallet',       getWalletInfo);
router.post('/web3auth/link-wallet',  linkWallet);

// Deposit management
router.get ('/wallet/deposit/address', getDepositAddress);
router.get ('/wallet/deposit/history', getDepositHistory);
router.get ('/wallet/balance',         getWalletBalance);
router.post('/wallet/check-balance',   checkBalance);

export default router;
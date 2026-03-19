// backend/controllers/wallet.controller.js
// Endpoint para guardar a wallet de utilizadores email/password
// após a criação via Web3Auth (lazy wallet creation).
//
// PATCH /api/v1/auth/wallet
// Body: { walletAddress: "0x..." }
// Auth: JWT obrigatório (utilizador já está autenticado)

import prisma from '../config/database.js';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';

/**
 * Guarda a wallet address de um utilizador que se registou via email/password.
 * Chamado pelo useWalletSetup.js após o Web3Auth criar a wallet.
 */
export const saveWalletAddress = async (req, res) => {
  try {
    const userId        = req.user.id;
    const { walletAddress } = req.body;

    // ── Validação ─────────────────────────────────────────────
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'walletAddress obrigatório',
      });
    }

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Endereço de wallet inválido',
      });
    }

    // ── Verificar se a wallet já está em uso por outro utilizador ──
    const existing = await prisma.user.findFirst({
      where: {
        web3Wallet: walletAddress.toLowerCase(),
        NOT: { id: userId },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Esta wallet já está associada a outra conta',
      });
    }

    // ── Actualizar utilizador ─────────────────────────────────
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        web3Wallet:      walletAddress.toLowerCase(),
        web3Verified:    true,
        web3VerifiedAt:  new Date(),
        // Não altera web3Provider — deixa null para indicar lazy creation
      },
      select: {
        id:         true,
        email:      true,
        username:   true,
        displayName: true,
        web3Wallet: true,
        web3Provider: true,
      },
    });

    logger.info('Wallet guardada (lazy creation):', {
      userId,
      wallet: walletAddress,
    });

    // ── Criar UserWallet se não existir ───────────────────────
    // (a mesma lógica que já tens no web3auth.controller.js)
    await prisma.userWallet.upsert({
      where:  { userId },
      create: { userId },
      update: {},
    });

    return res.json({
      success: true,
      message: 'Wallet configurada com sucesso',
      data: {
        web3Wallet: user.web3Wallet,
        user,
      },
    });

  } catch (error) {
    logger.error('Erro ao guardar wallet:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao guardar wallet',
    });
  }
};

export default { saveWalletAddress };
// src/hooks/useWalletSetup.js
// Hook de lazy wallet creation.
// Usado quando um utilizador com conta email/password tenta pagar pela primeira vez.
//
// Fluxo:
//   1. Verifica se o utilizador já tem web3Wallet no perfil
//   2. Se não tem → abre Web3Auth com email pré-preenchido
//   3. Wallet criada → guarda no backend via PATCH /auth/wallet
//   4. Actualiza o AuthContext (user.web3Wallet)
//   5. Resolve com a wallet address → BuyProductModal pode abrir
//
// Uso:
//   const { ensureWallet, status, error } = useWalletSetup();
//   const wallet = await ensureWallet();  // retorna address ou null

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAuth } from './useAuth';           // o teu AuthContext hook
import { useWeb3Auth } from './useWeb3Auth';   // o teu Web3Auth hook
import api from '../services/api';

export const WALLET_SETUP_STATUS = {
  IDLE:        'IDLE',
  CHECKING:    'CHECKING',    // a verificar se já tem wallet
  CONNECTING:  'CONNECTING',  // a abrir Web3Auth
  SAVING:      'SAVING',      // a guardar no backend
  DONE:        'DONE',
  ERROR:       'ERROR',
};

export function useWalletSetup() {
  const { user, updateUser }              = useAuth();
  const { login: web3Login, provider, address, isConnected } = useWeb3Auth();

  const [status, setStatus] = useState(WALLET_SETUP_STATUS.IDLE);
  const [error,  setError]  = useState('');

  /**
   * Garante que o utilizador tem uma wallet.
   * @returns {string|null} wallet address, ou null se falhou/cancelou
   */
  const ensureWallet = useCallback(async () => {
    setError('');

    // ── 1. Já tem wallet guardada no perfil? ─────────────────────
    setStatus(WALLET_SETUP_STATUS.CHECKING);

    if (user?.web3Wallet) {
      setStatus(WALLET_SETUP_STATUS.DONE);
      return user.web3Wallet;
    }

    // Web3Auth já está conectado desta sessão mas não guardou no backend?
    if (isConnected && address) {
      await saveWalletToBackend(address);
      return address;
    }

    // ── 2. Precisa de criar wallet via Web3Auth ──────────────────
    setStatus(WALLET_SETUP_STATUS.CONNECTING);

    try {
      // web3Login() abre o modal do Web3Auth.
      // Se o utilizador tem email/password, o Web3Auth abre com email OTP —
      // o user clica no link do email e a wallet é criada instantaneamente.
      await web3Login();

      // Após login, o Web3Auth popula provider + address no contexto
      // Aguardar um tick para o state actualizar
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      if (err.message?.includes('User closed') || err.message?.includes('cancelled')) {
        setStatus(WALLET_SETUP_STATUS.IDLE);
        return null; // utilizador cancelou — não é erro
      }
      setError('Não foi possível criar a wallet. Tenta novamente.');
      setStatus(WALLET_SETUP_STATUS.ERROR);
      return null;
    }

    // Verificar se o provider está disponível
    if (!provider) {
      setError('Wallet não disponível. Tenta novamente.');
      setStatus(WALLET_SETUP_STATUS.ERROR);
      return null;
    }

    // Obter address do provider
    let walletAddress;
    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer         = await ethersProvider.getSigner();
      walletAddress        = await signer.getAddress();
    } catch (err) {
      setError('Erro ao obter endereço da wallet.');
      setStatus(WALLET_SETUP_STATUS.ERROR);
      return null;
    }

    // ── 3. Guardar no backend ─────────────────────────────────────
    const saved = await saveWalletToBackend(walletAddress);
    if (!saved) return null;

    return walletAddress;
  }, [user, isConnected, address, provider, web3Login]);

  async function saveWalletToBackend(walletAddress) {
    setStatus(WALLET_SETUP_STATUS.SAVING);
    try {
      const res = await api.patch('/auth/wallet', { walletAddress });

      if (res.data?.success) {
        // Actualizar o AuthContext para que user.web3Wallet fique preenchido
        updateUser({ ...user, web3Wallet: walletAddress });
        setStatus(WALLET_SETUP_STATUS.DONE);
        return true;
      } else {
        throw new Error(res.data?.message || 'Erro ao guardar wallet');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro ao guardar wallet.');
      setStatus(WALLET_SETUP_STATUS.ERROR);
      return false;
    }
  }

  function reset() {
    setStatus(WALLET_SETUP_STATUS.IDLE);
    setError('');
  }

  return {
    ensureWallet,
    status,
    error,
    reset,
    needsWallet: !user?.web3Wallet && !isConnected,
  };
}
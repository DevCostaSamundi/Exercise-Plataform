// src/hooks/usePayWithUSDC.js
// Hook de pagamento USDC usando o provider do Web3Auth.
// Compatível com o teu sistema de dual auth (AuthContext + Web3AuthProvider).
//
// Fluxo:
//   1. Verificar saldo USDC na wallet Web3Auth do utilizador
//   2. USDC.approve(escrowContract, amount)
//   3. Escrow.deposit(orderKey, amount, creatorWallet)
//   4. POST /orders/:id/confirm-payment com o txHash

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from './useWeb3Auth';
import api from '../services/api';
import {
  USDC_ADDRESS,
  ESCROW_ADDRESS,
  USDC_DECIMALS,
  ERC20_ABI,
  ESCROW_ABI,
  toUSDCUnits,
  fromUSDCUnits,
  getTxUrl,
} from '../constants/blockchain';

// ── Estados visíveis do pagamento ────────────────────────────────
export const PAY_STATUS = {
  IDLE:            'IDLE',
  CHECKING:        'CHECKING',         // a verificar saldo
  APPROVING:       'APPROVING',        // aguarda confirmação do approve() na wallet
  WAITING_APPROVE: 'WAITING_APPROVE',  // approve a minar na chain
  DEPOSITING:      'DEPOSITING',       // aguarda confirmação do deposit() na wallet
  WAITING_DEPOSIT: 'WAITING_DEPOSIT',  // depósito a minar na chain
  CONFIRMING:      'CONFIRMING',       // a notificar o backend
  SUCCESS:         'SUCCESS',
  ERROR:           'ERROR',
};

export const STATUS_LABELS = {
  [PAY_STATUS.IDLE]:            '',
  [PAY_STATUS.CHECKING]:        'A verificar saldo USDC…',
  [PAY_STATUS.APPROVING]:       'Autoriza o pagamento na tua conta…',
  [PAY_STATUS.WAITING_APPROVE]: 'A processar autorização…',
  [PAY_STATUS.DEPOSITING]:      'Confirma o pagamento na tua conta…',
  [PAY_STATUS.WAITING_DEPOSIT]: 'A processar pagamento on-chain…',
  [PAY_STATUS.CONFIRMING]:      'A confirmar pedido…',
  [PAY_STATUS.SUCCESS]:         '✅ Pagamento confirmado!',
  [PAY_STATUS.ERROR]:           '',
};

// Índice numérico para a barra de progresso
const STATUS_PROGRESS = {
  [PAY_STATUS.IDLE]:            0,
  [PAY_STATUS.CHECKING]:        1,
  [PAY_STATUS.APPROVING]:       2,
  [PAY_STATUS.WAITING_APPROVE]: 3,
  [PAY_STATUS.DEPOSITING]:      4,
  [PAY_STATUS.WAITING_DEPOSIT]: 5,
  [PAY_STATUS.CONFIRMING]:      6,
  [PAY_STATUS.SUCCESS]:         7,
};
export const TOTAL_STEPS = 7;
export function getProgressPercent(status) {
  return Math.round((STATUS_PROGRESS[status] / TOTAL_STEPS) * 100);
}

// ─────────────────────────────────────────────────────────────────

export function usePayWithUSDC() {
  // Usa o Web3AuthProvider que já tens — provider + address + isConnected
  const { provider, address, isConnected } = useWeb3Auth();

  const [status,  setStatus]  = useState(PAY_STATUS.IDLE);
  const [error,   setError]   = useState('');
  const [txHash,  setTxHash]  = useState('');
  const [txUrl,   setTxUrl]   = useState('');

  const pay = useCallback(async ({ orderId, amountUSDC, creatorWallet }) => {
    setError('');
    setTxHash('');
    setTxUrl('');

    // ── Pré-checks ───────────────────────────────────────────────
    if (!isConnected || !provider) {
      setError('Sessão expirada. Faz login novamente.');
      setStatus(PAY_STATUS.ERROR);
      return false;
    }
    if (!ESCROW_ADDRESS) {
      setError('Sistema de pagamento não configurado. Contacta o suporte.');
      setStatus(PAY_STATUS.ERROR);
      return false;
    }
    if (!creatorWallet || !ethers.isAddress(creatorWallet)) {
      setError('Wallet da criadora inválida. Contacta o suporte.');
      setStatus(PAY_STATUS.ERROR);
      return false;
    }

    try {
      // ── Obter signer do provider Web3Auth ────────────────────
      // O provider do Web3Auth é compatível com ethers.BrowserProvider
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer         = await ethersProvider.getSigner();

      const usdcContract   = new ethers.Contract(USDC_ADDRESS,  ERC20_ABI,  signer);
      const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

      const amountRaw = toUSDCUnits(amountUSDC);

      // ── 1. Verificar saldo ───────────────────────────────────
      setStatus(PAY_STATUS.CHECKING);

      const balance = await usdcContract.balanceOf(address);

      if (balance < amountRaw) {
        const humanBal = fromUSDCUnits(balance).toFixed(2);
        const needed   = parseFloat(amountUSDC).toFixed(2);
        setError(
          `Saldo insuficiente: tens ${humanBal} USDC, precisas de ${needed} USDC. ` +
          `Adiciona USDC à tua wallet para continuar.`
        );
        setStatus(PAY_STATUS.ERROR);
        return false;
      }

      // ── 2. Approve (skip se allowance já suficiente) ─────────
      // Isto evita uma transacção desnecessária em compras repetidas
      setStatus(PAY_STATUS.APPROVING);

      const allowance = await usdcContract.allowance(address, ESCROW_ADDRESS);

      if (allowance < amountRaw) {
        // Para utilizadores Web3Auth, isto abre um popup de confirmação
        // simples — não precisam de perceber o que é um "approve"
        const approveTx = await usdcContract.approve(ESCROW_ADDRESS, amountRaw);

        setStatus(PAY_STATUS.WAITING_APPROVE);
        await approveTx.wait(1); // aguardar 1 bloco
      }

      // ── 3. Deposit no escrow ─────────────────────────────────
      setStatus(PAY_STATUS.DEPOSITING);

      // Converter orderId para bytes32 (mesmo algoritmo do Solidity: keccak256)
      const orderKey = ethers.keccak256(ethers.toUtf8Bytes(orderId));

      const depositTx = await escrowContract.deposit(orderKey, amountRaw, creatorWallet);

      setStatus(PAY_STATUS.WAITING_DEPOSIT);

      // Aguardar 2 blocos para segurança (Polygon ~2s por bloco)
      const receipt = await depositTx.wait(2);

      const hash = receipt.hash;
      setTxHash(hash);
      setTxUrl(getTxUrl(hash));

      // ── 4. Confirmar no backend ──────────────────────────────
      // O backend vai verificar o evento on-chain e actualizar o Order
      setStatus(PAY_STATUS.CONFIRMING);

      await api.post(`/orders/${orderId}/confirm-payment`, {
        txHash:      hash,
        buyerWallet: address,
        amountUSDC:  parseFloat(amountUSDC),
        chainId:     ACTIVE_CHAIN_ID,
      });

      setStatus(PAY_STATUS.SUCCESS);
      return true;

    } catch (err) {
      console.error('[usePayWithUSDC]', err);

      // Traduzir erros técnicos em mensagens legíveis
      if (
        err.code === 4001 ||
        err.code === 'ACTION_REJECTED' ||
        err.message?.includes('user rejected') ||
        err.message?.includes('User denied')
      ) {
        setError('Pagamento cancelado.');
      } else if (
        err.message?.includes('insufficient funds') ||
        err.message?.includes('cannot pay gas')
      ) {
        // Com Web3Auth + gasless activado isto não deve acontecer
        // Se acontecer, é porque a wallet precisa de POL para gas
        setError(
          'Saldo de POL insuficiente para o gas. ' +
          'A tua conta precisa de uma pequena quantidade de POL para processar transacções.'
        );
      } else if (err.message?.includes('Deposito ja existe')) {
        setError('Este pedido já foi pago.');
      } else if (err.response?.data?.message) {
        // Erro do backend
        setError(err.response.data.message);
      } else {
        setError('Erro no pagamento. Tenta novamente ou contacta o suporte.');
      }

      setStatus(PAY_STATUS.ERROR);
      return false;
    }
  }, [provider, address, isConnected]);

  function reset() {
    setStatus(PAY_STATUS.IDLE);
    setError('');
    setTxHash('');
    setTxUrl('');
  }

  const isPaying = ![PAY_STATUS.IDLE, PAY_STATUS.SUCCESS, PAY_STATUS.ERROR].includes(status);

  return {
    pay,
    status,
    isPaying,
    error,
    txHash,
    txUrl,
    reset,
    progressPercent: getProgressPercent(status),
  };
}
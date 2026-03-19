// src/constants/blockchain.js
// Constantes de blockchain para o FRONTEND.
// Usa VITE_ env vars — NÃO importa web3.config.js (esse é backend only).
//
// Adiciona ao .env do frontend:
//   VITE_USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582   (Amoy testnet)
//   VITE_ESCROW_ADDRESS=0x...   (após deploy do PlatformEscrow.sol)
//   VITE_CHAIN_ID=80002          (80002=Amoy, 137=Polygon mainnet)
//   VITE_BLOCK_EXPLORER=https://amoy.polygonscan.com

// ─── Endereços ────────────────────────────────────────────────────
export const USDC_ADDRESS    = import.meta.env.VITE_USDC_ADDRESS    || '';
export const ESCROW_ADDRESS  = import.meta.env.VITE_ESCROW_ADDRESS  || '';
export const ACTIVE_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '80002');
export const BLOCK_EXPLORER  = import.meta.env.VITE_BLOCK_EXPLORER  || 'https://amoy.polygonscan.com';

// USDC tem sempre 6 decimais na Polygon
export const USDC_DECIMALS = 6;

// ─── ABIs mínimas (apenas funções usadas no pagamento) ────────────
export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

export const ESCROW_ABI = [
  'function deposit(bytes32 orderId, uint256 amount, address creator) nonpayable',
  'event Deposited(bytes32 indexed orderId, address indexed buyer, address indexed creator, uint256 amount)',
];

// ─── Helpers ──────────────────────────────────────────────────────

/** Converte valor humano para unidades USDC com 6 decimais (BigInt) */
export function toUSDCUnits(amount) {
  return BigInt(Math.round(parseFloat(amount) * 10 ** USDC_DECIMALS));
}

/** Formata unidades USDC para valor legível */
export function fromUSDCUnits(raw) {
  return Number(raw) / 10 ** USDC_DECIMALS;
}

/** URL do explorador de blocos para uma tx */
export function getTxUrl(txHash) {
  return `${BLOCK_EXPLORER}/tx/${txHash}`;
}
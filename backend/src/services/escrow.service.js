/**
 * Escrow Service
 * Lógica de negócio para custódia de fundos on-chain.
 * Responsável por: criar escrow, liberar para criadora, reembolsar comprador,
 * gerir disputas e auto-release por timeout.
 */

import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import {
  ESCROW,
  ESCROW_STATUS,
  ORDER_STATUS,
  PAYMENT_TYPE,
  PAYMENT_GATEWAY,
  PAYMENT_STATUS,
  PLATFORM_FEE_PERCENTAGE,
  PLATFORM_WALLET_ADDRESS,
  NOTIFICATION_TYPES,
  MARKETPLACE,
  DISPUTE_RESOLUTION,
} from '../constants/constants.js';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Calcula o split de valores com a taxa da plataforma.
 * @param {number} totalAmount - Valor total pago pelo comprador em USD
 * @returns {{ platformFee: number, creatorNet: number }}
 */
export function calculateSplit(totalAmount) {
  const platformFee = parseFloat(
    ((totalAmount * PLATFORM_FEE_PERCENTAGE) / 100).toFixed(2)
  );
  const creatorNet = parseFloat((totalAmount - platformFee).toFixed(2));
  return { platformFee, creatorNet };
}

/**
 * Calcula o deadline de auto-release baseado no tipo de produto.
 * @param {'PHYSICAL'|'DIGITAL'|'SERVICE'|'CUSTOM'|'HYBRID'} productType
 * @returns {Date}
 */
export function calculateAutoReleaseDate(productType) {
  const hours =
    productType === 'PHYSICAL'
      ? ESCROW.AUTO_RELEASE_HOURS_PHYSICAL
      : ESCROW.AUTO_RELEASE_HOURS_DIGITAL;

  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

// ─────────────────────────────────────────────
// CRIAR ESCROW
// ─────────────────────────────────────────────

/**
 * Cria o registo de escrow após confirmação de pagamento on-chain.
 * Chamado pelo webhook do contrato inteligente.
 *
 * @param {object} params
 * @param {string} params.orderId
 * @param {number} params.amount          - Total pago em USD
 * @param {string} params.txHashHold      - Hash da transação de bloqueio on-chain
 * @param {string} params.smartContractAddress
 * @param {string} params.creatorWallet   - Wallet da criadora para receber 90%
 * @param {string} params.productType     - Para calcular o auto-release
 */
export async function createEscrow({
  orderId,
  amount,
  txHashHold,
  smartContractAddress,
  creatorWallet,
  productType,
}) {
  const { platformFee, creatorNet } = calculateSplit(amount);
  const autoReleaseAt = calculateAutoReleaseDate(productType);

  const escrow = await prisma.escrow.create({
    data: {
      orderId,
      amount,
      status: ESCROW_STATUS.HELD,
      smartContractAddress,
      txHashHold,
      heldAt: new Date(),
      autoReleaseAt,
      creatorWallet,
      platformWallet: PLATFORM_WALLET_ADDRESS,
      platformFee,
      creatorNet,
    },
  });

  // Actualizar saldo pendente da criadora
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { include: { creator: true } } } } },
  });

  if (order?.items?.[0]?.product?.creatorId) {
    await prisma.creatorBalance.upsert({
      where: { creatorId: order.items[0].product.creatorId },
      update: {
        pendingUSD:    { increment: creatorNet },
        escrowHeldUSD: { increment: creatorNet },
      },
      create: {
        creatorId:     order.items[0].product.creatorId,
        pendingUSD:    creatorNet,
        escrowHeldUSD: creatorNet,
      },
    });
  }

  logger.info(`[Escrow] Criado para ordem ${orderId} | ${amount} USDC | Release em ${autoReleaseAt.toISOString()}`);
  return escrow;
}

// ─────────────────────────────────────────────
// LIBERAR ESCROW → CRIADORA
// ─────────────────────────────────────────────

/**
 * Libera os fundos do escrow para a criadora.
 * Pode ser chamado por: aprovação manual do fa, auto-release por timeout,
 * ou resolução de disputa a favor da criadora.
 *
 * @param {string} orderId
 * @param {object} options
 * @param {string} [options.txHashRelease] - Hash on-chain da liberação
 * @param {boolean} [options.isAutoRelease] - Se foi release automático
 * @param {boolean} [options.isDisputeResolution] - Se é resolução de disputa
 */
export async function releaseEscrow(orderId, {
  txHashRelease = null,
  isAutoRelease = false,
  isDisputeResolution = false,
} = {}) {
  const escrow = await prisma.escrow.findUnique({ where: { orderId } });

  if (!escrow) throw new Error(`Escrow não encontrado para ordem ${orderId}`);
  if (escrow.status !== ESCROW_STATUS.HELD && escrow.status !== ESCROW_STATUS.DISPUTED) {
    throw new Error(`Escrow em estado inválido para liberação: ${escrow.status}`);
  }

  // Actualizar escrow
  await prisma.escrow.update({
    where: { orderId },
    data: {
      status:         ESCROW_STATUS.RELEASED,
      txHashRelease,
      releasedAt:     new Date(),
    },
  });

  // Actualizar ordem
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status:          ORDER_STATUS.COMPLETED,
      escrowStatus:    ESCROW_STATUS.RELEASED,
      releaseTxHash:   txHashRelease,
      approvedAt:      new Date(),
      autoApproved:    isAutoRelease,
    },
  });

  // Mover de pendente → disponível no saldo da criadora
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (order?.items?.[0]?.product?.creatorId) {
    const creatorId = order.items[0].product.creatorId;
    const net = Number(escrow.creatorNet);

    await prisma.creatorBalance.update({
      where: { creatorId },
      data: {
        availableUSD:     { increment: net },
        pendingUSD:       { decrement: net },
        escrowHeldUSD:    { decrement: net },
        lifetimeEarnings: { increment: net },
        lastPaymentAt:    new Date(),
      },
    });

    // Registar o pagamento final
    await prisma.payment.create({
      data: {
        userId:     order.userId,
        creatorId,
        type:       PAYMENT_TYPE.ESCROW_RELEASE,
        amountUSD:  net,
        currency:   'USDC',
        status:     PAYMENT_STATUS.COMPLETED,
        gateway:    PAYMENT_GATEWAY.SMART_CONTRACT_ESCROW,
        platformFee: Number(escrow.platformFee),
        netAmount:   net,
        orderId,
        txHash:      txHashRelease,
        confirmedAt: new Date(),
      },
    });

    // Notificar a criadora
    await createNotification(creatorId, {
      type:      NOTIFICATION_TYPES.ESCROW_RELEASED,
      title:     'Pagamento liberado! 💰',
      message:   `$${net.toFixed(2)} USDC foram adicionados ao teu saldo disponível.`,
      metadata:  { orderId, amount: net },
      actionUrl: '/creator/earnings',
    });
  }

  logger.info(`[Escrow] Liberado para ordem ${orderId} | Auto: ${isAutoRelease} | Disputa: ${isDisputeResolution}`);
}

// ─────────────────────────────────────────────
// REEMBOLSAR ESCROW → COMPRADOR
// ─────────────────────────────────────────────

/**
 * Reembolsa os fundos do escrow para o comprador.
 *
 * @param {string} orderId
 * @param {object} options
 * @param {string} [options.txHashRefund]
 * @param {string} [options.reason]
 */
export async function refundEscrow(orderId, {
  txHashRefund = null,
  reason = 'Pedido cancelado',
} = {}) {
  const escrow = await prisma.escrow.findUnique({ where: { orderId } });

  if (!escrow) throw new Error(`Escrow não encontrado para ordem ${orderId}`);

  const validStates = [ESCROW_STATUS.HELD, ESCROW_STATUS.DISPUTED];
  if (!validStates.includes(escrow.status)) {
    throw new Error(`Escrow em estado inválido para reembolso: ${escrow.status}`);
  }

  await prisma.escrow.update({
    where: { orderId },
    data: {
      status:       ESCROW_STATUS.REFUNDED,
      txHashRefund,
      refundedAt:   new Date(),
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status:       ORDER_STATUS.REFUNDED,
      escrowStatus: ESCROW_STATUS.REFUNDED,
    },
  });

  // Reverter saldo pendente da criadora
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (order?.items?.[0]?.product?.creatorId) {
    const creatorId = order.items[0].product.creatorId;
    const net = Number(escrow.creatorNet);

    await prisma.creatorBalance.update({
      where: { creatorId },
      data: {
        pendingUSD:    { decrement: net },
        escrowHeldUSD: { decrement: net },
      },
    });

    // Notificar comprador
    await createNotification(order.userId, {
      type:      NOTIFICATION_TYPES.PAYMENT,
      title:     'Reembolso processado',
      message:   `O teu pagamento de $${Number(escrow.amount).toFixed(2)} USDC foi reembolsado.`,
      metadata:  { orderId, reason },
      actionUrl: '/orders',
    });
  }

  logger.info(`[Escrow] Reembolsado para ordem ${orderId} | Razão: ${reason}`);
}

// ─────────────────────────────────────────────
// ABRIR DISPUTA
// ─────────────────────────────────────────────

/**
 * Congela o escrow e abre uma disputa.
 *
 * @param {string} orderId
 * @param {string} buyerId
 * @param {string} reason
 * @param {object} [evidence] - { description, fileUrls }
 */
export async function openDispute(orderId, buyerId, reason, evidence = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { escrow: true, items: { include: { product: { include: { creator: true } } } } },
  });

  if (!order) throw new Error('Ordem não encontrada');
  if (order.userId !== buyerId) throw new Error('Sem permissão para abrir disputa nesta ordem');
  if (order.isDisputed) throw new Error('Disputa já aberta');

  const now = new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status:         ORDER_STATUS.DISPUTED,
        isDisputed:     true,
        disputeReason:  reason,
        disputeOpenedAt: now,
        escrowStatus:   ESCROW_STATUS.DISPUTED,
        disputeEvidence: evidence,
      },
    }),
    prisma.escrow.update({
      where: { orderId },
      data: { status: ESCROW_STATUS.DISPUTED },
    }),
  ]);

  // Notificar criadora
  const creatorId = order.items[0]?.product?.creatorId;
  if (creatorId) {
    await createNotification(creatorId, {
      type:      NOTIFICATION_TYPES.ORDER_DISPUTED,
      title:     '⚠️ Disputa aberta',
      message:   `Um fa abriu uma disputa no pedido #${order.orderNumber}. Motivo: ${reason}`,
      metadata:  { orderId, reason },
      actionUrl: `/creator/orders/${orderId}`,
    });
  }

  logger.info(`[Escrow] Disputa aberta para ordem ${orderId} por utilizador ${buyerId}`);
}

// ─────────────────────────────────────────────
// RESOLVER DISPUTA
// ─────────────────────────────────────────────

/**
 * Admin resolve a disputa.
 *
 * @param {string} orderId
 * @param {'FAVOR_BUYER'|'FAVOR_CREATOR'|'SPLIT'} resolution
 * @param {string} adminNote
 */
export async function resolveDispute(orderId, resolution, adminNote = '') {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { escrow: true, items: { include: { product: true } } },
  });

  if (!order?.isDisputed) throw new Error('Ordem não está em disputa');

  const now = new Date();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      disputeResolvedAt: now,
      disputeResolution: resolution,
    },
  });

  if (resolution === DISPUTE_RESOLUTION.FAVOR_BUYER) {
    await refundEscrow(orderId, { reason: `Disputa resolvida a favor do comprador. ${adminNote}` });
  } else if (resolution === DISPUTE_RESOLUTION.FAVOR_CREATOR) {
    await releaseEscrow(orderId, { isDisputeResolution: true });
  } else if (resolution === DISPUTE_RESOLUTION.SPLIT) {
    // Divisão 50/50 — apenas no banco, a transferência on-chain é separada
    const halfAmount = Number(order.escrow.amount) / 2;
    await prisma.escrow.update({
      where: { orderId },
      data: { status: ESCROW_STATUS.RELEASED, releasedAt: now },
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.REFUNDED, escrowStatus: ESCROW_STATUS.RELEASED },
    });
    logger.info(`[Escrow] Divisão 50/50 para ordem ${orderId} | ${halfAmount} USDC cada`);
  }

  // Notificar ambas as partes
  await createNotification(order.userId, {
    type:      NOTIFICATION_TYPES.DISPUTE_RESOLVED,
    title:     'Disputa resolvida',
    message:   `A disputa do teu pedido #${order.orderNumber} foi resolvida.`,
    metadata:  { orderId, resolution },
    actionUrl: '/orders',
  });

  logger.info(`[Escrow] Disputa resolvida para ordem ${orderId} | Resolução: ${resolution}`);
}

// ─────────────────────────────────────────────
// AUTO-RELEASE CRON JOB
// ─────────────────────────────────────────────

/**
 * Verifica e processa todos os escrows que passaram o prazo de auto-release.
 * Deve ser chamado por um cron job a cada hora.
 */
export async function processAutoReleases() {
  const now = new Date();

  const overdueEscrows = await prisma.escrow.findMany({
    where: {
      status:       ESCROW_STATUS.HELD,
      autoReleaseAt: { lte: now },
    },
    include: { order: true },
  });

  logger.info(`[Escrow Auto-Release] ${overdueEscrows.length} escrows a processar`);

  const results = { released: 0, errors: [] };

  for (const escrow of overdueEscrows) {
    try {
      await releaseEscrow(escrow.orderId, { isAutoRelease: true });
      results.released++;
    } catch (err) {
      logger.error(`[Escrow Auto-Release] Erro na ordem ${escrow.orderId}: ${err.message}`);
      results.errors.push({ orderId: escrow.orderId, error: err.message });
    }
  }

  return results;
}

// ─────────────────────────────────────────────
// HELPER INTERNO — Criar Notificação
// ─────────────────────────────────────────────

async function createNotification(userId, { type, title, message, metadata, actionUrl }) {
  // Buscar o userId correto se foi passado um creatorId
  let targetUserId = userId;

  try {
    const creator = await prisma.creator.findUnique({ where: { id: userId } });
    if (creator) targetUserId = creator.userId;
  } catch {
    // userId já é um userId de User, ignorar
  }

  await prisma.notification.create({
    data: { userId: targetUserId, type, title, message, metadata, actionUrl },
  });
}
/**
 * Order Controller
 * Criar pedidos, confirmar entrega, abrir disputas, gerir rastreio.
 */

import prisma from '../config/prisma.js';
import {
  HTTP_STATUS,
  ORDER_STATUS,
  ESCROW_STATUS,
  PAYMENT_TYPE,
  PAYMENT_GATEWAY,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  PRIVACY,
  ESCROW,
  PAGINATION,
} from '../constants/constants.js';
import {
  createEscrow,
  releaseEscrow,
  refundEscrow,
  openDispute,
} from '../services/escrow.service.js';
import crypto from 'crypto';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function generateOrderNumber() {
  const ts     = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${random}`;
}

function generateDropCode() {
  const chars = PRIVACY.DROP_CODE_CHARS;
  let code = '';
  for (let i = 0; i < PRIVACY.DROP_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function encryptAddress(address) {
  const key = Buffer.from(process.env.SHIPPING_ADDRESS_ENCRYPTION_KEY || 'fallback-key-32bytes-padded!!!!!', 'utf8').slice(0, 32);
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(address), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function calculateDeliveryDeadline(productType) {
  const hours =
    productType === 'PHYSICAL'
      ? ESCROW.CREATOR_DELIVERY_DEADLINE_HOURS_PHYSICAL
      : ESCROW.CREATOR_DELIVERY_DEADLINE_HOURS_DIGITAL;
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

// ─────────────────────────────────────────────
// CRIAR PEDIDO
// ─────────────────────────────────────────────

/**
 * POST /api/v1/orders
 * Cria um pedido e bloqueia os fundos em escrow.
 * O pagamento on-chain deve ser feito pelo frontend ANTES de chamar este endpoint,
 * ou este endpoint retorna o endereço para pagamento e o webhook confirma depois.
 */
export async function createOrder(req, res) {
  try {
    const userId = req.user.id;
    const {
      items,            // [{ productId, quantity }]
      shippingAddress,  // { name, street, city, state, zip, country } — para físicos
      buyerInstructions,
      instructionFiles,
      paymentTxHash,    // Hash on-chain se pagamento já foi feito
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Nenhum item no pedido.',
      });
    }

    // Carregar produtos
    const productIds  = items.map(i => i.productId);
    const products    = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Um ou mais produtos não estão disponíveis.',
      });
    }

    // Verificar stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product.isUnlimited && product.stock !== null && product.stock < item.quantity) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Produto "${product.name}" sem stock suficiente.`,
        });
      }
    }

    // Calcular totais
    const subtotal    = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (parseFloat(product.price) * item.quantity);
    }, 0);

    const platformFee = parseFloat(((subtotal * 10) / 100).toFixed(2)); // 10%
    const total       = subtotal;

    // Determinar tipo dominante para escrow deadline
    const hasPhysical = products.some(p => p.type === 'PHYSICAL' || p.type === 'HYBRID');
    const primaryType = hasPhysical ? 'PHYSICAL' : products[0].type;

    // Encrypt shipping address (comprador anónimo para criadora)
    const encryptedShippingAddress = shippingAddress
      ? encryptAddress(shippingAddress)
      : null;

    const anonDropCode = hasPhysical ? generateDropCode() : null;

    // Calcular prazos
    const deliveryDeadline  = calculateDeliveryDeadline(primaryType);
    const approvalDeadline  = new Date(
      deliveryDeadline.getTime() +
      (primaryType === 'PHYSICAL'
        ? ESCROW.AUTO_RELEASE_HOURS_PHYSICAL
        : ESCROW.AUTO_RELEASE_HOURS_DIGITAL) * 60 * 60 * 1000
    );

    // Criar ordem em transação
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          orderNumber:            generateOrderNumber(),
          status:                 ORDER_STATUS.PENDING,
          subtotal,
          platformFee,
          total,
          paymentStatus:          'ORDER_PENDING',
          escrowStatus:           ESCROW_STATUS.PENDING,
          encryptedShippingAddress,
          anonDropCode,
          buyerInstructions,
          instructionFiles:       instructionFiles || [],
          deliveryDeadline,
          approvalDeadline,
          items: {
            create: items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return {
                productId:       item.productId,
                quantity:        item.quantity,
                price:           product.price,
                productSnapshot: {
                  name:        product.name,
                  description: product.description,
                  category:    product.category,
                  type:        product.type,
                },
              };
            }),
          },
        },
        include: { items: true },
      });

      // Criar envio físico se necessário
      if (hasPhysical) {
        await tx.physicalShipment.create({
          data: {
            orderId:                 created.id,
            anonDropCode:            anonDropCode,
            encryptedShippingAddress: encryptedShippingAddress,
          },
        });
      }

      // Decrementar stock
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (!product.isUnlimited && product.stock !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data:  { stock: { decrement: item.quantity } },
          });
        }
      }

      return created;
    });

    // Se o pagamento já foi feito on-chain (hash fornecido), confirmar imediatamente
    if (paymentTxHash) {
      await confirmOrderPayment(order.id, paymentTxHash, products[0].creator?.payoutWallet);
    }

    // Retornar dados para o frontend fazer o pagamento
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        orderId:       order.id,
        orderNumber:   order.orderNumber,
        total,
        status:        order.status,
        // Endereço para pagamento (wallet da plataforma ou contrato de escrow)
        paymentAddress: process.env.ESCROW_CONTRACT_ADDRESS || process.env.PLATFORM_WALLET_ADDRESS,
        currency:       'USDC',
        expiresAt:      new Date(Date.now() + 15 * 60 * 1000), // 15 min para pagar
      },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// CONFIRMAR PAGAMENTO (webhook on-chain)
// ─────────────────────────────────────────────

export async function confirmOrderPayment(orderId, txHash, creatorWallet) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { include: { creator: true } } } },
    },
  });

  if (!order) throw new Error('Ordem não encontrada');
  if (order.status !== ORDER_STATUS.PENDING) return; // Já confirmado

  const productType = order.items[0]?.product?.type || 'DIGITAL';
  const walletToUse = creatorWallet || order.items[0]?.product?.creator?.payoutWallet || '';

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status:        ORDER_STATUS.CONFIRMED,
        paymentStatus: 'ORDER_COMPLETED',
        escrowStatus:  ESCROW_STATUS.HELD,
      },
    });

    // Registar payment
    await tx.payment.create({
      data: {
        userId:    order.userId,
        creatorId: order.items[0]?.product?.creatorId,
        type:      PAYMENT_TYPE.MARKETPLACE_PURCHASE,
        amountUSD: Number(order.total),
        currency:  'USDC',
        status:    PAYMENT_STATUS.COMPLETED,
        gateway:   PAYMENT_GATEWAY.SMART_CONTRACT_ESCROW,
        platformFee: Number(order.platformFee),
        netAmount:   Number(order.total) - Number(order.platformFee),
        orderId:     order.id,
        txHash,
        paidAt:      new Date(),
        confirmedAt: new Date(),
      },
    });
  });

  // Criar escrow
  await createEscrow({
    orderId:             orderId,
    amount:              Number(order.total),
    txHashHold:          txHash,
    smartContractAddress: process.env.ESCROW_CONTRACT_ADDRESS || '',
    creatorWallet:        walletToUse,
    productType,
  });

  // Notificar criadora
  const creatorId = order.items[0]?.product?.creatorId;
  if (creatorId) {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }, select: { userId: true },
    });

    await prisma.notification.create({
      data: {
        userId:    creator.userId,
        type:      NOTIFICATION_TYPES.NEW_ORDER,
        title:     '🛍️ Novo pedido recebido!',
        message:   `Novo pedido #${order.orderNumber} — $${Number(order.total).toFixed(2)} USDC em escrow.`,
        metadata:  { orderId, orderNumber: order.orderNumber },
        actionUrl: '/creator/orders',
      },
    });
  }
}

/**
 * POST /api/v1/orders/webhook/payment-confirmed
 * Webhook do smart contract / indexer on-chain.
 */
export async function webhookPaymentConfirmed(req, res) {
  try {
    const { orderId, txHash, creatorWallet } = req.body;

    // Em produção: verificar assinatura do webhook
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false });
    }

    await confirmOrderPayment(orderId, txHash, creatorWallet);

    return res.status(HTTP_STATUS.OK).json({ success: true });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// LISTAR PEDIDOS
// ─────────────────────────────────────────────

/**
 * GET /api/v1/orders
 * Comprador: os seus pedidos.
 */
export async function getMyOrders(req, res) {
  try {
    const userId  = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name:        true,
                  images:      true,
                  type:        true,
                  category:    true,
                  creator: {
                    select: {
                      displayName: true,
                      user: { select: { username: true, avatar: true } },
                    },
                  },
                },
              },
            },
          },
          shipment: {
            select: {
              status:           true,
              trackingCode:     true,
              carrier:          true,
              estimatedDelivery: true,
            },
          },
          escrow: {
            select: {
              status:        true,
              autoReleaseAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: orders,
      meta: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * GET /api/v1/creator/orders
 * Criadora: pedidos recebidos.
 */
export async function getCreatorOrders(req, res) {
  try {
    const creatorId = req.creator.id;
    const { page = 1, limit = 20, status } = req.query;

    const where = {
      items: { some: { product: { creatorId } } },
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { name: true, images: true, type: true } },
            },
          },
          shipment: true,
          escrow: {
            select: { status: true, amount: true, creatorNet: true, autoReleaseAt: true },
          },
          // NÃO incluir dados do comprador que identifiquem — apenas id anónimo
          user: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    // Remover dados sensíveis do comprador
    const sanitized = orders.map(o => ({
      ...o,
      encryptedShippingAddress: undefined, // nunca expor ao criador
      user: { id: o.user.id },             // só o ID
      anonDropCode: o.anonDropCode,        // código de drop: OK
    }));

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: sanitized,
      meta: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// ENTREGAR PEDIDO (Criadora)
// ─────────────────────────────────────────────

/**
 * POST /api/v1/creator/orders/:orderId/deliver
 * Criadora marca como entregue e/ou insere código de rastreio.
 */
export async function markAsDelivered(req, res) {
  try {
    const creatorId = req.creator.id;
    const { orderId } = req.params;
    const {
      deliveryFileUrl,  // Para digitais/customs
      trackingCode,     // Para físicos
      carrier,
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        shipment: true,
      },
    });

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Pedido não encontrado.' });
    }

    // Verificar que pertence à criadora
    const belongs = order.items.some(i => i.product.creatorId === creatorId);
    if (!belongs) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Sem permissão.' });
    }

    if (![ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING].includes(order.status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Pedido em estado inválido para entrega: ${order.status}`,
      });
    }

    const isPhysical = order.items.some(
      i => i.product.type === 'PHYSICAL' || i.product.type === 'HYBRID'
    );

    const autoReleaseAt = new Date();
    autoReleaseAt.setHours(
      autoReleaseAt.getHours() +
      (isPhysical ? ESCROW.AUTO_RELEASE_HOURS_PHYSICAL : ESCROW.AUTO_RELEASE_HOURS_DIGITAL)
    );

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status:           ORDER_STATUS.AWAITING_APPROVAL,
          deliveryFileUrl,
          deliveredAt:      new Date(),
          approvalDeadline: autoReleaseAt,
        },
      });

      // Actualizar escrow auto-release
      await tx.escrow.update({
        where: { orderId },
        data:  { autoReleaseAt },
      });

      // Actualizar envio físico
      if (isPhysical && trackingCode && order.shipment) {
        await tx.physicalShipment.update({
          where: { orderId },
          data: {
            trackingCode,
            carrier,
            shippedAt:        new Date(),
            status:           'SHIPPED',
            autoConfirmedAt:  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Actualizar soldCount do produto
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data:  { soldCount: { increment: item.quantity } },
        });
      }
    });

    // Notificar comprador
    await prisma.notification.create({
      data: {
        userId:    order.userId,
        type:      NOTIFICATION_TYPES.ORDER_DELIVERED,
        title:     isPhysical ? '📦 Pedido enviado!' : '✅ Conteúdo entregue!',
        message:   isPhysical
          ? `O teu pedido #${order.orderNumber} foi enviado. Código de rastreio: ${trackingCode}`
          : `O teu pedido #${order.orderNumber} está pronto. Tens ${ESCROW.AUTO_RELEASE_HOURS_DIGITAL}h para aprovar.`,
        metadata:  { orderId, trackingCode, deliveryFileUrl },
        actionUrl: `/orders/${orderId}`,
      },
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Entrega registada. Fundos serão liberados após aprovação.',
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// APROVAR ENTREGA (Comprador)
// ─────────────────────────────────────────────

/**
 * POST /api/v1/orders/:orderId/approve
 * Comprador aprova — libera fundos para criadora.
 */
export async function approveDelivery(req, res) {
  try {
    const userId  = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false });
    }

    if (order.status !== ORDER_STATUS.AWAITING_APPROVAL) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Pedido não está aguardando aprovação.',
      });
    }

    await releaseEscrow(orderId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Entrega aprovada. Pagamento liberado para a criadora!',
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// ABRIR DISPUTA
// ─────────────────────────────────────────────

/**
 * POST /api/v1/orders/:orderId/dispute
 */
export async function openOrderDispute(req, res) {
  try {
    const userId  = req.user.id;
    const { orderId } = req.params;
    const { reason, evidence } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Indica o motivo da disputa.',
      });
    }

    await openDispute(orderId, userId, reason, evidence);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Disputa aberta. A plataforma irá analisar em até 5 dias úteis.',
    });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

// ─────────────────────────────────────────────
// CANCELAR PEDIDO
// ─────────────────────────────────────────────

/**
 * POST /api/v1/orders/:orderId/cancel
 * Só possível enquanto PENDING (antes de escrow).
 */
export async function cancelOrder(req, res) {
  try {
    const userId  = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order || order.userId !== userId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false });
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Só é possível cancelar pedidos antes do pagamento ser confirmado.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data:  { status: ORDER_STATUS.CANCELLED },
      });

      // Repor stock
      for (const item of order.items) {
        if (!item.product.isUnlimited && item.product.stock !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data:  { stock: { increment: item.quantity } },
          });
        }
      }
    });

    return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Pedido cancelado.' });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}

/**
 * GET /api/v1/orders/:orderId
 * Detalhe de um pedido (comprador ou criadora com produtos no pedido).
 */
export async function getOrderDetail(req, res) {
  try {
    const userId    = req.user?.id;
    const creatorId = req.creator?.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                creator: {
                  select: {
                    id: true,
                    displayName: true,
                    payoutWallet: true,
                    user: { select: { username: true, avatar: true } },
                  },
                },
              },
            },
          },
        },
        shipment: true,
        escrow: true,
        nftRecord: true,
      },
    });

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false });
    }

    const isOwner   = order.userId === userId;
    const isCreator = order.items.some(i => i.product.creatorId === creatorId);

    if (!isOwner && !isCreator) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false });
    }

    // Remover endereço criptografado para criadora (nunca deve ver)
    const safeOrder = {
      ...order,
      encryptedShippingAddress: isCreator ? undefined : order.encryptedShippingAddress,
    };

    return res.status(HTTP_STATUS.OK).json({ success: true, data: safeOrder });
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message,
    });
  }
}
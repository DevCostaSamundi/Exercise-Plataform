import crypto from 'crypto';
import prisma from '../config/database.js';

// ── Desencriptar endereço ─────────────────────────────────────────────────────
// Formato guardado: "iv_hex:encrypted_hex" (AES-256-CBC)

function decryptAddress(encryptedShippingAddress) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes
  const [ivHex, encHex] = encryptedShippingAddress.split(':');
  const iv        = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher  = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const dec       = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(dec.toString('utf8'));
}

// ── Calcular zona de envio ────────────────────────────────────────────────────

const EU_COUNTRIES = new Set([
  'PT','ES','FR','DE','IT','NL','BE','AT','SE','DK','FI','NO','CH',
  'PL','CZ','SK','HU','RO','BG','HR','SI','EE','LV','LT','IE','GR',
  'LU','MT','CY','IS','LI','AL','BA','ME','MK','RS','XK',
]);

function getZone(fromCode, toCode) {
  if (!fromCode || !toCode) return 'WORLD';
  if (fromCode === toCode) return 'NATIONAL';
  if (EU_COUNTRIES.has(fromCode) && EU_COUNTRIES.has(toCode)) return 'EUROPE';
  return 'WORLD';
}

const ZONE_INFO = {
  NATIONAL: { label: 'Nacional',      days: '2–4 dias úteis',   estimateMin: 3,  estimateMax: 6  },
  EUROPE:   { label: 'Europa',         days: '5–10 dias úteis',  estimateMin: 8,  estimateMax: 15 },
  WORLD:    { label: 'Internacional',  days: '10–21 dias úteis', estimateMin: 12, estimateMax: 25 },
};

// ── Gerar dados da etiqueta ───────────────────────────────────────────────────

async function generateShippingLabelPDF(orderId, creatorId) {
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: {
      items:    { include: { product: true } },
      shipment: true,
      creator:  { include: { storeProfile: true } },
    },
  });

  if (!order)                          throw new Error('Pedido não encontrado');
  if (order.creatorId !== creatorId)   throw new Error('Sem permissão');
  if (!order.encryptedShippingAddress) throw new Error('Pedido sem endereço de envio');

  const addr      = decryptAddress(order.encryptedShippingAddress);
  const shipsFrom = order.creator?.storeProfile?.shipsFrom || '';
  const zone      = getZone(shipsFrom, addr.countryCode);
  const zoneInfo  = ZONE_INFO[zone];

  return {
    orderId:      order.id,
    orderNumber:  order.orderNumber,
    anonDropCode: order.anonDropCode,
    createdAt:    order.createdAt,

    sender: {
      storeName: order.creator?.storeProfile?.storeDisplayName || 'Loja Anónima',
      country:   shipsFrom,
    },

    recipient: {
      // Nome real substituído pelo código anónimo por privacidade
      displayName:  `REF: ${order.anonDropCode}`,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city:         addr.city,
      postalCode:   addr.postalCode,
      country:      addr.countryCode,
      phone:        addr.phone || '',
    },

    shipping: {
      zone:         zone,
      zoneLabel:    zoneInfo.label,
      days:         zoneInfo.days,
      estimateMin:  zoneInfo.estimateMin,
      estimateMax:  zoneInfo.estimateMax,
      trackingCode: order.shipment?.trackingCode || null,
    },

    items: order.items.map((i) => ({
      name:     i.product?.name || 'Produto',
      quantity: i.quantity,
    })),
  };
}

export { generateShippingLabelPDF, getZone, ZONE_INFO };